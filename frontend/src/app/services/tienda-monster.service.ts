import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { ITienda } from '../interfaces/itienda';
import { environment } from '../environment/environment.prod';

interface TiendaMonsterUpdate {
  monsterId: number;
  precio: number;
}

@Injectable({
  providedIn: 'root'
})
export class TiendaMonsterService {

private apiUrl = `${environment.apiUrl}/tienda-monsters`;

  constructor(private http: HttpClient) { }

  // añadir un monster a una tienda
  addMonsterToTienda(tiendaId: number, monsterId: number, precio: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/add`, {
      tiendaId,
      monsterId,
      precio
    });
  }



  getTiendaWithMonsters(tiendaId: number) {
    const url = `${this.apiUrl}/tiendas/${tiendaId}`;
    return this.http.get<ITienda>(url);
  }


  updateTiendaMonsters(tiendaId: number, updates: any[]): Observable<any> {
    
    //validar tienda id
    if (!tiendaId || tiendaId <= 0) {
      return throwError(() => new Error('El ID de la tienda es invalido'))
    }
    
    const actualizacionValida = updates.filter(update => 
      update && typeof update.monsterId === 'number' &&
      typeof update.precio === 'number'
    );

    // verificar que los datos son validos
    if (actualizacionValida.length === 0) {
      return throwError(() => new Error('No hay datos para actualizar'));
    }
  
    // asegurar que los datos tienen el formato correcto
    const formattedUpdates = updates.map(update => ({
      monsterId: update.monsterId,
      precio: update.precio,
      descuento: update.descuento || false,
      precioDescuento: update.descuento ? update.precioDescuento : null,
      enNevera: update.enNevera || false
    }));
  
    console.log('Datos enviados:', JSON.stringify(formattedUpdates));
  
    return this.http.post<any>(`${this.apiUrl}/${tiendaId}/update`, formattedUpdates)
      .pipe(
        catchError(error => {
          console.error('Error en la petición:', error);
          
          let errorMessage = 'Error actualizando monsters';
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          } else if (error.status) {
            errorMessage = `Error ${error.status}: ${error.statusText || errorMessage}`;
          }
          
          return throwError(() => new Error(errorMessage));
        })
      );
  }

}