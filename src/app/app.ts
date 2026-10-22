import { Component, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
// Importamos apuntando a tu archivo navbar.ts
import { NavbarComponent } from './components/navbar/navbar'; 

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.html', // Ajustado a tu nombre de archivo
  styleUrl: './app.css'      // Ajustado a tu nombre de archivo
})
export class AppComponent {
  
  private router = inject(Router);

  mostrarNavbar(): boolean {
    return this.router.url !== '/login';
  }
}