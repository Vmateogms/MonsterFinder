import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';
import { ITienda } from '../interfaces/itienda';
import { environment } from '../environment/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class TiendaService {
  forEach(arg0: (tienda: any) => void) {
    throw new Error('Method not implemented.');
  }

private apiUrl = `${environment.apiUrl}/tiendas`;
private tiendaCache: ITienda[] = [];
private lastFetchTime: number = 0;
private readonly CACHE_DURATION = 5 * 60 * 1000 //5 minutos 

  constructor(private http: HttpClient) { }


  getTiendas(): Observable<ITienda[]> {
    const now = Date.now();

    //si tenemos datos en cache y no han expirado los usamos
    if (this.tiendaCache.length > 0 && now - this.lastFetchTime < this.CACHE_DURATION) {
      console.log('Usando datos en cache');
      return of(this.tiendaCache);
    }

    //si no, hacer perticio a la api
    return this.http.get<ITienda[]>(this.apiUrl).pipe(
        map((tiendas: any[]) => tiendas.map(t => ({
            ...t,
            monsters: t.tiendaMonsters.map((tm: any) => ({
                monster: tm.monster,
                precio: tm.precio,
                descuento: tm.descuento || false,
                precioDescuento: tm.precioDescuento,
                enNevera: tm.enNevera
            }))
        })))
    );
}



getTiendaById(id: number): Observable<ITienda> {
  console.log('Fetching tienda with id:', id);
  
  return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
    tap(response => console.log('Backend response:', JSON.stringify(response))),
    map((tienda: any) => {
      const mappedTienda = {
        ...tienda,
        monsters: tienda.tiendaMonsters.map((tm: any) => {
          console.log(`Processing monster ${tm.monster.id}: precio=${tm.precio}, descuento=${tm.descuento}, precioDescuento=${tm.precioDescuento}, nevera=${tm.enNevera}`);
          
          return {
            monster: tm.monster,
            precio: tm.precio,
            // Asegurar que los valores de descuento estén correctamente mapeados
            descuento: tm.descuento === true, 
            // Garantizar que precioDescuento sea null si no está definido
            precioDescuento: tm.precioDescuento !== undefined ? tm.precioDescuento : null,
            enNevera: tm.enNevera === true
          };
        })
      };
      console.log('Mapped tienda data:', JSON.stringify(mappedTienda));
      return mappedTienda;
    })
  );
}



addTienda(tienda: any): Observable<any> {

  console.log('TiendaService.addTienda called with:', tienda);

  if (!tienda.nombre || !tienda.latitud || !tienda.longitud) {
    console.error('Datos de tienda incompletos', tienda);
    return throwError(() => new Error('Datos de tienda incompletos'));
  }

  const payload = {
    nombre: tienda.nombre,
    latitud: Number(tienda.latitud),
    longitud: Number(tienda.longitud)
  };

  console.log('Sending formatted payload to API:', payload);

  const headers = new HttpHeaders({
    'Content-Type': 'application/json'
  });

  return this.http.post<any>(this.apiUrl, payload, { headers })
    .pipe(
      tap(response => {
        console.log('API response for addTienda:', response);
        this.tiendaCache = [];
        this.lastFetchTime = 0;
      }),
      catchError(error => {
        console.error('API error in addTienda:', error);
        let errorMessage = 'Error al añadir tienda';
        
        if (error.error instanceof ErrorEvent) {
          errorMessage = `Error del cliente: ${error.error.message}`;
        } else if (error.error && error.error.message) {
          errorMessage = `Error del servidor: ${error.error.message}`;
        } else if (error.status) {
          errorMessage = `Error HTTP ${error.status}: ${error.statusText || 'Error desconocido'}`;
        }
        
        console.error(errorMessage);
        return throwError(() => new Error(errorMessage));
      })
    );

  
}

private handleError(error: HttpErrorResponse) {
  console.error('Error detallado:', error);
  
  let errorMessage = 'Ocurrió un error desconocido';
  
  if (error.error instanceof ErrorEvent) {
    // Error del lado del cliente
    errorMessage = `Error del cliente: ${error.error.message}`;
  } else {
    // Error del backend
    errorMessage = `Error del servidor: ${error.status}. Mensaje: ${error.error?.message || error.statusText}`;
  }
  
  console.error(errorMessage);
  return throwError(() => new Error(errorMessage));
}


}
