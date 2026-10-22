import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs'; // <-- Importación agregada

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  // Inyectamos el cliente HTTP para poder hacer peticiones
  private http = inject(HttpClient);
  
  // Tu ruta apuntando al Gateway
  private apiUrl = 'http://localhost:8080/api/v1/auth'; 

  login(credenciales: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credenciales);
  }
}