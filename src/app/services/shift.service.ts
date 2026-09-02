import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Shift } from '../Models/shift.model';
import { Employee } from '../Models/emplyee.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ShiftService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // --- שליפת נתונים ---

  // חדש - weekStart אופציונלי (yyyy-MM-dd): כשמועבר, מחזיר רק את
  // משמרות השבוע הזה (נדרש כדי לתמוך בכמה סידורים מקבילים בלי
  // שידרסו זה את זה בתצוגה).
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

  // חדש - weekStart אופציונלי: כשמועבר, מפרסם רק את משמרות השבוע הזה.
  publishWeek(weekStart?: string): Observable<any> {
    let params = new HttpParams();
    if (weekStart) {
      params = params.set('weekStart', weekStart);
    }
    return this.http.put(`${this.apiUrl}/Shifts/publish`, {}, { params });
  }

  getEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${this.apiUrl}/Employees`);
  }

  // --- פעולות שיבוץ ויצירה ---
  assignEmployee(shiftId: string, employeeId: string | null, role: string): Observable<any> {
    const payload = { shiftId, employeeId, role };
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

  getAvailabilityForEmployee(employeeName: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/Import/availability/${encodeURIComponent(employeeName)}`);
  }

  generateWeek(startDate: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/Shifts/generate-week`, startDate);
  }

  // --- פונקציות מחיקה ואיפוס ---
  clearAllData(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/Employees/reset-all`);
  }
}