import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { WeaponTracking } from '../Models/weapon-tracking.model';

@Injectable({
  providedIn: 'root'
})
export class WeaponTrackingService {
  // תוקן - חוזר לשימוש ב-environment.apiUrl (כמו כל שאר השירותים
  // בפרויקט), במקום כתובת קשיחה - כדי ש-localhost:7278 בפיתוח
  // ימשיך לעבוד, לא רק הפרודקשן.
  constructor(private http: HttpClient) {}

  // תוקן - אין יותר employeeId כפרמטר: השרת קובע לפי ה-Token שלך
  getMyTracking(): Observable<WeaponTracking> {
    return this.http.get<WeaponTracking>(`${environment.apiUrl}/weapon-tracking/my`);
  }

  getAllTracking(): Observable<WeaponTracking[]> {
    return this.http.get<WeaponTracking[]>(`${environment.apiUrl}/weapon-tracking`);
  }

  updateTracking(employeeId: string, data: Partial<WeaponTracking>): Observable<WeaponTracking> {
    return this.http.put<WeaponTracking>(`${environment.apiUrl}/weapon-tracking/${employeeId}`, data);
  }

  sendHealthDeclaration(): Observable<any> {
    return this.http.post(`${environment.apiUrl}/weapon-tracking/send-health-declaration`, {});
  }

  sendBtfRequest(): Observable<any> {
    return this.http.post(`${environment.apiUrl}/weapon-tracking/send-btf-request`, {});
  }
}