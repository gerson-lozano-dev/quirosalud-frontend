import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { ReporteService } from '../../services/reporte';
import { Chart, registerables } from 'chart.js';
import jsPDF from 'jspdf';
import Swal from 'sweetalert2';

Chart.register(...registerables);

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, DatePipe, DecimalPipe, FormsModule], 
  templateUrl: './reportes.html',
  styleUrl: './reportes.css'
})
export class ReportesComponent implements OnInit {
  private reporteService = inject(ReporteService);
  private cdr = inject(ChangeDetectorRef);
  
  // Instancias de Gráficos
  public chartDistritos: any;
  public chartTratamientos: any;
  public chartEvolucion: any;
  public chartCumplimiento: any;

  // Datos
  listaVentas: any[] = []; 
  filtroTabla: string = '';

  // Métricas Clave (KPIs)
  kpis = {
    ingresosHoy: 0,
    ingresosAyer: 0,
    comparativaAyerPorcentaje: 0,
    ingresosMes: 0,
    ticketPromedio: 0,
    totalTransacciones: 0,
    citasAtendidasMes: 0
  };

  // Cumplimiento Operativo de Citas
  datosCumplimiento = {
    total: 0,
    atendidas: 0,
    noShow: 0,
    canceladas: 0,
    pendientes: 0,
    tasaAsistencia: 0,
    tasaNoShow: 0
  };

  // Filtros de Evolución de Ingresos
  filtroEvolucion: 'HOY' | 'SEMANA' | 'MES' | 'ANIO' | 'TODO' | 'PERSONALIZADO' = 'MES';
  fechaInicioEvolucion: string = '';
  fechaFinEvolucion: string = '';

  ngOnInit(): void {
    // Inicializar fechas por defecto para filtro personalizado (últimos 30 días)
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);
    this.fechaInicioEvolucion = this.formatearFechaLocal(hace30Dias);
    this.fechaFinEvolucion = this.formatearFechaLocal(hoy);

    this.cargarKpis();
    this.cargarCumplimiento();
    this.cargarGraficoDistritos();
    this.cargarGraficoTratamientos();
    this.cargarHistorial(); 
  }

  // Cargar métricas KPI
  cargarKpis(): void {
    this.reporteService.obtenerKpis().subscribe({
      next: (kpis) => {
        if (kpis) {
          this.kpis = {
            ingresosHoy: Number(kpis.ingresosHoy) || 0,
            ingresosAyer: Number(kpis.ingresosAyer) || 0,
            comparativaAyerPorcentaje: Number(kpis.comparativaAyerPorcentaje) || 0,
            ingresosMes: Number(kpis.ingresosMes) || 0,
            ticketPromedio: Number(kpis.ticketPromedio) || 0,
            totalTransacciones: Number(kpis.totalTransacciones) || 0,
            citasAtendidasMes: Number(kpis.citasAtendidasMes) || 0
          };
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Error al cargar KPIs financieros', err)
    });
  }

  // Cargar métricas de cumplimiento de citas
  cargarCumplimiento(): void {
    this.reporteService.obtenerCumplimiento().subscribe({
      next: (datos) => {
        if (datos) {
          this.datosCumplimiento = {
            total: Number(datos.total) || 0,
            atendidas: Number(datos.atendidas) || 0,
            noShow: Number(datos.noShow) || 0,
            canceladas: Number(datos.canceladas) || 0,
            pendientes: Number(datos.pendientes) || 0,
            tasaAsistencia: Number(datos.tasaAsistencia) || 0,
            tasaNoShow: Number(datos.tasaNoShow) || 0
          };
          this.renderizarGraficoCumplimiento();
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Error al cargar cumplimiento de citas', err)
    });
  }

  // Gráfico 1: Distritos (Barras)
  cargarGraficoDistritos(): void {
    this.reporteService.obtenerEstadisticaDistritos().subscribe({
      next: (datos: any[]) => {
        const etiquetas = datos.map(d => d.nombreDistrito);
        const cantidades = datos.map(d => d.cantidad);
        
        if (this.chartDistritos) this.chartDistritos.destroy();

        this.chartDistritos = new Chart('graficoDistritos', {
          type: 'bar',
          data: {
            labels: etiquetas,
            datasets: [{
              label: 'Pacientes',
              data: cantidades,
              backgroundColor: 'rgba(232, 93, 56, 0.85)',
              hoverBackgroundColor: '#e85d38',
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: { stepSize: 1 }
              }
            }
          }
        });
      }
    });
  }

  // Gráfico 2: Tratamientos (Dona)
  cargarGraficoTratamientos(): void {
    this.reporteService.obtenerEstadisticaTratamientos().subscribe({
      next: (datos: any[]) => {
        const etiquetas = datos.map(d => d.nombre);
        const cantidades = datos.map(d => d.cantidad);
        const dineros = datos.map(d => d.totalDinero);
        const totalSesionesGeneral = cantidades.reduce((a, b) => a + b, 0);

        if (this.chartTratamientos) this.chartTratamientos.destroy();

        this.chartTratamientos = new Chart('graficoTratamientos', {
          type: 'doughnut',
          data: {
            labels: etiquetas,
            datasets: [{
              data: cantidades,
              backgroundColor: ['#e85d38', '#1b3b6f', '#f39c12', '#10b981', '#6f42c1', '#06b6d4'],
              borderWidth: 2,
              borderColor: '#ffffff',
              hoverOffset: 8
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
              legend: { 
                position: 'bottom',
                labels: { boxWidth: 12, padding: 12, font: { size: 11 } }
              },
              tooltip: {
                callbacks: {
                  label: function(context: any) {
                    let index = context.dataIndex;
                    let ses = cantidades[index];
                    let dinero = dineros[index];
                    let porcentaje = totalSesionesGeneral > 0 ? ((ses / totalSesionesGeneral) * 100).toFixed(1) : 0;
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

  // Gráfico 3: Cumplimiento de Citas (Dona)
  renderizarGraficoCumplimiento(): void {
    const canvas = document.getElementById('graficoCumplimiento') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.chartCumplimiento) this.chartCumplimiento.destroy();

    const d = this.datosCumplimiento;
    const etiquetas = ['Atendidas', 'Pendientes', 'No Asistió (No-Show)', 'Canceladas'];
    const valores = [d.atendidas, d.pendientes, d.noShow, d.canceladas];
    const totalCitas = d.total || valores.reduce((a, b) => a + b, 0);

    this.chartCumplimiento = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: etiquetas,
        datasets: [{
          data: valores,
          backgroundColor: ['#10b981', '#3b82f6', '#ef4444', '#9ca3af'],
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, padding: 12, font: { size: 11 } }
          },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                const val = Number(context.raw) || 0;
                const pct = totalCitas > 0 ? ((val / totalCitas) * 100).toFixed(1) : '0';
                return ` ${context.label}: ${val} citas (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }

  // Cargar Historial de Ventas y disparar Gráfico de Evolución
  cargarHistorial(): void {
    this.reporteService.obtenerHistorialVentas().subscribe({
      next: (datos) => {
        this.listaVentas = datos || [];
        this.actualizarGraficoEvolucion();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar historial de ventas', err);
      }
    });
  }

  // Cambiar período del gráfico de evolución
  cambiarFiltroEvolucion(periodo: 'HOY' | 'SEMANA' | 'MES' | 'ANIO' | 'TODO' | 'PERSONALIZADO'): void {
    this.filtroEvolucion = periodo;
    this.actualizarGraficoEvolucion();
  }

  // Renderizar o actualizar Gráfico de Evolución de Ingresos
  actualizarGraficoEvolucion(): void {
    const canvas = document.getElementById('graficoEvolucion') as HTMLCanvasElement;
    if (!canvas) return;

    const { etiquetas, valores } = this.procesarDatosEvolucion();

    if (this.chartEvolucion) {
      this.chartEvolucion.destroy();
    }

    const ctx = canvas.getContext('2d');
    let gradient = null;
    if (ctx) {
      gradient = ctx.createLinearGradient(0, 0, 0, 320);
      gradient.addColorStop(0, 'rgba(232, 93, 56, 0.35)');
      gradient.addColorStop(1, 'rgba(232, 93, 56, 0.00)');
    }

    this.chartEvolucion = new Chart(canvas, {
      type: 'line',
      data: {
        labels: etiquetas,
        datasets: [{
          label: 'Recaudación (S/.)',
          data: valores,
          borderColor: '#e85d38',
          backgroundColor: gradient || 'rgba(232, 93, 56, 0.15)',
          fill: true,
          tension: 0.35,
          borderWidth: 3,
          pointBackgroundColor: '#e85d38',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => ` Recaudación: S/. ${(Number(context.raw) || 0).toFixed(2)}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: {
              callback: (value) => `S/. ${value}`
            }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  }

  // Procesar transacciones según el filtro seleccionado
  private procesarDatosEvolucion(): { etiquetas: string[], valores: number[] } {
    const hoy = new Date();
    const hoyStr = this.formatearFechaLocal(hoy);

    // Mapear ventas válidas
    const ventasValidas = this.listaVentas.map(v => {
      let fechaStr = '';
      if (v.fecha) {
        if (typeof v.fecha === 'string') {
          fechaStr = v.fecha.substring(0, 10);
        } else if (v.fecha instanceof Date) {
          fechaStr = this.formatearFechaLocal(v.fecha);
        }
      }
      return {
        ...v,
        fechaStr,
        monto: Number(v.total) || 0
      };
    }).filter(v => v.fechaStr);

    if (this.filtroEvolucion === 'HOY') {
      const ventasHoy = ventasValidas.filter(v => v.fechaStr === hoyStr);
      if (ventasHoy.length === 0) {
        return { etiquetas: ['Hoy (Sin ventas registradas)'], valores: [0] };
      }
      // Mostrar cada comprobante del día
      return {
        etiquetas: ventasHoy.map(v => `${v.nroHp} (${v.nombreTratamiento ? v.nombreTratamiento.substring(0, 15) : 'Tratamiento'}...)`),
        valores: ventasHoy.map(v => v.monto)
      };
    }

    if (this.filtroEvolucion === 'SEMANA') {
      // Últimos 7 días
      const etiquetas: string[] = [];
      const valores: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const f = new Date();
        f.setDate(hoy.getDate() - i);
        const fStr = this.formatearFechaLocal(f);
        const diaMes = `${String(f.getDate()).padStart(2, '0')}/${String(f.getMonth() + 1).padStart(2, '0')}`;
        etiquetas.push(diaMes);

        const totalDia = ventasValidas
          .filter(v => v.fechaStr === fStr)
          .reduce((sum, v) => sum + v.monto, 0);
        valores.push(totalDia);
      }
      return { etiquetas, valores };
    }

    if (this.filtroEvolucion === 'MES') {
      // Días del mes actual
      const anio = hoy.getFullYear();
      const mes = hoy.getMonth();
      const diasEnMes = new Date(anio, mes + 1, 0).getDate();
      const etiquetas: string[] = [];
      const valores: number[] = [];

      for (let d = 1; d <= diasEnMes; d++) {
        const f = new Date(anio, mes, d);
        const fStr = this.formatearFechaLocal(f);
        const etiqueta = `${String(d).padStart(2, '0')}/${String(mes + 1).padStart(2, '0')}`;
        etiquetas.push(etiqueta);

        const totalDia = ventasValidas
          .filter(v => v.fechaStr === fStr)
          .reduce((sum, v) => sum + v.monto, 0);
        valores.push(totalDia);
      }
      return { etiquetas, valores };
    }

    if (this.filtroEvolucion === 'ANIO') {
      // 12 meses del año actual
      const anio = hoy.getFullYear();
      const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
      const valores: number[] = Array(12).fill(0);

      ventasValidas.forEach(v => {
        const partes = v.fechaStr.split('-');
        if (partes.length === 3 && Number(partes[0]) === anio) {
          const indiceMes = Number(partes[1]) - 1;
          if (indiceMes >= 0 && indiceMes < 12) {
            valores[indiceMes] += v.monto;
          }
        }
      });
      return { etiquetas: nombresMeses, valores };
    }

    if (this.filtroEvolucion === 'PERSONALIZADO') {
      const fInicio = this.fechaInicioEvolucion || '2000-01-01';
      const fFin = this.fechaFinEvolucion || '2099-12-31';

      const ventasRango = ventasValidas.filter(v => v.fechaStr >= fInicio && v.fechaStr <= fFin);
      
      // Agrupar por fecha
      const mapaTotales = new Map<string, number>();
      ventasRango.forEach(v => {
        const actual = mapaTotales.get(v.fechaStr) || 0;
        mapaTotales.set(v.fechaStr, actual + v.monto);
      });

      const fechasOrdenadas = Array.from(mapaTotales.keys()).sort();
      if (fechasOrdenadas.length === 0) {
        return { etiquetas: ['Rango sin transacciones'], valores: [0] };
      }

      const etiquetas = fechasOrdenadas.map(f => {
        const [y, m, d] = f.split('-');
        return `${d}/${m}/${y}`;
      });
      const valores = fechasOrdenadas.map(f => mapaTotales.get(f) || 0);
      return { etiquetas, valores };
    }

    // TODO el historial
    const mapaTotales = new Map<string, number>();
    ventasValidas.forEach(v => {
      const actual = mapaTotales.get(v.fechaStr) || 0;
      mapaTotales.set(v.fechaStr, actual + v.monto);
    });

    const fechasOrdenadas = Array.from(mapaTotales.keys()).sort();
    if (fechasOrdenadas.length === 0) {
      return { etiquetas: ['Sin ventas registradas'], valores: [0] };
    }

    const etiquetas = fechasOrdenadas.map(f => {
      const [y, m, d] = f.split('-');
      return `${d}/${m}/${y}`;
    });
    const valores = fechasOrdenadas.map(f => mapaTotales.get(f) || 0);
    return { etiquetas, valores };
  }

  // Filtrado reactivo de la tabla de ventas
  get ventasFiltradas(): any[] {
    if (!this.filtroTabla || !this.filtroTabla.trim()) {
      return this.listaVentas;
    }
    const term = this.filtroTabla.trim().toLowerCase();
    return this.listaVentas.filter(v => 
      (v.nroHp && v.nroHp.toLowerCase().includes(term)) ||
      (v.dni && v.dni.toLowerCase().includes(term)) ||
      (v.nombrePaciente && v.nombrePaciente.toLowerCase().includes(term)) ||
      (v.nombreTratamiento && v.nombreTratamiento.toLowerCase().includes(term)) ||
      (v.estado && v.estado.toLowerCase().includes(term)) ||
      (v.fecha && v.fecha.toString().toLowerCase().includes(term))
    );
  }

  // Total acumulado de las ventas filtradas
  get totalVentasFiltradas(): number {
    return this.ventasFiltradas.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
  }

  // Exportar a Excel (CSV con UTF-8 BOM)
  exportarExcel(): void {
    if (this.ventasFiltradas.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Sin datos',
        text: 'No hay transacciones para exportar con el filtro actual.'
      });
      return;
    }

    // Prefijo BOM para soporte completo de acentos y caracteres especiales en Excel
    let csvContent = '\uFEFF';
    
    // Encabezados
    const encabezados = ['Nro Comprobante', 'Fecha', 'DNI Paciente', 'Paciente', 'Tratamiento', 'Sesiones', 'Total (S/.)', 'Estado'];
    csvContent += encabezados.map(h => `"${h}"`).join(';') + '\r\n';

    // Filas
    this.ventasFiltradas.forEach(v => {
      const fila = [
        v.nroHp || '',
        v.fecha || '',
        v.dni || '',
        v.nombrePaciente || 'No especificado',
        v.nombreTratamiento || 'Tratamiento Quiropráctico',
        v.sesiones || 0,
        (Number(v.total) || 0).toFixed(2),
        v.estado || 'PAGADO'
      ];
      csvContent += fila.map(val => `"${String(val).replace(/"/g, '""')}"`).join(';') + '\r\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const hoyStr = this.formatearFechaLocal(new Date());
    link.href = url;
    link.download = `Reporte_Financiero_QuiroSalud_${hoyStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Reporte Excel exportado correctamente',
      showConfirmButton: false,
      timer: 2500
    });
  }

  // Exportar a PDF (Vectorial con jsPDF)
  exportarPDF(): void {
    if (this.ventasFiltradas.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Sin datos',
        text: 'No hay transacciones para exportar con el filtro actual.'
      });
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const anchoPagina = 297;
      const altoPagina = 210;
      const margenX = 14;
      let yActual = 0;

      // Banner cabecera corporativo
      doc.setFillColor(27, 59, 111); // Azul oscuro corporativo #1b3b6f
      doc.rect(0, 0, anchoPagina, 22, 'F');

      // Título
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('QUIROSALUD - REPORTE GENERAL DE VENTAS Y FINANZAS', margenX, 14);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Sistema de Gestión Quiropráctica Especializada', 215, 14);

      // Resumen ejecutivo
      yActual = 30;
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Fecha de emisión:', margenX, yActual);
      doc.setFont('helvetica', 'normal');
      doc.text(new Date().toLocaleString('es-PE'), margenX + 30, yActual);

      doc.setFont('helvetica', 'bold');
      doc.text('Total registros:', 110, yActual);
      doc.setFont('helvetica', 'normal');
      doc.text(`${this.ventasFiltradas.length} transacciones`, 135, yActual);

      doc.setFont('helvetica', 'bold');
      doc.text('Recaudación filtrada:', 190, yActual);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129); // Verde esmeralda
      doc.text(`S/. ${this.totalVentasFiltradas.toFixed(2)}`, 225, yActual);

      // Cabecera de la tabla
      yActual = 36;
      doc.setFillColor(232, 93, 56); // Naranja primario #e85d38
      doc.rect(margenX, yActual, anchoPagina - (margenX * 2), 8, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');

      // Coordenadas de columnas
      const colNro = margenX + 2;        // 16
      const colFecha = margenX + 22;     // 36
      const colDni = margenX + 44;       // 58
      const colPac = margenX + 66;       // 80
      const colTrat = margenX + 138;     // 152
      const colSes = margenX + 210;      // 224
      const colTot = margenX + 228;      // 242
      const colEst = margenX + 252;      // 266

      doc.text('Comprobante', colNro, yActual + 5.5);
      doc.text('Fecha', colFecha, yActual + 5.5);
      doc.text('DNI', colDni, yActual + 5.5);
      doc.text('Paciente', colPac, yActual + 5.5);
      doc.text('Tratamiento', colTrat, yActual + 5.5);
      doc.text('Ses.', colSes, yActual + 5.5);
      doc.text('Total (S/.)', colTot, yActual + 5.5);
      doc.text('Estado', colEst, yActual + 5.5);

      yActual += 8;

      // Filas de datos
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      const items = this.ventasFiltradas;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        // Verificar salto de página
        if (yActual > 195) {
          doc.addPage();
          // Redibujar barra superior
          doc.setFillColor(27, 59, 111);
          doc.rect(0, 0, anchoPagina, 12, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text('QUIROSALUD - REPORTE DE VENTAS (Continuación)', margenX, 8);

          // Redibujar cabecera tabla
          yActual = 16;
          doc.setFillColor(232, 93, 56);
          doc.rect(margenX, yActual, anchoPagina - (margenX * 2), 7, 'F');
          doc.text('Comprobante', colNro, yActual + 5);
          doc.text('Fecha', colFecha, yActual + 5);
          doc.text('DNI', colDni, yActual + 5);
          doc.text('Paciente', colPac, yActual + 5);
          doc.text('Tratamiento', colTrat, yActual + 5);
          doc.text('Ses.', colSes, yActual + 5);
          doc.text('Total (S/.)', colTot, yActual + 5);
          doc.text('Estado', colEst, yActual + 5);
          yActual += 7;
        }

        // Fondo alternado
        if (i % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(margenX, yActual, anchoPagina - (margenX * 2), 6.5, 'F');
        }

        doc.setTextColor(40, 40, 40);
        doc.text(String(item.nroHp || '-'), colNro, yActual + 4.5);
        doc.text(String(item.fecha || '-'), colFecha, yActual + 4.5);
        doc.text(String(item.dni || '-'), colDni, yActual + 4.5);

        // Truncar texto largo de paciente y tratamiento
        const pacNom = String(item.nombrePaciente || 'No especificado');
        doc.text(pacNom.length > 36 ? pacNom.substring(0, 34) + '...' : pacNom, colPac, yActual + 4.5);

        const tratNom = String(item.nombreTratamiento || 'Tratamiento Quiropráctico');
        doc.text(tratNom.length > 38 ? tratNom.substring(0, 36) + '...' : tratNom, colTrat, yActual + 4.5);

        doc.text(String(item.sesiones || '0'), colSes, yActual + 4.5);
        doc.text(`S/. ${(Number(item.total) || 0).toFixed(2)}`, colTot, yActual + 4.5);
        
        doc.setTextColor(22, 101, 52); // Verde oscuro
        doc.text(String(item.estado || 'PAGADO'), colEst, yActual + 4.5);

        yActual += 6.5;
      }

      // Pie de página final
      const hoyStr = this.formatearFechaLocal(new Date());
      doc.save(`Reporte_Financiero_QuiroSalud_${hoyStr}.pdf`);

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Reporte PDF descargado correctamente',
        showConfirmButton: false,
        timer: 2500
      });

    } catch (err) {
      console.error('Error al generar PDF de reportes:', err);
      Swal.fire('Error', 'No se pudo generar el documento PDF.', 'error');
    }
  }

  // Formatear fecha local en formato YYYY-MM-DD
  private formatearFechaLocal(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }
}
