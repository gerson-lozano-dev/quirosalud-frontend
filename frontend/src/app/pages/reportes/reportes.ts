import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
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
  private cdr = inject(ChangeDetectorRef);
  
  public chartDistritos: any;
  public chartTratamientos: any;
  listaVentas: any[] = []; 

  ngOnInit(): void {
    this.cargarGraficoDistritos();
    this.cargarGraficoTratamientos();
    this.cargarHistorial(); 
  }

  cargarGraficoDistritos(): void {
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
              backgroundColor: 'rgba(232, 93, 56, 0.85)',
              borderRadius: 5
            }]
          }
        });
      }
    });
  }

  cargarGraficoTratamientos(): void {
    this.reporteService.obtenerEstadisticaTratamientos().subscribe({
      next: (datos: any[]) => {
        const etiquetas = datos.map(d => d.nombre);
        const cantidades = datos.map(d => d.cantidad);
        const dineros = datos.map(d => d.totalDinero);
        const totalSesionesGeneral = cantidades.reduce((a, b) => a + b, 0);

        this.chartTratamientos = new Chart('graficoTratamientos', {
          type: 'doughnut',
          data: {
            labels: etiquetas,
            datasets: [{
              data: cantidades,
              backgroundColor: ['#e85d38', '#1b3b6f', '#f39c12', '#109b8c', '#6f42c1'],
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
                  label: function(context: any) {
                    let index = context.dataIndex;
                    let ses = cantidades[index];
                    let dinero = dineros[index];
                    let porcentaje = ((ses / totalSesionesGeneral) * 100).toFixed(1);
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

  cargarHistorial(): void {
    this.reporteService.obtenerHistorialVentas().subscribe({
      next: (datos) => {
        this.listaVentas = datos || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar historial de ventas', err);
      }
    });
  }
}
