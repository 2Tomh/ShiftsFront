import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Shift } from '../Models/shift.model';
import { Employee } from '../Models/emplyee.model';
import { EmployeeHistoryEntry } from '../Models/employee-history-entry.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ShiftService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getShifts(weekStart?: string): Observable<Shift[]> {
    let params = new HttpParams();
    if (weekStart) {
      params = params.set('weekStart', weekStart);
    }
    return this.http.get<Shift[]>(`${this.apiUrl}/Shifts`, { params });
  }

  getPublishedShifts(): Observable<Shift[]> {
    return this.http.get<Shift[]>(`${this.apiUrl}/Shifts/published`);
  }

  publishWeek(weekStart?: string): Observable<any> {
    let params = new HttpParams();
    if (weekStart) {
      params = params.set('weekStart', weekStart);
    }
    return this.http.put(`${this.apiUrl}/Shifts/publish`, {}, { params });
  }

  getEmployees(weekStart: string): Observable<Employee[]> {
    const params = new HttpParams().set('weekStart', weekStart);
    return this.http.get<Employee[]>(`${this.apiUrl}/Employees`, { params });
  }

  assignEmployee(shiftId: string, employeeId: string | null, role: string, employeeName?: string | null): Observable<any> {
    const payload = { shiftId, employeeId, role, employeeName: employeeName ?? null };
    return this.http.post(`${this.apiUrl}/Shifts/assign`, payload);
  }

  createEmployee(name: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/Employees`, { name: name });
  }

  updateEmployeeName(employeeId: string, newName: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/Employees/${employeeId}/name`, { name: newName });
  }

  submitEmployeeAvailability(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/Import/submit-availability`, payload);
  }

  getAvailabilityForEmployee(employeeName: string, weekStart: string): Observable<any> {
    const params = new HttpParams().set('weekStart', weekStart);
    return this.http.get(`${this.apiUrl}/Import/availability/${encodeURIComponent(employeeName)}`, { params });
  }

  // חדש - מחיקת כל ההגשות של עובד לשבוע ספציפי. שימושי לניקוי
  // הגשות תקועות/כפולות (למשל מבאג ישן), וגם ככפתור "מחק הגשה" רגיל.
  deleteEmployeeAvailabilityForWeek(employeeName: string, weekStart: string): Observable<any> {
    const params = new HttpParams()
      .set('employeeName', employeeName)
      .set('weekStart', weekStart);
    return this.http.delete(`${this.apiUrl}/Import/employee-availability`, { params });
  }

  getEmployeeHistory(employeeName: string, startDate: string, endDate: string): Observable<EmployeeHistoryEntry[]> {
    const params = new HttpParams()
      .set('employeeName', employeeName)
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.get<EmployeeHistoryEntry[]>(`${this.apiUrl}/Import/employee-history`, { params });
  }

  generateWeek(startDate: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/Shifts/generate-week`,
      JSON.stringify(startDate),
      { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) }
    );
  }

  clearAllData(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/Employees/reset-all`);
  }
}