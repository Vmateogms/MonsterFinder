import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { environment } from '../environment/environment.prod';
import { ITienda } from '../interfaces/itienda';

@Injectable({
  providedIn: 'root'
})
export class CommunicationService {

  private apiUrl = `${environment.apiUrl}/tiendas`;

  private updateMap = new Subject<void>();
  updateMap$ = this.updateMap.asObservable();

  private newTiendaAdded = new Subject<ITienda>();
  newTiendaAdded$ = this.newTiendaAdded.asObservable();

  notifyUpdate() {
    this.updateMap.next()
  }

  notifyNewTiendaAdded(tienda: ITienda) {
    this.newTiendaAdded.next(tienda);
  }

  constructor() { }
}
