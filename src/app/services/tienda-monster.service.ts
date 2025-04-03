import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { ITienda } from '../interfaces/itienda';

interface TiendaMonsterUpdate {
  monsterId: number;
  precio: number;
}

@Injectable({
  providedIn: 'root'
})
export class TiendaMonsterService {

  private apiUrl = 'http://localhost:9007/api/tienda-monsters';

  constructor(private http: HttpClient) { }

  // Añadir un monster a una tienda
  addMonsterToTienda(tiendaId: number, monsterId: number, precio: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/add`, {
      tiendaId,
      monsterId,
      precio
    });
  }

  // // Obtener monsters de una tienda
  // getMonstersForTienda(tiendaId: number): Observable<any> {
  //   return this.http.get(`${this.apiUrl}/tiendas/${tiendaId}/monsters`);
  // }

  getTiendaWithMonsters(tiendaId: number) {
    const url = `${this.apiUrl}/tiendas/${tiendaId}`;
    return this.http.get<ITienda>(url);
  }
  updateTiendaMonsters(tiendaId: number, updates: any[]): Observable<any> {
    // Verificar que los datos son válidos
    if (!updates || updates.length === 0) {
      return throwError(() => new Error('No hay datos para actualizar'));
    }
  
    // Asegurar que los datos tienen el formato correcto
    const formattedUpdates = updates.map(update => ({
      monsterId: update.monsterId,
      precio: update.precio
    }));
  
    console.log('Datos enviados:', JSON.stringify(formattedUpdates));
  
    return this.http.post(`${this.apiUrl}/${tiendaId}/update`, formattedUpdates)
      .pipe(
        catchError(error => {
          console.error('Error en la petición:', error);
          
          // Mejorar el mensaje de error
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
  // updateTiendaMonsters(tiendaId: number, updates: any[]): Observable<any> {




  //   console.log(`Sending to ${this.apiUrl}/${tiendaId}/update:`, updates);
  //   return this.http.post(`${this.apiUrl}/${tiendaId}/update`, updates).pipe(
  //     catchError(error => {
  //       console.error('Error enla peticion:', error);
  //       if (error.error) {
  //         console.error('Server error message:', error.error);
  //       }
  //       return throwError(() => new Error('Error actualizando monsters'));
  //     })
  //   );
  // }

}