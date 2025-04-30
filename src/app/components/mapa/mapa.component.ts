import { Component, AfterViewInit, OnInit } from '@angular/core';
import { ITienda } from '../../interfaces/itienda';
import L, { LatLng, latLng, LeafletMouseEvent, Map, map, marker, tileLayer,  Icon, DivIcon } from 'leaflet';
import { TiendaDetailComponent } from "../tienda-detail/tienda-detail.component";
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { CommonModule } from '@angular/common';
import { TiendaService } from '../../services/tienda.service'; 
import { catchError, of, Subscription } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AddtiendaComponent } from "../addtienda/addtienda.component";
import { CommunicationService } from '../../services/communication.service';
import { MonsterService } from '../../services/monster.service';
import { ModalBienvenidaComponent } from "../modal-bienvenida/modal-bienvenida.component";
import { MonsterFilterComponent } from "../monster-filter/monster-filter.component";


@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [TiendaDetailComponent, LeafletModule, CommonModule, AddtiendaComponent, ModalBienvenidaComponent, MonsterFilterComponent],
  templateUrl: './mapa.component.html',
  styleUrl: './mapa.component.css'
})
export class MapaComponent implements OnInit, AfterViewInit{

private map! : Map;
private markers: L.Marker[] = [];
userLocationMarker: L.Marker | null = null;
private highlightedMarker: L.Marker | L.CircleMarker | null = null;
selectedTienda: ITienda | null = null;
tiendas: any[] = [];
addStoreForm!: FormGroup;
nearestStores: ITienda[] = [];
isLocating: boolean = false;
userLocation: LatLng | null = null;
watchId: number | null = null;
filteredResultsSubscription: Subscription | null = null;
panelVisible: boolean = false; 
tiendasCercanas = true; 
mapaInicializado = false;
mapaInitPromesa: Promise<void> | null = null;
ultimoMarkerClickeado: L.Marker | null = null;

constructor (
  private tiendaService: TiendaService, 
  private fb: FormBuilder, 
  private cservice: CommunicationService, 
  private mService: MonsterService) 
  {
    this.mapaInitPromesa = new Promise<void>((resolve) => {
      this.mapaInitResolver = resolve;
    })
  }

  private mapaInitResolver!: (value: void | PromiseLike<void>) => void;

//Cordenadas Santander
private initialCoords: LatLng = latLng(43.4628, -3.8050);
  private initialZoom = 15;

  mostrarModalBienvenida = true;

  cerrarModalBienvenida(): void {
    this.mostrarModalBienvenida = false;
    //guardar en el localStorage asi no se muestra otra vez para el mismo user 
    localStorage.setItem('modalBienvenidaMostrado', 'true');
  }



  ngOnInit(): void {
    this.addStoreForm = this.fb.group({
      latitud: ['', Validators.required],
      longitud: ['', Validators.required]
    })
    
    this.cservice.updateMap$.subscribe(() => this.cargarTiendas());
    this.mService.registerMapaComponent(this);
     // Suscribirse a resultados filtrados
     this.filteredResultsSubscription = this.mService.resultadosFiltrado$.subscribe(
      results => this.handleFilteredResults(results)
    );
    const modalBienvenidaMostrado = localStorage.getItem('modalBienvenidaMostrado');
    this.mostrarModalBienvenida = modalBienvenidaMostrado !== 'true';

    //ajustes visuales
    this.ajustarAlturaMapa();
    window.addEventListener('resize', this.ajustarAlturaMapa.bind(this))

    this.cargarTiendas();
  }

  handleFilteredResults(results: any[]): void {
    if (!results || results.length === 0) return;
    
    // Si hay resultados, encontrar las tiendas correspondientes y resaltarlas
    const storeIds = [...new Set(results.map(r => r.tiendaId))];
    
    // Eliminar cualquier resaltado anterior
    this.clearHighlights();

    if (!this.mapaInicializado) return;
    
    if(!this.mapaInicializado) {
     this.mapaInitPromesa?.then(() => {
      this.highlightTiendasFiltradas(storeIds, results)
     }) ;
     return;
    }
  }

  highlightTiendasFiltradas(storeIds: any[], results: any[]): void {
     // Resaltar las tiendas en los resultados
    storeIds.forEach(id => {
      const tienda = this.tiendas.find(t => t.id === id);
      if (tienda) {
        this.highlightStore(tienda);
      }
    });

     // Si solo hay un resultado, centramos el mapa en esa tienda
      if (results.length === 1) {
      const tienda = this.tiendas.find(t => t.id === results[0].tiendaId);
      if (tienda) {
        this.centerMapOnStore(tienda);
      }
    }
  }



  ngAfterViewInit(): void {
    this.ajustarAlturaMapa();

    setTimeout(() => {
    this.initMap();
    //comprobamos si la geolocalizacion esta supported por el navegador
    if('geolocation' in navigator) {
      this.addLocateControl();
    } else {
      console.warn('Geolocation is not supported by this browser.')
    }
  }, 100);
  }

  private cargarTiendas(): void {
    console.log('Inicializando mapa...');
    this.tiendaService.getTiendas()
          .pipe(
            catchError(error => {
              console.error('Error cargando tiendas:', error);
              return of ([]);
            })
          )
          .subscribe((tiendas: ITienda[]) => {
            console.log('Tiendas recibidas:', tiendas);
            this.tiendas = tiendas;
            if (this.mapaInicializado && this.map) {
              this.addMarkers();
            } else {
              this.mapaInitPromesa?.then(()=> {
                if (this.map) {
                  this.addMarkers();
                }
              })
            }
            //si la localizacion esta ya disponible , actualizamos las distancias
            if (this.userLocation) {
              this.actualizarDistanciaTiendas();
            }

          });
  }

  private initMap(): void {
    console.log('Inicializando mapa con', this.tiendas.length, 'tiendas');
    this.map = map('map', {
      center: this.initialCoords,
      zoom: this.initialZoom,
      zoomControl: false
    });


    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: 'MonsterFinder'
    }).addTo(this.map);

    setTimeout(() => {
      this.map.invalidateSize();
      this.mapaInicializado = true;

      if (this.mapaInitResolver) {
        this.mapaInitResolver();
      }

      if (this.tiendas.length > 0) {
        this.addMarkers();
      }
    }, 100);
  }

  private addLocateControl(): void {
    const customControl = L.Control.extend({
      options: {
        position: 'topleft'
      },
      onAdd: () => {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        const button = L.DomUtil.create('a', 'locate-button', container);
        button.href = '#';
        button.title = 'Mostrar mi ubicacion';
        button.innerHTML = '<i class="fas fa-location-arrow">📍</i>';
        if(!button.innerHTML.includes('fa-location-arrow')) {
          button.innerHTML = '📍';
        }

        L.DomEvent.on(button, 'click', L.DomEvent.stop)
          .on(button, 'click', () => {
            this.locateUser();
          });

          return container;
      }
    });
    this.map.addControl(new customControl());
  }

  locateUser(): void {
    //indicador de carga
    this.isLocating = true;

    const loadingEl = document.createElement('div');
    loadingEl.className = 'location-loader';
    loadingEl.innerHTML = '';
    document.body.appendChild(loadingEl);

    if(navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude} = position.coords;
          this.userLocation = latLng(latitude, longitude);

          //Añadir o actualizar el marker del usuario
          this.addUserLocationMarker(this.userLocation);

          //centrar el mapa en la localizacion del usuario
          this.map.setView(this.userLocation, 15);

          //calcular distancias a todas las tiendas
          this.actualizarDistanciaTiendas();

          this.isLocating = false;
          document.body.removeChild(loadingEl);

          this.startWatchingPosition();
        },
        (error) => {
          console.error( 'Error obteniendo localizacion' , error);
          this.handleLocationError(error);
          this.isLocating = false;
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      console.error('Geolocalizacion no supported por el buscador');
      this.isLocating = false;
      document.body.removeChild(loadingEl);
    }
  }

  startWatchingPosition(): void {
    //limpiar cualquier vista existente
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
    }

    //empezar una nueva vista
    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const {latitude, longitude} = position.coords;
        this.userLocation = latLng(latitude, longitude);

        //actualizar el marcador de la posicion del usuario
        this.addUserLocationMarker(this.userLocation);

        //recalcular distancias
        this.actualizarDistanciaTiendas();
      },
      (error) => {
        console.error('Error watching position', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  stopWatchingPosition(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  handleLocationError(error: GeolocationPositionError): void {
    let message = '';
    switch (error.code) {
      case error.PERMISSION_DENIED:
      message = 'El usuario ha denegado el permiso para la geolocalizacion.';
      break;
      case error.POSITION_UNAVAILABLE:
      message = 'La informacion de ubicacion no esta disponible.';
      break  ;
      case error.TIMEOUT:
      message = 'La solicitud para obtener la ubicacion del usuario ha caducado';
      break;
      default:
      message = 'Se ha producido un error desconocido.';
      break;
    }

    alert (message);
  }

  addUserLocationMarker(location: LatLng): void {
    //quitar marquer anterior si es que existiese
    if ( this.userLocationMarker) {
      this.map.removeLayer(this.userLocationMarker);
    }

    //crear un icono customizado para la localizacion
    const userIcon = new L.DivIcon({
      className: 'monster-marker', 
      html: `<img src="assets/monsterconducir.png" style="width:60px; height:60px;">`,
      iconSize: [60, 60],
      iconAnchor: [30, 30]
      
    })

    //añadir nuevo marcador 
    this.userLocationMarker = L.marker(location, {
      icon: userIcon,
       zIndexOffset: 1000}) // zIndexOffset asegura que el marcador de usuario siempre esté encima
      .addTo(this.map)
      .openPopup();

    //   // círculo de precisión 
    //  const accuracyCircle = L.circle(location, {
    //   radius: 40, // Radio en metros 
    //   weight: 1,
    //   color: '#4285F4',
    //   fillColor: '#4285F480',
    //   fillOpacity: 0.15
    //   }).addTo(this.map);


      console.log('Marcador de ubicación añadido en:', location);
  }

  actualizarDistanciaTiendas(): void {
    if(!this.userLocation) return;

    //calcular distancia del usuario a cada tienda
    this.tiendas.forEach(tienda => {
      const storeLocation = latLng(tienda.latitud, tienda.longitud);
      // @ts-ignore - distance is available in LatLng
      const distancia = this.userLocation.distanceTo(storeLocation) / 2000;
      (tienda as any).distance = parseFloat(distancia.toFixed(2));
    });

    //filtrar tiendas por distancia
    this.nearestStores = [...this.tiendas].sort((a, b) => 
    (a as any).distance - (b as any).distance
  );

  console.log('Tiendas mas cercanas: ', this.nearestStores);
  }

  findNearestStoreWithMonster(monsterId: number): ITienda | null {
    if (!this.userLocation || !this.nearestStores.length) return null;
    
    // encontrar tiendas que tengan monster
    const storesWithMonster = this.nearestStores.filter(tienda => 
      tienda.monsters.some((m: any) => m.monster.id === monsterId)
    );
    
    // filtrar por precio
    const sortedStores = storesWithMonster.sort((a, b) => {
      const monsterA = a.monsters.find(m => m.monster.id === monsterId);
      const monsterB = b.monsters.find(m => m.monster.id === monsterId);
      
      // obtener precio descontado si es posible si no normal 
      const priceA = monsterA?.descuento ? monsterA.precioDescuento ?? monsterA.precio : monsterA?.precio ?? Infinity;
      const priceB = monsterB?.descuento ? monsterB.precioDescuento ?? monsterB.precio : monsterB?.precio ?? Infinity;
      
      return priceA - priceB;
    });
    
    // devolver la mejor opcion ( precio mas barato )
    return sortedStores.length ? sortedStores[0] : null;
  }

    // Nuevo método para resaltar una tienda en el mapa
    highlightStore(tienda: ITienda): void {
      if (!tienda || !this.map) return;
      
      this.clearHighlights();

      //Icono rojo highlight tienda seleccionada
      const redIcon = new L.Icon({
        iconUrl: 'assets/marker-icon-red.png',
        iconRetinaUrl: 'assets/marker-icon-2x-red.png',
        shadowUrl: 'assets/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      const latlng = latLng(tienda.latitud, tienda.longitud);
      const highlightMarker = L.marker(latlng, {
        icon: redIcon,
        zIndexOffset: 1000  // Para asegurarse de que aparezca encima de otros marcadores
      }).addTo(this.map)
      .on('click', () => this.showTiendaInfo(tienda));

      // Guardar referencia para poder eliminarlo despues
      this.highlightedMarker = highlightMarker as any;
      
      // Mostrar información de la tienda
      this.showTiendaInfo(tienda);
    }
    
    // Metodo para centrar el mapa en una tienda especifica
    centerMapOnStore(tienda: ITienda): void {
      if (!tienda || !this.map) return;
      
      const latlng = latLng(tienda.latitud, tienda.longitud);
      this.map.setView(latlng, 16);
    }
    
    // Método para limpiar resaltados en el mapa
    clearHighlights(): void {
      if (this.highlightedMarker) {
        this.map.removeLayer(this.highlightedMarker);
        this.highlightedMarker = null;
      }
    }
    
    togglePanel() {
      this.panelVisible = !this.panelVisible;
    }

  private addMarkers(): void {
    if (!this.map || !this.mapaInicializado) {
      console.warn('Map not initialized yet, cannot add markers');
      return;
    }
    // Limpiar marcadores existentes
    this.markers.forEach(marker => marker.removeFrom(this.map));
    this.markers = [];

    // Configurar iconos
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'assets/marker-icon-2x-green.png',
      iconUrl: 'assets/marker-icon-green.png',
      shadowUrl: 'assets/marker-shadow.png',
    });

    // Añadir nuevos marcadores
    this.tiendas.forEach(tienda => {
      const coordenadas = latLng(tienda.latitud, tienda.longitud);
      const newMarker = marker(coordenadas)
        .addTo(this.map)
        .on('click', () => this.showTiendaInfo(tienda));
      
      this.markers.push(newMarker);
    });

    // Ajustar vista del mapa si hay tiendas
    if (this.tiendas.length > 0) {
      const markerGroup = L.featureGroup(this.markers);
      this.map.fitBounds(markerGroup.getBounds().pad(0.1));
    }
  }

  showTiendaInfo(tienda: ITienda): void {
    console.log('Marcador de tienda clickeado:', tienda);
    this.selectedTienda = tienda;
    this.map.getContainer().style.cursor = 'pointer';
  }

  closeInfo(): void {
    this.selectedTienda = null;
    this.map.getContainer().style.cursor = 'grab';
  }

  handleClose() {
    this.selectedTienda = null;
  }

  onMapClick(event: LeafletMouseEvent, tienda: ITienda) {
    console.log('Tienda seleccionada:', tienda);
    this.addStoreForm.patchValue({
      latitud: event.latlng.lat,
      longitud: event.latlng.lng
    })
  }

  //metodo estetico
  ajustarAlturaMapa(): void {
    setTimeout(() => {
      const mapContainer = document.querySelector('.map-container') as HTMLElement;
      if (mapContainer) {
        const alturaVentana = window.innerHeight
        mapContainer.style.height = `${alturaVentana}px`

        if(this.map){
          this.map.invalidateSize();
        }

      }
    },100)  // Un pequeño retraso para asegurar que el DOM está listo

  }

  ngOnDestroy(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
    }

    window.removeEventListener('resize', this.ajustarAlturaMapa.bind(this));

    // Desuscribir de los observables
  if (this.filteredResultsSubscription) {
    this.filteredResultsSubscription.unsubscribe();
  }

  }


}

