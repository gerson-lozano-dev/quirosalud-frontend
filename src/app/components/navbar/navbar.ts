import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router'; 

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive], 
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent { 
  
  // 1. Inyectamos el Router (DENTRO de la clase)
  private router = inject(Router);

  cargoActual = localStorage.getItem('cargoUsuario');
  // Variable para guardar el nombre
  nombreActual: string = '';

  ngOnInit() {
    // Cuando el menú carga, saca el nombre de la memoria (o pone Usuario si no hay nada)
    this.nombreActual = localStorage.getItem('nombreUsuario') || 'Usuario';
  }

  // 2. El método va DENTRO de la clase
  cerrarSesion() {
    localStorage.clear();
    this.router.navigate(['/login']); // Lo mandamos al login
  }
  
}