import { Injectable } from '@angular/core';
import { IMonster } from '../interfaces/imonster';
import { HttpClient } from '@angular/common/http';
import { environment } from './environment.prod';

@Injectable({
  providedIn: 'root'
})
export class MonsterService {

private apiUrl = `${environment.apiUrl}/monsters`;

  constructor(private http: HttpClient) { }

  getAllMonsters() {
    return this.http.get<IMonster[]>(`${this.apiUrl}/monsters`);
  }

}
