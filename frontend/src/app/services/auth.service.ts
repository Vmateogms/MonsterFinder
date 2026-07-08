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
    console.log('🔄 Intentando cargar usuario desde localStorage');
    const userStr = localStorage.getItem('currentUser');
    const token = localStorage.getItem('token');
    
    if (userStr && token) {
      try {
        const user = JSON.parse(userStr);
        console.log('🔄 Usuario encontrado en localStorage:', user.username);
        console.log('🔄 Token encontrado (primeros 15 caracteres):', token.substring(0, 15) + '...');
        
        this.currentUserSubject.next(user);
        this.isLoggedInSubject.next(true);
        
        console.log('🔄 Sesión restaurada desde localStorage');
        
        // Verificar token al iniciar (silenciosamente)
        this.verificarToken(token).subscribe({
          next: () => console.log('✅ Token verificado exitosamente'),
          error: (err) => {
            console.error('❌ Token inválido, cerrando sesión:', err);
            // Intento de verificación alternativo silencioso
            console.log('🔄 Intentando verificación alternativa...');
            this.http.get(`${this.apiUrl}/verificar-auth-debug`, {
              headers: new HttpHeaders({
                'Authorization': `Bearer ${token.trim()}`
              }),
              withCredentials: true
            }).subscribe({
              next: () => console.log('✅ Verificación alternativa exitosa'),
              error: (err2) => {
                console.error('❌ Verificación alternativa fallida:', err2);
                this.logout().subscribe();
              }
            });
          }
        });
      } catch (e) {
        console.error('❌ Error al parsear usuario:', e);
        this.limpiarSesionLocal();
      }
    } else {
      // Si no hay usuario o token, limpiar todo
      console.log('⚠️ No se encontraron datos de sesión en localStorage');
      this.limpiarSesionLocal();
    }
  }

  login(credentials: ILoginRequest): Observable<IAuthResponse> {
    console.log('🔑 Intentando iniciar sesión con:', credentials.username);
    return this.http.post<IAuthResponse>(`${this.apiUrl}/login`, credentials, {
      withCredentials: true
    })
      .pipe(
        tap(resp => {
          console.log('✅ Login exitoso, respuesta completa:', resp);
          if (!resp.token) {
            console.error('⚠️ La respuesta no incluye token');
          }
          this.almacenarSesion(resp);
        }),
        catchError(error => {
          console.error('❌ Error en login:', error);
          return throwError(() => new Error(error.error?.message || 'Error en el login'));
        })
      );
  }

  registro(userData: IRegistroRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/registro`, userData)
      .pipe(
        catchError(error => {
          console.error('Error en registro:', error);
          return throwError(() => new Error(error.error?.message || 'Error en el registro'));
        })
      );
  }

  logout(): Observable<any> {
    console.log('🚪 Cerrando sesión...');
    
    // Si no hay token, solo limpiamos localmente
    if (!localStorage.getItem('token')) {
      this.limpiarSesionLocal();
      return of(true);
    }
    
    // Llamar al endpoint de logout y luego limpiar la sesión
    return this.httpAuth.post<any>(`${this.apiUrl}/logout`, {}).pipe(
      finalize(() => {
        this.limpiarSesionLocal();
      }),
      catchError(error => {
        console.error('Error en logout:', error);
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
    console.log('🧹 Sesión limpiada localmente');
  }

  verificarToken(token: string): Observable<IAuthResponse> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token.trim()}`
    });
    
    console.log('🔍 Verificando token con encabezado:', headers.get('Authorization'));
    console.log('🔍 URL de verificación:', `${this.apiUrl}/verificar-token`);
    
    return this.http.get<IAuthResponse>(`${this.apiUrl}/verificar-token`, { 
      headers,
      withCredentials: true
    })
      .pipe(
        tap(resp => {
          console.log('✅ Token verificado correctamente:', resp);
          this.almacenarSesion(resp);
        }),
        catchError(error => {
          console.error('❌ Error al verificar token:', error);
          console.error('❌ Status:', error.status);
          console.error('❌ Error completo:', JSON.stringify(error));
          
          // Limpiar sesión si hay error 401 o 403
          if (error.status === 401 || error.status === 403) {
            console.log('🧹 Limpiando sesión por error de autenticación');
            this.limpiarSesionLocal();
          }
          
          return throwError(() => new Error('Token inválido o expirado'));
        })
      );
  }

  obtenerPerfil(): Observable<IUsuario> {
    console.log('🔍 Obteniendo perfil de usuario...');
    console.log('🔗 URL:', `${this.apiUrl}/perfil`);
    
    return this.httpAuth.get<IUsuario>(`${this.apiUrl}/perfil`)
      .pipe(
        tap(user => {
          console.log('✅ Perfil obtenido correctamente:', user);
          console.log('📊 Experiencia actual:', user.experiencia);
          console.log('📊 Nivel actual:', user.nivel);
          
          // Comprobar si hay cambios respecto al perfil almacenado localmente
          const storedUser = this.currentUserValue;
          if (storedUser) {
            if (storedUser.experiencia !== user.experiencia) {
              console.log('🎉 ¡Cambio de experiencia detectado!', 
                `Anterior: ${storedUser.experiencia}, Nuevo: ${user.experiencia}, 
                Incremento: ${user.experiencia - storedUser.experiencia}`);
            }
            if (storedUser.nivel !== user.nivel) {
              console.log('🎉 ¡Cambio de nivel detectado!', 
                `Anterior: ${storedUser.nivel}, Nuevo: ${user.nivel}`);
            }
          }
          
          this.currentUserSubject.next(user);
          // Guardar usuario actualizado en localStorage
          localStorage.setItem('currentUser', JSON.stringify(user));
        }),
        catchError(error => {
          console.error('❌ Error al obtener perfil:', error);
          console.error('❌ Código de estado:', error.status);
          console.error('❌ Mensaje:', error.message);
          
          if (error.status === 401) {
            console.log('⚠️ Token posiblemente inválido. Verificando...');
            const token = localStorage.getItem('token');
            if (token) {
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
        tap(favoritos => console.log(`✅ ${favoritos.length} favoritos obtenidos`)),
        catchError(error => {
          console.error('❌ Error al obtener favoritos:', error);
          if (error.status === 401) {
            console.log('⚠️ Token posiblemente inválido para favoritos');
          }
          return throwError(() => new Error('Error al obtener favoritos'));
        })
      );
  }

  agregarFavorito(tiendaId: number): Observable<any> {
    console.log('📍 Agregando tienda a favoritos:', tiendaId);
    return this.httpAuth.post<any>(`${this.favoritosUrl}/agregar`, { tiendaId })
      .pipe(
        tap(() => console.log(`✅ Tienda ${tiendaId} agregada a favoritos`)),
        catchError(error => {
          console.error('❌ Error al agregar favorito:', error);
          return throwError(() => new Error('Error al agregar favorito'));
        })
      );
  }

  eliminarFavorito(tiendaId: number): Observable<any> {
    console.log('🗑️ Eliminando tienda de favoritos:', tiendaId);
    return this.httpAuth.delete<any>(`${this.favoritosUrl}/${tiendaId}`)
      .pipe(
        tap(() => console.log(`✅ Tienda ${tiendaId} eliminada de favoritos`)),
        catchError(error => {
          console.error('❌ Error al eliminar favorito:', error);
          return throwError(() => new Error('Error al eliminar favorito'));
        })
      );
  }

  esFavorito(tiendaId: number): Observable<boolean> {
    console.log('🔍 Verificando si la tienda es favorita:', tiendaId);
    return this.httpAuth.get<any>(`${this.favoritosUrl}/check/${tiendaId}`)
      .pipe(
        map(resp => resp.success),
        tap(result => console.log(`✅ Tienda ${tiendaId} es favorita: ${result ? 'Sí' : 'No'}`)),
        catchError(error => {
          console.error('❌ Error al verificar favorito:', error);
          return of(false);
        })
      );
  }

  // Helpers
  private almacenarSesion(response: IAuthResponse) {
    if (!response.token) {
      console.error('❌ Error: No se recibió token del servidor');
      return;
    }
    
    try {
      // Almacenar el token exactamente como viene del backend
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
      
      console.log('💾 Sesión almacenada correctamente');
    } catch (e) {
      console.error('Error al almacenar datos de sesión:', e);
    }
  }

  get currentUserValue(): IUsuario | null {
    return this.currentUserSubject.value;
  }

  // Método de diagnóstico para verificar el token y el interceptor
  verificarAutenticacion(): Observable<any> {
    console.group('🔍 Diagnóstico de autenticación');
    const token = localStorage.getItem('token');
    console.log('Token almacenado:', token ? token : 'No existe');
    console.log('Usuario almacenado:', localStorage.getItem('currentUser') ? 'Presente' : 'No existe');
    console.log('Estado de isLoggedIn:', this.isLoggedInSubject.value);
    console.groupEnd();
    
    return this.httpAuth.get<any>(`${this.apiUrl}/verificar-auth-debug`)
      .pipe(
        tap(resp => {
          console.log('✅ Verificación exitosa:', resp);
        }),
        catchError(error => {
          console.error('❌ Error en verificación:', error);
          if (error.status === 401) {
            console.error('❌ ERROR 401: Problema con el token o el interceptor');
          }
          return throwError(() => new Error('Error verificando autenticación'));
        })
      );
  }

  get isLoggedIn(): boolean {
    return this.isLoggedInSubject.value;
  }
}