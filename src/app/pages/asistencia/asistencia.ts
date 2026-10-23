import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AsistenciaService } from '../../services/asistencia';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-asistencia',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './asistencia.html'
})
export class AsistenciaComponent {

  private asistenciaService = inject(AsistenciaService);
  private cdr = inject(ChangeDetectorRef);

  dniBusqueda: string = '';
  listaCitas: any[] = [];
  
  // Nuevas variables para que el doctor vea el contexto clínico del paciente
  pacienteEncontrado: any = null;
  listaConsultas: any[] = [];
  ultimoDiagnostico: any = null;

  busquedaRealizada: boolean = false;

  // Objeto para atrapar las notas del modal y si pagó la sesión en ese momento
  citaSeleccionada: any = { idCita: null, notasAjuste: '', pagado: true };

  buscarHistorial() {
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

  // Prepara el modal antes de abrirlo
  prepararAsistencia(citaFila: any) {
    this.citaSeleccionada = { 
      idCita: citaFila.idCita, 
      notasAjuste: citaFila.notasAjuste || '',
      pagado: citaFila.pagado ?? true
    };
  }

  guardarAsistencia() {
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

  exitoAlGuardar() {
    Swal.fire({ 
      title: '¡Asistencia Marcada!', 
      text: 'La sesión y las notas de evolución han sido guardadas.', 
      icon: 'success', 
      confirmButtonColor: '#198754' 
    });
    this.buscarHistorial(); // Refrescamos el expediente automáticamente
  }
}