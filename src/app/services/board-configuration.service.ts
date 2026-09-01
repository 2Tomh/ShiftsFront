import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { BoardConfiguration, ExtraRowEntry } from '../Models/board-configuration.model';

@Injectable({
  providedIn: 'root'
})
export class BoardConfigurationService {
  constructor(private http: HttpClient) { }

  getConfiguration() {
    return this.http.get<BoardConfiguration>(`${environment.apiUrl}/BoardConfiguration`);
  }

  updateConfiguration(config: BoardConfiguration) {
    return this.http.put(`${environment.apiUrl}/BoardConfiguration`, config);
  }

  getExtraRows() {
    return this.http.get<ExtraRowEntry[]>(`${environment.apiUrl}/BoardConfiguration/extra-rows`);
  }

  updateExtraRow(entry: ExtraRowEntry) {
    return this.http.put(`${environment.apiUrl}/BoardConfiguration/extra-rows`, entry);
  }
}