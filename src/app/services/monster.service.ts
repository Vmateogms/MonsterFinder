import { Injectable } from '@angular/core';
import { IMonster } from '../interfaces/imonster';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../environment/environment.prod';
import { catchError, Observable, of, Subject, tap ,map } from 'rxjs';
import { MapaComponent } from '../components/mapa/mapa.component';

@Injectable({
  providedIn: 'root'
})
export class MonsterService {

private apiUrl = `${environment.apiUrl}/monsters`; // CAMBIAR A ENVIROMENT UN AVEZ HECHAS LAS PRUEBAS 

//private mapaComponentSubject = new Subject<MapaComponent>();
private mapaComponent: MapaComponent | null = null;

private resultadosFiltradoSubject = new Subject<any[]>();
// Observable que utilizan otros componentes para recibir resultados de filtrado
resultadosFiltrado$ = this.resultadosFiltradoSubject.asObservable();


  constructor(private http: HttpClient) { }

   // Método para registrar el componente de mapa
    registerMapaComponent(component: MapaComponent): void {
      this.mapaComponent = component;
  }

    // Método para acceder al componente de mapa registrado
    getMapaComponent(): MapaComponent | null {
      return this.mapaComponent;
    }
  

  getAllMonsters(): Observable<IMonster[]> {
    return this.http.get<any[]>(this.apiUrl)
      .pipe(
        tap(data => console.log('Monsters obtenidos:', data)),
        catchError(error => {
          console.error('Error al obtener monsters:', error);
          return of([]);
        })
      );
  }


    // Método para filtrar monsters
    filtrarMonsters(nombreBusqueda: string, ordenPrecio: string, soloEnNevera: boolean = false): Observable<any[]> {
      console.log(`Filtrando con URL: ${this.apiUrl}/filtrar?nombre=${nombreBusqueda}&ordenPrecio=${ordenPrecio}`);
      const url = `${this.apiUrl}/filtrar`;
      
      console.log(`Filtrando con URL: ${url}?nombre=${nombreBusqueda}&ordenPrecio=${ordenPrecio}`);

      let params = new HttpParams()
      .set('nombre', nombreBusqueda)
      .set('ordenPrecio', ordenPrecio);
    
    if (soloEnNevera) {
      params = params.set('enNevera', soloEnNevera.toString());
    }
      // Corregimos la URL del endpoint
      return this.http.get<any[]>(url, {params}).pipe(
      map(resultados => {
        // Ordenar resultados
        if (ordenPrecio === 'precioAscendente') {
          return resultados.sort((a, b) => {
            // Si hay precio con descuento, usar ese
            const precioA = a.descuento ? a.precioDescuento : a.precio;
            const precioB = b.descuento ? b.precioDescuento : b.precio;
            return precioA - precioB;
          });
        } else {
          return resultados.sort((a, b) => {
            const precioA = a.descuento ? a.precioDescuento : a.precio;
            const precioB = b.descuento ? b.precioDescuento : b.precio;
            return precioB - precioA;
          });
        }
      }),
      catchError(error => {
        console.error('Error filtrando monsters:', error);
        return of([]);
      })
    );
  }

  // Método para notificar a los componentes suscritos sobre nuevos resultados
  actualizarResultadosFiltrados(resultados: any[]): void {
    console.log('Actualizando resultados filtrados:', resultados);
    this.resultadosFiltradoSubject.next(resultados);
  }

  findNearestStoreWithMonster(monsterId: number): any {
    if (!this.mapaComponent) {
      console.warn('Mapacomponent no registrado');
      return null;
    }
    return this.mapaComponent.findNearestStoreWithMonster(monsterId);
  }

  highlightStoreOnMap(tienda: any): void {
    if (!this.mapaComponent) {
      console.warn('MapaComponent no registrado');
      return;
    }
    
    this.mapaComponent.highlightStore(tienda);
  }

}
