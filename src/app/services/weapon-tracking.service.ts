import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { WeaponTracking, WeaponTrackingConfig } from '../Models/weapon-tracking.model';

@Injectable({
  providedIn: 'root'
})
export class WeaponTrackingService {
  constructor(private http: HttpClient) {}

  getMyTracking(): Observable<WeaponTracking> {
    return this.http.get<WeaponTracking>(`${environment.apiUrl}/weapon-tracking/my`);
  }

  getAllTracking(): Observable<WeaponTracking[]> {
    return this.http.get<WeaponTracking[]>(`${environment.apiUrl}/weapon-tracking`);
  }

  updateTracking(employeeId: string, data: Partial<WeaponTracking>): Observable<WeaponTracking> {
    return this.http.put<WeaponTracking>(`${environment.apiUrl}/weapon-tracking/${employeeId}`, data);
  }

  addEmployee(employeeId: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/weapon-tracking/${employeeId}`, {});
  }

  removeEmployee(employeeId: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/weapon-tracking/${employeeId}`);
  }

  sendHealthDeclaration(): Observable<any> {
    return this.http.post(`${environment.apiUrl}/weapon-tracking/send-health-declaration`, {});
  }

  sendBtfRequest(): Observable<any> {
    return this.http.post(`${environment.apiUrl}/weapon-tracking/send-btf-request`, {});
  }

  // חדש - תצורת עמודות מותאמות אישית
  getConfig(): Observable<WeaponTrackingConfig> {
    return this.http.get<WeaponTrackingConfig>(`${environment.apiUrl}/weapon-tracking/config`);
  }

  updateConfig(config: WeaponTrackingConfig): Observable<any> {
    return this.http.put(`${environment.apiUrl}/weapon-tracking/config`, config);
  }
}