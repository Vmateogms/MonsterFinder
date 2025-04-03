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
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tienda-detail.component.html',
  styleUrl: './tienda-detail.component.css'
})
export class TiendaDetailComponent implements OnInit {
  @Input() tienda!: ITienda;
  @Output() closed = new EventEmitter<void>();

  viewMode: 'view' | 'edit' | 'watch' = 'view';
  allMonsters: IMonster[] = [];
  monsterEditForm!: FormGroup;

  constructor(
    private monsterService: MonsterService,
    private tiendaMonsterService: TiendaMonsterService,
    private tiendaService: TiendaService,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    //?this.monsterEditForm = this.fb.group({});

    // Fetch all available monsters when the component initializes
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
    // Desuscribir cualquier suscripción anterior si existe
    // Esto evitaría suscripciones múltiples
    
    const group: { [key: string]: FormControl } = {};
  
    this.allMonsters.forEach(monster => {
      // Verificar que tienda.monsters existe antes de usarlo
      const isInStore = this.tienda.monsters && 
                        this.tienda.monsters.some(m => m.monster.id === monster.id);
      
      // Control checkbox
      const monsterControl = new FormControl(isInStore || false);
      group[`monster_${monster.id}`] = monsterControl;
  
      // Control precio
      const precioInicial = (isInStore && this.tienda.monsters) ? 
                            this.getExistingPrice(monster.id) : 
                            0;
      const priceControl = new FormControl(
        precioInicial,
        [Validators.min(0)]
      );
      group[`price_${monster.id}`] = priceControl;
  
      // Habilitar o deshabilitar validación según el estado inicial
      if (isInStore) {
        priceControl.setValidators([Validators.required, Validators.min(0)]);
      }
    });
  
    this.monsterEditForm = this.fb.group(group);
    
    // Agregar suscripciones DESPUÉS de crear el formulario completo
    this.allMonsters.forEach(monster => {
      const monsterControl = this.getMonsterControl(monster);
      const priceControl = this.getPriceControl(monster);
      
      if (monsterControl && priceControl) {
        monsterControl.valueChanges.subscribe(checked => {
          if (checked) {
            priceControl.setValidators([Validators.required, Validators.min(0)]);
          } else {
            priceControl.clearValidators();
            priceControl.setValue(null); // Limpiar valor cuando se desmarca
          }
          priceControl.updateValueAndValidity();
        });
      }
    });
  }
//   initForm() {
//     const group: { [key: string]: FormControl } = {};
    
//     this.allMonsters.forEach(monster => {
//         const isInStore = this.tienda.monsters?.some(m => m.monster.id === monster.id);
        
//         group[`monster_${monster.id}`] = new FormControl(isInStore);
//         group[`price_${monster.id}`] = new FormControl(
//             isInStore ? this.getExistingPrice(monster.id) : '', 
//             [Validators.min(0)] // Validator.required se añade dinámicamente
//         );
      
//         // Suscripción a cambios en el checkbox
//         this.getMonsterControl(monster).valueChanges.subscribe(checked => {
//             const priceControl = this.getPriceControl(monster);
//             if (checked) {
//                 priceControl.setValidators([Validators.required, Validators.min(0)]);
//             } else {
//                 priceControl.clearValidators();
//             }
//             priceControl.updateValueAndValidity();
//         });
//     });
    
//     this.monsterEditForm = this.fb.group(group);
// }

  // // Initialize the form with dynamic form controls
  // initForm() {
  //   // Create an object to hold form controls dynamically
  //   const group: { [key: string]: FormControl } = {};
    
  //   // For each available monster, create form controls
  //   this.allMonsters.forEach(monster => {
  //     // Check if this monster is already in the store
  //     const isInStore = this.tienda.monsters.some(m => m.monster.id === monster.id);
  //     // Create a checkbox control for monster selection
  //     group[`monster_${monster.id}`] = new FormControl(isInStore);
      
  //     // Create a price control for the monster
  //     group[`price_${monster.id}`] = new FormControl(
  //       isInStore ? this.getExistingPrice(monster.id) : '', 
  //       [Validators.min(0), Validators.required]
  //     );
  //   });

  //   // Create the form group with all dynamic controls
  //   this.monsterEditForm = this.fb.group(group);
    
  // }

  // Helper method to get existing price for a monster in this store
  getExistingPrice(monsterId: number): number {
    const existingMonster = this.tienda.monsters.find(m => m.monster.id === monsterId);
    return existingMonster ? existingMonster.precio : 0;
  }

  // Get the checkbox control for a specific monster
  getMonsterControl(monster: IMonster): FormControl {
    return this.monsterEditForm.get(`monster_${monster.id}`) as FormControl;
  }

  // Get the price control for a specific monster
  getPriceControl(monster: IMonster): FormControl {
    return this.monsterEditForm.get(`price_${monster.id}`) as FormControl;
  }

  getPresenceControl(monster: IMonster): FormControl {
    return this.monsterEditForm.get(`present_${monster.id}`) as FormControl;
  }

  // Save the updated monsters for this store
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
                      
        return {
          monsterId: monster.id,
          precio: precio
        };
      });
  
    console.log('Datos a enviar al servidor:', updates);
  
    // Verificar que hay datos a enviar
    if (updates.length === 0) {
      console.log('No hay monsters seleccionados para actualizar');
      this.viewMode = 'view';
      return;
    }
  
    // Enviar actualización al backend
    this.tiendaMonsterService.updateTiendaMonsters(this.tienda.id, updates)
      .subscribe({
        next: (updatedTienda) => {
          this.tienda = updatedTienda || this.tienda;
          this.viewMode = 'view';
          this.reloadTiendaData(); // Forzar recarga
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


  // Switch to edit mode
  switchToEditMode() {
    this.viewMode = 'edit';
  }

  switchToWatchMode(){
    this.viewMode = 'watch';
  }

  // Cancel editing and return to view mode
  cancelEdit() {
    this.viewMode = 'view';
    // Optionally reset the form to original state
    this.initForm();
  }

  // Close the entire detail view
  close() {
    this.closed.emit();
  }

  reloadTiendaData() {
    this.tiendaService.getTiendaById(this.tienda.id).subscribe({
      next: (updateTienda) => {
        this.tienda = updateTienda;
        this.initForm();
      },
      error: (err) => {
        console.error('Error al cargar los datos de la tienda', err);
      }
    });
  }

}