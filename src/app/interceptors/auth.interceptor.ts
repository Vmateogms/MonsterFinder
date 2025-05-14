import { HttpInterceptorFn } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { inject } from '@angular/core';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Obtener el token del localStorage
  const token = localStorage.getItem('token');
  
  // Clonar la petición base para añadir withCredentials
  let authReq = req.clone({
    withCredentials: true // Habilitar envío de cookies en peticiones CORS
  });
  
  if (token) {
    console.log(`🔒 Interceptando petición a: ${req.url}`);
    
    // Comprobar si el token es válido (formato básico)
    if (token.length < 20) {
      console.error('⚠️ Token sospechosamente corto, podría ser inválido:', token);
    }
    
    // Añadir encabezado de autorización cuando hay token
    // Formato exacto: "Bearer <token>" sin espacios adicionales
    authReq = authReq.clone({
      setHeaders: {
        Authorization: `Bearer ${token.trim()}`
      }
    });
    
    console.log('Headers enviados:', authReq.headers.keys().map(k => `${k}: ${authReq.headers.get(k)}`));
  } else {
    console.log(`⚠️ Petición sin autenticación a: ${req.url}`);
  }
  
  // Regresar la petición clonada 
  return next(authReq).pipe(
    tap({
      next: (event) => {
        // Petición exitosa, no hacer nada
      },
      error: (error) => {
        if (error.status === 401) {
          console.error('🚫 Error 401: Unauthorized - Posible token inválido o expirado');
          console.log('URL:', req.url);
          console.log('Headers enviados:', authReq.headers.keys().map(k => `${k}: ${authReq.headers.get(k)}`));
          
          // Si no es una petición de verificación de token, limpiar localStorage
          if (!req.url.includes('verificar-token') && !req.url.includes('login')) {
            console.log('🧹 Limpiando sesión local por error 401');
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
            
            // Intenta refrescar la página si la sesión ha caducado
            window.location.reload();
          }
        }
      }
    })
  );
};