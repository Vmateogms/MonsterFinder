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
private mapaComponentSubject = new Subject<MapaComponent>();

// Observable que utilizan otros componentes para recibir resultados de filtrado
resultadosFiltrado$ = this.resultadosFiltradoSubject.asObservable();
mapaComponentSet$ = this.mapaComponentSubject.asObservable();

  constructor(private http: HttpClient) { }

   // Método para registrar el componente de mapa
    registerMapaComponent(mapaComponent: MapaComponent): void {
    this.mapaComponentSubject.next(mapaComponent);
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
    this.resultadosFiltradoSubject.next(resultados);
  }
}
