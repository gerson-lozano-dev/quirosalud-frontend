import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';
import Swal from 'sweetalert2';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const auth = inject(AuthService);

  const usuario = auth.usuarioActual();

  if (!usuario) {
    router.navigate(['/login']);
    return false;
  }

  const rolesPermitidos = route.data?.['roles'] as Array<string> | undefined;

  if (rolesPermitidos && !auth.tieneRol(rolesPermitidos)) {
    Swal.fire('Acceso Denegado', `Tu cargo (${usuario.cargo}) no tiene permisos para esta zona.`, 'warning');
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
