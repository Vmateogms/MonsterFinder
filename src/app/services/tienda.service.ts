import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { ITienda } from '../interfaces/itienda';
import { environment } from './environment.prod';

@Injectable({
  providedIn: 'root'
})
export class TiendaService {

private apiUrl = `${environment.apiUrl}/tiendas`;

  constructor(private http: HttpClient) { }


  getTiendas(): Observable<ITienda[]> {
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
