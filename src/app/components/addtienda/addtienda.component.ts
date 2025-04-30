import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Injectable, Output } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TiendaService } from '../../services/tienda.service';
import { CommunicationService } from '../../services/communication.service';
import bootstrap, { Modal } from 'bootstrap';


@Component({
  selector: 'app-addtienda',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './addtienda.component.html',
  styleUrl: './addtienda.component.css'
})

export class AddtiendaComponent {

  addStoreForm: any;
  showModal = false;
  @Output() activateMapMode = new EventEmitter<void>();

  constructor (private fb: FormBuilder, private tService: TiendaService, private cservice: CommunicationService) {
    this.addStoreForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3) ]],
      latitud: ['', [Validators.required, Validators.pattern(/\./)]],
      longitud: ['', [Validators.required, Validators.pattern(/\./)]],
      //imagenUrl: ['']
      
    });
  }

  notificarActualizacion() {
    this.cservice.notifyUpdate();
  }

  onSubmit() {
    if (this.addStoreForm.valid) {
      const payload = {
        nombre: this.addStoreForm.get('nombre').value,
        latitud: this.addStoreForm.get('latitud').value,
        longitud: this.addStoreForm.get('longitud').value,
        //imagenUrl: this.addStoreForm.get('imagenUrl').value || null 
      };
  
      console.log('Sending precise payload:', payload);
  
      this.tService.addTienda(payload).subscribe({
        next: (response) => {
          console.log('Store added successfully', response);
          // cerrar la logica del modal
          const modalElement = document.getElementById('addStoreModal');
          const modalBackdrop = document.querySelector('.modal-backdrop');
          
          if (modalElement) {
            const modal = Modal.getInstance(modalElement);
            modal?.hide();
          }
          this.notificarActualizacion();
        },
        error: (err) => {
          console.error('Detailed error:', err);
          
          alert('Error adding store: ' + err.message);
        }
      });
    }
  }

  startAddStoreMapMode() {
    // Cerrar el modal completamente
    const modalElement = document.getElementById('addStoreModal');
    if (modalElement) {
      try {
        const modal = Modal.getInstance(modalElement);
        if (modal) {
          modal.hide();
        }
      } catch (error) {
        console.error('Error closing modal:', error);
      }
    }
    
    // Limpieza rigurosa del modal
    document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    
    // Emitir evento
    console.log('Emitiendo evento activateMapMode');
    this.activateMapMode.emit();
  }
}
 

