import { Injectable } from '@angular/core';
import { IMonster } from '../interfaces/imonster';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from './environment.prod';
import { catchError, Observable, of, Subject, tap } from 'rxjs';
import { MapaComponent } from '../components/mapa/mapa.component';

@Injectable({
  providedIn: 'root'
})
export class MonsterService {

private apiUrl = `${environment.apiUrl}/monsters`; // CAMBIAR A ENVIROMENT UN AVEZ HECHAS LAS PRUEBAS 
private resultadosFiltradoSubject = new Subject<any[]>();
//private mapaComponentSubject = new Subject<MapaComponent>();
private mapaComponentRef: MapaComponent | null = null;

// Observable que utilizan otros componentes para recibir resultados de filtrado
resultadosFiltrado$ = this.resultadosFiltradoSubject.asObservable();


  constructor(private http: HttpClient) { }

   // Método para registrar el componente de mapa
    registerMapaComponent(mapaComponent: MapaComponent): void {
      this.mapaComponentRef = mapaComponent;
      console.log('Mapa component registered with MonsterService');
  }

    // Método para acceder al componente de mapa registrado
    getMapaComponent(): MapaComponent | null {
      return this.mapaComponentRef;
    }
  

  getAllMonsters(): Observable<any[]> {
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
    filtrarMonsters(nombre: string, ordenPrecio: string): Observable<any[]> {
      console.log(`Filtrando con URL: ${this.apiUrl}/filtrar?nombre=${nombre}&ordenPrecio=${ordenPrecio}`);
      
      const params = new HttpParams()
        .set('nombre', nombre)
        .set('ordenPrecio', ordenPrecio);
        
      // Corregimos la URL del endpoint
      return this.http.get<any[]>(`${this.apiUrl}/monsters/filtrar`, { params })
        .pipe(
          catchError(error => {
            console.error('Error al filtrar monsters:', error);
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
    if (!this.mapaComponentRef) {
      console.warn('Mapacomponent no registrado');
      return null;
    }
    return this.mapaComponentRef.findNearestStoreWithMonster(monsterId);
  }

  highlightStoreOnMap(tienda: any): void {
    if (!this.mapaComponentRef) {
      console.warn('MapaComponent no registrado');
      return;
    }
    
    this.mapaComponentRef.highlightStore(tienda);
  }

}
