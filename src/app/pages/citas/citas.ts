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
  citaAtencion: any = { idConsulta: null, diagnostico: '', tratamientoSugerido: '', sesionesSugeridas: 1, motivo: '' };
  pacienteAtencion: any = null;
  cargandoPaciente: boolean = false;
  nombrePacienteAtencion: string = '';

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
    this.nuevaCita.fecha = hoy.toISOString().split('T')[0];
  }

  cargarPendientes(): void {
    this.consultaService.listarPendientes().subscribe({
      next: (datos) => {
        this.listaPendientes = datos;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar sala de espera', err)
    });
  }

  agendarCita(): void {
    let datosAEnviar = { ...this.nuevaCita };
    if (datosAEnviar.hora && datosAEnviar.hora.length === 5) {
      datosAEnviar.hora = datosAEnviar.hora + ':00';
    }

    this.consultaService.registrarConsulta(datosAEnviar).subscribe({
      next: () => this.exitoAgendar(),
      error: (err) => {
        if (err.status === 200) { 
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
    this.nuevaCita.dniPaciente = '';
    this.nuevaCita.hora = '';
    this.nuevaCita.motivo = '';
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
    this.citaAtencion.idConsulta = citaFila.idConsulta;
    this.citaAtencion.diagnostico = citaFila.diagnostico || '';
    this.citaAtencion.tratamientoSugerido = citaFila.tratamientoSugerido || '';
    this.citaAtencion.sesionesSugeridas = citaFila.sesionesSugeridas !== undefined && citaFila.sesionesSugeridas !== null ? citaFila.sesionesSugeridas : 5;
    this.citaAtencion.motivo = citaFila.motivo || '';
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
