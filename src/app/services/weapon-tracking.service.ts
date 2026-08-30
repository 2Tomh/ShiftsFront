import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WeaponTracking } from '../Models/weapon-tracking.model';

@Injectable({
  providedIn: 'root'
})
export class WeaponTrackingService {
  // כתובת מלאה כדי למנוע נפילה על Vercel או שגיאות 404
  private apiUrl = 'https://shiftsbackend-8qns.onrender.com/api/weapon-tracking';

  constructor(private http: HttpClient) {}

  getEmployeeTracking(employeeId: string): Observable<WeaponTracking> {
    return this.http.get<WeaponTracking>(`${this.apiUrl}/${employeeId}`);
  }

  getAllTracking(): Observable<WeaponTracking[]> {
    return this.http.get<WeaponTracking[]>(this.apiUrl);
  }

  updateTracking(employeeId: string, data: Partial<WeaponTracking>): Observable<WeaponTracking> {
    return this.http.put<WeaponTracking>(`${this.apiUrl}/${employeeId}`, data);
  }

  sendHealthDeclaration(employeeId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/send-health-declaration`, { employeeId });
  }

  sendBtfRequest(employeeId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/send-btf-request`, { employeeId });
  }
}