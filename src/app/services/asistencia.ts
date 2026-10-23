import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AsistenciaService {
  private http = inject(HttpClient);
  // Apuntamos al API Gateway (puerto 8080) y a la ruta versión 1
  private apiUrl = 'http://localhost:8080/api/v1/citas'; 

  // 1. Mantiene tu método original por compatibilidad
  buscarHistorial(dni: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/historial/${dni}`);
  }

  // 2. NUEVO: Trae Paciente (vía Feign) + Consultas (Diagnósticos) + Sesiones (Asistencias)
  obtenerExpedienteCompleto(dni: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/expediente/${dni}`);
  }

  // 3. Marca asistencia, guarda notas de ajuste y estado de pago de la sesión
  marcarAsistencia(idCita: number, datosActualizados: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/asistencia/${idCita}`, datosActualizados);
  }
}