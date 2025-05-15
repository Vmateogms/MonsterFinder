import { LatLng } from "leaflet";
import { IMonster } from "./imonster";

export interface ITienda {
    id: number;
    nombre: string;
    latitud: number;
    longitud: number;
    distance?: number;
    monsters: {
        monster: {
        id: number;
        nombre: string;
        descripcion: string;
        sabor: string;
        imagenUrl: string;
    };
    precio: number;
    descuento?: boolean;
    precioDescuento?: number;
    enNevera?: boolean; 
    }[];
    usuarioCreador?: string; // Nombre de usuario que creó la tienda
}