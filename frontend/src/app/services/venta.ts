import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VentaService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/v1/ventas';

  registrarVenta(hojaPago: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/registro`, hojaPago);
  }
}
