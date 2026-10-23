import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router'; 
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive], 
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent implements OnInit { 
  private router = inject(Router);
  private auth = inject(AuthService);

  cargoActual: string = '';
  nombreActual: string = 'Usuario';

  ngOnInit() {
    const usuario = this.auth.usuarioActual();
    if (usuario) {
      this.nombreActual = usuario.nombres || 'Usuario';
      this.cargoActual = (usuario.cargo || '').replace('ROLE_', '').toUpperCase();
    } else {
      this.cargoActual = (localStorage.getItem('cargoUsuario') || '').replace('ROLE_', '').toUpperCase();
      this.nombreActual = localStorage.getItem('nombreUsuario') || 'Usuario';
    }
  }

  cerrarSesion() {
    this.auth.cerrarSesion();
    this.router.navigate(['/login']);
  }
}
