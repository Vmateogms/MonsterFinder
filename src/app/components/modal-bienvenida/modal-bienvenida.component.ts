import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-modal-bienvenida',
  standalone: true,
  imports: [],
  templateUrl: './modal-bienvenida.component.html',
  styleUrl: './modal-bienvenida.component.css'
})
export class ModalBienvenidaComponent {

  @Output() closed = new EventEmitter<void>();

  cerrarModal(event?: Event): void {
    if(event) {
      //cerrar si el user clickea fuera del modal
      if(event.target === event.currentTarget) {
        this.closed.emit();
      }
    } else {
      //clickeando en el boton
      this.closed.emit();
    }
  }



}
