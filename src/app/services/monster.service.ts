import { Injectable } from '@angular/core';
import { IMonster } from '../interfaces/imonster';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class MonsterService {

  private apiUrl = 'http://localhost:9007/api/monsters';

  constructor(private http: HttpClient) { }

  getAllMonsters() {
    return this.http.get<IMonster[]>(`${this.apiUrl}/monsters`);
  }

}
