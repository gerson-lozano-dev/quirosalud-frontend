import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8990/api/usuarios'; 

  listarUsuarios(): Observable<any> {
    return this.http.get(`${this.apiUrl}/listado`);
  }

  registrarUsuario(usuario: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/registro`, usuario);
  }
  
  actualizarUsuario(id: any, usuario: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/actualizar/${id}`, usuario);
  }

  eliminarUsuario(id: any): Observable<any> {
    return this.http.delete(`${this.apiUrl}/eliminar/${id}`);
  }
}