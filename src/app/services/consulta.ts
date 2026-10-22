import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConsultaService {
  
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8990/api/consultas'; 

  listarPendientes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/pendientes`);
  }

  registrarConsulta(consulta: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/registro`, consulta);
  }
  
  finalizarConsulta(id: any, consulta: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/atender/${id}`, consulta);
  }
}