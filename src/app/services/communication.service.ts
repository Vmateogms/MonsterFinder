import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CommunicationService {

  private apiUrl = 'http://localhost:9007/api/tiendas';

  private updateMap = new Subject<void>();
  updateMap$ = this.updateMap.asObservable();

  notifyUpdate() {
    this.updateMap.next()
  }

  constructor() { }
}
