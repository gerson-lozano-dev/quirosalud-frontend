import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TratamientoService {
  
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8990/api/tratamientos'; 

  listarTratamientos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/listado`);
  }

  registrarTratamiento(tratamiento: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/registro`, tratamiento);
  }
  
  actualizarTratamiento(id: any, tratamiento: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/actualizar/${id}`, tratamiento);
  }

  eliminarTratamiento(id: any): Observable<any> {
    return this.http.delete(`${this.apiUrl}/eliminar/${id}`);
  }
}