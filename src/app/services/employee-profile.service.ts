import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { EmployeeProfile, EmployeeManagementConfig } from '../Models/employee-profile.model';

@Injectable({
  providedIn: 'root'
})
export class EmployeeProfileService {
  constructor(private http: HttpClient) { }

  getConfig() {
    return this.http.get<EmployeeManagementConfig>(`${environment.apiUrl}/EmployeeProfile/config`);
  }

  updateConfig(config: EmployeeManagementConfig) {
    return this.http.put(`${environment.apiUrl}/EmployeeProfile/config`, config);
  }

  getAll() {
    return this.http.get<EmployeeProfile[]>(`${environment.apiUrl}/EmployeeProfile`);
  }

  // יצירת עובד חדש - POST עם אובייקט מלא (רשומה חדשה, אין "מה השתנה")
  create(profile: Partial<EmployeeProfile>) {
    return this.http.post<EmployeeProfile>(`${environment.apiUrl}/EmployeeProfile`, profile);
  }

  // עריכת עובד קיים - PATCH עם רק השדות שהשתנו בפועל
  update(id: string, changes: Partial<EmployeeProfile>) {
    return this.http.patch(`${environment.apiUrl}/EmployeeProfile/${id}`, changes);
  }

  removeAccess(id: string) {
    return this.http.delete(`${environment.apiUrl}/EmployeeProfile/${id}/access`);
  }

  delete(id: string) {
    return this.http.delete(`${environment.apiUrl}/EmployeeProfile/${id}`);
  }
}