import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, of, tap } from 'rxjs';
import { ITienda } from '../interfaces/itienda';
import { environment } from './environment.prod';

@Injectable({
  providedIn: 'root'
})
export class TiendaService {

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
                precioDescuento: tm.precioDescuento
            }))
        })))
    );
}

// getTiendas(): Observable<ITienda[]> {
//   const now = Date.now();
  
//   // Si tenemos datos en caché y no han expirado, usarlos
//   if (this.tiendaCache.length > 0 && now - this.lastFetchTime < this.CACHE_DURATION) {
//     console.log('Usando datos en caché');
//     return of(this.tiendaCache);
//   }
  
//   // Si no, hacer petición a la API
//   console.log('Solicitando datos a la API');
//   return this.http.get<ITienda[]>(`${this.apiUrl}/tiendas`)
//     .pipe(
//       tap(tiendas => {
//         this.tiendaCache = tiendas;
//         this.lastFetchTime = now;
//         console.log('Datos almacenados en caché:', tiendas.length);
//       }),
//       catchError(error => {
//         console.error('Error cargando tiendas:', error);
//         // Si hay un error pero tenemos caché, usamos la caché aunque esté expirada
//         if (this.tiendaCache.length > 0) {
//           console.log('Usando caché expirada debido a error');
//           return of(this.tiendaCache);
//         }
//         return of([]);
//       })
//     );
// }



getTiendaById(id: number): Observable<ITienda> {
  console.log('Fetching tienda with id:', id);
  
  return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
    tap(response => console.log('Backend response:', JSON.stringify(response))),
    map((tienda: any) => {
      const mappedTienda = {
        ...tienda,
        monsters: tienda.tiendaMonsters.map((tm: any) => {
          console.log(`Processing monster ${tm.monster.id}: precio=${tm.precio}, descuento=${tm.descuento}, precioDescuento=${tm.precioDescuento}`);
          
          return {
            monster: tm.monster,
            precio: tm.precio,
            // Asegurar que los valores de descuento estén correctamente mapeados
            descuento: tm.descuento === true, 
            // Garantizar que precioDescuento sea null si no está definido
            precioDescuento: tm.precioDescuento !== undefined ? tm.precioDescuento : null 
          };
        })
      };
      console.log('Mapped tienda data:', JSON.stringify(mappedTienda));
      return mappedTienda;
    })
  );
}




// getTiendaById(id: number): Observable<ITienda> {
//   console.log('Fetching tienda with id:', id);
  
//   return this.http.get(`${this.apiUrl}/${id}`).pipe(
//     tap(response => console.log('Backend response:', response)),
//     map((tienda: any) => ({
//       ...tienda, 
//       monsters: tienda.tiendaMonsters.map((tm: any) => ({
//         monster: tm.monster, 
//         precio: tm.precio,
//         descuento: !!tm.descuento, //|| false,
//         precioDescuento: tm.precioDescuento || null
//       }))
//     }))
//   );
// }


addTienda(tienda: any) {
  const httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };
  return this.http.post(this.apiUrl, tienda, httpOptions);
}



}
