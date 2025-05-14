import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '../environment/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class CommunicationService {

  private apiUrl = `${environment.apiUrl}/tiendas`;

  private updateMap = new Subject<void>();
  updateMap$ = this.updateMap.asObservable();

  notifyUpdate() {
    this.updateMap.next()
  }

  constructor() { }
}
