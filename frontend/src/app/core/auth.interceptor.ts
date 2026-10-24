import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // No enviar token al endpoint público de autenticación
  if (req.url.includes('/api/v1/auth/login')) {
    return next(req);
  }

  // Si la petición va a cualquier endpoint de la API (/api/v1/)
  if (req.url.includes('/api/v1/') || req.url.startsWith('/api/')) {
    const token = inject(AuthService).token();
    if (token) {
      return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
    }
  }

  return next(req);
};
