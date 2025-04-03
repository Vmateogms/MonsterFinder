import { LatLng } from "leaflet";
import { IMonster } from "./imonster";

export interface ITienda {
    id: number;
    nombre: string;
    latitud: number;
    longitud: number;
    monsters: {
        monster: IMonster;
        precio: number;
    }[];
}