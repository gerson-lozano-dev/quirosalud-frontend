import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConsultaService } from '../../services/consulta';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-citas',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './citas.html'
})
export class CitasComponent implements OnInit {

  private consultaService = inject(ConsultaService);
  private cdr = inject(ChangeDetectorRef);

  listaPendientes: any[] = [];
  
  // Objeto para la Recepcionista (Agendar)
  // Agregamos estado: 'PENDIENTE' para que Java lo guarde correctamente
  nuevaCita = { dniPaciente: '', fecha: '', hora: '', motivo: '', estado: 'PENDIENTE' };
  
  // Objeto para el Doctor (Atender)
  citaAtencion: any = { idConsulta: null, diagnostico: '' };
  nombrePacienteAtencion: string = '';

  ngOnInit(): void {
    this.cargarPendientes();
    this.setFechaActual();
  }

  setFechaActual() {
    const hoy = new Date();
    this.nuevaCita.fecha = hoy.toISOString().split('T')[0];
  }

  cargarPendientes() {
    this.consultaService.listarPendientes().subscribe({
      next: (datos) => {
        this.listaPendientes = datos;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar la sala de espera', err)
    });
  }

  agendarCita() {
    // 1. Clonamos nuestra variable en una nueva para no alterar la vista del formulario
    let datosAEnviar = { ...this.nuevaCita };

    // 2. Spring Boot (java.sql.Time) exige los segundos. 
    // Si la hora viene como "22:00" (5 caracteres), le agregamos ":00" al final.
    if (datosAEnviar.hora && datosAEnviar.hora.length === 5) {
      datosAEnviar.hora = datosAEnviar.hora + ':00';
    }

    // 3. Enviamos los datos clonados y corregidos
    this.consultaService.registrarConsulta(datosAEnviar).subscribe({
      next: () => this.exitoAgendar(),
      error: (err) => {
        if (err.status === 200) { this.exitoAgendar(); } 
        else { 
          console.error("Error del backend:", err);
          Swal.fire('Error', 'Revise que el DNI exista o intente de nuevo.', 'error'); 
        }
      }
    });
  }

  exitoAgendar() {
    Swal.fire({ title: '¡Agendado!', text: 'El paciente está en sala de espera.', icon: 'success', confirmButtonColor: '#0d6efd' });
    this.nuevaCita.dniPaciente = '';
    this.nuevaCita.hora = '';
    this.nuevaCita.motivo = '';
    this.cargarPendientes();
  }

  // --- MÉTODOS DEL DOCTOR ---
  prepararAtencion(citaFila: any) {
    this.citaAtencion.idConsulta = citaFila.idConsulta;
    this.citaAtencion.diagnostico = '';
    this.nombrePacienteAtencion = citaFila.nombrePaciente || citaFila.dniPaciente; // Respaldo por si no viene el join
    this.cdr.detectChanges();
  }

  finalizarConsulta() {
    this.consultaService.finalizarConsulta(this.citaAtencion.idConsulta, this.citaAtencion).subscribe({
      next: () => this.exitoFinalizar(),
      error: (err) => {
        if (err.status === 200) { this.exitoFinalizar(); } 
        else { Swal.fire('Error', 'No se pudo guardar el diagnóstico.', 'error'); }
      }
    });
  }

  exitoFinalizar() {
    Swal.fire({ title: '¡Atendido!', text: 'Diagnóstico guardado correctamente.', icon: 'success', confirmButtonColor: '#198754' });
    this.cargarPendientes();
  }
}