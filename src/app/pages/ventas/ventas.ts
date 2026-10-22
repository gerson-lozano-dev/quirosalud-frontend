import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { VentaService } from '../../services/venta';
import { PacienteService } from '../../services/paciente'; 
import { TratamientoService } from '../../services/tratamiento';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common'; // Necesario para el pipe de moneda/número

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './ventas.html'
})
export class VentasComponent implements OnInit {

  private ventaService = inject(VentaService);
  private pacienteService = inject(PacienteService);
  private tratamientoService = inject(TratamientoService);
  private cdr = inject(ChangeDetectorRef);

  listaPacientes: any[] = [];
  listaTratamientos: any[] = [];
  
  // Quemamos el idUsuario en 1 temporalmente hasta que tengamos el Login de Spring Security
  nuevaVenta = { 
    dniPaciente: '', 
    idTratamiento: '', 
    totalSesiones: 1, 
    costoTotal: 0.0, 
    idUsuario: 0 
  };

  ngOnInit(): void {
    // Lee el ID real del cajero que inició sesión
    const idGuardado = localStorage.getItem('idUsuario');
    if (idGuardado) {
      this.nuevaVenta.idUsuario = parseInt(idGuardado, 10);
    }
    
    this.cargarCatalogos();
  }

  cargarCatalogos() {
    this.pacienteService.listarPacientes().subscribe(data => this.listaPacientes = data);
    this.tratamientoService.listarTratamientos().subscribe(data => this.listaTratamientos = data);
  }

  // Se dispara automáticamente al cambiar el combo de Tratamiento o escribir las Sesiones
  calcularTotal() {
    if (!this.nuevaVenta.idTratamiento || this.nuevaVenta.totalSesiones < 1) {
      this.nuevaVenta.costoTotal = 0.0;
      return;
    }
    
    // Buscamos el tratamiento en la lista para obtener su precio
    const tratamiento = this.listaTratamientos.find(t => t.idTratamiento == this.nuevaVenta.idTratamiento);
    if (tratamiento) {
      this.nuevaVenta.costoTotal = tratamiento.precio * this.nuevaVenta.totalSesiones;
    }
  }

  guardarVenta() {
    this.ventaService.registrarVenta(this.nuevaVenta).subscribe({
      next: (res) => {
        // Si por algún milagro Angular logra parsear el texto de Spring Boot
        this.exitoVenta(res);
      },
      error: (err) => {
        // HACK SENIOR: Atrapamos el "falso error" porque Spring Boot devuelve un String
        if (err.status === 200) { 
          // err.error.text contiene el String que devolviste en tu VentaRestController
          const mensajeDelBackend = err.error.text || 'Cobro registrado correctamente.';
          this.exitoVenta(mensajeDelBackend); 
        }
        else { Swal.fire('Error', 'No se pudo procesar la venta', 'error'); }
      }
    });
  }

  exitoVenta(mensaje: string) {
    Swal.fire({ 
      title: '¡Venta Exitosa!', 
      text: mensaje, 
      icon: 'success', 
      confirmButtonColor: '#198754' 
    });
    
    // ARREGLO SENIOR: Volvemos a leer quién está en la caja en lugar de quemar el "1"
    const idGuardado = localStorage.getItem('idUsuario');
    
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