import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/v1/reportes';

  obtenerEstadisticaDistritos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/distritos`);
  }

  obtenerHistorialVentas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/ventas`);
  }
  
  obtenerEstadisticaTratamientos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/tratamientos-vendidos`);
  }
}
