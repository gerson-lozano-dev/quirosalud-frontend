import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConsultaService {
  
  private http = inject(HttpClient);
  // Ahora todo pasa por el API Gateway en el puerto 8080
  private apiUrl = 'http://localhost:8080/api/v1/consultas'; 

  listarPendientes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/pendientes`);
  }

  registrarConsulta(consulta: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/registro`, consulta);
  }
  
  finalizarConsulta(id: any, consulta: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/atender/${id}`, consulta);
  }

  obtenerUltimoDiagnostico(dni: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/ultimo-diagnostico/${dni}`);
  }
}