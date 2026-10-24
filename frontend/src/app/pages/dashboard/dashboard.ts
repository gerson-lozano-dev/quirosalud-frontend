import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  nombreActual: string = '';
  cargoActual: string = '';

  ngOnInit(): void {
    this.nombreActual = localStorage.getItem('nombreUsuario') || 'Usuario';
    this.cargoActual = localStorage.getItem('cargoUsuario') || 'SIN CARGO';
  }
}
