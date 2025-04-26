import { Component, Input, OnInit } from '@angular/core';
import { ITienda } from '../../interfaces/itienda';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IMonster } from '../../interfaces/imonster';
import { MonsterService } from '../../services/monster.service';
import { TiendaMonsterService } from '../../services/tienda-monster.service';

@Component({
  selector: 'app-view-tienda',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './view-tienda.component.html',
  styleUrl: './view-tienda.component.css'
})
export class ViewTiendaComponent implements OnInit{
  @Input() tienda!: ITienda;
  
  viewMode: 'view' | 'edit' = 'view';
  allMonsters: IMonster[] = [];
  monsterEditForm!: FormGroup;

  constructor(
    private monsterService: MonsterService,
    private tiendaMonsterService: TiendaMonsterService,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
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

    if (!this.tienda?.monsters) { 
      console.error('Tienda or monsters is undefined');
      return;
    }

    const group: { [key: string]: FormControl } = {};
    
    this.allMonsters.forEach(monster => {

      const existingMonster = this.tienda.monsters.find(m => m.monster.id === monster.id);
      const isInStore = !!existingMonster;
      
      // crear un nuevo form
      group[`monster_${monster.id}`] = new FormControl(isInStore);
      group[`price_${monster.id}`] = new FormControl(
        isInStore ? this.getExistingPrice(monster.id) : '', 
        [Validators.min(0)]
      );
      group[`discount_${monster.id}`] = new FormControl(
        isInStore ? existingMonster?.descuento : false
      );
      group[`discount_price_${monster.id}`] = new FormControl(
        isInStore && existingMonster.descuento ? existingMonster.precioDescuento : '',
        [Validators.min(0)]
      );
      group[`nevera_${monster.id}`] = new FormControl(
        isInStore ? existingMonster.enNevera : false
      );
    });

    this.monsterEditForm = this.fb.group(group);
  }

  getExistingPrice(monsterId: number): number {
    const existingMonster = this.tienda.monsters.find(m => m.monster.id === monsterId);
    return existingMonster ? existingMonster.precio : 0;
  }

  getMonsterControl(monster: IMonster): FormControl {
    
    return this.monsterEditForm.get(`monster_${monster.id}`) as FormControl;
  }

  getPriceControl(monster: IMonster): FormControl {
    
    return this.monsterEditForm.get(`price_${monster.id}`) as FormControl;
  }

  saveMonsters() {
  const updates = this.allMonsters
    .filter(monster => this.getMonsterControl(monster).value)
    .map(monster => {
      const hasDiscount = this.getDiscountControl(monster).value;
      return {
        monsterId: monster.id,
        precio: this.getPriceControl(monster).value || 0,
        descuento: hasDiscount,
        precioDescuento: hasDiscount ? this.getDiscountPriceControl(monster).value : null,
        enNevera: this.getNeveraControl(monster).value
      };
    });


    this.tiendaMonsterService.updateTiendaMonsters(this.tienda.id, updates)
      .subscribe({
        next: (tiendaActualizada) => {
          
          
          this.tienda = tiendaActualizada ;
          this.viewMode = 'view';
        },
        error: (err) => {
          console.error('Error updating monsters', err);
        }
      });
  }

  switchToEditMode() {
    this.viewMode = 'edit';
  }

  cancelEdit() {
    this.viewMode = 'view';
  }

  getNeveraControl(monster: IMonster): FormControl {
    return this.monsterEditForm.get(`nevera_${monster.id}`) as FormControl;
  }
  
  getDiscountControl(monster: IMonster): FormControl {
    return this.monsterEditForm.get(`discount_${monster.id}`) as FormControl;
  }
  
  getDiscountPriceControl(monster: IMonster): FormControl {
    return this.monsterEditForm.get(`discount_price_${monster.id}`) as FormControl;
  }

}