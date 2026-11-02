import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ConsultaService } from '../../services/consulta';
import { TratamientoService } from '../../services/tratamiento';
import { PacienteService } from '../../services/paciente';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-citas',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './citas.html'
})
export class CitasComponent implements OnInit {

  private consultaService = inject(ConsultaService);
  private tratamientoService = inject(TratamientoService);
  private pacienteService = inject(PacienteService);
  private cdr = inject(ChangeDetectorRef);

  listaPendientes: any[] = [];
  listaTratamientos: any[] = [];
  listaPacientes: any[] = [];
  nuevaCita = { dniPaciente: '', fecha: '', hora: '', motivo: '', estado: 'PENDIENTE' };
  citaAtencion: any = { idConsulta: null, diagnostico: '', tratamientoSugerido: '', sesionesSugeridas: 1, motivo: '', sesionesTotales: 0, sesionesAsistidas: 0 };
  pacienteAtencion: any = null;
  cargandoPaciente: boolean = false;
  nombrePacienteAtencion: string = '';

  // Búsqueda y autocompletado de pacientes al agendar
  textoBusquedaPaciente: string = '';
  mostrarDropdownPacientes: boolean = false;
  pacienteSeleccionado: any = null;

  filtroPeriodo: 'HOY' | 'SEMANA' | 'MES' | 'TODAS' = 'TODAS';
  filtroTexto: string = '';

  ngOnInit(): void {
    this.cargarPendientes();
    this.cargarTratamientos();
    this.cargarPacientes();
    this.setFechaActual();
  }

  cargarPacientes(): void {
    this.pacienteService.listarPacientes().subscribe({
      next: (datos: any) => {
        this.listaPacientes = datos || [];
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Error al cargar la lista de pacientes', err)
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
      this.nuevaCita.dniPaciente = '';
      this.pacienteSeleccionado = null;
      this.cdr.detectChanges();
      return;
    }

    const valorLimpio = valor.trim().toLowerCase();
    // Búsqueda directa por coincidencia exacta de DNI
    const matchExactoDni = this.listaPacientes.find(p => (p.dni || '').trim() === valor.trim());
    if (matchExactoDni) {
      this.nuevaCita.dniPaciente = matchExactoDni.dni;
      this.pacienteSeleccionado = matchExactoDni;
    } else {
      if (this.pacienteSeleccionado) {
        const etiquetaActual = `${this.pacienteSeleccionado.apellidos}, ${this.pacienteSeleccionado.nombres} (DNI: ${this.pacienteSeleccionado.dni})`.toLowerCase();
        if (etiquetaActual !== valorLimpio) {
          this.nuevaCita.dniPaciente = '';
          this.pacienteSeleccionado = null;
        }
      }
    }
    this.cdr.detectChanges();
  }

  seleccionarPaciente(p: any): void {
    this.pacienteSeleccionado = p;
    this.nuevaCita.dniPaciente = p.dni;
    this.textoBusquedaPaciente = `${p.apellidos}, ${p.nombres} (DNI: ${p.dni})`;
    this.mostrarDropdownPacientes = false;
    this.cdr.detectChanges();
  }

  toggleDropdown(): void {
    this.mostrarDropdownPacientes = !this.mostrarDropdownPacientes;
    this.cdr.detectChanges();
  }

  limpiarPaciente(): void {
    this.textoBusquedaPaciente = '';
    this.nuevaCita.dniPaciente = '';
    this.pacienteSeleccionado = null;
    this.mostrarDropdownPacientes = false;
    this.cdr.detectChanges();
  }

  cerrarDropdownConRetraso(): void {
    setTimeout(() => {
      this.mostrarDropdownPacientes = false;
      this.cdr.detectChanges();
    }, 200);
  }

  cargarTratamientos(): void {
    this.tratamientoService.listarTratamientos().subscribe({
      next: (datos) => {
        this.listaTratamientos = datos || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar tratamientos', err)
    });
  }

  setFechaActual(): void {
    const hoy = new Date();
    const y = hoy.getFullYear();
    const m = String(hoy.getMonth() + 1).padStart(2, '0');
    const d = String(hoy.getDate()).padStart(2, '0');
    this.nuevaCita.fecha = `${y}-${m}-${d}`;
  }

  cargarPendientes(): void {
    this.consultaService.listarPendientes().subscribe({
      next: (datos) => {
        this.listaPendientes = datos || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar sala de espera', err)
    });
  }

  formatearFecha(fecha: any): string {
    if (!fecha) return 'Sin fecha';
    if (typeof fecha === 'string') {
      const parteFecha = fecha.split('T')[0];
      const partes = parteFecha.split('-');
      if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
      }
    }
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return 'Sin fecha';
    const dia = String(d.getUTCDate()).padStart(2, '0');
    const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
    const anio = d.getUTCFullYear();
    return `${dia}/${mes}/${anio}`;
  }

  cambiarPeriodo(periodo: 'HOY' | 'SEMANA' | 'MES' | 'TODAS'): void {
    this.filtroPeriodo = periodo;
    this.cdr.detectChanges();
  }

  get conteoHoy(): number {
    const hoy = new Date();
    const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    return this.listaPendientes.filter(c => (c.fecha || '').toString().split('T')[0] === hoyStr).length;
  }

  get conteoSemana(): number {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const finSemana = new Date(hoy);
    finSemana.setDate(finSemana.getDate() + 7);
    finSemana.setHours(23, 59, 59, 999);
    return this.listaPendientes.filter(c => {
      if (!c.fecha) return false;
      const partes = c.fecha.toString().split('T')[0].split('-').map(Number);
      if (partes.length !== 3) return false;
      const f = new Date(partes[0], partes[1] - 1, partes[2]);
      return f >= hoy && f <= finSemana;
    }).length;
  }

  get conteoMes(): number {
    const hoy = new Date();
    const mActual = hoy.getMonth() + 1;
    const aActual = hoy.getFullYear();
    return this.listaPendientes.filter(c => {
      if (!c.fecha) return false;
      const partes = c.fecha.toString().split('T')[0].split('-').map(Number);
      if (partes.length !== 3) return false;
      return partes[0] === aActual && partes[1] === mActual;
    }).length;
  }

  get conteoTodas(): number {
    return this.listaPendientes.length;
  }

  get citasFiltradas(): any[] {
    let resultado = this.listaPendientes || [];

    if (this.filtroPeriodo !== 'TODAS') {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

      if (this.filtroPeriodo === 'HOY') {
        resultado = resultado.filter(c => (c.fecha || '').toString().split('T')[0] === hoyStr);
      } else if (this.filtroPeriodo === 'SEMANA') {
        const finSemana = new Date(hoy);
        finSemana.setDate(finSemana.getDate() + 7);
        finSemana.setHours(23, 59, 59, 999);
        resultado = resultado.filter(c => {
          if (!c.fecha) return false;
          const partes = c.fecha.toString().split('T')[0].split('-').map(Number);
          if (partes.length !== 3) return false;
          const f = new Date(partes[0], partes[1] - 1, partes[2]);
          return f >= hoy && f <= finSemana;
        });
      } else if (this.filtroPeriodo === 'MES') {
        const mActual = hoy.getMonth() + 1;
        const aActual = hoy.getFullYear();
        resultado = resultado.filter(c => {
          if (!c.fecha) return false;
          const partes = c.fecha.toString().split('T')[0].split('-').map(Number);
          if (partes.length !== 3) return false;
          return partes[0] === aActual && partes[1] === mActual;
        });
      }
    }

    if (this.filtroTexto && this.filtroTexto.trim() !== '') {
      const q = this.filtroTexto.toLowerCase().trim();
      resultado = resultado.filter(c => {
        const dni = (c.dniPaciente || '').toLowerCase();
        const nombres = (c.paciente?.nombres || '').toLowerCase();
        const apellidos = (c.paciente?.apellidos || '').toLowerCase();
        const nombreCompleto = `${apellidos} ${nombres} ${apellidos}`.toLowerCase();
        const motivo = (c.motivo || '').toLowerCase();
        const tratamiento = (c.tratamientoSugerido || '').toLowerCase();
        return dni.includes(q) || nombreCompleto.includes(q) || motivo.includes(q) || tratamiento.includes(q);
      });
    }

    return resultado;
  }

  cancelarCitaNueva(): void {
    if (!this.nuevaCita.dniPaciente && !this.nuevaCita.motivo) {
      this.nuevaCita = { dniPaciente: '', fecha: '', hora: '', motivo: '', estado: 'PENDIENTE' };
      this.limpiarPaciente();
      return;
    }

    Swal.fire({
      title: '¿Cancelar agendamiento?',
      text: 'Se limpiará el formulario y se descartarán los datos ingresados.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e85d38',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '<i class="fa-solid fa-trash me-1"></i> Sí, cancelar',
      cancelButtonText: 'Continuar editando',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.nuevaCita = { dniPaciente: '', fecha: '', hora: '', motivo: '', estado: 'PENDIENTE' };
        this.limpiarPaciente();
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'info',
          title: 'Formulario de cita cancelado y reiniciado',
          showConfirmButton: false,
          timer: 2000
        });
      }
    });
  }

  agendarCita(): void {
    if (!this.nuevaCita.dniPaciente) {
      Swal.fire({
        title: 'Paciente no seleccionado',
        text: 'Por favor seleccione un paciente de la lista o escriba su DNI/nombre para buscarlo.',
        icon: 'warning',
        confirmButtonColor: '#0d6efd'
      });
      return;
    }

    const paciente = this.pacienteSeleccionado;
    const nombre = paciente ? `${paciente.apellidos}, ${paciente.nombres}` : this.nuevaCita.dniPaciente;

    Swal.fire({
      title: '¿Confirmar Agendamiento?',
      html: `
        <div style="text-align: left; background-color: #2b3035; border: 1px solid #414850; border-radius: 12px; padding: 16px; margin-bottom: 12px; font-size: 0.92rem; color: #ffffff;">
          <div style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #94a3b8; font-weight: 500;">Paciente:</span>
            <strong style="color: #ffffff; text-align: right; max-width: 65%;">${nombre}</strong>
          </div>
          <div style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #94a3b8; font-weight: 500;">DNI:</span>
            <strong style="color: #ffffff;">${this.nuevaCita.dniPaciente}</strong>
          </div>
          <div style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #94a3b8; font-weight: 500;">Fecha:</span>
            <strong style="color: #ffffff;">${this.nuevaCita.fecha}</strong>
          </div>
          <div style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #94a3b8; font-weight: 500;">Hora:</span>
            <strong style="color: #38bdf8;">${this.nuevaCita.hora}</strong>
          </div>
          <div style="border-top: 1px solid #414850; padding-top: 8px; margin-top: 6px;">
            <span style="color: #94a3b8; font-weight: 500;">Motivo:</span>
            <span style="color: #e2e8f0; display: block; margin-top: 2px;">${this.nuevaCita.motivo || 'Consulta médica'}</span>
          </div>
        </div>
        <p style="color: #94a3b8; font-size: 0.82rem; margin: 0;">
          Si hubo alguna equivocación, puede pulsar <strong>Cancelar</strong> para corregirlo.
        </p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0d6efd',
      cancelButtonColor: '#4b5563',
      confirmButtonText: '<i class="fa-solid fa-check me-1"></i> Sí, Agendar',
      cancelButtonText: '<i class="fa-solid fa-xmark me-1"></i> Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.procesarRegistroCita();
      }
    });
  }

  procesarRegistroCita(): void {
    let datosAEnviar = { ...this.nuevaCita };
    if (datosAEnviar.hora && datosAEnviar.hora.length === 5) {
      datosAEnviar.hora = datosAEnviar.hora + ':00';
    }

    this.consultaService.registrarConsulta(datosAEnviar).subscribe({
      next: () => this.exitoAgendar(),
      error: (err) => {
        if (err.status === 200 || err.status === 201) { 
          this.exitoAgendar(); 
        } else { 
          console.error('Error al registrar consulta:', err);
          Swal.fire('Error', 'Revise que el DNI exista o intente de nuevo.', 'error'); 
        }
      }
    });
  }

  exitoAgendar(): void {
    Swal.fire({ title: '¡Agendado!', text: 'El paciente está en sala de espera.', icon: 'success', confirmButtonColor: '#0d6efd' });
    this.limpiarPaciente();
    this.nuevaCita.hora = '';
    this.nuevaCita.motivo = '';
    this.setFechaActual();
    this.cargarPendientes();
  }

  calcularEdad(fechaNacimiento: any): string {
    if (!fechaNacimiento) return 'N/D';
    const cumple = new Date(fechaNacimiento);
    if (isNaN(cumple.getTime())) return 'N/D';
    const hoy = new Date();
    let edad = hoy.getFullYear() - cumple.getFullYear();
    const m = hoy.getMonth() - cumple.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < cumple.getDate())) {
      edad--;
    }
    return edad >= 0 ? `${edad} años` : 'N/D';
  }

  prepararAtencion(citaFila: any): void {
    this.citaAtencion = {
      idConsulta: citaFila.idConsulta || 0,
      idCita: citaFila.idCita || null,
      tipo: citaFila.tipo || 'CONSULTA',
      numeroSesion: citaFila.numeroSesion || null,
      nroHp: citaFila.nroHp || null,
      diagnostico: citaFila.diagnostico || (citaFila.tipo === 'TRATAMIENTO' ? 'Ajuste quiropráctico y terapia vertebral aplicada sin complicaciones.' : ''),
      tratamientoSugerido: citaFila.tratamientoSugerido || '',
      sesionesSugeridas: citaFila.sesionesSugeridas !== undefined && citaFila.sesionesSugeridas !== null ? citaFila.sesionesSugeridas : 5,
      motivo: citaFila.motivo || '',
      sesionesTotales: citaFila.sesionesTotales || 0,
      sesionesAsistidas: citaFila.sesionesAsistidas || 0
    };
    this.pacienteAtencion = citaFila.paciente || null;
    this.nombrePacienteAtencion = (citaFila.paciente?.nombres ? (citaFila.paciente.nombres + ' ' + citaFila.paciente.apellidos) : (citaFila.nombrePaciente || citaFila.dniPaciente));

    if (citaFila.dniPaciente) {
      this.cargandoPaciente = true;
      this.pacienteService.obtenerPacientePorDni(citaFila.dniPaciente).subscribe({
        next: (p) => {
          this.pacienteAtencion = p;
          this.nombrePacienteAtencion = `${p.apellidos}, ${p.nombres}`;
          this.cargandoPaciente = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.cargandoPaciente = false;
          this.cdr.detectChanges();
        }
      });
    }
    this.cdr.detectChanges();
  }

  marcarAltaMedica(): void {
    this.citaAtencion.sesionesSugeridas = 0;
    this.citaAtencion.tratamientoSugerido = 'Ninguno (Alta médica / Sin patología)';
    if (!this.citaAtencion.diagnostico || this.citaAtencion.diagnostico.trim() === '') {
      this.citaAtencion.diagnostico = 'Evaluación física y postural normal. Sin subluxaciones vertebrales detectadas. Paciente recibe alta médica y pautas ergonómicas preventivas.';
    }
    this.cdr.detectChanges();
  }

  finalizarConsulta(): void {
    this.consultaService.finalizarConsulta(this.citaAtencion.idConsulta, this.citaAtencion).subscribe({
      next: () => this.exitoFinalizar(),
      error: (err) => {
        if (err.status === 200) { 
          this.exitoFinalizar(); 
        } else { 
          Swal.fire('Error', 'No se pudo guardar el diagnóstico.', 'error'); 
        }
      }
    });
  }

  exitoFinalizar(): void {
    Swal.fire({ title: '¡Atendido!', text: 'Diagnóstico guardado correctamente.', icon: 'success', confirmButtonColor: '#198754' });
    this.cargarPendientes();
  }
}
