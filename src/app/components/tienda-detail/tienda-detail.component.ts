import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ITienda } from '../../interfaces/itienda';
import { CommonModule } from '@angular/common';
import { IMonster } from '../../interfaces/imonster';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MonsterService } from '../../services/monster.service';
import { TiendaMonsterService } from '../../services/tienda-monster.service';
import { TiendaService } from '../../services/tienda.service';
import { AuthService } from '../../services/auth.service';
import { HttpHeaders } from '@angular/common/http';
import { environment } from '../../environment/environment.prod';

@Component({
  selector: 'app-tienda-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule ],
  templateUrl: './tienda-detail.component.html',
  styleUrl: './tienda-detail.component.css'
})
export class TiendaDetailComponent implements OnInit {
  @Input() tienda!: ITienda;
  @Output() closed = new EventEmitter<void>();

  viewMode: 'view' | 'edit' | 'watch' = 'view';
  allMonsters: IMonster[] = [];
  monsterEditForm!: FormGroup;
  isFormSubmitted = false;
  
  constructor(
    private monsterService: MonsterService,
    private tiendaMonsterService: TiendaMonsterService,
    private tiendaService: TiendaService,
    private fb: FormBuilder,
    public authService: AuthService // Hacerlo público para usarlo en el template
  ) {}

  ngOnInit() {
    // fetch todos los monters disponibles
    this.monsterService.getAllMonsters().subscribe({
      next: (monsters) => {
        this.allMonsters = monsters;
        this.initForm();
      },
      error: (err) => {
        console.error('Error fetching monsters', err);
      }
    });
  }

  initForm() {
    // desuscribir cualquier suscripción anterior si existe
    // esto evitaría suscripciones múltiples
    
    const group: { [key: string]: FormControl } = {};
  
    this.allMonsters.forEach(monster => {
      // verificar que tienda.monsters existe antes de usarlo
      const isInStore = this.tienda.monsters && 
                        this.tienda.monsters.some(m => m.monster.id === monster.id);
      
      // control checkbox
      const monsterControl = new FormControl(isInStore || false);
      group[`monster_${monster.id}`] = monsterControl;
  
      // control precio normal
      const precioInicial = (isInStore && this.tienda.monsters) ? 
                            this.getExistingPrice(monster.id) : 
                            0;
      const priceControl = new FormControl(
        precioInicial,
        [Validators.min(0)]
      );
      group[`price_${monster.id}`] = priceControl;
      
      // control descuento checkbox
      const hasDiscountInitial = (isInStore && this.tienda.monsters) ?
                                this.getExistingDiscount(monster.id) :
                                false;
      const discountControl = new FormControl(hasDiscountInitial);
      group[`discount_${monster.id}`] = discountControl;
      
      // control precio con descuento (NUEVO)
      const discountPriceInitial = (isInStore && this.tienda.monsters) ?
                                  this.getExistingDiscountPrice(monster.id) :
                                  0;
      const discountPriceControl = new FormControl(
        discountPriceInitial,
        [Validators.min(0)]
      );
      group[`discount_price_${monster.id}`] = discountPriceControl;

      //control nevera checkbox
      const existeEnNevera = (isInStore && this.tienda) ?
                            this.getExistingNevera(monster.id) :
                            false;
      const neveraControl = new FormControl(existeEnNevera);
      group[`nevera_${monster.id}`] = neveraControl;
  
      if (isInStore) {
        priceControl.setValidators([Validators.required, Validators.min(0)]);
      }
    });
  
    this.monsterEditForm = this.fb.group(group);
    
    // agregar suscripciones despues de crear el formulario completo
    this.allMonsters.forEach(monster => {
      const monsterControl = this.getMonsterControl(monster);
      const priceControl = this.getPriceControl(monster);
      const discountControl = this.getDiscountControl(monster);
      const discountPriceControl = this.getDiscountPriceControl(monster);
      const neveraControl = this.getNeveraControl(monster);

      if (monsterControl && priceControl) {
        monsterControl.valueChanges.subscribe(checked => {
          if (checked) {
            priceControl.setValidators([Validators.required, Validators.min(0)]);
          } else {
            priceControl.clearValidators();
            priceControl.setValue(null); // limpiar valor cuando se desmarca
            discountControl.setValue(false); // resetear descuento también
            discountPriceControl.setValue(null); // resetear precio con descuento
            neveraControl.setValue(false); // nevera en false default
          }
          priceControl.updateValueAndValidity();
        });
      }
      
      // Suscripción para habilitar/deshabilitar el campo de precio con descuento
      if (discountControl && discountPriceControl) {
        discountControl.valueChanges.subscribe(hasDiscount => {
          if (hasDiscount) {
            discountPriceControl.setValidators([Validators.required, Validators.min(0)]);
          } else {
            discountPriceControl.clearValidators();
            discountPriceControl.setValue(null);
          }
          discountPriceControl.updateValueAndValidity();
        });
      }
    });
  }

  // metodo para conseguir un precio ya existente
  getExistingPrice(monsterId: number): number {
    const existingMonster = this.tienda.monsters.find(m => m.monster.id === monsterId);
    return existingMonster ? existingMonster.precio : 0;
  }
  
  // método para obtener el valor de descuento existente
  getExistingDiscount(monsterId: number): boolean {
    const existingMonster = this.tienda.monsters.find(m => m.monster.id === monsterId);
    return existingMonster ? (existingMonster.descuento || false) : false;
  }
  
  // método para obtener el precio con descuento existente (NUEVO)
  getExistingDiscountPrice(monsterId: number): number {
    const existingMonster = this.tienda.monsters.find(m => m.monster.id === monsterId);
    return existingMonster && existingMonster.precioDescuento ? existingMonster.precioDescuento : 0;
  }

  getExistingNevera(monsterId: number): boolean {
    const existingMonster = this.tienda.monsters.find(m => m.monster.id === monsterId);
    return existingMonster ? (existingMonster.enNevera || false): false;
  }

  // control del checkbox
  getMonsterControl(monster: IMonster): FormControl {
    return this.monsterEditForm.get(`monster_${monster.id}`) as FormControl;
  }

  getPriceControl(monster: IMonster): FormControl {
    return this.monsterEditForm.get(`price_${monster.id}`) as FormControl;
  }
  
  // obtener control de descuento
  getDiscountControl(monster: IMonster): FormControl {
    return this.monsterEditForm.get(`discount_${monster.id}`) as FormControl;
  }
  
  // obtener control de precio con descuento (NUEVO)
  getDiscountPriceControl(monster: IMonster): FormControl {
    return this.monsterEditForm.get(`discount_price_${monster.id}`) as FormControl;
  }

  getNeveraControl(monster: IMonster): FormControl {
    return this.monsterEditForm.get(`nevera_${monster.id}`) as FormControl;
  }

  // Guardar los monstersa actualizados para la tienda
  saveMonsters() {
    // Validar el formulario
    if (this.monsterEditForm.invalid) {
      Object.keys(this.monsterEditForm.controls).forEach(key => {
        const control = this.monsterEditForm.get(key);
        control?.markAsTouched();
      });
      return;
    }
  
    // Filtrar monsters seleccionados y asegurar que los datos son válidos
    const updates = this.allMonsters
      .filter(monster => {
        const control = this.getMonsterControl(monster);
        return control && control.value === true;
      })
      .map(monster => {
        const priceValue = this.getPriceControl(monster)?.value;
        const precio = priceValue !== null && priceValue !== undefined ? 
                      Number(priceValue) : 0;
        
        const descuento = this.getDiscountControl(monster)?.value || false;
        
        let precioDescuento: number | null = null;
        if (descuento) {
          const discountPriceValue = this.getDiscountPriceControl(monster)?.value;
          if (discountPriceValue !== null && discountPriceValue !== undefined) {
            precioDescuento = Number(discountPriceValue);
          }
        }

        const enNevera = this.getNeveraControl(monster)?.value || false;
                      
        return {
          monsterId: monster.id,
          precio: precio,
          descuento: descuento,
          precioDescuento: precioDescuento,
          enNevera: enNevera
        };
      });
    
    console.log('Updates completos antes de enviar:', JSON.stringify(updates));
    
    // verificar que hay datos a enviar
    if (updates.length === 0) {
      console.log('No hay monsters seleccionados para actualizar');
      this.viewMode = 'view';
      return;
    }
    
    // Determinar si se están añadiendo productos nuevos o actualizando existentes
    const tiendaActual = this.tienda;
    const monstersActuales = tiendaActual.monsters || [];
    const monstersActualesIds = monstersActuales.map((m: any) => m.monster.id);
    
    // Encontrar productos nuevos añadidos (no existían antes)
    const productosNuevos = updates.filter(update => 
      !monstersActualesIds.includes(update.monsterId)
    );
    
    // Encontrar productos cuyo precio ha cambiado (existían antes)
    const productosActualizados = updates.filter(update => {
      const monsterExistente = monstersActuales.find((m: any) => m.monster.id === update.monsterId);
      return monsterExistente && 
             (monsterExistente.precio !== update.precio || 
              monsterExistente.descuento !== update.descuento ||
              monsterExistente.precioDescuento !== update.precioDescuento ||
              monsterExistente.enNevera !== update.enNevera);
    });
  
    // enviar actualización al backend
    this.tiendaMonsterService.updateTiendaMonsters(this.tienda.id, updates)
      .subscribe({
        next: (updatedTienda) => {
          console.log('Tienda actualizada recibida del servidor:', JSON.stringify(updatedTienda));
          this.tienda = updatedTienda || this.tienda;
          this.viewMode = 'view';
          this.reloadTiendaData(); // forzar recarga
          console.log('Actualizado correctamente');

          // Solicitar recompensas si el usuario está autenticado
          if (this.authService.isLoggedIn) {
            // Primero procesamos nuevos productos
            if (productosNuevos.length > 0) {
              console.log(`${productosNuevos.length} productos nuevos añadidos`);
              this.solicitarRecompensaExperiencia(this.tienda.id, 'AÑADIR_PRODUCTO', 300 * productosNuevos.length)
                .then(() => {
                  this.mostrarNotificacionExperiencia(300 * productosNuevos.length, 'añadir productos');
                });
            }
            
            // Luego procesamos actualizaciones de precio
            if (productosActualizados.length > 0) {
              console.log(`${productosActualizados.length} productos actualizados`);
              this.solicitarRecompensaExperiencia(this.tienda.id, 'ACTUALIZACION_PRECIO', 200 * productosActualizados.length)
                .then(() => {
                  if (productosNuevos.length === 0) { // Si ya mostramos notificación para nuevos productos, no mostramos otra
                    this.mostrarNotificacionExperiencia(200 * productosActualizados.length, 'actualizar precios');
                  }
                });
            }
          }
        },
        error: (err) => {
          console.error('Error completo:', err);
          let errorMessage = 'Error desconocido';
          
          if (err.error && typeof err.error === 'object') {
            errorMessage = err.error.message || JSON.stringify(err.error);
          } else if (typeof err.error === 'string') {
            errorMessage = err.error;
          } else if (err.message) {
            errorMessage = err.message;
          }
          
          alert('Error al guardar: ' + errorMessage);
        }
      });
  }

  // Método para solicitar explícitamente la recompensa
  private solicitarRecompensaExperiencia(tiendaId: number, accion: string, experiencia: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `${environment.apiUrl}/usuarios/recompensa`;
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      });
      
      const payload = {
        accion: accion,
        tiendaId: tiendaId,
        experiencia: experiencia
      };
      
      console.log(`🏆 Solicitando recompensa de experiencia (${accion}):`, payload);
      
      this.authService['http'].post(url, payload, { headers }).subscribe({
        next: (response: any) => {
          console.log('✅ Recompensa procesada:', response);
          
          // Actualizar el perfil para reflejar los cambios de experiencia
          this.authService.obtenerPerfil().subscribe({
            next: (usuario) => {
              console.log('Perfil actualizado después de recompensa:', usuario);
            }
          });
          
          resolve();
        },
        error: (error: any) => {
          console.error('❌ Error al procesar recompensa:', error);
          // Resolvemos de todas formas para continuar el flujo
          resolve();
        }
      });
    });
  }
  
  // Método para mostrar una notificación de experiencia ganada
  private mostrarNotificacionExperiencia(xp: number, accion: string): void {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = 'xp-notification';
    notification.innerHTML = `
      <div class="xp-notification-content">
        <img src="assets/monsterconducir.png" alt="Monster" class="xp-icon">
        <div class="xp-text">
          <span class="xp-title">¡Experiencia ganada!</span>
          <span class="xp-value">+${xp} XP por ${accion}</span>
        </div>
      </div>
    `;
    
    // Añadir estilos inline para la notificación
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.backgroundColor = '#4CAF50';
    notification.style.color = 'white';
    notification.style.padding = '10px 15px';
    notification.style.borderRadius = '10px';
    notification.style.boxShadow = '0 3px 10px rgba(0,0,0,0.2)';
    notification.style.zIndex = '2000';
    notification.style.display = 'flex';
    notification.style.alignItems = 'center';
    notification.style.animation = 'slideIn 0.5s forwards, fadeOut 0.5s 3.5s forwards';
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(50px)';
    
    // Crear estilos para la animación
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { opacity: 0; transform: translateX(50px); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes fadeOut {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(50px); }
      }
      .xp-notification-content {
        display: flex;
        align-items: center;
      }
      .xp-icon {
        width: 40px;
        height: 40px;
        margin-right: 10px;
      }
      .xp-text {
        display: flex;
        flex-direction: column;
      }
      .xp-title {
        font-weight: bold;
        margin-bottom: 2px;
      }
      .xp-value {
        font-size: 14px;
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(notification);
    
    // Eliminar la notificación después de 4 segundos
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 4000);
  }

  toggleFavorito(): void {
    if(!this.authService.isLoggedIn){
      alert('Debes iniciar sesion para agregar favoritos');
      return;
    }

    const tiendaId = this.tienda.id;
    const esFavorita = (this.tienda as any).esFavorita;


    if(esFavorita) {
      this.authService.eliminarFavorito(tiendaId).subscribe({
        next: () => {
          (this.tienda as any).esFavorita = false;
        },
        error: (err) => {
          console.error('Error al eliminar favorito' , err);
          alert('Error al eliminar de favoritos');
        }
      });
    } else {
      this.authService.agregarFavorito(tiendaId).subscribe({
        next: () => {
          (this.tienda as any).esFavorita = true;
        },
        error: (err) => {
          console.error('Error al agregar a favoritos', err);
          alert('Error al agregar a favoritos');
        }
      });
    }

  }

  // cambiar a modo edicion
  switchToEditMode() {
    this.viewMode = 'edit';
  }

  switchToWatchMode(){
    this.viewMode = 'watch';
  }

  // cancelar el modo edicion y voler a vista 
  cancelEdit() {
    this.viewMode = 'view';
    // opcionalmente resestear el form 
    this.isFormSubmitted = false;
    this.initForm();
  }

  //cerrar el ver detalle entero
  close() {
    this.closed.emit();
  }

  reloadTiendaData() {
    this.tiendaService.getTiendaById(this.tienda.id).subscribe({
      next: (updatedTienda) => {
        console.log('Updated tienda full data:', JSON.stringify(updatedTienda));
        console.log('Monster data samples:', updatedTienda.monsters.map(m => ({
          id: m.monster.id,
          name: m.monster.nombre,
          precio: m.precio,
          descuento: m.descuento,
          precioDescuento: m.precioDescuento,
          enNevera: m.enNevera
        })));
        this.tienda = updatedTienda;
        this.initForm();
      },
      error: (err) => {
        console.error('Error al cargar los datos de la tienda', err);
      }
    });
  }

  // Método para verificar si la tienda es favorita
  isFavorito(): boolean {
    if (!this.tienda) return false;
    // Usamos tipo indexado y verificamos que sea booleano
    const favorito = 'esFavorita' in this.tienda ? this.tienda['esFavorita'] : false;
    return typeof favorito === 'boolean' ? favorito : false;
  }
}