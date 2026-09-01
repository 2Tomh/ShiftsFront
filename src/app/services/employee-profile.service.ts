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

  create(profile: Partial<EmployeeProfile>) {
    return this.http.post<EmployeeProfile>(`${environment.apiUrl}/EmployeeProfile`, profile);
  }

  update(id: string, profile: EmployeeProfile) {
    return this.http.put(`${environment.apiUrl}/EmployeeProfile/${id}`, profile);
  }

  delete(id: string) {
    return this.http.delete(`${environment.apiUrl}/EmployeeProfile/${id}`);
  }
}