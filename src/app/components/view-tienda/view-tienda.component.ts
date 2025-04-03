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
    const group: { [key: string]: FormControl } = {};
    
    this.allMonsters.forEach(monster => {
      // Check if the monster is already in the store
      const isInStore = this.tienda.monsters.some(m => m.monster.id === monster.id);
      
      // Create form controls with type safety
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
    // Non-null assertion to handle type safety
    return this.monsterEditForm.get(`monster_${monster.id}`) as FormControl;
  }

  getPriceControl(monster: IMonster): FormControl {
    // Non-null assertion to handle type safety
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
          // Optionally reload or update the tienda data
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