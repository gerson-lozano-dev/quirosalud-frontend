import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AsistenciaService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/v1/citas'; 

  buscarHistorial(dni: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/historial/${dni}`);
  }

  obtenerExpedienteCompleto(dni: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/expediente/${dni}`);
  }

  marcarAsistencia(idCita: number, datosActualizados: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/asistencia/${idCita}`, datosActualizados);
  }
}
