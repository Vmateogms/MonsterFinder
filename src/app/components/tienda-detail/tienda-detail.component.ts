import { Component, EventEmitter, Input, OnInit, Output, OnDestroy } from '@angular/core';
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
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tienda-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule ],
  templateUrl: './tienda-detail.component.html',
  styleUrl: './tienda-detail.component.css'
})
export class TiendaDetailComponent implements OnInit, OnDestroy {
  @Input() tienda!: ITienda;
  @Output() closed = new EventEmitter<void>();

  viewMode: 'view' | 'edit' | 'watch' = 'view';
  allMonsters: IMonster[] = [];
  monsterEditForm!: FormGroup;
  isFormSubmitted = false;
  private xpSubscription: Subscription | null = null;
  
  constructor(
    private monsterService: MonsterService,
    private tiendaMonsterService: TiendaMonsterService,
    private tiendaService: TiendaService,
    private fb: FormBuilder,
    public authService: AuthService // Hacerlo público para usarlo en el template
  ) {}

  ngOnInit() {
    console.log('TiendaDetailComponent inicializado con tienda:', this.tienda);
    
    // Cargar todos los monsters disponibles
    this.monsterService.getAllMonsters().subscribe(monsters => {
      this.allMonsters = monsters;
      this.initForm();
    });

    // Suscribirse a notificaciones de XP
    this.xpSubscription = this.tiendaService.xpNotification$.subscribe(notification => {
      if (notification) {
        this.mostrarNotificacionExperiencia(notification.xpGanada, notification.mensaje);
      }
    });
  }

  ngOnDestroy() {
    // Cancelar suscripciones para evitar memory leaks
    if (this.xpSubscription) {
      this.xpSubscription.unsubscribe();
    }
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
    if (!this.authService.isLoggedIn) {
      alert('Debes iniciar sesión para editar la tienda.');
      return;
    }
    
    this.isFormSubmitted = true;
    
    // Validar el formulario
    if (this.monsterEditForm.invalid) {
      console.error('Formulario inválido');
      return;
    }
    
    // Obtener monsters seleccionados y sus precios
    const monsterUpdates = this.allMonsters
      .filter(monster => this.getMonsterControl(monster).value)
      .map(monster => {
        const precio = this.getPriceControl(monster).value;
        const descuento = this.getDiscountControl(monster).value;
        const precioDescuento = descuento ? this.getDiscountPriceControl(monster).value : null;
        const enNevera = this.getNeveraControl(monster).value;
        
        return {
          monsterId: monster.id,
          precio: precio,
          descuento: descuento,
          precioDescuento: precioDescuento,
          enNevera: enNevera
        };
      });
    
    if (monsterUpdates.length === 0) {
      alert('Debes seleccionar al menos un producto.');
      return;
    }
    
    console.log('Actualizando productos:', monsterUpdates);
    
    // Usar el método actualizado en tiendaService
    this.tiendaService.updateTiendaMonsters(this.tienda.id, monsterUpdates).subscribe({
      next: (tiendaActualizada) => {
        console.log('Tienda actualizada correctamente:', tiendaActualizada);
        this.tienda = tiendaActualizada;
        this.viewMode = 'view';
      },
      error: (error) => {
        console.error('Error al actualizar tienda:', error);
        alert(`Error: ${error.message}`);
      }
    });
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

  // Método para mostrar notificaciones de XP
  private mostrarNotificacionExperiencia(xp: number, mensaje: string): void {
    // Eliminar notificación anterior si existe
    const existingNotification = document.querySelector('.xp-notification');
    if (existingNotification) {
      document.body.removeChild(existingNotification);
    }
    
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = 'xp-notification';
    notification.innerHTML = `
      <div class="xp-notification-content">
        <img src="assets/monsterconducir.png" alt="Monster" class="xp-icon">
        <div class="xp-text">
          <span class="xp-title">${xp > 0 ? '¡Experiencia ganada!' : 'Límite de XP'}</span>
          <span class="xp-message">${mensaje}</span>
        </div>
      </div>
    `;
    
    // Añadir estilos inline para la notificación
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.backgroundColor = xp > 0 ? '#4CAF50' : '#FF9800';
    notification.style.color = 'white';
    notification.style.padding = '15px';
    notification.style.borderRadius = '10px';
    notification.style.boxShadow = '0 3px 10px rgba(0,0,0,0.2)';
    notification.style.zIndex = '2000';
    notification.style.display = 'flex';
    notification.style.alignItems = 'center';
    notification.style.minWidth = '300px';
    notification.style.maxWidth = '400px';
    notification.style.animation = 'slideIn 0.5s forwards, fadeOut 0.5s 4.5s forwards';
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
        width: 100%;
      }
      .xp-icon {
        width: 40px;
        height: 40px;
        margin-right: 15px;
      }
      .xp-text {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
      }
      .xp-title {
        font-weight: bold;
        font-size: 16px;
        margin-bottom: 5px;
      }
      .xp-message {
        font-size: 14px;
        line-height: 1.4;
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(notification);
    
    // Eliminar la notificación después de 5 segundos
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 5000);
  }
}