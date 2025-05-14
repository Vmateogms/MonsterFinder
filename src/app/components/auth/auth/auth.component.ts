// src/app/components/auth/auth.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { ILoginRequest } from '../../../interfaces/ILoginRequest';
import { IRegistroRequest } from '../../../interfaces/IRegistroRequest';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent implements OnInit {
  modo: 'login' | 'registro' = 'login';
  loginForm!: FormGroup;
  registroForm!: FormGroup;
  mostrarModal = false;
  errorMessage = '';
  loading = false;

  constructor(
    private fb: FormBuilder,
    public authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.initForms();
  }

  initForms(): void {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });

    this.registroForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      nombreCompleto: ['', [Validators.required]]
    });
  }

  abrirModal(): void {
    this.mostrarModal = true;
    this.errorMessage = '';
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.errorMessage = '';
  }

  cambiarModo(nuevoModo: 'login' | 'registro'): void {
    this.modo = nuevoModo;
    this.errorMessage = '';
  }

  onSubmitLogin(): void {
    if (this.loginForm.invalid) {
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    
    const credentials: ILoginRequest = this.loginForm.value;
    console.log('🔑 Intentando iniciar sesión con:', credentials.username);
    
    this.authService.login(credentials).subscribe({
      next: (response) => {
        console.log('✅ Login exitoso:', response);
        this.loading = false;
        this.cerrarModal();
        // Recargar la página para asegurar que todo se actualiza correctamente
        window.location.reload();
      },
      error: (error) => {
        this.loading = false;
        console.error('❌ Error de login:', error);
        
        // Mostrar mensaje de error más detallado
        let errorMsg = 'Error al iniciar sesión';
        
        if (error.status === 401) {
          errorMsg = 'Nombre de usuario o contraseña incorrectos';
        } else if (error.status === 0) {
          errorMsg = 'No se pudo conectar al servidor. Verifica tu conexión a internet.';
        } else if (error.message) {
          errorMsg = error.message;
        }
        
        this.errorMessage = errorMsg;
        
        // Verificar el estado de conexión a la API
        this.verificarConexionAPI();
      }
    });
  }

  onSubmitRegistro(): void {
    if (this.registroForm.invalid) {
      Object.keys(this.registroForm.controls).forEach(key => {
        this.registroForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    
    const userData: IRegistroRequest = this.registroForm.value;
    
    this.authService.registro(userData).subscribe({
      next: () => {
        this.loading = false;
        this.errorMessage = '';
        this.cambiarModo('login');
        // Mostrar mensaje de éxito
        alert('¡Registro exitoso! Por favor inicia sesión con tus nuevas credenciales.');
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.message || 'Error al registrarse';
      }
    });
  }

  // Método para verificar autenticación (diagnóstico)
  verificarAuth(): void {
    console.log('Verificando autenticación...');
    this.authService.verificarAutenticacion().subscribe({
      next: (resp) => {
        console.log('Autenticación correcta:', resp);
        alert('Autenticación correcta. Revisa la consola para más detalles.');
      },
      error: (err) => {
        console.error('Error de autenticación:', err);
        alert('Error de autenticación. Revisa la consola para más detalles.');
      }
    });
  }

  // Método para cerrar sesión
  logout(): void {
    this.loading = true;
    this.authService.logout().subscribe({
      next: () => {
        this.loading = false;
        this.cerrarModal();
        window.location.reload(); // Recargar para reiniciar el estado de la aplicación
      },
      error: () => {
        this.loading = false;
        this.cerrarModal();
      }
    });
  }

  // Método adicional para verificar la conexión a la API
  verificarConexionAPI(): void {
    const apiUrl = this.authService['apiUrl'].replace('/usuarios', '');
    console.log('🔍 Verificando conexión a:', apiUrl);
    
    this.http.get(apiUrl + '/health', { responseType: 'text' }).subscribe({
      next: (resp) => {
        console.log('✅ API accesible:', resp);
      },
      error: (err) => {
        console.error('❌ API no accesible:', err);
        this.errorMessage = 'No se pudo conectar con el servidor. La aplicación podría estar usando una URL incorrecta.';
      }
    });
  }
}