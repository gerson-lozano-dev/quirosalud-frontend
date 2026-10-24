import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AsistenciaService } from '../../services/asistencia';
import { PacienteService } from '../../services/paciente';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-asistencia',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './asistencia.html'
})
export class AsistenciaComponent implements OnInit {

  private asistenciaService = inject(AsistenciaService);
  private pacienteService = inject(PacienteService);
  private cdr = inject(ChangeDetectorRef);

  dniBusqueda: string = '';
  listaPacientes: any[] = [];
  listaCitas: any[] = [];
  pacienteEncontrado: any = null;
  listaConsultas: any[] = [];
  ultimoDiagnostico: any = null;
  busquedaRealizada: boolean = false;
  citaSeleccionada: any = { idCita: null, notasAjuste: '', pagado: true };

  ngOnInit(): void {
    this.cargarPacientes();
  }

  cargarPacientes(): void {
    this.pacienteService.listarPacientes().subscribe({
      next: (datos) => {
        this.listaPacientes = datos || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar la lista de pacientes', err);
      }
    });
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

  buscarHistorial(): void {
    if (!this.dniBusqueda || this.dniBusqueda.length !== 8) {
      Swal.fire('Atención', 'Ingrese un DNI válido de 8 dígitos.', 'warning');
      return;
    }

    this.asistenciaService.obtenerExpedienteCompleto(this.dniBusqueda).subscribe({
      next: (expediente) => {
        this.pacienteEncontrado = expediente.paciente;
        this.listaConsultas = expediente.consultas || [];
        this.ultimoDiagnostico = this.listaConsultas.length > 0 ? this.listaConsultas[0] : null;
        this.listaCitas = expediente.sesiones || [];
        this.busquedaRealizada = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al buscar el expediente clínico', err);
        Swal.fire('Error', 'No se pudo cargar el historial del paciente.', 'error');
      }
    });
  }

  prepararAsistencia(citaFila: any): void {
    this.citaSeleccionada = { 
      idCita: citaFila.idCita, 
      notasAjuste: citaFila.notasAjuste || '',
      pagado: citaFila.pagado ?? true
    };
  }

  guardarAsistencia(): void {
    this.asistenciaService.marcarAsistencia(this.citaSeleccionada.idCita, this.citaSeleccionada).subscribe({
      next: () => this.exitoAlGuardar(),
      error: (err) => {
        if (err.status === 200) { 
          this.exitoAlGuardar(); 
        } else { 
          Swal.fire('Error', 'No se pudo marcar la asistencia.', 'error'); 
        }
      }
    });
  }

  exitoAlGuardar(): void {
    Swal.fire({ 
      title: '¡Asistencia Marcada!', 
      text: 'La sesión y las notas de evolución han sido guardadas.', 
      icon: 'success', 
      confirmButtonColor: '#198754' 
    });
    this.buscarHistorial();
  }
}
