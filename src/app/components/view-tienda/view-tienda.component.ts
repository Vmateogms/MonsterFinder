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
      // comprobar si la monster esta ya en la tienda
      const isInStore = this.tienda.monsters.some(m => m.monster.id === monster.id);
      
      // crear un nuevo form
      group[`monster_${monster.id}`] = new FormControl(isInStore);
      group[`price_${monster.id}`] = new FormControl(
        isInStore ? this.getExistingPrice(monster.id) : '', 
        [Validators.min(0)]
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
      .map(monster => ({
        monsterId: monster.id,
        precio: this.getPriceControl(monster).value || 0
      }));

    this.tiendaMonsterService.updateTiendaMonsters(this.tienda.id, updates)
      .subscribe({
        next: () => {
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
}