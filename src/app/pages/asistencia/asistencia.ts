import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AsistenciaService } from '../../services/asistencia';
import { PacienteService } from '../../services/paciente';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-asistencia',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './asistencia.html'
})
export class AsistenciaComponent implements OnInit {

  private asistenciaService = inject(AsistenciaService);
  private pacienteService = inject(PacienteService);
  private cdr = inject(ChangeDetectorRef);

  listaPacientes: any[] = [];
  dniBusqueda: string = '';
  listaCitas: any[] = [];
  pacienteEncontrado: any = null;
  listaConsultas: any[] = [];
  ultimoDiagnostico: any = null;
  busquedaRealizada: boolean = false;
  citaSeleccionada: any = { idCita: null, notasAjuste: '', pagado: true };

  ngOnInit(): void {
    this.cargarPacientes();
  }

  cargarPacientes(): void {
    this.pacienteService.listarPacientes().subscribe({
      next: (datos) => {
        this.listaPacientes = datos || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar la lista de pacientes', err);
      }
    });
  }

  formatearFecha(fecha: any): string {
    if (!fecha) return 'Por programar';
    if (typeof fecha === 'string') {
      const soloFecha = fecha.split('T')[0];
      const partes = soloFecha.split('-');
      if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
      }
    }
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return 'Por programar';
    const dia = String(d.getUTCDate()).padStart(2, '0');
    const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
    const anio = d.getUTCFullYear();
    return `${dia}/${mes}/${anio}`;
  }

  calcularEdad(fechaNacimiento: any): string {
    if (!fechaNacimiento) return 'N/D';
    const cumple = new Date(fechaNacimiento);
    if (isNaN(cumple.getTime())) return 'N/D';
    const hoy = new Date();
    let edad = hoy.getFullYear() - cumple.getFullYear();
    const m = hoy.getMonth() - cumple.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < cumple.getDate())) {
      edad--;
    }
    return edad >= 0 ? `${edad} años` : 'N/D';
  }

  buscarHistorial(): void {
    if (!this.dniBusqueda || this.dniBusqueda.length !== 8) {
      Swal.fire('Atención', 'Ingrese un DNI válido de 8 dígitos.', 'warning');
      return;
    }

    this.asistenciaService.obtenerExpedienteCompleto(this.dniBusqueda).subscribe({
      next: (expediente) => {
        const pacienteLista = this.listaPacientes.find(p => p.dni === this.dniBusqueda);
        const pacienteFinal = { ...(pacienteLista || {}), ...(expediente?.paciente || {}) };
        if (pacienteLista) {
          for (const k of Object.keys(pacienteLista)) {
            if (pacienteFinal[k] === null || pacienteFinal[k] === undefined || pacienteFinal[k] === '') {
              if (pacienteLista[k] !== null && pacienteLista[k] !== undefined && pacienteLista[k] !== '') {
                pacienteFinal[k] = pacienteLista[k];
              }
            }
          }
        }
        this.pacienteEncontrado = pacienteFinal;
        this.listaConsultas = expediente.consultas || [];
        this.ultimoDiagnostico = this.listaConsultas.length > 0 ? this.listaConsultas[0] : null;
        
        const sesiones = expediente.sesiones || [];
        sesiones.sort((a: any, b: any) => {
          if (a.nroHp !== b.nroHp) return (a.nroHp || '').localeCompare(b.nroHp || '');
          return (a.numeroSesion || 0) - (b.numeroSesion || 0);
        });
        this.listaCitas = sesiones;

        this.busquedaRealizada = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al buscar el expediente clínico', err);
        Swal.fire('Error', 'No se pudo cargar el historial del paciente.', 'error');
      }
    });
  }

  prepararAsistencia(citaFila: any): void {
    this.citaSeleccionada = { 
      idCita: citaFila.idCita, 
      notasAjuste: citaFila.notasAjuste || '',
      pagado: citaFila.pagado ?? true
    };
  }

  guardarAsistencia(): void {
    this.asistenciaService.marcarAsistencia(this.citaSeleccionada.idCita, this.citaSeleccionada).subscribe({
      next: () => this.exitoAlGuardar(),
      error: (err) => {
        if (err.status === 200) { 
          this.exitoAlGuardar(); 
        } else { 
          Swal.fire('Error', 'No se pudo marcar la asistencia.', 'error'); 
        }
      }
    });
  }

  exitoAlGuardar(): void {
    Swal.fire({ 
      title: '¡Asistencia Marcada!', 
      text: 'La sesión y las notas de evolución han sido guardadas.', 
      icon: 'success', 
      confirmButtonColor: '#198754' 
    });
    this.buscarHistorial();
  }
}
