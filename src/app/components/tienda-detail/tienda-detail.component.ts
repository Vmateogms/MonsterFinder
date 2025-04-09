import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ITienda } from '../../interfaces/itienda';
import { CommonModule } from '@angular/common';
import { IMonster } from '../../interfaces/imonster';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MonsterService } from '../../services/monster.service';
import { TiendaMonsterService } from '../../services/tienda-monster.service';
import { TiendaService } from '../../services/tienda.service';

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
    private fb: FormBuilder
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
      
      if (monsterControl && priceControl) {
        monsterControl.valueChanges.subscribe(checked => {
          if (checked) {
            priceControl.setValidators([Validators.required, Validators.min(0)]);
          } else {
            priceControl.clearValidators();
            priceControl.setValue(null); // limpiar valor cuando se desmarca
            discountControl.setValue(false); // resetear descuento también
            discountPriceControl.setValue(null); // resetear precio con descuento
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
        
        //el problema esta aqui
        let precioDescuento: number | null = null;
        if (descuento) {
          const discountPriceValue = this.getDiscountPriceControl(monster)?.value;
          if (discountPriceValue !== null && discountPriceValue !== undefined) {
            precioDescuento = Number(discountPriceValue);
          }
        }

        // if (descuento) {
        //   const discountPriceValue = this.getDiscountPriceControl(monster)?.value;
        //   precioDescuento = discountPriceValue !== null && discountPriceValue !== undefined ?
        //             Number(discountPriceValue) : null; 
        // }
                      
        return {
          monsterId: monster.id,
          precio: precio,
          descuento: descuento,
          precioDescuento: precioDescuento  
        };
      });
      console.log('Updates completos antes de enviar:', JSON.stringify(updates));
    
  
    // verificar que hay datos a enviar
    if (updates.length === 0) {
      console.log('No hay monsters seleccionados para actualizar');
      this.viewMode = 'view';
      return;
    }
  
    // enviar actualización al backend
    this.tiendaMonsterService.updateTiendaMonsters(this.tienda.id, updates)
      .subscribe({
        next: (updatedTienda) => {
          console.log('Tienda actualizada recibida del servidor:', JSON.stringify(updatedTienda));
          this.tienda = updatedTienda || this.tienda;
          this.viewMode = 'view';
          this.reloadTiendaData(); // forzar recarga
          console.log('Actualizado correctamente');
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
          precioDescuento: m.precioDescuento
        })));
        this.tienda = updatedTienda;
        this.initForm();
      },
      error: (err) => {
        console.error('Error al cargar los datos de la tienda', err);
      }
    });
  }
}