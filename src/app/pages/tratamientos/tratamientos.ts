import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TratamientoService } from '../../services/tratamiento';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-tratamientos',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './tratamientos.html',
  styleUrl: './tratamientos.css' // Si no tienes CSS, puedes dejarlo vacío o borrar esta línea
})
export class TratamientosComponent implements OnInit {

  private tratamientoService = inject(TratamientoService);
  private cdr = inject(ChangeDetectorRef);

  listaTratamientos: any[] = [];
  esEdicion: boolean = false;
  tratamientoObj = this.obtenerTratamientoVacio();

  ngOnInit(): void {
    this.cargarTratamientos();
  }

  obtenerTratamientoVacio() {
    this.esEdicion = false;
    return {
      idTratamiento: null,
      nombre: '',
      precio: null,
      descripcion: ''
    };
  }

  cargarTratamientos() {
    this.tratamientoService.listarTratamientos().subscribe({
      next: (datos) => {
        this.listaTratamientos = datos;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar tratamientos', err)
    });
  }

  prepararNuevoTratamiento() {
    this.tratamientoObj = this.obtenerTratamientoVacio();
    this.cdr.detectChanges();
  }

  abrirModalEditar(tratamientoFila: any) {
    this.esEdicion = true;
    this.tratamientoObj = { ...tratamientoFila };
    this.cdr.detectChanges();
  }

  guardar() {
    if (this.esEdicion) {
      this.tratamientoService.actualizarTratamiento(this.tratamientoObj.idTratamiento, this.tratamientoObj).subscribe({
        next: () => this.exitoAlGuardar('¡Actualizado!'),
        error: (err) => {
          if (err.status === 200) { this.exitoAlGuardar('¡Actualizado!'); } 
          else { Swal.fire('Error', 'No se pudo actualizar.', 'error'); }
        }
      });
    } else {
      this.tratamientoService.registrarTratamiento(this.tratamientoObj).subscribe({
        next: () => this.exitoAlGuardar('¡Registrado!'),
        error: (err) => {
          if (err.status === 200) { this.exitoAlGuardar('¡Registrado!'); } 
          else { Swal.fire('Error', 'No se pudo guardar.', 'error'); }
        }
      });
    }
  }

  exitoAlGuardar(titulo: string) {
    Swal.fire({ title: titulo, text: 'Operación exitosa.', icon: 'success', confirmButtonColor: '#d63384' });
    this.tratamientoObj = this.obtenerTratamientoVacio();
    this.cargarTratamientos();
  }

  eliminar(tratamientoFila: any) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Vas a eliminar el tratamiento: ${tratamientoFila.nombre}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.tratamientoService.eliminarTratamiento(tratamientoFila.idTratamiento).subscribe({
          next: () => {
            Swal.fire('¡Eliminado!', 'El tratamiento ha sido borrado.', 'success');
            this.cargarTratamientos();
          },
          error: (err) => {
            if (err.status === 200) {
              Swal.fire('¡Eliminado!', 'El tratamiento ha sido borrado.', 'success');
              this.cargarTratamientos();
            } else {
              Swal.fire('Error', 'No se pudo eliminar.', 'error');
            }
          }
        });
      }
    });
  }
}