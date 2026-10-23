import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PacienteService {
  
  private http = inject(HttpClient);
  
  private apiUrl = 'http://localhost:8080/api/v1/pacientes'; 
  private distritosUrl = 'http://localhost:8080/api/v1/distritos';

  listarPacientes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/listado`);
  }

  obtenerPacientePorDni(dni: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/dni/${dni}`);
  }

  registrarPaciente(paciente: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/registro`, paciente);
  }

  actualizarPaciente(id: any, paciente: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/actualizar/${id}`, paciente);
  }

  eliminarPaciente(id: any): Observable<any> {
    return this.http.delete(`${this.apiUrl}/eliminar/${id}`);
  }

  listarDistritos(): Observable<any> {
    return this.http.get(`${this.distritosUrl}/listado`);
  }
}
