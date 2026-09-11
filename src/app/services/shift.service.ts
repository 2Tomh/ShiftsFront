import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
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

  // חדש - weekStart חובה כעת (yyyy-MM-dd), כי GetEmployees בשרת
  // דורש אותו כדי לסנן זמינויות לפי שבוע.
  getEmployees(weekStart: string): Observable<Employee[]> {
    const params = new HttpParams().set('weekStart', weekStart);
    return this.http.get<Employee[]>(`${this.apiUrl}/Employees`, { params });
  }

  // תוקן - נוסף employeeName אופציונלי: כשעורכים טקסט חופשי (כפולה,
  // "גיא/אלכס" וכו') אין employeeId אמיתי, אז בלי לשלוח את השם עצמו
  // השרת לא ידע מה לשמור והיה מפרש את זה כבקשת "הסר שיבוץ".
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

  // תוקן - Angular HttpClient לא הופך מחרוזת גולמית ל-JSON באופן
  // אוטומטי (הוא שולח אותה כ-text/plain), וזה גרם לשרת להחזיר
  // 415 Unsupported Media Type ולדלג בשקט על כל יצירת השבוע.
  // כאן אנחנו עושים JSON.stringify במפורש וקובעים Content-Type,
  // כדי שהשרת יקבל JSON תקין ויוכל לעשות Bind ל-DateTime.
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