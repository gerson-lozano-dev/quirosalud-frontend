import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface Credenciales {
  email: string;
  clave: string;
}

export interface UsuarioSesion {
  idUsuario: number;
  email: string;
  nombres: string;
  cargo: string;
  token: string;
}

export interface RespuestaLogin {
  response: UsuarioSesion;
  error?: { message: string };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/v1/auth';
  private readonly KEY = 'quirosalud.session';

  login(credenciales: Credenciales): Observable<RespuestaLogin> {
    return this.http.post<RespuestaLogin>(`${this.apiUrl}/login`, credenciales).pipe(
      tap(({ response }) => {
        if (!response?.token || !response.cargo) {
          throw new Error('Respuesta de autenticación incompleta');
        }
        sessionStorage.setItem(this.KEY, JSON.stringify(response));
        localStorage.setItem('usuarioLogueado', 'true');
        localStorage.setItem('idUsuario', String(response.idUsuario));
        localStorage.setItem('nombreUsuario', response.nombres);
        localStorage.setItem('cargoUsuario', response.cargo);
        localStorage.setItem('token', response.token);
      })
    );
  }

  cambiarClave(claveActual: string, claveNueva: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/cambiar-clave`, { claveActual, claveNueva });
  }

  usuarioActual(): UsuarioSesion | null {
    try {
      const raw = sessionStorage.getItem(this.KEY) || this.reconstruirDesdeLocalStorage();
      if (!raw) return null;
      const usuario = typeof raw === 'string' ? JSON.parse(raw) as UsuarioSesion : raw;
      if (!usuario.token || !this.tokenNoExpirado(usuario.token)) {
        this.cerrarSesion();
        return null;
      }
      return usuario;
    } catch {
      this.cerrarSesion();
      return null;
    }
  }

  private reconstruirDesdeLocalStorage(): string | null {
    const token = localStorage.getItem('token');
    const cargo = localStorage.getItem('cargoUsuario');
    if (token && cargo) {
      const sesion: UsuarioSesion = {
        idUsuario: Number(localStorage.getItem('idUsuario') || 0),
        email: '',
        nombres: localStorage.getItem('nombreUsuario') || '',
        cargo,
        token
      };
      sessionStorage.setItem(this.KEY, JSON.stringify(sesion));
      return JSON.stringify(sesion);
    }
    return null;
  }

  token(): string | null {
    return this.usuarioActual()?.token ?? localStorage.getItem('token');
  }

  tieneRol(roles: readonly string[]): boolean {
    const usuario = this.usuarioActual();
    if (!usuario) return false;
    const cargo = usuario.cargo.trim().toUpperCase().replace('ROLE_', '');
    const rolesNormalizados = roles.map(r => r.trim().toUpperCase().replace('ROLE_', ''));
    return rolesNormalizados.includes(cargo);
  }

  cerrarSesion(): void {
    sessionStorage.removeItem(this.KEY);
    localStorage.removeItem('usuarioLogueado');
    localStorage.removeItem('idUsuario');
    localStorage.removeItem('nombreUsuario');
    localStorage.removeItem('cargoUsuario');
    localStorage.removeItem('token');
  }

  private tokenNoExpirado(jwt: string): boolean {
    try {
      const payload = jwt.split('.')[1];
      if (!payload) return false;
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const contenido = JSON.parse(atob(base64)) as { exp?: number };
      return typeof contenido.exp === 'number' && contenido.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }
}
