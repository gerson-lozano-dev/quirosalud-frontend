import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms'; 
import { CommonModule } from '@angular/common';
import { PacienteService } from '../../services/paciente';
import { AsistenciaService } from '../../services/asistencia';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [FormsModule, CommonModule], 
  templateUrl: './pacientes.html',
  styleUrl: './pacientes.css'
})
export class PacientesComponent implements OnInit {
  
  private pacienteService = inject(PacienteService);
  private asistenciaService = inject(AsistenciaService);
  private cdr = inject(ChangeDetectorRef); 
  
  listaPacientes: any[] = [];
  pacientesFiltrados: any[] = [];
  terminoBusqueda: string = '';
  expedienteSeleccionado: any = null;
  cargandoExpediente: boolean = false;

  paginaActual: number = 1;
  elementosPorPagina: number = 15;

  listaDistritos = [
    { codDistrito: 'D01', nombreDistrito: 'San Juan de Lurigancho' },
    { codDistrito: 'D02', nombreDistrito: 'Miraflores' },
    { codDistrito: 'D03', nombreDistrito: 'San Isidro' },
    { codDistrito: 'D04', nombreDistrito: 'Los Olivos' },
    { codDistrito: 'D05', nombreDistrito: 'Ate' },
    { codDistrito: 'D06', nombreDistrito: 'La Molina' },
    { codDistrito: 'D07', nombreDistrito: 'Surco' },
    { codDistrito: 'D08', nombreDistrito: 'San Borja' },
    { codDistrito: 'D09', nombreDistrito: 'Lince' },
    { codDistrito: 'D10', nombreDistrito: 'San Miguel' },
    { codDistrito: 'D11', nombreDistrito: 'Cercado de Lima' },
    { codDistrito: 'D12', nombreDistrito: 'Ancón' },
    { codDistrito: 'D13', nombreDistrito: 'Barranco' },
    { codDistrito: 'D14', nombreDistrito: 'Breña' },
    { codDistrito: 'D15', nombreDistrito: 'Carabayllo' },
    { codDistrito: 'D16', nombreDistrito: 'Chaclacayo' },
    { codDistrito: 'D17', nombreDistrito: 'Chorrillos' },
    { codDistrito: 'D18', nombreDistrito: 'Cieneguilla' },
    { codDistrito: 'D19', nombreDistrito: 'Comas' },
    { codDistrito: 'D20', nombreDistrito: 'El Agustino' },
    { codDistrito: 'D21', nombreDistrito: 'Independencia' },
    { codDistrito: 'D22', nombreDistrito: 'Jesús María' },
    { codDistrito: 'D23', nombreDistrito: 'La Victoria' },
    { codDistrito: 'D24', nombreDistrito: 'Lurigancho-Chosica' },
    { codDistrito: 'D25', nombreDistrito: 'Lurín' },
    { codDistrito: 'D26', nombreDistrito: 'Magdalena del Mar' },
    { codDistrito: 'D27', nombreDistrito: 'Pachacámac' },
    { codDistrito: 'D28', nombreDistrito: 'Pucusana' },
    { codDistrito: 'D29', nombreDistrito: 'Pueblo Libre' },
    { codDistrito: 'D30', nombreDistrito: 'Puente Piedra' },
    { codDistrito: 'D31', nombreDistrito: 'Punta Hermosa' },
    { codDistrito: 'D32', nombreDistrito: 'Punta Negra' },
    { codDistrito: 'D33', nombreDistrito: 'Rímac' },
    { codDistrito: 'D34', nombreDistrito: 'San Bartolo' },
    { codDistrito: 'D35', nombreDistrito: 'San Juan de Miraflores' },
    { codDistrito: 'D36', nombreDistrito: 'San Luis' },
    { codDistrito: 'D37', nombreDistrito: 'San Martín de Porres' },
    { codDistrito: 'D38', nombreDistrito: 'Santa Anita' },
    { codDistrito: 'D39', nombreDistrito: 'Santa María del Mar' },
    { codDistrito: 'D40', nombreDistrito: 'Santa Rosa' },
    { codDistrito: 'D41', nombreDistrito: 'Surquillo' },
    { codDistrito: 'D42', nombreDistrito: 'Villa El Salvador' },
    { codDistrito: 'D43', nombreDistrito: 'Villa María del Triunfo' }
  ];

  pacienteObj = this.obtenerPacienteVacio();
  esEdicion: boolean = false;

  ngOnInit(): void {
    this.cargarPacientes();
    this.cargarDistritos();
  }

  cargarDistritos(): void {
    this.pacienteService.listarDistritos().subscribe({
      next: (datos) => {
        if (datos && datos.length > 0) {
          this.listaDistritos = datos;
          this.cdr.detectChanges();
        }
      },
      error: () => {}
    });
  }

  prepararNuevoPaciente(): void {
    this.esEdicion = false; 
    this.pacienteObj = this.obtenerPacienteVacio(); 
    this.cdr.detectChanges(); 
  }

  abrirModalEditar(pacienteFila: any): void {
    this.esEdicion = true; 
    this.pacienteObj = { ...pacienteFila }; 

    if (!this.pacienteObj.distrito) {
      this.pacienteObj.distrito = { codDistrito: 'D01' }; 
    }
    if (!this.pacienteObj.email) {
      this.pacienteObj.email = 'NO REGISTRA';
    }

    this.cdr.detectChanges(); 
  }

  verExpediente(p: any): void {
    this.cargandoExpediente = true;
    this.expedienteSeleccionado = { paciente: p, consultas: [], sesiones: [] };
    this.asistenciaService.obtenerExpedienteCompleto(p.dni).subscribe({
      next: (exp: any) => {
        this.expedienteSeleccionado = exp;
        this.cargandoExpediente = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargandoExpediente = false;
        this.cdr.detectChanges();
      }
    });
  }

  obtenerPacienteVacio(): any {
    this.esEdicion = false; 
    return {
      idPersona: null, dni: '', nombres: '', apellidos: '', fechaNacimiento: '', sexo: 'M',
      estadoCivil: 'S', distrito: { codDistrito: 'D01' }, direccion: '',
      telefono: '', ocupacion: '', numHijos: 0, email: 'NO REGISTRA',
      motivoConsulta: '', escalaDolor: 0, antecedenteTrauma: '',
      antecedenteCirugia: '', tieneAsma: false, tieneDiabetes: false,
      tieneAlergias: false, observaciones: ''
    };
  }

  cargarPacientes(): void {
    this.pacienteService.listarPacientes().subscribe({
      next: (datos) => {
        this.listaPacientes = datos || [];
        this.filtrarPacientes();
        this.cdr.detectChanges(); 
      },
      error: (err) => console.error('Error al cargar pacientes', err)
    });
  }

  filtrarPacientes(): void {
    this.paginaActual = 1;
    if (!this.terminoBusqueda || this.terminoBusqueda.trim() === '') {
      this.pacientesFiltrados = [...this.listaPacientes];
      return;
    }
    const term = this.terminoBusqueda.toLowerCase().trim();
    this.pacientesFiltrados = this.listaPacientes.filter(p => 
      (p.dni && p.dni.toLowerCase().includes(term)) ||
      (p.nombres && p.nombres.toLowerCase().includes(term)) ||
      (p.apellidos && p.apellidos.toLowerCase().includes(term)) ||
      (p.telefono && p.telefono.toLowerCase().includes(term)) ||
      (p.distrito?.nombreDistrito && p.distrito.nombreDistrito.toLowerCase().includes(term)) ||
      (p.motivoConsulta && p.motivoConsulta.toLowerCase().includes(term)) ||
      (p.ocupacion && p.ocupacion.toLowerCase().includes(term))
    );
  }

  get totalPaginas(): number {
    return Math.ceil(this.pacientesFiltrados.length / this.elementosPorPagina) || 1;
  }

  get pacientesPaginados(): any[] {
    const inicio = (this.paginaActual - 1) * this.elementosPorPagina;
    return this.pacientesFiltrados.slice(inicio, inicio + this.elementosPorPagina);
  }

  get listaNumerosPaginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  get indiceInicio(): number {
    if (this.pacientesFiltrados.length === 0) return 0;
    return (this.paginaActual - 1) * this.elementosPorPagina + 1;
  }

  get indiceFin(): number {
    return Math.min(this.paginaActual * this.elementosPorPagina, this.pacientesFiltrados.length);
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      this.cdr.detectChanges();
    }
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

  guardar(): void {
    if (!this.pacienteObj.email || this.pacienteObj.email === 'NO REGISTRA') {
      this.pacienteObj.email = `paciente_${this.pacienteObj.dni}@sinregistro.com`;
    }

    if (this.esEdicion) {
      this.pacienteService.actualizarPaciente(this.pacienteObj.idPersona, this.pacienteObj).subscribe({
        next: () => {
          Swal.fire({ title: '¡Actualizado!', text: 'Se modificaron los datos.', icon: 'success', confirmButtonColor: '#d63384' });
          this.pacienteObj = this.obtenerPacienteVacio();
          this.cargarPacientes();
        },
        error: (err) => {
          if (err.status === 200) {
            Swal.fire({ title: '¡Actualizado!', text: 'Se modificaron los datos.', icon: 'success', confirmButtonColor: '#d63384' });
            this.pacienteObj = this.obtenerPacienteVacio();
            this.cargarPacientes();
          } else {
            Swal.fire('Error', 'No se pudo actualizar.', 'error');
          }
        }
      });
    } else {
      this.pacienteService.registrarPaciente(this.pacienteObj).subscribe({
        next: () => {
          Swal.fire({ title: '¡Registrado!', text: 'El paciente se guardó.', icon: 'success', confirmButtonColor: '#d63384' });
          this.pacienteObj = this.obtenerPacienteVacio();
          this.cargarPacientes();
        },
        error: () => {
          Swal.fire('Error', 'No se pudo guardar.', 'error');
        }
      });
    }
  }

  permitirSoloNumeros(event: KeyboardEvent): void {
    const charCode = event.key.charCodeAt(0);
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  eliminar(pacienteFila: any): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Vas a eliminar a ${pacienteFila.nombres} ${pacienteFila.apellidos}. ¡Esta acción no se puede deshacer!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d', 
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.pacienteService.eliminarPaciente(pacienteFila.idPersona).subscribe({
          next: () => {
            Swal.fire('¡Eliminado!', 'El paciente ha sido borrado del sistema.', 'success');
            this.cargarPacientes(); 
          },
          error: (err) => {
            if (err.status === 200) {
              Swal.fire('¡Eliminado!', 'El paciente ha sido borrado del sistema.', 'success');
              this.cargarPacientes();
            } else {
              const msg = err.error?.mensaje || 'Hubo un problema al intentar eliminar en la base de datos.';
              Swal.fire('Error', msg, 'error');
            }
          }
        });
      }
    });
  }
}
