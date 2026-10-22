import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../services/usuario';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './usuarios.html'
})
export class UsuariosComponent implements OnInit {

  private usuarioService = inject(UsuarioService);
  private cdr = inject(ChangeDetectorRef);

  listaUsuarios: any[] = [];
  esEdicion: boolean = false;
  usuarioObj = this.obtenerUsuarioVacio();

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  // Respetamos los mismos campos que usaste en tu modelo Java original
  obtenerUsuarioVacio() {
    this.esEdicion = false;
    return {
      idUsuario: null,
      nombres: '',
      apellidos: '',
      email: '',
      clave: '',
      cargo: 'ASISTENTE' // Rol por defecto
    };
  }

  cargarUsuarios() {
    this.usuarioService.listarUsuarios().subscribe({
      next: (datos) => {
        this.listaUsuarios = datos;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar usuarios', err)
    });
  }

  prepararNuevoUsuario() {
    this.usuarioObj = this.obtenerUsuarioVacio();
    this.cdr.detectChanges();
  }

  abrirModalEditar(usuarioFila: any) {
    this.esEdicion = true;
    this.usuarioObj = { ...usuarioFila };
    
    // Vaciamos la contraseña visualmente por seguridad.
    this.usuarioObj.clave = ''; 
    
    this.cdr.detectChanges();
  }

  guardar() {
    if (this.esEdicion) {
      this.usuarioService.actualizarUsuario(this.usuarioObj.idUsuario, this.usuarioObj).subscribe({
        next: () => this.exitoAlGuardar('¡Actualizado!'),
        error: (err) => {
          if (err.status === 200) { this.exitoAlGuardar('¡Actualizado!'); } 
          else { Swal.fire('Error', 'No se pudo actualizar.', 'error'); }
        }
      });
    } else {
      this.usuarioService.registrarUsuario(this.usuarioObj).subscribe({
        next: () => this.exitoAlGuardar('¡Registrado!'),
        error: (err) => {
          if (err.status === 200) { this.exitoAlGuardar('¡Registrado!'); } 
          else { Swal.fire('Error', 'No se pudo guardar.', 'error'); }
        }
      });
    }
  }

  exitoAlGuardar(titulo: string) {
    Swal.fire({ title: titulo, text: 'Operación exitosa.', icon: 'success', confirmButtonColor: '#0d6efd' });
    this.usuarioObj = this.obtenerUsuarioVacio();
    this.cargarUsuarios();
  }

  eliminar(usuarioFila: any) {
    Swal.fire({
      title: '¿Eliminar acceso?',
      text: `El usuario ${usuarioFila.nombres} ya no podrá entrar al sistema.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.usuarioService.eliminarUsuario(usuarioFila.idUsuario).subscribe({
          next: () => {
            Swal.fire('¡Eliminado!', 'El usuario ha sido borrado.', 'success');
            this.cargarUsuarios();
          },
          error: (err) => {
            if (err.status === 200) {
              Swal.fire('¡Eliminado!', 'El usuario ha sido borrado.', 'success');
              this.cargarUsuarios();
            } else {
              Swal.fire('Error', 'No se pudo eliminar.', 'error');
            }
          }
        });
      }
    });
  }
}