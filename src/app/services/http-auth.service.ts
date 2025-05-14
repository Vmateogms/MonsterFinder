import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HttpAuthService {
  constructor(private http: HttpClient) {}

  /**
   * Crea los encabezados HTTP con el token de autenticación
   */
  private createAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    
    if (token) {
      // Formato exacto - importante para Spring Security
      headers = headers.set('Authorization', `Bearer ${token.trim()}`);
      console.log('🔑 Usando token para petición:', token);
    }
    
    return headers;
  }

  /**
   * Realiza una petición GET autenticada
   */
  get<T>(url: string): Observable<T> {
    const headers = this.createAuthHeaders();
    console.log(`GET autenticado a ${url}`);
    console.log('Headers:', headers.keys().map(k => `${k}: ${headers.get(k)}`));
    
    return this.http.get<T>(url, { 
      headers,
      withCredentials: true
    });
  }

  /**
   * Realiza una petición POST autenticada
   */
  post<T>(url: string, body: any): Observable<T> {
    const headers = this.createAuthHeaders();
    console.log(`POST autenticado a ${url}`);
    console.log('Body:', body);
    console.log('Headers:', headers.keys().map(k => `${k}: ${headers.get(k)}`));
    
    return this.http.post<T>(url, body, { 
      headers,
      withCredentials: true
    });
  }

  /**
   * Realiza una petición DELETE autenticada
   */
  delete<T>(url: string): Observable<T> {
    const headers = this.createAuthHeaders();
    console.log(`DELETE autenticado a ${url}`);
    console.log('Headers:', headers.keys().map(k => `${k}: ${headers.get(k)}`));
    
    return this.http.delete<T>(url, { 
      headers,
      withCredentials: true 
    });
  }
} 