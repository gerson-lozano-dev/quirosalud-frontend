import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { VentaService } from '../../services/venta';
import { PacienteService } from '../../services/paciente'; 
import { TratamientoService } from '../../services/tratamiento';
import { AsistenciaService } from '../../services/asistencia';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import jsPDF from 'jspdf';

export interface SesionProgramada {
  numeroSesion: number;
  fecha: string;
  hora: string;
}

export interface ComprobantePago {
  nroHp: string;
  fechaEmision: string;
  horaEmision: string;
  pacienteNombre: string;
  dniPaciente: string;
  telefonoPaciente: string;
  direccionPaciente: string;
  nombreTratamiento: string;
  precioUnitario: number;
  totalSesiones: number;
  costoTotal: number;
  cajero: string;
  citas: SesionProgramada[];
}

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './ventas.html',
  styleUrl: './ventas.css'
})
export class VentasComponent implements OnInit {

  private ventaService = inject(VentaService);
  private pacienteService = inject(PacienteService);
  private tratamientoService = inject(TratamientoService);
  private asistenciaService = inject(AsistenciaService);
  private cdr = inject(ChangeDetectorRef);

  listaPacientes: any[] = [];
  listaTratamientos: any[] = [];
  recetaMedica: any = null;
  buscandoReceta: boolean = false;

  // Búsqueda interactiva de paciente
  textoBusquedaPaciente: string = '';
  mostrarDropdownPacientes: boolean = false;
  pacienteSeleccionado: any = null;

  // Programación de sesiones
  sesionesProgramadas: SesionProgramada[] = [];
  fechaInicioProgramacion: string = '';
  horaInicioProgramacion: string = '09:00';
  frecuenciaProgramacion: 'INTERDIARIO' | 'SEMANAL' | 'DIARIO' = 'INTERDIARIO';

  // Comprobante de Pago
  comprobanteEmitido: ComprobantePago | null = null;
  mostrarModalComprobante: boolean = false;

  nuevaVenta = { 
    dniPaciente: '', 
    idTratamiento: '', 
    totalSesiones: 1, 
    costoTotal: 0.0, 
    idUsuario: 0 
  };

  ngOnInit(): void {
    const idGuardado = localStorage.getItem('idUsuario');
    if (idGuardado) {
      this.nuevaVenta.idUsuario = parseInt(idGuardado, 10);
    }
    this.inicializarFechaInicio();
    this.cargarCatalogos();
  }

  inicializarFechaInicio(): void {
    const hoy = new Date();
    // Si hoy es domingo (0), sugerir por defecto iniciar mañana lunes
    if (hoy.getDay() === 0) {
      hoy.setDate(hoy.getDate() + 1);
    }
    const y = hoy.getFullYear();
    const m = String(hoy.getMonth() + 1).padStart(2, '0');
    const d = String(hoy.getDate()).padStart(2, '0');
    this.fechaInicioProgramacion = `${y}-${m}-${d}`;
  }

  cargarCatalogos(): void {
    this.pacienteService.listarPacientes().subscribe(data => {
      this.listaPacientes = data || [];
      this.cdr.detectChanges();
    });
    this.tratamientoService.listarTratamientos().subscribe(data => {
      this.listaTratamientos = data || [];
      this.cdr.detectChanges();
    });
  }

  get pacientesFiltrados(): any[] {
    if (!this.textoBusquedaPaciente || this.textoBusquedaPaciente.trim() === '') {
      return this.listaPacientes;
    }
    const q = this.textoBusquedaPaciente.toLowerCase().trim();
    return this.listaPacientes.filter(p => {
      const dni = (p.dni || '').toLowerCase();
      const nombres = (p.nombres || '').toLowerCase();
      const apellidos = (p.apellidos || '').toLowerCase();
      const completo = `${apellidos} ${nombres}`.toLowerCase();
      return dni.includes(q) || nombres.includes(q) || apellidos.includes(q) || completo.includes(q);
    });
  }

  alEscribirPaciente(valor: string): void {
    this.textoBusquedaPaciente = valor;
    this.mostrarDropdownPacientes = true;

    if (!valor || valor.trim() === '') {
      this.nuevaVenta.dniPaciente = '';
      this.pacienteSeleccionado = null;
      this.recetaMedica = null;
      this.cdr.detectChanges();
      return;
    }

    const match = this.listaPacientes.find(p => (p.dni || '').trim() === valor.trim());
    if (match) {
      this.seleccionarPaciente(match);
    }
  }

  seleccionarPaciente(p: any): void {
    this.pacienteSeleccionado = p;
    this.nuevaVenta.dniPaciente = p.dni;
    this.textoBusquedaPaciente = `${p.apellidos}, ${p.nombres} (DNI: ${p.dni})`;
    this.mostrarDropdownPacientes = false;
    this.alSeleccionarPaciente();
    this.cdr.detectChanges();
  }

  toggleDropdown(): void {
    this.mostrarDropdownPacientes = !this.mostrarDropdownPacientes;
    this.cdr.detectChanges();
  }

  limpiarPaciente(): void {
    this.textoBusquedaPaciente = '';
    this.nuevaVenta.dniPaciente = '';
    this.pacienteSeleccionado = null;
    this.recetaMedica = null;
    this.mostrarDropdownPacientes = false;
    this.cdr.detectChanges();
  }

  cerrarDropdownConRetraso(): void {
    setTimeout(() => {
      this.mostrarDropdownPacientes = false;
      this.cdr.detectChanges();
    }, 200);
  }

  alSeleccionarPaciente(): void {
    this.recetaMedica = null;
    if (!this.nuevaVenta.dniPaciente) return;

    this.buscandoReceta = true;
    this.asistenciaService.obtenerExpedienteCompleto(this.nuevaVenta.dniPaciente).subscribe({
      next: (expediente) => {
        this.buscandoReceta = false;
        const consultas = expediente?.consultas || [];
        if (consultas.length > 0) {
          const ultima = consultas[0];
          this.recetaMedica = ultima;

          if (ultima.sesionesSugeridas !== undefined && ultima.sesionesSugeridas !== null && ultima.sesionesSugeridas > 0) {
            this.nuevaVenta.totalSesiones = ultima.sesionesSugeridas;
          }

          if (ultima.tratamientoSugerido) {
            const match = this.listaTratamientos.find(t => 
              t.nombre.toLowerCase().trim() === ultima.tratamientoSugerido.toLowerCase().trim() ||
              t.nombre.toLowerCase().includes(ultima.tratamientoSugerido.toLowerCase()) ||
              ultima.tratamientoSugerido.toLowerCase().includes(t.nombre.toLowerCase())
            );
            if (match) {
              this.nuevaVenta.idTratamiento = match.idTratamiento;
            }
          }

          this.calcularTotal();
        } else {
          this.generarSesionesProgramadas();
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.buscandoReceta = false;
        this.generarSesionesProgramadas();
        this.cdr.detectChanges();
      }
    });
  }

  calcularTotal(): void {
    if (!this.nuevaVenta.idTratamiento || this.nuevaVenta.totalSesiones < 1) {
      this.nuevaVenta.costoTotal = 0.0;
      this.generarSesionesProgramadas();
      return;
    }
    
    const tratamiento = this.listaTratamientos.find(t => t.idTratamiento == this.nuevaVenta.idTratamiento);
    if (tratamiento) {
      this.nuevaVenta.costoTotal = tratamiento.precio * this.nuevaVenta.totalSesiones;
    }
    this.generarSesionesProgramadas();
  }

  generarSesionesProgramadas(frecuencia: 'INTERDIARIO' | 'SEMANAL' | 'DIARIO' = this.frecuenciaProgramacion): void {
    this.frecuenciaProgramacion = frecuencia;
    if (!this.fechaInicioProgramacion) {
      this.inicializarFechaInicio();
    }
    const total = this.nuevaVenta.totalSesiones || 1;
    const diasSalto = frecuencia === 'DIARIO' ? 1 : (frecuencia === 'SEMANAL' ? 7 : 2);

    const partes = this.fechaInicioProgramacion.split('-').map(Number);
    let fechaPuntero = new Date(partes[0], partes[1] - 1, partes[2]);

    // Si la fecha elegida cae domingo, avanzar al lunes
    if (fechaPuntero.getDay() === 0) {
      fechaPuntero.setDate(fechaPuntero.getDate() + 1);
    }

    this.sesionesProgramadas = [];
    for (let i = 0; i < total; i++) {
      if (i > 0) {
        fechaPuntero.setDate(fechaPuntero.getDate() + diasSalto);
        // Si cae domingo (0), pasar al lunes (+1 día)
        if (fechaPuntero.getDay() === 0) {
          fechaPuntero.setDate(fechaPuntero.getDate() + 1);
        }
      }

      const yStr = fechaPuntero.getFullYear();
      const mStr = String(fechaPuntero.getMonth() + 1).padStart(2, '0');
      const dStr = String(fechaPuntero.getDate()).padStart(2, '0');

      this.sesionesProgramadas.push({
        numeroSesion: i + 1,
        fecha: `${yStr}-${mStr}-${dStr}`,
        hora: this.horaInicioProgramacion || '09:00'
      });
    }
    this.cdr.detectChanges();
  }

  cancelarVenta(): void {
    if (!this.nuevaVenta.dniPaciente && !this.nuevaVenta.idTratamiento && this.nuevaVenta.costoTotal <= 0) {
      this.resetearFormulario();
      return;
    }

    Swal.fire({
      title: '¿Desea cancelar la venta?',
      text: 'Se limpiará el formulario y se descartarán las citas programadas.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#c02425',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '<i class="fa-solid fa-trash me-1"></i> Sí, Cancelar',
      cancelButtonText: 'Continuar editando',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.resetearFormulario();
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'info',
          title: 'Operación cancelada y formulario reiniciado',
          showConfirmButton: false,
          timer: 2000
        });
      }
    });
  }

  guardarVenta(): void {
    if (!this.nuevaVenta.dniPaciente) {
      Swal.fire('Atención', 'Seleccione un paciente antes de continuar.', 'warning');
      return;
    }

    if (!this.nuevaVenta.idTratamiento || this.nuevaVenta.costoTotal <= 0) {
      Swal.fire('Atención', 'Seleccione un tratamiento válido antes de continuar.', 'warning');
      return;
    }

    const tratamiento = this.listaTratamientos.find(t => t.idTratamiento == this.nuevaVenta.idTratamiento);
    const paciente = this.listaPacientes.find(p => p.dni === this.nuevaVenta.dniPaciente) || this.pacienteSeleccionado;
    const nombrePaciente = paciente ? `${paciente.apellidos}, ${paciente.nombres}` : this.nuevaVenta.dniPaciente;
    const totalSesiones = this.sesionesProgramadas.length;

    Swal.fire({
      title: '¿Confirmar Emisión y Agendamiento?',
      html: `
        <div style="text-align: left; background-color: #2b3035; border: 1px solid #414850; border-radius: 12px; padding: 16px; margin-bottom: 12px; font-size: 0.92rem; color: #ffffff;">
          <div style="margin-bottom: 9px; display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #94a3b8; font-weight: 500;">Paciente:</span>
            <strong style="color: #ffffff; text-align: right; max-width: 65%;">${nombrePaciente}</strong>
          </div>
          <div style="margin-bottom: 9px; display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #94a3b8; font-weight: 500;">DNI:</span>
            <strong style="color: #ffffff;">${this.nuevaVenta.dniPaciente}</strong>
          </div>
          <div style="margin-bottom: 9px; display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #94a3b8; font-weight: 500;">Tratamiento:</span>
            <strong style="color: #38bdf8; text-align: right; max-width: 65%;">${tratamiento?.nombre || 'Tratamiento Quiropráctico'}</strong>
          </div>
          <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #94a3b8; font-weight: 500;">Citas a Programar:</span>
            <span style="background-color: #c02425; color: #ffffff; font-weight: 700; padding: 3px 12px; border-radius: 20px; font-size: 0.82rem;">
              ${totalSesiones} sesión(es)
            </span>
          </div>
          <div style="border-top: 1px solid #414850; padding-top: 10px; margin-top: 6px; display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #e2e8f0; font-weight: 600; font-size: 0.95rem;">Total a Cobrar:</span>
            <span style="color: #f87171; font-size: 1.35rem; font-weight: 800;">S/. ${this.nuevaVenta.costoTotal.toFixed(2)}</span>
          </div>
        </div>
        <p style="color: #94a3b8; font-size: 0.82rem; margin: 0; line-height: 1.4;">
          Si detectó algún error en las fechas, horarios o paciente, pulse <strong>Cancelar</strong> para corregirlo.
        </p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#c02425',
      cancelButtonColor: '#4b5563',
      confirmButtonText: '<i class="fa-solid fa-check me-1"></i> Sí, Emitir y Agendar',
      cancelButtonText: '<i class="fa-solid fa-xmark me-1"></i> Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.procesarGuardadoVenta();
      }
    });
  }

  procesarGuardadoVenta(): void {
    const payload = {
      ...this.nuevaVenta,
      sesiones: this.sesionesProgramadas.map(s => ({
        numeroSesion: s.numeroSesion,
        fecha: s.fecha,
        hora: s.hora.length === 5 ? `${s.hora}:00` : s.hora
      }))
    };

    this.ventaService.registrarVenta(payload).subscribe({
      next: (res: any) => {
        this.emitirComprobante(res);
      },
      error: (err: any) => {
        if (err.status === 200 || err.status === 201) { 
          this.emitirComprobante(err.error || {}); 
        } else { 
          console.error('Error al registrar venta:', err);
          Swal.fire('Error', 'No se pudo procesar la venta en el servidor.', 'error'); 
        }
      }
    });
  }

  emitirComprobante(res: any): void {
    const t = this.listaTratamientos.find(item => item.idTratamiento == this.nuevaVenta.idTratamiento);
    const p = this.listaPacientes.find(item => item.dni === this.nuevaVenta.dniPaciente) || this.pacienteSeleccionado;
    const cajeroNombre = localStorage.getItem('nombreUsuario') || 'Caja Central';
    
    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, '0');
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const anio = hoy.getFullYear();
    const hora = String(hoy.getHours()).padStart(2, '0');
    const min = String(hoy.getMinutes()).padStart(2, '0');

    this.comprobanteEmitido = {
      nroHp: res?.nroHp || 'HP001',
      fechaEmision: `${dia}/${mes}/${anio}`,
      horaEmision: `${hora}:${min}`,
      pacienteNombre: p ? `${p.apellidos}, ${p.nombres}` : 'Paciente Registrado',
      dniPaciente: this.nuevaVenta.dniPaciente,
      telefonoPaciente: p?.telefono || 'Sin teléfono',
      direccionPaciente: p?.direccion || 'Sin dirección',
      nombreTratamiento: t ? t.nombre : (this.recetaMedica?.tratamientoSugerido || 'Tratamiento Quiropráctico'),
      precioUnitario: t ? t.precio : (this.nuevaVenta.costoTotal / (this.nuevaVenta.totalSesiones || 1)),
      totalSesiones: this.nuevaVenta.totalSesiones,
      costoTotal: this.nuevaVenta.costoTotal,
      cajero: cajeroNombre,
      citas: [...this.sesionesProgramadas]
    };

    this.mostrarModalComprobante = true;
    this.cdr.detectChanges();
  }

  descargarPDF(): void {
    if (!this.comprobanteEmitido) return;

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const c = this.comprobanteEmitido;

      // Encabezado decorativo (barra roja carmesí superior)
      doc.setFillColor(192, 36, 37);
      doc.rect(0, 0, 210, 10, 'F');

      // Título de la clínica
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(192, 36, 37);
      doc.text('CENTRO QUIROPRÁCTICO QUIROSALUD', 105, 23, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('Especialistas en Salud y Alineación de la Columna Vertebral', 105, 28, { align: 'center' });
      doc.text('R.U.C. 20608945123  |  Tel: (01) 456-7890 / 991-234-567  |  San Borja - Lima, Perú', 105, 33, { align: 'center' });

      // Caja de Boleta Electrónica
      doc.setDrawColor(192, 36, 37);
      doc.setLineWidth(0.8);
      doc.roundedRect(60, 39, 90, 11, 3, 3);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(192, 36, 37);
      doc.text(`BOLETA DE VENTA: ${c.nroHp}`, 105, 46.5, { align: 'center' });

      // Línea divisoria
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(14, 55, 196, 55);

      // Datos de emisión y cliente
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);

      // Fila 1
      doc.setFont('helvetica', 'bold');
      doc.text('Fecha de Emisión:', 14, 62);
      doc.setFont('helvetica', 'normal');
      doc.text(`${c.fechaEmision}   ${c.horaEmision}`, 50, 62);

      doc.setFont('helvetica', 'bold');
      doc.text('Cajero(a):', 130, 62);
      doc.setFont('helvetica', 'normal');
      doc.text(`${c.cajero}`, 155, 62);

      // Fila 2
      doc.setFont('helvetica', 'bold');
      doc.text('Paciente / Cliente:', 14, 70);
      doc.setFont('helvetica', 'normal');
      doc.text(`${c.pacienteNombre}`, 50, 70);

      doc.setFont('helvetica', 'bold');
      doc.text('DNI / Doc.:', 130, 70);
      doc.setFont('helvetica', 'normal');
      doc.text(`${c.dniPaciente}`, 155, 70);

      // Fila 3
      doc.setFont('helvetica', 'bold');
      doc.text('Dirección:', 14, 78);
      doc.setFont('helvetica', 'normal');
      doc.text(`${c.direccionPaciente}`, 50, 78);

      doc.setFont('helvetica', 'bold');
      doc.text('Teléfono:', 130, 78);
      doc.setFont('helvetica', 'normal');
      doc.text(`${c.telefonoPaciente}`, 155, 78);

      // Tabla de Conceptos Facturados
      doc.setFillColor(241, 245, 249);
      doc.rect(14, 86, 182, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text('CANT.', 18, 91.5);
      doc.text('DESCRIPCIÓN DEL SERVICIO', 45, 91.5);
      doc.text('P. UNIT.', 140, 91.5);
      doc.text('SUBTOTAL', 170, 91.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${c.totalSesiones} ses.`, 18, 101);
      doc.setFont('helvetica', 'bold');
      doc.text(`${c.nombreTratamiento}`, 45, 101);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Paquete quiropráctico con sesiones programadas', 45, 106);

      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`S/. ${c.precioUnitario.toFixed(2)}`, 140, 101);
      doc.setFont('helvetica', 'bold');
      doc.text(`S/. ${c.costoTotal.toFixed(2)}`, 170, 101);

      // Línea debajo del concepto
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 112, 196, 112);

      // Cuadro de Cronograma de Sesiones Agendadas
      const yCronograma = 119;
      const totalFilasCitas = Math.ceil(c.citas.length / 2);
      const altoCuadroCitas = 12 + (totalFilasCitas * 6.5);

      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(254, 205, 211);
      doc.roundedRect(14, yCronograma, 182, altoCuadroCitas, 3, 3, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(192, 36, 37);
      doc.text('CRONOGRAMA DE CITAS AGENDADAS:', 18, yCronograma + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);

      let fila = 0;
      c.citas.forEach((s, idx) => {
        const col = idx % 2;
        const xPos = col === 0 ? 20 : 108;
        const yPos = yCronograma + 12 + (fila * 6.5);
        doc.text(`• Sesión ${s.numeroSesion}:  ${s.fecha}   Hora: ${s.hora}`, xPos, yPos);
        if (col === 1) fila++;
      });
      if (c.citas.length % 2 !== 0) fila++;

      const yTotales = yCronograma + altoCuadroCitas + 8;

      // Totales
      const subtotal = c.costoTotal / 1.18;
      const igv = c.costoTotal - subtotal;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text('Subtotal (Op. Gravada):', 125, yTotales);
      doc.text(`S/. ${subtotal.toFixed(2)}`, 172, yTotales);

      doc.text('I.G.V. (18%):', 125, yTotales + 6);
      doc.text(`S/. ${igv.toFixed(2)}`, 172, yTotales + 6);

      doc.setDrawColor(192, 36, 37);
      doc.setLineWidth(0.6);
      doc.line(125, yTotales + 9, 196, yTotales + 9);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(192, 36, 37);
      doc.text('TOTAL CANCELADO:', 115, yTotales + 15);
      doc.text(`S/. ${c.costoTotal.toFixed(2)}`, 172, yTotales + 15);

      // Pie de comprobante
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Estado: CANCELADO EN CAJA  |  Condición de Pago: Contado / Efectivo / POS', 105, yTotales + 25, { align: 'center' });
      doc.text('"Su salud y bienestar espinal es nuestra prioridad. Por favor presente este comprobante al ingresar."', 105, yTotales + 30, { align: 'center' });

      // Barra inferior
      doc.setFillColor(192, 36, 37);
      doc.rect(0, 287, 210, 10, 'F');

      // Descarga directa del archivo PDF (sin abrir ventana de imprimir)
      const nombreArchivo = `Boleta_${c.nroHp}_${c.dniPaciente}.pdf`;
      doc.save(nombreArchivo);

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `Descargado: ${nombreArchivo}`,
        showConfirmButton: false,
        timer: 3000
      });

    } catch (err) {
      console.error('Error al generar PDF:', err);
      Swal.fire('Error', 'No se pudo generar el archivo PDF.', 'error');
    }
  }

  imprimirComprobante(): void {
    window.print();
  }

  cerrarComprobante(): void {
    const hp = this.comprobanteEmitido?.nroHp || '';
    const total = this.comprobanteEmitido?.totalSesiones || 0;
    const paciente = this.comprobanteEmitido?.pacienteNombre || 'el paciente';

    this.mostrarModalComprobante = false;
    this.comprobanteEmitido = null;
    this.resetearFormulario();

    Swal.fire({
      title: '¡Citas Agendadas Exitosamente!',
      html: `
        <div class="text-start p-2">
          <p class="mb-2">La venta con hoja <strong>${hp}</strong> para <strong>${paciente}</strong> fue registrada en Caja.</p>
          <div class="alert alert-success py-2 mb-0 small">
            <i class="fa-solid fa-circle-check me-1"></i> Se agendaron <strong>${total} sesiones</strong> en el sistema. Ya están visibles en la <strong>Sala de Espera</strong> del médico y en el módulo de <strong>Asistencia</strong>.
          </div>
        </div>
      `,
      icon: 'success',
      confirmButtonColor: '#c02425',
      confirmButtonText: 'Entendido'
    });
  }

  resetearFormulario(): void {
    const idGuardado = localStorage.getItem('idUsuario');
    this.recetaMedica = null;
    this.limpiarPaciente();
    this.nuevaVenta = { 
      dniPaciente: '', 
      idTratamiento: '', 
      totalSesiones: 1, 
      costoTotal: 0.0, 
      idUsuario: idGuardado ? parseInt(idGuardado, 10) : 0 
    };
    this.sesionesProgramadas = [];
    this.inicializarFechaInicio();
    this.cdr.detectChanges();
  }
}
