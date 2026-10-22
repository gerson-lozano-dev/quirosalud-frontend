import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { PacientesComponent } from './pages/pacientes/pacientes';
import { TratamientosComponent } from './pages/tratamientos/tratamientos';
import { UsuariosComponent } from './pages/usuarios/usuarios';
import { CitasComponent } from './pages/citas/citas';
import { VentasComponent } from './pages/ventas/ventas';
import { AsistenciaComponent } from './pages/asistencia/asistencia';
import { ReportesComponent } from './pages/reportes/reportes';

import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' }, 
  { path: 'login', component: LoginComponent },
  
  // El Dashboard es para todos los que estén logueados
  { path: 'dashboard', component: DashboardComponent , canActivate: [authGuard] },
  
  // Pacientes: Lo ven todos
  { path: 'pacientes', component: PacientesComponent , canActivate: [authGuard], data: { roles: ['ADMIN', 'MEDICO', 'ASISTENTE'] } },
  
  // Citas (Recepción/Triaje): Lo ven todos
  { path: 'citas', component: CitasComponent , canActivate: [authGuard], data: { roles: ['ADMIN', 'MEDICO', 'ASISTENTE'] } },
  
  // Asistencia (Control de sesiones): Médico y Admin
  { path: 'asistencia', component: AsistenciaComponent , canActivate: [authGuard], data: { roles: ['ADMIN', 'MEDICO'] } },
  
  // Ventas (Caja): Asistente y Admin
  { path: 'ventas', component: VentasComponent , canActivate: [authGuard], data: { roles: ['ADMIN', 'ASISTENTE'] } },
  
  // Administración y Finanzas: SOLO ADMIN
  { path: 'tratamientos', component: TratamientosComponent , canActivate: [authGuard], data: { roles: ['ADMIN'] } },
  { path: 'usuarios', component: UsuariosComponent , canActivate: [authGuard], data: { roles: ['ADMIN'] } },
  { path: 'reportes', component: ReportesComponent , canActivate: [authGuard], data: { roles: ['ADMIN'] } },
  
  { path: '**', redirectTo: 'login' } 
];