import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';;

import { TiendaMonsterService } from '../../services/tienda-monster.service';
import { TiendaService } from '../../services/tienda.service';
import { MonsterService } from '../../services/monster.service';

@Component({
  selector: 'app-add-monster-to-tienda',
  standalone: true,
  imports: [],
  templateUrl: './add-monster-to-tienda.component.html',
  styleUrl: './add-monster-to-tienda.component.css'
})
export class AddMonsterToTiendaComponent implements OnInit {
  addMonsterForm: FormGroup;
  tiendas: any[] = [];
  monsters: any[] = [];

  constructor(
    private fb: FormBuilder,
    private TiendaMonsterService: TiendaMonsterService,
    private tiendaService: TiendaService,
    private monsterService: MonsterService
  ) {
    this.addMonsterForm = this.fb.group({
      tiendaId: ['', Validators.required],
      monsterId: ['', Validators.required],
      precio: ['', [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit() {
    // Cargar tiendas y monsters
    this.tiendaService.getTiendas().subscribe(
      tiendas => this.tiendas = tiendas
    );

    this.monsterService.getAllMonsters().subscribe(
      monsters => this.monsters = monsters
    );
  }

  onSubmit() {
    if (this.addMonsterForm.valid) {
      const { tiendaId, monsterId, precio } = this.addMonsterForm.value;
      
      this.TiendaMonsterService.addMonsterToTienda(tiendaId, monsterId, precio)
        .subscribe({
          next: () => {
            alert('Monster añadido a la tienda correctamente');
            this.addMonsterForm.reset();
          },
          error: (err) => {
            console.error('Error al añadir monster:', err);
            alert('Hubo un error al añadir el monster');
          }
        });
    }
  }
}