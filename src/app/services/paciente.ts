import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PacienteService {
  
  // Inyectamos el cliente HTTP
  private http = inject(HttpClient);
  
  // NUEVA URL: Ahora Angular habla exclusivamente con el API Gateway
  private apiUrl = 'http://localhost:8080/api/v1/pacientes'; 

  // Método que va al Gateway y trae la lista completa
  listarPacientes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/listado`);
  }

  // Método POST para enviar un nuevo paciente
  registrarPaciente(paciente: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/registro`, paciente);
  }

  // Método para actualizar
  actualizarPaciente(id: any, paciente: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/actualizar/${id}`, paciente);
  }

  // Método para eliminar
  eliminarPaciente(id: any): Observable<any> {
    return this.http.delete(`${this.apiUrl}/eliminar/${id}`);
  }
}