import { HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of, tap, throwError, BehaviorSubject, Subject } from 'rxjs';
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

  // Para detección de nuevas tiendas
  private lastTiendaId: number = 0;
  private newTiendaSubject = new BehaviorSubject<ITienda | null>(null);
  public newTienda$ = this.newTiendaSubject.asObservable();

  // Para notificaciones de XP
  private xpNotificationSubject = new Subject<{xpGanada: number, mensaje: string}>();
  public xpNotification$ = this.xpNotificationSubject.asObservable();

  constructor(private http: HttpClient) { }

  getTiendas(): Observable<ITienda[]> {
    const now = Date.now();
    if (this.tiendaCache.length > 0 && now - this.lastFetchTime < this.CACHE_DURATION) {
      console.log('Retornando tiendas desde cache:', this.tiendaCache.length);
      return of(this.tiendaCache);
    }

    return this.http.get<ITienda[]>(`${this.apiUrl}`).pipe(
      tap(tiendas => {
        console.log('Tiendas cargadas desde API:', tiendas.length);
        this.tiendaCache = tiendas;
        this.lastFetchTime = now;
        
        // Actualizar el ID más alto
        this.updateLastTiendaId(tiendas);
      }),
      catchError(this.handleError)
    );
  }

  // Comprobar si hay tiendas nuevas
  checkForNewTiendas(): Observable<ITienda[]> {
    if (this.lastTiendaId === 0) {
      // Si no tenemos lastTiendaId, primero cargamos todas las tiendas
      return this.getTiendas().pipe(
        map(tiendas => {
          // No notificamos nuevas tiendas la primera vez
          return [];
        })
      );
    }
    
    // Buscar tiendas con ID mayor que el último conocido
    return this.http.get<ITienda[]>(`${this.apiUrl}/nuevas/${this.lastTiendaId}`).pipe(
      tap(tiendas => {
        const nuevasTiendas = this.findNewTiendas(tiendas);
        if (nuevasTiendas.length > 0) {
          console.log(`Se encontraron ${nuevasTiendas.length} nuevas tiendas`);
          
          // Actualizar caché
          this.tiendaCache = [...this.tiendaCache, ...nuevasTiendas];
          
          // Actualizar último ID
          this.updateLastTiendaId(tiendas);
          
          // Notificar la primera tienda nueva
          if (nuevasTiendas.length > 0) {
            this.newTiendaSubject.next(nuevasTiendas[0]);
          }
        }
      }),
      map(tiendas => this.findNewTiendas(tiendas)),
      catchError(error => {
        console.error('Error al comprobar nuevas tiendas:', error);
        return of([]);
      })
    );
  }

  private findNewTiendas(tiendas: ITienda[]): ITienda[] {
    if (!tiendas || tiendas.length === 0) return [];
    
    // Filtrar tiendas con ID mayor que el último conocido
    return tiendas.filter(tienda => tienda.id > this.lastTiendaId);
  }

  private updateLastTiendaId(tiendas: ITienda[]): void {
    if (!tiendas || tiendas.length === 0) return;
    
    // Encontrar el ID más alto
    const maxId = Math.max(...tiendas.map(tienda => tienda.id));
    if (maxId > this.lastTiendaId) {
      console.log(`Actualizando lastTiendaId: ${this.lastTiendaId} -> ${maxId}`);
      this.lastTiendaId = maxId;
    }
  }

  getTiendaById(id: number): Observable<ITienda> {
    // Primero buscar en caché
    const cachedTienda = this.tiendaCache.find(tienda => tienda.id === id);
    if (cachedTienda && cachedTienda.monsters && cachedTienda.monsters.length > 0) {
      console.log('Retornando tienda desde caché:', cachedTienda.nombre);
      return of(cachedTienda);
    }
    
    // Si no está en caché o no tiene monsters, obtener desde API
    return this.http.get<ITienda>(`${this.apiUrl}/${id}`).pipe(
      tap(tienda => {
        console.log('Tienda cargada desde API:', tienda.nombre);
        
        // Actualizar la tienda en la caché
        const index = this.tiendaCache.findIndex(t => t.id === id);
        if (index >= 0) {
          this.tiendaCache[index] = tienda;
        } else {
          this.tiendaCache.push(tienda);
        }
      }),
      catchError(this.handleError)
    );
  }

  addTienda(tienda: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}`, tienda).pipe(
      tap(response => {
        console.log('Tienda añadida correctamente:', response);
        
        // Añadir la nueva tienda a la caché
        if (response && response.id) {
          this.tiendaCache.push(response);
          
          // Actualizar el ID más alto si es necesario
          if (response.id > this.lastTiendaId) {
            this.lastTiendaId = response.id;
          }
        }
        
        // Verificar si hay headers de experiencia
        const xpGanada = response.headers?.get('X-Experiencia-Ganada');
        const mensajeXp = response.headers?.get('X-Mensaje-Experiencia');
        
        if (xpGanada && mensajeXp) {
          this.xpNotificationSubject.next({
            xpGanada: parseInt(xpGanada, 10),
            mensaje: mensajeXp
          });
        }
      }),
      catchError(this.handleError)
    );
  }
  
  // Método para actualizar monsters de una tienda
  updateTiendaMonsters(tiendaId: number, updates: any[]): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/tienda-monsters/${tiendaId}/update`, updates, {
      observe: 'response'
    }).pipe(
      tap(response => {
        console.log('Monsters actualizados correctamente:', response.body);
        
        // Actualizar la tienda en la caché
        const index = this.tiendaCache.findIndex(t => t.id === tiendaId);
        if (index >= 0 && response.body) {
          this.tiendaCache[index] = response.body;
        }
        
        // Verificar si hay headers de experiencia
        const xpGanada = response.headers.get('X-Experiencia-Ganada');
        const mensajeXp = response.headers.get('X-Mensaje-Experiencia');
        
        if (xpGanada && mensajeXp) {
          this.xpNotificationSubject.next({
            xpGanada: parseInt(xpGanada, 10),
            mensaje: mensajeXp
          });
        }
      }),
      map(response => response.body), // Devolver solo el body
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Error en TiendaService', error);
    
    let errorMessage = 'Ocurrió un error en el servidor';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else if (error.error && error.error.message) {
      // Error del backend con mensaje
      errorMessage = error.error.message;
    } else if (error.status) {
      // Error HTTP
      errorMessage = `Error HTTP ${error.status}: ${error.statusText}`;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}
