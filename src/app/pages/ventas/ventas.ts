import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { VentaService } from '../../services/venta';
import { PacienteService } from '../../services/paciente'; 
import { TratamientoService } from '../../services/tratamiento';
import { AsistenciaService } from '../../services/asistencia';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './ventas.html',
  styleUrl: './ventas.css'
})
export class VentasComponent implements OnInit {

  private ventaService = inject(VentaService);
  private pacienteService = inject(PacienteService);
  private tratamientoService = inject(TratamientoService);
  private asistenciaService = inject(AsistenciaService);
  private cdr = inject(ChangeDetectorRef);

  listaPacientes: any[] = [];
  listaTratamientos: any[] = [];
  recetaMedica: any = null;
  buscandoReceta: boolean = false;

  nuevaVenta = { 
    dniPaciente: '', 
    idTratamiento: '', 
    totalSesiones: 1, 
    costoTotal: 0.0, 
    idUsuario: 0 
  };

  ngOnInit(): void {
    const idGuardado = localStorage.getItem('idUsuario');
    if (idGuardado) {
      this.nuevaVenta.idUsuario = parseInt(idGuardado, 10);
    }
    this.cargarCatalogos();
  }

  cargarCatalogos(): void {
    this.pacienteService.listarPacientes().subscribe(data => this.listaPacientes = data);
    this.tratamientoService.listarTratamientos().subscribe(data => this.listaTratamientos = data);
  }

  alSeleccionarPaciente(): void {
    this.recetaMedica = null;
    if (!this.nuevaVenta.dniPaciente) return;

    this.buscandoReceta = true;
    this.asistenciaService.obtenerExpedienteCompleto(this.nuevaVenta.dniPaciente).subscribe({
      next: (expediente) => {
        this.buscandoReceta = false;
        const consultas = expediente?.consultas || [];
        if (consultas.length > 0) {
          const ultima = consultas[0];
          this.recetaMedica = ultima;

          if (ultima.sesionesSugeridas !== undefined && ultima.sesionesSugeridas !== null) {
            this.nuevaVenta.totalSesiones = ultima.sesionesSugeridas;
          }

          if (ultima.tratamientoSugerido) {
            const match = this.listaTratamientos.find(t => 
              t.nombre.toLowerCase().trim() === ultima.tratamientoSugerido.toLowerCase().trim() ||
              t.nombre.toLowerCase().includes(ultima.tratamientoSugerido.toLowerCase()) ||
              ultima.tratamientoSugerido.toLowerCase().includes(t.nombre.toLowerCase())
            );
            if (match) {
              this.nuevaVenta.idTratamiento = match.idTratamiento;
            }
          }

          this.calcularTotal();
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.buscandoReceta = false;
        this.cdr.detectChanges();
      }
    });
  }

  calcularTotal(): void {
    if (!this.nuevaVenta.idTratamiento || this.nuevaVenta.totalSesiones < 1) {
      this.nuevaVenta.costoTotal = 0.0;
      return;
    }
    
    const tratamiento = this.listaTratamientos.find(t => t.idTratamiento == this.nuevaVenta.idTratamiento);
    if (tratamiento) {
      this.nuevaVenta.costoTotal = tratamiento.precio * this.nuevaVenta.totalSesiones;
    }
  }

  guardarVenta(): void {
    this.ventaService.registrarVenta(this.nuevaVenta).subscribe({
      next: (res) => {
        const mensaje = typeof res === 'object' && res?.mensaje ? res.mensaje : (typeof res === 'string' ? res : 'Cobro registrado correctamente.');
        this.exitoVenta(mensaje);
      },
      error: (err) => {
        if (err.status === 200 || err.status === 201) { 
          const mensajeDelBackend = err.error?.mensaje || err.error?.text || 'Cobro registrado correctamente.';
          this.exitoVenta(mensajeDelBackend); 
        } else { 
          Swal.fire('Error', 'No se pudo procesar la venta', 'error'); 
        }
      }
    });
  }

  exitoVenta(mensaje: string): void {
    Swal.fire({ 
      title: '¡Venta Exitosa!', 
      text: mensaje, 
      icon: 'success', 
      confirmButtonColor: '#198754' 
    });
    
    const idGuardado = localStorage.getItem('idUsuario');
    this.recetaMedica = null;
    this.nuevaVenta = { 
      dniPaciente: '', 
      idTratamiento: '', 
      totalSesiones: 1, 
      costoTotal: 0.0, 
      idUsuario: idGuardado ? parseInt(idGuardado, 10) : 0 
    };
    
    this.cdr.detectChanges();
  }
}