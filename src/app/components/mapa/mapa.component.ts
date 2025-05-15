import { Component, AfterViewInit, OnInit, OnDestroy } from '@angular/core';
import { ITienda } from '../../interfaces/itienda';
import L, { LatLng, latLng, LeafletMouseEvent, Map, marker, tileLayer, Icon, DivIcon } from 'leaflet';
import { TiendaDetailComponent } from "../tienda-detail/tienda-detail.component";
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { CommonModule } from '@angular/common';
import { TiendaService } from '../../services/tienda.service'; 
import { catchError, of, Subscription, interval, switchMap } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AddtiendaComponent } from "../addtienda/addtienda.component";
import { CommunicationService } from '../../services/communication.service';
import { MonsterService } from '../../services/monster.service';
import { ModalBienvenidaComponent } from "../modal-bienvenida/modal-bienvenida.component";
import { MonsterFilterComponent } from "../monster-filter/monster-filter.component";
import { UserProfileComponent } from "../perfil-usuario/user-profile/user-profile.component";
import { AuthComponent } from "../auth/auth/auth.component";
import { AuthService } from '../../services/auth.service';
import { HttpHeaders } from '@angular/common/http';
import { environment } from '../../environment/environment.prod';

@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [TiendaDetailComponent, LeafletModule, CommonModule, AddtiendaComponent, ModalBienvenidaComponent, MonsterFilterComponent, UserProfileComponent, AuthComponent],
  templateUrl: './mapa.component.html',
  styleUrl: './mapa.component.css'
})
export class MapaComponent implements OnInit, AfterViewInit, OnDestroy {
  // Propiedades del mapa
  private map!: Map;
  private markers: L.Marker[] = [];
  private highlightedMarker: L.Marker | L.CircleMarker | null = null;
  private initialCoords: LatLng = latLng(43.4628, -3.8050);
  private initialZoom = 15;
  mapaInicializado = false;
  private mapaInitPromesa: Promise<void>;
  private mapaInitResolver!: (value: void | PromiseLike<void>) => void;

  // Propiedades de localizacion
  userLocationMarker: L.Marker | null = null;
  userLocation: LatLng | null = null;
  watchId: number | null = null;
  isLocating: boolean = false;

  // Propiedades de tiendas
  tiendas: ITienda[] = [];
  selectedTienda: ITienda | null = null;
  nearestStores: ITienda[] = [];
  ultimoMarkerClickeado: L.Marker | null = null;
  modoAnadirTiendas: boolean = false;
  markerTemporal: L.Marker | null = null;
  posicionDeNuevaTienda: LatLng | null = null;
  mostrarFormNombre: boolean = false;
  nuevaTiendaNombre: string = '';
  private guardandoTienda: boolean = false;

  // Propiedades de UI
  panelVisible: boolean = false;
  tiendasCercanas = true;
  mostrarModalBienvenida = true;
  addStoreForm!: FormGroup;

  // Subscripciones
  private filteredResultsSubscription: Subscription | null = null;
  private communicationSubscription: Subscription | null = null;

  // Propiedades para el sistema de notificaciones de tiendas nuevas
  private newStoreCheckingEnabled: boolean = true;
  private pollingSubscription: Subscription | null = null;
  private newStoreNotification: HTMLElement | null = null;
  private newTiendaData: ITienda | null = null;

  constructor(
    private tiendaService: TiendaService,
    private fb: FormBuilder,
    private cservice: CommunicationService,
    private mService: MonsterService,
    private authService: AuthService
  ) {
    this.mapaInitPromesa = new Promise<void>((resolve) => {
      this.mapaInitResolver = resolve;
    });
  }

  ngOnInit(): void {
    // Inicializar formulario
    this.addStoreForm = this.fb.group({
      latitud: ['', Validators.required],
      longitud: ['', Validators.required]
    });
    
    // Configurar suscripciones
    this.setupSubscriptions();
    
    // Comprobar si se debe mostrar el modal de bienvenida
    this.mostrarModalBienvenida = localStorage.getItem('modalBienvenidaMostrado') !== 'true';

    // Ajustes visuales
    this.ajustarAlturaMapa();
    window.addEventListener('resize', this.ajustarAlturaMapa.bind(this));

    // Cargar tiendas
    this.cargarTiendas();

    // Iniciar sistema de polling para detectar nuevas tiendas
    this.startPollingForNewStores();
  }

  ngAfterViewInit(): void {
    this.ajustarAlturaMapa();

    setTimeout(() => {
      this.initMap();
    }, 100);
  }

  ngOnDestroy(): void {
    this.stopWatchingPosition();
    window.removeEventListener('resize', this.ajustarAlturaMapa.bind(this));
    
    // Desuscribir de los observables
    if (this.filteredResultsSubscription) {
      this.filteredResultsSubscription.unsubscribe();
    }
    
    if (this.communicationSubscription) {
      this.communicationSubscription.unsubscribe();
    }

    // Detener el polling de nuevas tiendas
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }

    // Eliminar notificación si existe
    this.removeNewStoreNotification();
  }

  // METODOS DE INICIALIZACION

  private setupSubscriptions(): void {
    // Suscripcion a actualizaciones del mapa
    this.communicationSubscription = this.cservice.updateMap$.subscribe(() => 
      this.cargarTiendas()
    );
    
    // Registrar este componente en el servicio de monstruos
    this.mService.registerMapaComponent(this);
    
    // Suscribirse a resultados filtrados
    this.filteredResultsSubscription = this.mService.resultadosFiltrado$.subscribe(
      results => this.handleFilteredResults(results)
    );

    // Suscribirse a nuevas tiendas detectadas
    this.tiendaService.newTienda$.subscribe(newTienda => {
      if (newTienda) {
        this.newTiendaData = newTienda;
        this.showNewStoreNotification(newTienda);
      }
    });
  }

  private initMap(): void {
    console.log('Inicializando mapa con', this.tiendas.length, 'tiendas');
    
    // Crear el mapa
    this.map = L.map('map', {
      center: this.initialCoords,
      zoom: this.initialZoom,
      zoomControl: false
    });

    // Añadir capa base
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: 'MonsterFinder'
    }).addTo(this.map);

    // Añadir control de localizacion si esta disponible
    if ('geolocation' in navigator) {
      this.addLocateControl();
    } else {
      console.warn('Geolocation is not supported by this browser.');
    }

    // Finalizar inicializacion
    setTimeout(() => {
      this.map.invalidateSize();
      this.mapaInicializado = true;

      if (this.mapaInitResolver) {
        this.mapaInitResolver();
      }

      if (this.tiendas.length > 0) {
        this.renderMarkers();
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
        
        if (!button.innerHTML.includes('fa-location-arrow')) {
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

  // METODOS DE CARGA DE DATOS

  private cargarTiendas(): void {
    console.log('Cargando tiendas...');
    
    this.tiendaService.getTiendas()
      .pipe(
        catchError(error => {
          console.error('Error cargando tiendas:', error);
          return of([]);
        })
      )
      .subscribe((tiendas: ITienda[]) => {
        console.log('Tiendas recibidas:', tiendas);
        this.tiendas = tiendas;
        
        // Actualizar marcadores según el estado del mapa
        if (this.mapaInicializado && this.map) {
          this.renderMarkers();
        } else {
          this.mapaInitPromesa.then(() => {
            if (this.map) {
              this.renderMarkers();
            }
          });
        }
        
        // Actualizar distancias si hay localizacion
        if (this.userLocation) {
          this.actualizarDistanciaTiendas();
        }
      });
  }

  // METODOS DE MARCADORES Y VISUALIZACION

  private renderMarkers(): void {
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

  
  activarModoAnadirTiendas(): void {
    console.log('Activando modo añadir tiendas');

    
    
    //cambiar el cursos del mapa para indicar que esta en modo añadir tiendas
    if (this.map && this.map.getContainer()) {
      this.map.getContainer().style.cursor = 'crosshair';
      console.log('Cursor cambiado');
    }
    
    this.modoAnadirTiendas = true;

    //Añade un listener de click al mapa
    if (this.map) {
      this.map.off('click');
      
      this.boundHandleMapClick = this.handleMapClickForNewStore.bind(this);
      this.map.on('click', this.boundHandleMapClick);
      console.log('Listener añadido');
    }
    
    //crear un panel de control en la parte superior
    this.crearAnadirTiendaPanel()
    
    //this.desactivarModoAnadirtienda();
  }

  desactivarModoAnadirtienda(): void {
    console.log('Desactivando modo añadir tienda');

    this.modoAnadirTiendas = false;

   // Restaurar el cursor
    if (this.map && this.map.getContainer()) {
      this.map.getContainer().style.cursor = '';
    }

   // Remover el listener de click del mapa
   if (this.map) {
    // Importante: eliminar TODOS los handlers de click
    this.map.off('click');
    
    if (this.boundHandleMapClick) {
      this.map.off('click', this.boundHandleMapClick);
      this.boundHandleMapClick = null;
    }
  }

    //remueve el marcador temporal si existe 
    if (this.markerTemporal && this.map) {
      this.map.removeLayer(this.markerTemporal);
      this.markerTemporal = null;
    }

     // Remueve el panel de control si existe
    const controlPanel = document.querySelector('.add-store-control-panel');
    if (controlPanel) {
    controlPanel.remove();
    }

     // Remove name form if it exists
  const nameForm = document.querySelector('.store-name-form-container');
  if (nameForm) {
    nameForm.remove();
  }

    //resetea el estado del formulario
    this.posicionDeNuevaTienda = null;
    this.mostrarFormNombre = false;
    this.nuevaTiendaNombre = '';
    this.guardandoTienda = false;
    
    console.log('Modo añadir tienda completamente desactivado');
  }

  private boundHandleMapClick: ((event: L.LeafletMouseEvent) => void ) | null = null;;


handleMapClickForNewStore(event: LeafletMouseEvent): void{

  if (!this.modoAnadirTiendas) {
    console.log('Click ignorado - no estamos en modo añadir tienda');
    return;
  }

  console.log('Click en el mapa para nueva tienda', event.latlng);

  //Guarda la posicion seleccionada
  this.posicionDeNuevaTienda = event.latlng;


  //remueve el marcador temporal previo si existe
  if (this.markerTemporal && this.map) {
    this.map.removeLayer(this.markerTemporal);
  }

  const newStoreIcon = new L.Icon({
    iconUrl: 'assets/marker-icon-red.png',
    iconRetinaUrl: 'assets/marker-icon-2x-red.png',
    shadowUrl: 'assets/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  //crea un nuevo marcador en la posicion seleccionada
  this.markerTemporal = L.marker(event.latlng, { icon: newStoreIcon }).addTo(this.map);

  //activa el boton de guardar
  const saveButton = document.querySelector('.save-store-button') as HTMLButtonElement;
  if(saveButton) {
    saveButton.disabled = false;
  }
}


crearAnadirTiendaPanel(): void {
  console.log('Creando panel de control');
  console.log('Estado del mapa:', this.map ? 'Inicializado' : 'No inicializado');
  // Crear el panel de control
  const controlPanel = document.createElement('div');
  controlPanel.className = 'add-store-control-panel';

    // Añadir estilos inline para garantizar visibilidad
    controlPanel.style.position = 'absolute';
    controlPanel.style.top = '20px';
    controlPanel.style.left = '50%';
    controlPanel.style.transform = 'translateX(-50%)';
    controlPanel.style.backgroundColor = 'white';
    controlPanel.style.padding = '15px';
    controlPanel.style.borderRadius = '5px';
    controlPanel.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
    controlPanel.style.zIndex = '1500'; // Alto z-index para estar sobre otros elementos
  
  // Añadir título
  const title = document.createElement('h4');
  title.textContent = 'Añadir nueva tienda';
  controlPanel.appendChild(title);
  
  // Añadir instrucciones
  const instructions = document.createElement('p');
  instructions.textContent = 'Haz clic en el mapa para colocar la tienda';
  controlPanel.appendChild(instructions);
  
  // Botones
  const buttonsDiv = document.createElement('div');
  buttonsDiv.className = 'control-buttons';
  
  // Botón cancelar
  const cancelButton = document.createElement('button');
  cancelButton.className = 'btn btn-secondary cancel-store-button';
  cancelButton.textContent = 'Cancelar';
  cancelButton.onclick = () => this.desactivarModoAnadirtienda();
  buttonsDiv.appendChild(cancelButton);
  
  // Botón guardar
  const saveButton = document.createElement('button');
  saveButton.className = 'btn btn-primary save-store-button';
  saveButton.textContent = 'Guardar';
  saveButton.disabled = true; // Inicialmente deshabilitado hasta que se haga clic en el mapa
  saveButton.onclick = () => this.showStoreNameForm();
  buttonsDiv.appendChild(saveButton);
  
  controlPanel.appendChild(buttonsDiv);
  
  // Añadir el panel al DOM
  document.body.appendChild(controlPanel);
  console.log('Panel de control creado');
}


showStoreNameForm(): void {
  this.mostrarFormNombre = true;


   // Remove any existing forms to prevent duplicates
   const existingForm = document.querySelector('.store-name-form-container');
   if (existingForm) {
     existingForm.remove();
   }

  //Ocultar el panel de control
  const controlPanel = document.querySelector('.add-store-control-panel');
  if(controlPanel) {
    controlPanel.remove();
  }

  const contenedorNombreForm = document.createElement('div');
  contenedorNombreForm.className = 'store-name-form-container';
  contenedorNombreForm.style.position = 'absolute';
  contenedorNombreForm.style.top = '20px';
  contenedorNombreForm.style.left = '50%';
  contenedorNombreForm.style.transform = 'translateX(-50%)';
  contenedorNombreForm.style.backgroundColor = 'white';
  contenedorNombreForm.style.padding = '15px';
  contenedorNombreForm.style.borderRadius = '5px';
  contenedorNombreForm.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
  contenedorNombreForm.style.zIndex = '1500';
  contenedorNombreForm.style.width = '300px';



  

    // Título
    const title = document.createElement('h4');
    title.textContent = 'Nombre de la tienda';
    contenedorNombreForm.appendChild(title);
    
    // Input
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-control store-name-input';
    input.placeholder = 'Introduce el nombre de la tienda...';
    input.value = this.nuevaTiendaNombre;
    input.oninput = (e) => {
      this.nuevaTiendaNombre = (e.target as HTMLInputElement).value;
    };
    contenedorNombreForm.appendChild(input);

    //añadimos espacio
    const spacer = document.createElement('div');
  spacer.style.height = '10px';
  contenedorNombreForm.appendChild(spacer);

      // Botones
      const buttonsDiv = document.createElement('div');
      buttonsDiv.className = 'form-buttons';
      buttonsDiv.style.display = 'flex';
      buttonsDiv.style.justifyContent = 'space-between';
      buttonsDiv.style.marginTop = '10px';
  
  // Botón cancelar
  const cancelButton = document.createElement('button');
  cancelButton.className = 'btn btn-secondary cancel-name-button';
  cancelButton.textContent = 'Cancelar';
  cancelButton.style.marginRight = '10px';
  cancelButton.onclick = (e) => {
    e.preventDefault(); 
    console.log('Cancelando formulario de nombre');
    contenedorNombreForm.remove();
    this.activarModoAnadirTiendas(); // Return to map selection mode
  };
  buttonsDiv.appendChild(cancelButton);
  
  // Botón guardar
  const saveButton = document.createElement('button');
  saveButton.className = 'btn btn-primary save-name-button';
  saveButton.textContent = 'Guardar';
  saveButton.onclick = (e) => {
    e.preventDefault(); 

    //Confirmacion Antes de guardar
    if (confirm(`¿Estas seguro de que quieres añadir la tienda "${this.nuevaTiendaNombre}" en "${this.posicionDeNuevaTienda?.lat.toFixed(6)}, ${this.posicionDeNuevaTienda?.lng.toFixed(6)}?"` )) {
      console.log('Botón guardar clickeado, llamando a guardarNuevaTienda()');
      this.guardarNuevaTienda();
    } else {
      console.log('Confimacion cancelada')
    }
  };
  buttonsDiv.appendChild(saveButton);
  
  contenedorNombreForm.appendChild(buttonsDiv);
  
   // Debug info to confirm position data
  const debugInfo = document.createElement('div');
  debugInfo.style.fontSize = '10px';
  debugInfo.style.marginTop = '10px';
  debugInfo.style.color = '#888';
  debugInfo.textContent = `Posición: ${this.posicionDeNuevaTienda?.lat.toFixed(6)}, ${this.posicionDeNuevaTienda?.lng.toFixed(6)}`;
  contenedorNombreForm.appendChild(debugInfo);
  
  // Añadir el formulario al DOM
  document.body.appendChild(contenedorNombreForm);
  setTimeout(() => {
    input.focus();
  }, 100);
}

guardarNuevaTienda(): void {
  console.log('Ejecutando guardarNuevaTienda');
  console.log('Nombre:', this.nuevaTiendaNombre);
  console.log('Posición:', this.posicionDeNuevaTienda);

  if (!this.posicionDeNuevaTienda || !this.nuevaTiendaNombre.trim()) {
    alert('Por favor, selecciona una ubicación y proporciona un nombre para la tienda.');
    return;
  }

  this.guardandoTienda = true;

  const saveButton = document.querySelector('.save-name-button') as HTMLButtonElement;
  if (saveButton) {
    saveButton.disabled = true;
    saveButton.textContent = 'Guardando...';
  }

  // Preparar los datos de la nueva tienda
  const newStore: any = {
    nombre: this.nuevaTiendaNombre.trim(),
    latitud: this.posicionDeNuevaTienda.lat,
    longitud: this.posicionDeNuevaTienda.lng
  };
  
  // Añadir usuario creador si está autenticado
  if (this.authService.isLoggedIn && this.authService.currentUserValue) {
    newStore.usuarioCreador = this.authService.currentUserValue.username;
  }
  
  // Enviar a la API
  this.tiendaService.addTienda(newStore).subscribe({
    next: (response) => {
      console.log('Tienda añadida correctamente', response);
      
      // Completely deactivate store addition mode
      this.desactivarModoAnadirtienda();
      
      // Extra safety measures to ensure all state is reset
      this.modoAnadirTiendas = false;
      if (this.markerTemporal && this.map) {
        this.map.removeLayer(this.markerTemporal);
        this.markerTemporal = null;
      }
      //resetear todas las variables de estado
      this.posicionDeNuevaTienda = null;
      this.nuevaTiendaNombre = '';
      this.guardandoTienda = false;
      
      // quitar todos los listeners del mapa
      if (this.map) {
        this.map.off('click');
      }
      //reset el cursor
      if (this.map && this.map.getContainer()) {
        this.map.getContainer().style.cursor = '';
      }
      
      // Ya no necesitamos actualizar el perfil manualmente ni solicitar recompensa
      // El servicio TiendaService se encargará de emitir la notificación de XP
      // cuando reciba los headers de experiencia del backend
      
      // Crear un efecto visual de marca nueva en el mapa
      if (response && response.id) {
        setTimeout(() => {
          this.cargarTiendas();
          this.resaltarTiendaNueva(response);
        }, 1000);
      } else {
        this.cargarTiendas();
      }

      // Notificar a través del servicio de comunicación
      if (response && response.id) {
        this.cservice.notifyNewTiendaAdded(response);
      }
    },
    error: (err) => {
      console.error('Error al añadir la tienda', err);
      if (saveButton) {
        saveButton.disabled = false;
        saveButton.textContent = 'Guardar';
      }
      this.guardandoTienda = false;
      
      let errorMsg = 'Error al añadir la tienda';
      if (err.error && err.error.message) {
        errorMsg += ': ' + err.error.message;
      } else if (err.message) {
        errorMsg += ': ' + err.message;
      } else if (err.status) {
        errorMsg += `: Error HTTP ${err.status}`;
      }
      
      alert(errorMsg);
    }
  });
}

  // Método para resaltar una tienda recién añadida con animación
  private resaltarTiendaNueva(tiendaNueva: any): void {
    console.log('Resaltando nueva tienda:', tiendaNueva);
    
    // Buscar la tienda en la lista actualizada
    const tienda = this.tiendas.find(t => t.id === tiendaNueva.id);
    if (!tienda) {
      console.log('No se encontró la tienda nueva en la lista actualizada');
      return;
    }
    
    // Centrar el mapa en la nueva tienda
    this.centerMapOnStore(tienda);
    
    // Crear un marcador de destello para la tienda nueva
    const latlng = latLng(tienda.latitud, tienda.longitud);
    
    // Crear un círculo pulsante para resaltar la nueva tienda
    const highlightCircle = L.circle(latlng, {
      radius: 30,
      color: '#4CAF50',
      fillColor: '#4CAF50',
      fillOpacity: 0.7,
      weight: 2
    }).addTo(this.map);
    
    // Animación de pulso
    let size = 30;
    const maxSize = 80;
    const interval = setInterval(() => {
      size += 5;
      highlightCircle.setRadius(size);
      highlightCircle.setStyle({
        fillOpacity: Math.max(0, 0.7 - (size / maxSize) * 0.7)
      });
      
      if (size >= maxSize) {
        clearInterval(interval);
        
        // Remover el círculo después de completar la animación
        setTimeout(() => {
          this.map.removeLayer(highlightCircle);
          
          // Mostrar el modal de la tienda después de la animación
          this.showTiendaInfo(tienda);
          
          // Mostrar mensaje de éxito
          alert('¡Tienda añadida con éxito! Ahora puedes añadir tus bebidas favoritas.');
        }, 500);
      }
    }, 50);
  }

  showTiendaInfo(tienda: ITienda): void {
    console.log('Marcador de tienda clickeado:', tienda);
    
    // Si no tiene monsters o está vacío, recargar los datos
    if (!tienda.monsters || tienda.monsters.length === 0) {
      console.log('Tienda sin monsters detectada. Recargando datos...');
      this.tiendaService.getTiendaById(tienda.id).subscribe({
        next: (tiendaActualizada) => {
          console.log('Datos de tienda actualizados:', tiendaActualizada);
          this.selectedTienda = tiendaActualizada;
          this.verificarFavorito(tiendaActualizada);
        },
        error: (error) => {
          console.error('Error al recargar datos de tienda:', error);
          // Continuar con los datos que tenemos
          this.selectedTienda = tienda;
          this.verificarFavorito(tienda);
        }
      });
    } else {
      // Si ya tiene datos completos
      this.selectedTienda = tienda;
      this.verificarFavorito(tienda);
    }
    
    this.map.getContainer().style.cursor = 'pointer';
  }
  
  // Método auxiliar para verificar si una tienda es favorita
  private verificarFavorito(tienda: ITienda): void {
    //si el usuario esta logueado, verificamos si la tienda es favorita
    if(this.authService.isLoggedIn) {
      this.authService.esFavorito(tienda.id).subscribe(esFavorito => {
        if(this.selectedTienda){
          (this.selectedTienda as any).esFavorita = esFavorito;
        }
      });
    }
  }

  closeInfo(): void {
    this.selectedTienda = null;
    this.map.getContainer().style.cursor = 'grab';
  }

  // METODOS DE LOCALIZACIoN

  locateUser(): void {
    // Indicador de carga
    this.isLocating = true;

    const loadingEl = document.createElement('div');
    loadingEl.className = 'location-loader';
    loadingEl.innerHTML = '';
    document.body.appendChild(loadingEl);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          this.userLocation = latLng(latitude, longitude);

          // Actualizar marcador y vista
          this.updateUserLocationMarker(this.userLocation);
          this.map.setView(this.userLocation, 15);

          // Actualizar distancias
          this.actualizarDistanciaTiendas();

          // Limpiar UI
          this.isLocating = false;
          document.body.removeChild(loadingEl);

          // Iniciar seguimiento de posicion
          this.startWatchingPosition();
        },
        (error) => {
          console.error('Error obteniendo localizacion', error);
          this.handleLocationError(error);
          this.isLocating = false;
          document.body.removeChild(loadingEl);
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

  private startWatchingPosition(): void {
    // Limpiar cualquier vista existente
    this.stopWatchingPosition();

    // Empezar una nueva vista
    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        this.userLocation = latLng(latitude, longitude);

        // Actualizar marcador y distancias
        this.updateUserLocationMarker(this.userLocation);
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

  private handleLocationError(error: GeolocationPositionError): void {
    let message = '';
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = 'El usuario ha denegado el permiso para la geolocalizacion.';
        break;
      case error.POSITION_UNAVAILABLE:
        message = 'La informacion de ubicacion no esta disponible.';
        break;
      case error.TIMEOUT:
        message = 'La solicitud para obtener la ubicacion del usuario ha caducado';
        break;
      default:
        message = 'Se ha producido un error desconocido.';
        break;
    }

    alert(message);
  }

  private updateUserLocationMarker(location: LatLng): void {
    // Quitar marcador anterior si existe
    if (this.userLocationMarker) {
      this.map.removeLayer(this.userLocationMarker);
    }

    // Crear un icono personalizado para la localizacion
    const userIcon = new L.DivIcon({
      className: 'monster-marker',
      html: `<img src="assets/monsterconducir.png" style="width:60px; height:60px;">`,
      iconSize: [60, 60],
      iconAnchor: [30, 30]
    });

    // Añadir nuevo marcador
    this.userLocationMarker = L.marker(location, {
      icon: userIcon,
      zIndexOffset: 1000 // Asegura que el marcador de usuario siempre estE encima
    })
      .addTo(this.map)
      .openPopup();

    console.log('Marcador de ubicacion añadido en:', location);
  }

  // METODOS DE DISTANCIA Y FILTRADO

  actualizarDistanciaTiendas(): void {
    if (!this.userLocation) return;

    // Calcular distancia del usuario a cada tienda
    this.tiendas.forEach(tienda => {
      const storeLocation = latLng(tienda.latitud, tienda.longitud);
      // @ts-ignore - distance is available in LatLng
      const distancia = this.userLocation.distanceTo(storeLocation) / 2000;
      (tienda as any).distance = parseFloat(distancia.toFixed(2));
    });

    // Ordenar tiendas por distancia
    this.nearestStores = [...this.tiendas].sort((a, b) =>
      (a as any).distance - (b as any).distance
    );

    console.log('Tiendas mas cercanas: ', this.nearestStores);
  }

  findNearestStoreWithMonster(monsterId: number): ITienda | null {
    if (!this.userLocation || !this.nearestStores.length) return null;
    
    // Encontrar tiendas que tengan el monstruo
    const storesWithMonster = this.nearestStores.filter(tienda => 
      tienda.monsters.some((m: any) => m.monster.id === monsterId)
    );
    
    // Ordenar por precio
    const sortedStores = storesWithMonster.sort((a, b) => {
      const monsterA = a.monsters.find((m: any) => m.monster.id === monsterId);
      const monsterB = b.monsters.find((m: any) => m.monster.id === monsterId);
      
      // Obtener precio con descuento si es posible, si no el normal
      const priceA = monsterA?.descuento ? monsterA.precioDescuento ?? monsterA.precio : monsterA?.precio ?? Infinity;
      const priceB = monsterB?.descuento ? monsterB.precioDescuento ?? monsterB.precio : monsterB?.precio ?? Infinity;
      
      return priceA - priceB;
    });
    
    // Devolver la mejor opcion (precio más barato)
    return sortedStores.length ? sortedStores[0] : null;
  }

  // METODOS DE FILTRADO Y RESALTADO

  handleFilteredResults(results: any[]): void {
    if (!results || results.length === 0) return;
    
    // Obtener IDs de tiendas únicas
    const storeIds = [...new Set(results.map(r => r.tiendaId))];
    
    // Eliminar cualquier resaltado anterior
    this.clearHighlights();

    if (!this.mapaInicializado) {
      this.mapaInitPromesa.then(() => {
        this.highlightTiendasFiltradas(storeIds, results);
      });
      return;
    }
    
    this.highlightTiendasFiltradas(storeIds, results);
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

  highlightStore(tienda: ITienda): void {
    if (!tienda || !this.map) return;
    
    this.clearHighlights();

    // Si no hay monsters en la tienda, intentamos recargar los datos
    if (!tienda.monsters || tienda.monsters.length === 0) {
      console.log('La tienda no tiene monsters. Intentando recargar datos...');
      this.tiendaService.getTiendaById(tienda.id).subscribe({
        next: (tiendaActualizada) => {
          console.log('Datos de tienda recargados:', tiendaActualizada);
          // Actualizar la referencia a tienda con los datos completos
          this.selectedTienda = tiendaActualizada;
          this.continuarHighlightStore(tiendaActualizada);
        },
        error: (error) => {
          console.error('Error al recargar datos de tienda:', error);
          // Continuar con los datos que tenemos
          this.continuarHighlightStore(tienda);
        }
      });
    } else {
      // Si ya tiene monsters, continuar normalmente
      this.continuarHighlightStore(tienda);
    }
  }

  // Método auxiliar para evitar duplicación de código
  private continuarHighlightStore(tienda: ITienda): void {
    // Icono rojo para highlight tienda seleccionada
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
    this.highlightedMarker = highlightMarker;
    
    // Mostrar informacion de la tienda
    this.showTiendaInfo(tienda);
  }

  centerMapOnStore(tienda: ITienda): void {
    if (!tienda || !this.map) return;
    
    const latlng = latLng(tienda.latitud, tienda.longitud);
    this.map.setView(latlng, 16);
  }

  clearHighlights(): void {
    if (this.highlightedMarker) {
      this.map.removeLayer(this.highlightedMarker);
      this.highlightedMarker = null;
    }
  }

  // METODOS DE UI

  cerrarModalBienvenida(): void {
    this.mostrarModalBienvenida = false;
    // Guardar en el localStorage para que no se muestre otra vez
    localStorage.setItem('modalBienvenidaMostrado', 'true');
  }

  togglePanel() {
    this.panelVisible = !this.panelVisible;
  }

  manejarClickEnMapaParaTiendasNuevas(event: LeafletMouseEvent, tienda: ITienda) {
    console.log('Tienda seleccionada:', tienda);
    this.addStoreForm.patchValue({
      latitud: event.latlng.lat,
      longitud: event.latlng.lng
    });
  }

  ajustarAlturaMapa(): void {
    setTimeout(() => {
      const mapContainer = document.querySelector('.map-container') as HTMLElement;
      if (mapContainer) {
        const alturaVentana = window.innerHeight;
        mapContainer.style.height = `${alturaVentana}px`;

        if (this.map) {
          this.map.invalidateSize();
        }
      }
    }, 100);  // Un pequeño retraso para asegurar que el DOM esta listo
  }

  // Sistema de polling para detectar nuevas tiendas
  private startPollingForNewStores(): void {
    // Comprobar cada 30 segundos si hay tiendas nuevas
    const POLLING_INTERVAL = 30000; // 30 segundos
    
    this.pollingSubscription = interval(POLLING_INTERVAL)
      .pipe(
        switchMap(() => {
          if (this.newStoreCheckingEnabled) {
            console.log('Comprobando si hay tiendas nuevas...');
            return this.tiendaService.checkForNewTiendas();
          }
          return of([]);
        })
      )
      .subscribe({
        next: (newTiendas) => {
          if (newTiendas.length > 0) {
            console.log(`Se han detectado ${newTiendas.length} tiendas nuevas`);
            // No necesitamos hacer nada más aquí, ya que la notificación
            // se maneja a través de la suscripción a newTienda$
          }
        },
        error: (error) => {
          console.error('Error al comprobar nuevas tiendas:', error);
        }
      });
  }

  // Mostrar notificación de nueva tienda
  private showNewStoreNotification(tienda: ITienda): void {
    // Eliminar notificación anterior si existe
    this.removeNewStoreNotification();
    
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = 'new-store-notification';
    notification.innerHTML = `
      <div class="new-store-content">
        <img src="assets/monsterconducir.png" alt="Monster" class="notification-icon">
        <div class="notification-text">
          <span class="notification-title">¡Nueva tienda añadida!</span>
          <span class="notification-store">${tienda.nombre}</span>
          ${tienda.usuarioCreador ? 
            `<span class="notification-creator">por ${tienda.usuarioCreador}</span>` : 
            ''}
        </div>
        <button class="notification-btn">Ver ahora</button>
      </div>
    `;
    
    // Añadir evento de clic al botón
    const button = notification.querySelector('.notification-btn');
    if (button) {
      button.addEventListener('click', () => {
        this.viewNewStore(tienda);
      });
    }
    
    document.body.appendChild(notification);
    
    // Guardar referencia a la notificación
    this.newStoreNotification = notification;
    
    // Añadir un botón para cerrar la notificación después de 15 segundos
    setTimeout(() => {
      // Solo cerrar si todavía existe
      if (this.newStoreNotification === notification && document.body.contains(notification)) {
        notification.style.animation = 'fadeOut 0.5s forwards';
        setTimeout(() => {
          this.removeNewStoreNotification();
        }, 500);
      }
    }, 15000);
  }

  // Eliminar notificación de nueva tienda
  private removeNewStoreNotification(): void {
    if (this.newStoreNotification && document.body.contains(this.newStoreNotification)) {
      document.body.removeChild(this.newStoreNotification);
    }
    this.newStoreNotification = null;
  }

  // Ver la nueva tienda
  private viewNewStore(tienda: ITienda): void {
    // Eliminar la notificación
    this.removeNewStoreNotification();
    
    // Comprobar si se necesita recargar las tiendas
    this.cargarTiendas();
    
    // Una vez cargadas, centramos y resaltamos la tienda nueva
    setTimeout(() => {
      // Centrar el mapa en la nueva tienda
      this.centerMapOnStore(tienda);
      
      // Resaltar la tienda
      this.highlightStore(tienda);
      
      // Mostrar los detalles de la tienda
      this.showTiendaInfo(tienda);
    }, 500);
  }
}