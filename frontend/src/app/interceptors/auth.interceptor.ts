import { HttpInterceptorFn } from '@angular/common/http';
import { tap } from 'rxjs/operators';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');

  let authReq = req.clone({
    withCredentials: true
  });

  if (token) {
    authReq = authReq.clone({
      setHeaders: {
        Authorization: `Bearer ${token.trim()}`
      }
    });
  }

  return next(authReq).pipe(
    tap({
      error: (error) => {
        if (error.status === 401 && !req.url.includes('verificar-token') && !req.url.includes('login')) {
          localStorage.removeItem('token');
          localStorage.removeItem('currentUser');
          window.location.reload();
        }
      }
    })
  );
};