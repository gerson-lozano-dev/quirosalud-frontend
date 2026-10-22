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
  busquedaRealizada: boolean = false;

  // Objeto para atrapar las notas del modal y mandarlas al backend
  citaSeleccionada: any = { idCita: null, notasAjuste: '' };

  buscarHistorial() {
    if (!this.dniBusqueda || this.dniBusqueda.length !== 8) {
      Swal.fire('Atención', 'Ingrese un DNI válido de 8 dígitos.', 'warning');
      return;
    }

    this.asistenciaService.buscarHistorial(this.dniBusqueda).subscribe({
      next: (datos) => {
        this.listaCitas = datos;
        this.busquedaRealizada = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al buscar citas', err);
        Swal.fire('Error', 'No se pudo cargar el historial.', 'error');
      }
    });
  }

  // Prepara el modal vacío antes de abrirlo
  prepararAsistencia(citaFila: any) {
    this.citaSeleccionada = { 
      idCita: citaFila.idCita, 
      notasAjuste: '' 
    };
  }

  guardarAsistencia() {
    this.asistenciaService.marcarAsistencia(this.citaSeleccionada.idCita, this.citaSeleccionada).subscribe({
      next: () => this.exitoAlGuardar(),
      error: (err) => {
        // HACK SENIOR: Atrapamos el String "Asistencia confirmada exitosamente" que devuelve tu backend
        if (err.status === 200) { this.exitoAlGuardar(); } 
        else { Swal.fire('Error', 'No se pudo marcar la asistencia.', 'error'); }
      }
    });
  }

  exitoAlGuardar() {
    Swal.fire({ title: '¡Asistencia Marcada!', text: 'La sesión ha sido completada.', icon: 'success', confirmButtonColor: '#198754' });
    this.buscarHistorial(); // Refrescamos la tabla automáticamente
  }
}