import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import Swal from 'sweetalert2'; // No olvides importar SweetAlert

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  const estaLogueado = localStorage.getItem('usuarioLogueado');
  const cargoUsuario = localStorage.getItem('cargoUsuario'); // Leemos el rol

  if (estaLogueado !== 'true') {
    router.navigate(['/login']);
    return false;
  }

  // Lógica Senior: Revisamos si la ruta exige roles específicos
  const rolesPermitidos = route.data?.['roles'] as Array<string>;
  
  if (rolesPermitidos && cargoUsuario && !rolesPermitidos.includes(cargoUsuario)) {
    // Si el usuario no tiene el rol permitido, lo pateamos
    Swal.fire('Acceso Denegado', 'Tu cargo de ' + cargoUsuario + ' no tiene permisos para esta zona.', 'warning');
    router.navigate(['/dashboard']);
    return false;
  }

  return true; 
};