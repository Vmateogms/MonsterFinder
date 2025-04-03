import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ITienda } from '../interfaces/itienda';

@Injectable({
  providedIn: 'root'
})
export class TiendaService {

  private apiUrl = 'http://localhost:9007/api/tiendas';

  constructor(private http: HttpClient) { }


  getTiendas(): Observable<ITienda[]> {
    return this.http.get<ITienda[]>(this.apiUrl).pipe(
        map((tiendas: any[]) => tiendas.map(t => ({
            ...t,
            monsters: t.tiendaMonsters.map((tm: any) => ({
                monster: tm.monster,
                precio: tm.precio
            }))
        })))
    );
}

getTiendaById(id: number): Observable<ITienda> {
  return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
    map((tienda: any) => ({
      ...tienda, 
      monsters: tienda.tiendaMonsters.map((tm: any) => ({
        monster: tm.monster, 
        precio: tm.precio
      }))
    }))
  );
}


addTienda(tienda: any) {
  const httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };
  return this.http.post(this.apiUrl, tienda, httpOptions);
}



}
