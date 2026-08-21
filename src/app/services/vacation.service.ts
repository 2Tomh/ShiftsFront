import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VacationRequest } from '../Models/vacationRequest.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VacationService {
  private apiUrl = `${environment.apiUrl}/Vacations`;

  constructor(private http: HttpClient) { }

  submitRequest(payload: { employeeName: string, startDate: string, endDate: string, reason?: string }): Observable<any> {
    return this.http.post(this.apiUrl, payload);
  }

  getForEmployee(employeeName: string): Observable<VacationRequest[]> {
    return this.http.get<VacationRequest[]>(`${this.apiUrl}/employee/${encodeURIComponent(employeeName)}`);
  }

  getAll(status?: string): Observable<VacationRequest[]> {
    const url = status ? `${this.apiUrl}?status=${status}` : this.apiUrl;
    return this.http.get<VacationRequest[]>(url);
  }

  updateStatus(id: string, status: 'Approved' | 'Rejected', adminNote?: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/status`, { status, adminNote });
  }

  deleteRequest(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}