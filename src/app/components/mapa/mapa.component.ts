import { Component, AfterViewInit, OnInit } from '@angular/core';
import { ITienda } from '../../interfaces/itienda';
import L, { LatLng, latLng, LeafletMouseEvent, Map, map, marker, tileLayer } from 'leaflet';
import { TiendaDetailComponent } from "../tienda-detail/tienda-detail.component";
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { CommonModule } from '@angular/common';
import { TiendaService } from '../../services/tienda.service'; 
import { catchError, of } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AddtiendaComponent } from "../addtienda/addtienda.component";
import { CommunicationService } from '../../services/communication.service';


@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [TiendaDetailComponent, LeafletModule, CommonModule, AddtiendaComponent],
  templateUrl: './mapa.component.html',
  styleUrl: './mapa.component.css'
})
export class MapaComponent implements OnInit, AfterViewInit{

private map! : Map;
private markers: L.Marker[] = [];
selectedTienda: ITienda | null = null;
tiendas: any[] = [];
addStoreForm!: FormGroup;

constructor (private tiendaService: TiendaService, private fb: FormBuilder, private cservice: CommunicationService) {}


//Cordenadas Santander
private initialCoords: LatLng = latLng(43.4628, -3.8050);
  private initialZoom = 15;


  ngOnInit(): void {
    this.addStoreForm = this.fb.group({
      latitud: ['', Validators.required],
      longitud: ['', Validators.required]
    })
    this.cargarTiendas();
    this.cservice.updateMap$.subscribe(() => this.cargarTiendas());
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  private cargarTiendas(): void {
    this.tiendaService.getTiendas()
          .pipe(
            catchError(error => {
              console.error('Error cargando tiendas:', error);
              return of ([]);
            })
          )
          .subscribe((tiendas: ITienda[]) => {
            this.tiendas = tiendas;
            this.addMarkers();
          });
  }

  private initMap(): void {
    this.map = map('map', {
      center: this.initialCoords,
      zoom: this.initialZoom
    });


    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
  }


  private addMarkers(): void {
    // Limpiar marcadores existentes
    this.markers.forEach(marker => marker.removeFrom(this.map));
    this.markers = [];

    // Configurar iconos
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'assets/marker-icon-2x.png',
      iconUrl: 'assets/marker-icon.png',
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

  onMapClick(event: LeafletMouseEvent) {
    this.addStoreForm.patchValue({
      latitud: event.latlng.lat,
      longitud: event.latlng.lng
    })
  }

}




//  //Datos de ejemplo
//  tiendas: ITienda[] = [
//   {
//     id: 1,
//     nombre: 'Bazar Cueto',
//     coordenadas: latLng(43.483430,-3.800185),
//     monsters: [
//       {tipo: 'Ultra White', precio: 1.70},
//       {tipo: 'Mango Loco', precio: 1.70},
//       {tipo: 'Zero Sugar Monster Energy', precio: 1.70},
//       {tipo: 'Rio Punch', precio: 1.70},
//     ]
//   },
//   {
//     id: 2,
//     nombre: 'Videoclub Valdenoja',
//     coordenadas: latLng(43.481720,-3.796091),
//     monsters: [
//       {tipo: 'Ultra White', precio: 2.00},
//       {tipo: 'Monster Energy', precio: 2.00},
//       {tipo: 'Mango Loco', precio: 2.00},
//       {tipo: 'Ultra Peachy Keen', precio: 2.00},
//       {tipo: 'Ultra Rosa', precio: 2.00},
//       {tipo: 'Papillon', precio: 2.00},
//       {tipo: 'Bad Apple', precio: 2.00},
//     ]
//   },
//   {
//     id: 3,
//     nombre: 'Igos Valdenoja',
//     coordenadas: latLng(43.481364,-3.796596),
//     monsters: [
//       {tipo: 'Ultra White', precio: 2.20},
//       {tipo: 'Monster Energy', precio: 2.20},
//       {tipo: 'Mango Loco', precio: 2.20},
//       {tipo: 'Zero Sugar Monster Energy', precio: 2.20},
//       {tipo: 'Khaotic', precio: 2.20},
//       {tipo: 'Papillon', precio: 2.20},
//       {tipo: 'Lewis Hamilton', precio: 2.20},
//     ]
//   },
//   {
//     id: 4,
//     nombre: 'Lupa Valdenoja',
//     coordenadas: latLng(43.480184,-3.800492),
//     monsters: [
//       {tipo: 'Ultra White', precio: 1.75},
//       {tipo: 'Monster Energy', precio: 1.75},
//       {tipo: 'Mango Loco', precio: 1.75},
//       {tipo: 'Zero Sugar Monster Energy', precio: 1.75},
//       {tipo: 'Ultra Red', precio: 1.75},
//       {tipo: 'Ultra Paradise', precio: 1.75},
//       {tipo: 'Ultra Golden Pineapple', precio: 1.75},
//     ]
//   },
// ]