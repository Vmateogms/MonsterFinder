import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { MonsterService } from '../../services/monster.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MapaComponent } from '../mapa/mapa.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-monster-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './monster-filter.component.html',
  styleUrl: './monster-filter.component.css'
})
export class MonsterFilterComponent implements OnInit, OnDestroy {
  monsters: any[] = [];
  filteredMonsters: any[] = [];
  nombreBusqueda: string = '';
  ordenPrecio: string = 'precioAscendente'; //valor por defecto
  isFilterVisible: boolean = false; 
  useLocation: boolean = true;
  filterEnNevera: boolean = false;

  private mapaComponent: MapaComponent | null = null;
  private subscriptions: Subscription[] = [];

  constructor(private mservice : MonsterService) {}



  ngOnInit(): void {
    // Cargar la lista de monsters disponibles para el selector
      const monsterSub = this.mservice.getAllMonsters().subscribe(data => {
        this.monsters = data;
        console.log('Monsters cargados:', this.monsters);
      });
      this.subscriptions.push(monsterSub);
  }

  toggleFilterPanel(): void {
    this.isFilterVisible = !this.isFilterVisible;
  }

  buscarPorFiltro(): void {
    
    if (this.nombreBusqueda.trim() === '') {
      console.log('Nombre de busqueda vacio');
      return;
    }

    console.log(`Buscando "${this.nombreBusqueda}" ordenado por ${this.ordenPrecio}`);
    const searchSub = this.mservice.filtrarMonsters(this.nombreBusqueda, this.ordenPrecio)
      .subscribe(resultado => {
        console.log('Resultados del filtrado:', resultado);
        this.filteredMonsters = resultado;
        // Emitir evento para actualizar el mapa
        this.mservice.actualizarResultadosFiltrados(resultado);

        // Si hay resultados, cerramos el panel de filtro para mostrar mejor el mapa
        if (resultado && resultado.length > 0) {
          this.isFilterVisible = false;
          
          // Si el usuario tiene la geolocalización activa y hay resultados,
          // buscar la tienda más cercana con este monster
          if (this.useLocation) {
            const mapaComponent = this.mservice.getMapaComponent();
            if (mapaComponent && mapaComponent.userLocation) {
              const monsterId = this.monsters.find(m => m.nombre === this.nombreBusqueda)?.id;
              if (monsterId) {
                const nearestStore = mapaComponent.findNearestStoreWithMonster(monsterId);
                if (nearestStore) {
                  console.log('Tienda más cercana con mejor precio:', nearestStore);
                  mapaComponent.highlightStore(nearestStore);
                  mapaComponent.centerMapOnStore(nearestStore);
                }
              }
            }
          }
        }
      });
      
    this.subscriptions.push(searchSub);
  }

   // Método para seleccionar un monster específico y centrarlo en el mapa
    seleccionarMonster(item: any): void {
    // Emitimos solo este resultado para centrarlo en el mapa
    this.mservice.actualizarResultadosFiltrados([item]);

    const mapaComponent = this.mservice.getMapaComponent();

// Si hay una tienda asociada, la seleccionamos en el mapa
      if (mapaComponent) {
        const tienda = mapaComponent.tiendas.find(t => t.id === item.tiendaId);
        if(tienda) {
          mapaComponent.showTiendaInfo(tienda);
          mapaComponent.centerMapOnStore(tienda);
        }
      }

  }
  ngOnDestroy(): void {
    // Limpiar todas las suscripciones
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

}
