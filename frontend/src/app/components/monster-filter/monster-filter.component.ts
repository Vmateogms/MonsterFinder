import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { MonsterService } from '../../services/monster.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MapaComponent } from '../mapa/mapa.component';
import { catchError, finalize, of, Subscription } from 'rxjs';

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
  estaCargando: boolean = false;
  mensajeError: string | null = null;
  autoFocusTienda: boolean = false;

  private mapaComponent: MapaComponent | null = null;
  private subscriptions: Subscription[] = [];

  constructor(private mservice : MonsterService) {}



  ngOnInit(): void {
    // Cargar la lista de monsters disponibles para el selector
    this.estaCargando = true;
    const monsterSub = this.mservice.getAllMonsters().pipe(
      finalize(() => this.estaCargando = false),
      catchError(error => {
        this.mensajeError = "Error cargando la lista de monsters. Por favor, inténtelo de nuevo.";
        console.error('Error al cargar monsters:', error);
        return of([]);
      })
    ).subscribe(data => {
      this.monsters = data;
      console.log('Monsters cargados:', this.monsters);
      this.mensajeError = null;
    });
    
    this.subscriptions.push(monsterSub);
  }

  toggleFilterPanel(): void {
    this.isFilterVisible = !this.isFilterVisible;
  }

  buscarPorFiltro(): void {
    
  this.mensajeError = null;

    if (this.nombreBusqueda.trim() === '') {
      this.mensajeError = "por fabor ingrese un nombre para buscar"
      console.log('Nombre de busqueda vacio');
      return;
    }

    console.log(`Buscando "${this.nombreBusqueda}" ordenado por ${this.ordenPrecio}`);
    const searchSub = this.mservice.filtrarMonsters(this.nombreBusqueda, this.ordenPrecio,this.filterEnNevera)
      .subscribe(resultado => {
        console.log('Resultados del filtrado:', resultado);
        this.filteredMonsters = resultado;
        this.filteredMonsters = resultado.map(item => {

          const mapaComponent = this.mservice.getMapaComponent();
          let storeId = null;
          let distance = null;
          let tienda = null;

          if (mapaComponent) {
            tienda = mapaComponent.tiendas.find(t => 
              t.latitud === item.latitudTienda &&
              t.longitud === item.longitudTienda
            );

            if (tienda) {
              storeId = tienda.id;
              distance = tienda.distance;
              console.log(`Tienda encontrada: ${tienda.nombre} con ID: ${storeId}`);
            }
          }

          return {
            ...item,
            nombreMonster: item.monster?.nombre || item.nombre || item.nombreMonster,
            sabor: item.monster?.sabor || item.sabor,
            oferta: item.descuento,
            enNevera: item.enNevera,
            distancia: tienda?.distance,
            tiendaId: item.tiendaId,
            tienda: tienda
          }
        });
        // Emitir evento para actualizar el mapa
        this.mservice.actualizarResultadosFiltrados(resultado);

        if (this.filteredMonsters.length > 0) {
          this.isFilterVisible = false;
        }
        // Si hay resultados, cerramos el panel de filtro para mostrar mejor el mapa
        if (resultado.length > 0) {
          this.isFilterVisible = false;
          
          // Si el usuario tiene la geolocalización activa y hay resultados,
          // buscar la tienda más cercana con este monster
          if (this.useLocation && this.autoFocusTienda && resultado.length > 0) {
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
    const mapaComponent = this.mservice.getMapaComponent();
    if (!mapaComponent) {
      console.error("No se encontro el componente mapa");
      return;
    }

     // Si tenemos una tienda directamente en el item, usamos esa
    if (item.tienda) {
    console.log('Usando tienda del objeto:', item.tienda);
    mapaComponent.highlightStore(item.tienda);
    mapaComponent.centerMapOnStore(item.tienda);
    mapaComponent.showTiendaInfo(item.tienda);
      return;
    }
      
        const tienda = mapaComponent.tiendas.find(t => t.id === item.tiendaId);
        if(!tienda) {
          console.error("No se encontro la tienda para el monsterId: ", item.tiendaId);
          return;
        }

        this.mservice.actualizarResultadosFiltrados([item]);

          mapaComponent.highlightStore(tienda);
          mapaComponent.centerMapOnStore(tienda);
          mapaComponent.showTiendaInfo(tienda);
        

  }

  cerrarPanelFiltrado(): void {
    this.isFilterVisible = false;
  }

  ngOnDestroy(): void {
    // Limpiar todas las suscripciones
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

}
