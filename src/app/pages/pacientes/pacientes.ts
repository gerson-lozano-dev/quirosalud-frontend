import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms'; 
import { PacienteService } from '../../services/paciente';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [FormsModule], 
  templateUrl: './pacientes.html',
  styleUrl: './pacientes.css'
})
export class PacientesComponent implements OnInit {
  
  private pacienteService = inject(PacienteService);
  private cdr = inject(ChangeDetectorRef); 
  
  listaPacientes: any[] = [];

  // HACK SENIOR: Lista rápida para no arriesgar un error de conexión a minutos de la entrega
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
    { codDistrito: 'D10', nombreDistrito: 'Comas' }
  ];

  pacienteObj = this.obtenerPacienteVacio();
  esEdicion: boolean = false;

  ngOnInit(): void {
    this.cargarPacientes();
    this.cargarDistritos();
  }

  cargarDistritos() {
    this.pacienteService.listarDistritos().subscribe({
      next: (datos) => {
        if (datos && datos.length > 0) {
          this.listaDistritos = datos;
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.log('Usando distritos locales', err)
    });
  }

  prepararNuevoPaciente() {
    this.esEdicion = false; 
    this.pacienteObj = this.obtenerPacienteVacio(); 
    this.cdr.detectChanges(); 
  }

  abrirModalEditar(pacienteFila: any) {
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

  obtenerPacienteVacio() {
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

  cargarPacientes() {
    this.pacienteService.listarPacientes().subscribe({
      next: (datos) => {
        this.listaPacientes = datos;
        this.cdr.detectChanges(); 
      },
      error: (err) => console.error('Error al cargar', err)
    });
  }

  guardar() {
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
            console.error('Error real al actualizar:', err);
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
        error: (err) => {
          console.error('Error al registrar:', err);
          Swal.fire('Error', 'No se pudo guardar.', 'error');
        }
      });
    }
  }

  permitirSoloNumeros(event: KeyboardEvent) {
    const charCode = event.key.charCodeAt(0);
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  exitoAlGuardar() {
    Swal.fire({
      title: '¡Registrado!',
      text: 'El paciente se ha guardado exitosamente.',
      icon: 'success',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#d63384' 
    });

    this.pacienteObj = this.obtenerPacienteVacio();
    this.cargarPacientes(); 
  }

  eliminar(pacienteFila: any) {
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
            console.error('Error al eliminar:', err);
            if (err.status === 200) {
               Swal.fire('¡Eliminado!', 'El paciente ha sido borrado del sistema.', 'success');
               this.cargarPacientes();
            } else {
               Swal.fire('Error', 'Hubo un problema al intentar eliminar en la base de datos.', 'error');
            }
          }
        });
      }
    });
  }
}