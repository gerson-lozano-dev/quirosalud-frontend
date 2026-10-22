import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common'; 
import { ReporteService } from '../../services/reporte';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, DatePipe, DecimalPipe], 
  templateUrl: './reportes.html'
})
export class ReportesComponent implements OnInit {
  private reporteService = inject(ReporteService);
  
  public chartDistritos: any;
  public chartTratamientos: any; // El nuevo gráfico
  
  listaVentas: any[] = []; 

  ngOnInit(): void {
    this.cargarGraficoDistritos();
    this.cargarGraficoTratamientos();
    this.cargarHistorial(); 
  }

  cargarGraficoDistritos() {
    this.reporteService.obtenerEstadisticaDistritos().subscribe({
      next: (datos: any[]) => {
        const etiquetas = datos.map(d => d.nombreDistrito);
        const cantidades = datos.map(d => d.cantidad);
        
        this.chartDistritos = new Chart('graficoDistritos', {
          type: 'bar',
          data: {
            labels: etiquetas,
            datasets: [{
              label: 'Pacientes',
              data: cantidades,
              backgroundColor: 'rgba(13, 110, 253, 0.7)',
              borderRadius: 5
            }]
          }
        });
      }
    });
  }

  cargarGraficoTratamientos() {
    this.reporteService.obtenerEstadisticaTratamientos().subscribe({
      next: (datos: any[]) => {
        // Leemos los 3 datos reales que vienen de tu base de datos
        const etiquetas = datos.map(d => d.nombre);
        const cantidades = datos.map(d => d.cantidad); // Esto son las Sesiones
        const dineros = datos.map(d => d.totalDinero); // Esto es la Plata real

        // Sumamos todas las sesiones matemáticamente para sacar el 100%
        const totalSesionesGeneral = cantidades.reduce((a, b) => a + b, 0);

        this.chartTratamientos = new Chart('graficoTratamientos', {
          type: 'doughnut',
          data: {
            labels: etiquetas,
            datasets: [{
              data: cantidades,
              backgroundColor: ['#8b3dff', '#1a66cc', '#ff6b3b', '#109b8c', '#e6195e'],
              borderWidth: 0,
              hoverOffset: 8
            }]
          },
          options: {
            cutout: '65%',
            plugins: {
              legend: { position: 'bottom' },
              tooltip: {
                callbacks: {
                  // MAGIA PURA: Aquí construimos lo que quieres ver al pasar el mouse
                  label: function(context: any) {
                    let index = context.dataIndex;
                    let ses = cantidades[index];
                    let dinero = dineros[index];
                    let porcentaje = ((ses / totalSesionesGeneral) * 100).toFixed(1);
                    
                    // Va a mostrar algo como: " 60.0% (6 Sesiones) - Total: S/. 450"
                    return ` ${porcentaje}% (${ses} Sesiones) - Total: S/. ${dinero}`;
                  }
                }
              }
            }
          }
        });
      }
    });
  }

  cargarHistorial() {
    this.reporteService.obtenerHistorialVentas().subscribe({
      next: (datos) => this.listaVentas = datos
    });
  }
}