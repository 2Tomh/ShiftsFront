import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { LoginResponse, AppUser } from '../Models/user.model';

// חדש - שירות האימות המרכזי. שומר את הטוקן ופרטי המשתמש ב-localStorage
// (לא ב-Cookie, כי אין צורך ב-Server-Side Rendering כאן) - כך המשתמש
// נשאר מחובר גם אחרי רענון דף (F5), עד שיתנתק במפורש או שהטוקן יפוג
// (12 שעות, כמו שהוגדר ב-AuthController בשרת).
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/Auth`;

  private readonly TOKEN_KEY = 'shifts_auth_token';
  private readonly ROLE_KEY = 'shifts_auth_role';
  private readonly EMPLOYEE_NAME_KEY = 'shifts_auth_employee_name';
  private readonly USERNAME_KEY = 'shifts_auth_username';

  constructor(private http: HttpClient) { }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { username, password }).pipe(
      tap(res => {
        localStorage.setItem(this.TOKEN_KEY, res.token);
        localStorage.setItem(this.ROLE_KEY, res.role);
        localStorage.setItem(this.USERNAME_KEY, res.username);
        if (res.employeeName) {
          localStorage.setItem(this.EMPLOYEE_NAME_KEY, res.employeeName);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    localStorage.removeItem(this.USERNAME_KEY);
    localStorage.removeItem(this.EMPLOYEE_NAME_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRole(): 'Admin' | 'Employee' | null {
    return localStorage.getItem(this.ROLE_KEY) as 'Admin' | 'Employee' | null;
  }

  getUsername(): string | null {
    return localStorage.getItem(this.USERNAME_KEY);
  }

  getEmployeeName(): string | null {
    return localStorage.getItem(this.EMPLOYEE_NAME_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    return this.getRole() === 'Admin';
  }

  // ===== ניהול משתמשים (רק אדמין) =====
  createUser(payload: { username: string, password: string, role: string, employeeName?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/create-user`, payload);
  }

  getUsers(): Observable<AppUser[]> {
    return this.http.get<AppUser[]>(`${this.apiUrl}/users`);
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${id}`);
  }
}