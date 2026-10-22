import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth'; // Ajusta la ruta si es necesario
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html'
})
export class LoginComponent {
  // Te dejo un correo por defecto para que no escribas tanto al probar
  credenciales = { email: 'juan@mail.com', clave: '' }; 
  
  private authService = inject(AuthService);
  private router = inject(Router);

  ingresar() {
    this.authService.login(this.credenciales).subscribe({
      next: (res: any) => {
      const u = res.response;
      localStorage.setItem('usuarioLogueado', 'true');
      localStorage.setItem('idUsuario', u.idUsuario);
      localStorage.setItem('nombreUsuario', u.nombres);
      localStorage.setItem('cargoUsuario', u.cargo);
      localStorage.setItem('token', u.token);
      this.router.navigate(['/dashboard']);
    },
    error: (err) => {
      if (err.status === 401) {
        Swal.fire('Acceso Denegado', 'Credenciales incorrectas', 'error');
      } else {
        Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
      }
    }
    });
  }
}