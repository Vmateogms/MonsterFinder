// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap, finalize } from 'rxjs/operators';
import { environment } from '../environment/environment.prod';
import {IUsuario} from '../interfaces/iusuario';
import { ILoginRequest } from '../interfaces/ILoginRequest';
import { IAuthResponse } from '../interfaces/IAuthResponse';
import { IRegistroRequest } from '../interfaces/IRegistroRequest';
import { IFavorito } from '../interfaces/IFavorito';
import { HttpAuthService } from './http-auth.service';

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  private apiUrl = `${environment.apiUrl}/usuarios`;
  private favoritosUrl = `${environment.apiUrl}/favoritos`;
  
  private currentUserSubject = new BehaviorSubject<IUsuario | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(
    private http: HttpClient,
    private httpAuth: HttpAuthService
  ) {
    this.cargarUsuarioDesdeLocalStorage();
  }

  private cargarUsuarioDesdeLocalStorage() {
    const userStr = localStorage.getItem('currentUser');
    const token = localStorage.getItem('token');
    
    if ( !userStr || !token) {
      this.limpiarSesionLocal();
      return;
    }
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
        this.isLoggedInSubject.next(true);
        
       
        
        // Verificar token al iniciar (silenciosamente)
        this.verificarToken(token).subscribe({
          error: () => this.limpiarSesionLocal()
        });
      } catch {
        this.limpiarSesionLocal();
      }
    
  }

  login(credentials: ILoginRequest): Observable<IAuthResponse> {
    return this.http.post<IAuthResponse>(`${this.apiUrl}/login`, credentials, {
      withCredentials: true
    })
      .pipe(
        tap(resp => this.almacenarSesion(resp)),
        catchError(error =>  
          throwError(() => new Error(error.error?.message || 'Error en el login'))
        )
      );
  }

  registro(userData: IRegistroRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/registro`, userData)
      .pipe(
        catchError(error => {
          return throwError(() => new Error(error.error?.message || 'Error en el registro'));
        })
      );
  }

  logout(): Observable<any> {
    
    // Si no hay token, solo limpiamos localmente
    if (!localStorage.getItem('token')) {
      this.limpiarSesionLocal();
      return of(true);
    }
    
    // Llamar al endpoint de logout y luego limpiar la sesión
    return this.httpAuth.post<any>(`${this.apiUrl}/logout`, {}).pipe(
      finalize(() => this.limpiarSesionLocal()),
      catchError(() => {
        this.limpiarSesionLocal();
        return of(true);
      })
    );
  }

  private limpiarSesionLocal(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
    this.isLoggedInSubject.next(false);
  }

  verificarToken(token: string): Observable<IAuthResponse> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token.trim()}`
    });
    
    return this.http.get<IAuthResponse>(`${this.apiUrl}/verificar-token`, { 
      headers,
      withCredentials: true
    })
      .pipe(
        tap(resp => {
          this.almacenarSesion(resp);
        }),
        catchError(error => {
          
          // Limpiar sesión si hay error 401 o 403
          if (error.status === 401 || error.status === 403) {
            this.limpiarSesionLocal();
          }
          
          return throwError(() => new Error('Token inválido o expirado'));
        })
      );
  }

  obtenerPerfil(): Observable<IUsuario> {

    
    return this.httpAuth.get<IUsuario>(`${this.apiUrl}/perfil`)
      .pipe(
        tap(user => {
          this.currentUserSubject.next(user);
          localStorage.setItem('currentUser', JSON.stringify(user));
        }),
        catchError(error => {
          if(error.status === 401) {
            const token = localStorage.getItem('token');
            if(token) {
              this.verificarToken(token).subscribe({
                error: () => this.limpiarSesionLocal()
              });
            }
          }
          return throwError(() => new Error('Error al obtener perfil'));
        })
        );
        }
  // Favoritos
  obtenerFavoritos(): Observable<IFavorito[]> {
    console.log('🔍 Obteniendo favoritos...');
    return this.httpAuth.get<any>(`${this.favoritosUrl}`)
      .pipe(
        map(resp => resp.favoritos || []),
      catchError(() => throwError(() => new Error('Error al obtener favoritos')))
    );
  }

  agregarFavorito(tiendaId: number): Observable<any> {
    console.log('📍 Agregando tienda a favoritos:', tiendaId);
    return this.httpAuth.post<any>(`${this.favoritosUrl}/agregar`, { tiendaId })
      .pipe(
        catchError(() => throwError(() => new Error('Error al agregar favorito')))
      );
  }

  eliminarFavorito(tiendaId: number): Observable<any> {
      return this.httpAuth.delete<any>(`${this.favoritosUrl}/${tiendaId}`).pipe(
      catchError(() => throwError(() => new Error('Error al eliminar favorito')))
    );
  }

  esFavorito(tiendaId: number): Observable<boolean> {
    return this.httpAuth.get<any>(`${this.favoritosUrl}/check/${tiendaId}`).pipe(
      map(resp => resp.success),
      catchError(() => of(false))
    );
  }

  // Helpers
  private almacenarSesion(response: IAuthResponse) {
    if (!response.token) return;
    
      const token = response.token.trim();
      localStorage.setItem('token', token);
      
      console.log(`💾 Token almacenado (${response.tipo}): ${token}`);
      
      const userData: IUsuario = {
        id: response.id,
        username: response.username,
        email: response.email,
        rol: response.rol,
        nivelConfianza: response.nivelConfianza,
        experiencia: response.experiencia,
        nivel: response.nivel,
        progresoNivel: response.progresoNivel
      };
      
      // Luego almacenar datos de usuario
      localStorage.setItem('currentUser', JSON.stringify(userData));
      
      // Actualizar subjects
      this.currentUserSubject.next(userData);
      this.isLoggedInSubject.next(true);
      

  }

  get currentUserValue(): IUsuario | null {
    return this.currentUserSubject.value;
  }

  get isLoggedIn(): boolean {
    return this.isLoggedInSubject.value;
  }
}