import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ManagerSettings } from '../Models/ManagerSettings';

@Injectable({
  providedIn: 'root'
})
export class ManagerSettingsService {
  private apiUrl = `${environment.apiUrl}/ManagerSettings`;

  constructor(private http: HttpClient) { }

  get(): Observable<ManagerSettings> {
    return this.http.get<ManagerSettings>(this.apiUrl);
  }

  update(settings: ManagerSettings): Observable<any> {
    return this.http.put(this.apiUrl, settings);
  }
}