// src/app/components/user-profile/user-profile.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { IUsuario } from '../../../interfaces/iusuario';
import { IFavorito } from '../../../interfaces/IFavorito';
import { MonsterService } from '../../../services/monster.service';
import { TiendaService } from '../../../services/tienda.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit, OnDestroy {
  usuario: IUsuario | null = null;
  favoritos: IFavorito[] = [];
  mostrarPerfil = false;
  isLoading = false;
  errorMensaje = '';
  nivelAnterior: number = 0;
  xpAnterior: number = 0;
  mostrandoAnimacionNivel: boolean = false;
  private userSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private monsterService: MonsterService,
    private tiendaService: TiendaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarPerfilUsuario();
    
    // Suscribirse a cambios en el usuario actual
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      if (user && this.usuario) {
        // Si el usuario ya estaba cargado, verificar si hay cambios en XP o nivel
        if (this.usuario.experiencia !== user.experiencia || this.usuario.nivel !== user.nivel) {
          this.xpAnterior = this.usuario.experiencia;
          this.nivelAnterior = this.usuario.nivel;
          
          // Actualizar el usuario
          this.usuario = user;
          
          // Mostrar animación de cambio si aumentó
          if (user.experiencia > this.xpAnterior) {
            this.animarCambioXP();
          }
          if (user.nivel > this.nivelAnterior) {
            this.animarSubidaNivel();
          }
        } else {
          // Simple actualización sin animación
          this.usuario = user;
        }
      } else {
        this.usuario = user;
        if (user) {
          this.xpAnterior = user.experiencia;
          this.nivelAnterior = user.nivel;
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  abrirPerfil(): void {
    // Verificar autenticación antes de abrir el perfil
    if (!this.authService.isLoggedIn) {
      console.warn('⚠️ Intentando abrir perfil sin estar autenticado');
      this.errorMensaje = 'Debes iniciar sesión primero';
      return;
    }

    this.mostrarPerfil = true;
    this.errorMensaje = '';
    this.cargarFavoritos();
    this.actualizarPerfil();
  }

  cerrarPerfil(): void {
    this.mostrarPerfil = false;
  }

  logout(): void {
    this.isLoading = true;
    this.authService.logout().subscribe({
      next: () => {
        this.isLoading = false;
        this.cerrarPerfil();
        this.router.navigate(['/']);
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  cargarFavoritos(): void {
    this.isLoading = true;
    console.log('🔍 Cargando favoritos...');

    this.authService.obtenerFavoritos().subscribe({
      next: (favoritos) => {
        this.favoritos = favoritos;
        this.isLoading = false;
        console.log(`✅ ${favoritos.length} favoritos cargados correctamente`);
      },
      error: (error) => {
        console.error('❌ Error al cargar favoritos:', error);
        this.isLoading = false;
        this.errorMensaje = 'No se pudieron cargar los favoritos';
      }
    });
  }

  actualizarPerfil(): void {
    console.log('🔄 Actualizando datos del perfil...');
    this.authService.obtenerPerfil().subscribe({
      next: (perfil) => {
        console.log('✅ Perfil actualizado correctamente');
      },
      error: (error) => {
        console.error('❌ Error al actualizar perfil:', error);
        this.errorMensaje = 'No se pudo actualizar el perfil';
      }
    });
  }

  calcularXpRestante(): number {
    if (!this.usuario) return 0;
    
    const nivelActual = this.usuario.nivel;
    const xpTotal = this.usuario.experiencia;
    
    // Utilizando la fórmula de ExperienciaUtils del backend
    const xpNivelActual = 10000 * ((nivelActual - 1) * (nivelActual - 1));
    const xpSiguienteNivel = 10000 * (nivelActual * nivelActual);
    
    return xpSiguienteNivel - xpTotal;
  }

  // Método para centrar el mapa en una tienda favorita
  ubicarTiendaEnMapa(favorito: IFavorito): void {
    // Cerrar el perfil
    this.cerrarPerfil();
    
    const mapaComponent = this.monsterService.getMapaComponent();
    if (mapaComponent) {
      console.log('🔍 Ubicando tienda en mapa:', favorito.nombre);
      
      // Obtener los datos completos de la tienda
      this.isLoading = true;
      this.tiendaService.getTiendaById(favorito.id).subscribe({
        next: (tiendaCompleta) => {
          this.isLoading = false;
          
          // Centrar el mapa en la tienda
          mapaComponent.centerMapOnStore(tiendaCompleta);
          
          // Resaltar la tienda y mostrar su información
          mapaComponent.highlightStore(tiendaCompleta);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('❌ Error al cargar datos de la tienda favorita:', error);
          
          // Si falla, usar los datos básicos que tenemos del favorito
          const tiendaBasica = {
            id: favorito.id,
            nombre: favorito.nombre,
            latitud: favorito.latitud,
            longitud: favorito.longitud,
            monsters: []
          };
          
          mapaComponent.centerMapOnStore(tiendaBasica);
          mapaComponent.highlightStore(tiendaBasica);
        }
      });
    }
  }

  // Método de diagnóstico
  verificarEstadoAuth(): void {
    console.group('🔍 Diagnóstico de autenticación en perfil');
    console.log('¿Usuario autenticado?', this.authService.isLoggedIn);
    console.log('Usuario actual:', this.usuario);
    console.log('Token en localStorage:', localStorage.getItem('token') ? 'Presente' : 'No existe');
    console.groupEnd();
    
    this.authService.verificarAutenticacion().subscribe({
      next: (resp) => {
        console.log('✅ Verificación exitosa desde perfil:', resp);
        alert('Autenticación correcta. La sesión está activa.');
      },
      error: (err) => {
        console.error('❌ Error de verificación desde perfil:', err);
        alert('Error de autenticación. Revisa la consola para más detalles.');
      }
    });
  }

  cargarPerfilUsuario(): void {
    this.authService.obtenerPerfil().subscribe({
      next: (usuario) => {
        console.log('Perfil de usuario cargado:', usuario);
        this.usuario = usuario;
        this.xpAnterior = usuario.experiencia;
        this.nivelAnterior = usuario.nivel;
      },
      error: (err) => {
        console.error('Error al cargar perfil:', err);
        this.router.navigate(['/login']);
      }
    });
  }

  animarCambioXP(): void {
    // Calcular la ganancia real
    const xpGanada = this.usuario!.experiencia - this.xpAnterior;
    
    // Crear un elemento para mostrar la ganancia de XP
    const xpGainEl = document.createElement('div');
    xpGainEl.className = 'xp-gain-animation';
    xpGainEl.textContent = `+${xpGanada > 0 ? xpGanada : 1000} XP`;
    
    // Agregar estilos
    xpGainEl.style.position = 'absolute';
    xpGainEl.style.top = '50%';
    xpGainEl.style.left = '50%';
    xpGainEl.style.transform = 'translate(-50%, -50%)';
    xpGainEl.style.fontSize = '24px';
    xpGainEl.style.fontWeight = 'bold';
    xpGainEl.style.color = '#4CAF50';
    xpGainEl.style.opacity = '0';
    xpGainEl.style.animation = 'xpFadeInOut 2s forwards';
    
    // Crear el keyframe para la animación
    const style = document.createElement('style');
    style.textContent = `
      @keyframes xpFadeInOut {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        20% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
        80% { opacity: 1; transform: translate(-50%, -70%) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -100%) scale(0.8); }
      }
    `;
    
    // Obtener el contenedor de estadísticas para añadir la animación
    const statsContainer = document.querySelector('.stats-container');
    if (statsContainer) {
      statsContainer.appendChild(xpGainEl);
      document.head.appendChild(style);
      
      // Eliminar después de la animación
      setTimeout(() => {
        statsContainer.removeChild(xpGainEl);
      }, 2000);
    }
  }
  
  animarSubidaNivel(): void {
    this.mostrandoAnimacionNivel = true;
    
    // Crear overlay de nivel
    const levelUpOverlay = document.createElement('div');
    levelUpOverlay.className = 'level-up-overlay';
    
    // Establecer estilos
    levelUpOverlay.style.position = 'fixed';
    levelUpOverlay.style.top = '0';
    levelUpOverlay.style.left = '0';
    levelUpOverlay.style.width = '100%';
    levelUpOverlay.style.height = '100%';
    levelUpOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    levelUpOverlay.style.display = 'flex';
    levelUpOverlay.style.flexDirection = 'column';
    levelUpOverlay.style.justifyContent = 'center';
    levelUpOverlay.style.alignItems = 'center';
    levelUpOverlay.style.zIndex = '2000';
    levelUpOverlay.style.animation = 'fadeIn 0.5s forwards';
    
    // Contenido
    levelUpOverlay.innerHTML = `
      <div class="level-up-content" style="text-align: center; padding: 30px; background-color: rgba(76, 175, 80, 0.9); border-radius: 15px; transform: scale(0.8); animation: scaleIn 0.5s forwards 0.3s;">
        <img src="assets/monsterconducir.png" alt="Monster" style="width: 100px; height: 100px; margin-bottom: 20px;">
        <h2 style="color: white; font-size: 32px; margin: 0 0 10px;">¡SUBIDA DE NIVEL!</h2>
        <p style="color: white; font-size: 24px; margin: 0 0 20px;">Has alcanzado el nivel ${this.usuario?.nivel}</p>
        <p style="color: white; font-size: 18px;">Sigue explorando para desbloquear más logros</p>
        <button class="close-level-up" style="margin-top: 20px; padding: 10px 20px; background-color: white; color: #4CAF50; border: none; border-radius: 5px; font-weight: bold; cursor: pointer;">CONTINUAR</button>
      </div>
    `;
    
    // Crear estilos para las animaciones
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes scaleIn {
        from { transform: scale(0.8); }
        to { transform: scale(1); }
      }
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(levelUpOverlay);
    
    // Agregar evento al botón
    const closeButton = levelUpOverlay.querySelector('.close-level-up');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        levelUpOverlay.style.animation = 'fadeOut 0.5s forwards';
        setTimeout(() => {
          document.body.removeChild(levelUpOverlay);
          this.mostrandoAnimacionNivel = false;
        }, 500);
      });
    }
  }

  calcularPorcentajeNivel(): number {
    if (!this.usuario) return 0;
    
    // Implementación basada en ExperienciaUtils del backend
    const nivelActual = this.usuario.nivel;
    const xpTotal = this.usuario.experiencia;
    
    // Valores de XP según la tabla de ExperienciaUtils
    const XP_POR_NIVEL = [
      0,      // Nivel 0 (no usado)
      1000,   // Nivel 1
      2000,   // Nivel 2
      5000,   // Nivel 3
      8000,   // Nivel 4
      12000,  // Nivel 5
      16000,  // Nivel 6
      20000,  // Nivel 7
      25000,  // Nivel 8
      30000,  // Nivel 9
      40000,  // Nivel 10
      50000,  // Nivel 11
      60000,  // Nivel 12
      70000,  // Nivel 13
      85000,  // Nivel 14
      100000, // Nivel 15
      120000, // Nivel 16
      140000, // Nivel 17
      165000, // Nivel 18
      195000, // Nivel 19
      225000  // Nivel 20
    ];
    
    const NIVEL_MAXIMO = 20;
    
    if (nivelActual >= NIVEL_MAXIMO) {
      return 100; // Ya está en nivel máximo
    }
    
    const xpNivelActual = nivelActual > 0 && nivelActual < XP_POR_NIVEL.length ? 
                          XP_POR_NIVEL[nivelActual] : 0;
    const xpSiguienteNivel = nivelActual + 1 < XP_POR_NIVEL.length ? 
                            XP_POR_NIVEL[nivelActual + 1] : XP_POR_NIVEL[NIVEL_MAXIMO];
    
    // Calcular progreso
    const xpNecesarios = xpSiguienteNivel - xpNivelActual;
    const xpConseguidos = xpTotal - xpNivelActual;
    
    // Retornar porcentaje (0-100)
    const porcentaje = Math.floor((xpConseguidos / xpNecesarios) * 100);
    return Math.max(0, Math.min(100, porcentaje));
  }

  // Calcular XP necesaria para el siguiente nivel
  calcularXpSiguienteNivel(): number {
    if (!this.usuario) return 0;
    
    const nivelActual = this.usuario.nivel;
    
    // Valores de XP según la tabla de ExperienciaUtils
    const XP_POR_NIVEL = [
      0,      // Nivel 0 (no usado)
      1000,   // Nivel 1
      2000,   // Nivel 2
      5000,   // Nivel 3
      8000,   // Nivel 4
      12000,  // Nivel 5
      16000,  // Nivel 6
      20000,  // Nivel 7
      25000,  // Nivel 8
      30000,  // Nivel 9
      40000,  // Nivel 10
      50000,  // Nivel 11
      60000,  // Nivel 12
      70000,  // Nivel 13
      85000,  // Nivel 14
      100000, // Nivel 15
      120000, // Nivel 16
      140000, // Nivel 17
      165000, // Nivel 18
      195000, // Nivel 19
      225000  // Nivel 20
    ];
    
    const NIVEL_MAXIMO = 20;
    
    if (nivelActual >= NIVEL_MAXIMO) {
      return XP_POR_NIVEL[NIVEL_MAXIMO]; // Ya está en nivel máximo
    }
    
    return nivelActual + 1 < XP_POR_NIVEL.length ? 
           XP_POR_NIVEL[nivelActual + 1] : XP_POR_NIVEL[NIVEL_MAXIMO];
  }
}