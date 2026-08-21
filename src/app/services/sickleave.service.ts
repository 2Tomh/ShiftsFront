import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SickLeaveRequest } from '../Models/sickLeaveRequest.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SickLeaveService {
  private apiUrl = `${environment.apiUrl}/SickLeave`;

  constructor(private http: HttpClient) { }

  submitRequest(payload: { employeeName: string, startDate: string, endDate: string, reason?: string }): Observable<any> {
    return this.http.post(this.apiUrl, payload);
  }

  getForEmployee(employeeName: string): Observable<SickLeaveRequest[]> {
    return this.http.get<SickLeaveRequest[]>(`${this.apiUrl}/employee/${encodeURIComponent(employeeName)}`);
  }

  getAll(status?: string): Observable<SickLeaveRequest[]> {
    const url = status ? `${this.apiUrl}?status=${status}` : this.apiUrl;
    return this.http.get<SickLeaveRequest[]>(url);
  }

  updateStatus(id: string, status: 'Approved' | 'Rejected', adminNote?: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/status`, { status, adminNote });
  }

  deleteRequest(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}