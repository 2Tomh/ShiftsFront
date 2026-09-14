import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { LoginResponse } from '../Models/user.model';

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

  // תוקן - נוסף rememberMe: כשמסומן, שומרים ב-localStorage (נשאר
  // גם אחרי סגירת הדפדפן/המחשב). כשלא מסומן, שומרים ב-sessionStorage
  // (נמחק אוטומטית כשהטאב/הדפדפן נסגר) - בדיוק כמו "זכור אותי" בכל
  // אתר רגיל. גם השרת מקבל את זה כדי להנפיק טוקן שתקף ל-30 יום
  // במקום 12 שעות, כדי שלא יידרש login חוזר תוך כדי.
  login(username: string, password: string, rememberMe: boolean = false): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { username, password, rememberMe }).pipe(
      tap(res => {
        this.clearBothStorages();
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem(this.TOKEN_KEY, res.token);
        storage.setItem(this.ROLE_KEY, res.role);
        storage.setItem(this.USERNAME_KEY, res.username);
        if (res.employeeName) {
          storage.setItem(this.EMPLOYEE_NAME_KEY, res.employeeName);
        }
      })
    );
  }

  logout(): void {
    this.clearBothStorages();
  }

  // חדש - מנקה גם localStorage וגם sessionStorage, כדי לא להשאיר
  // נתונים ישנים סותרים ממקור קודם (למשל אם פעם התחברו עם "זכור
  // אותי" ופעם בלי).
  private clearBothStorages(): void {
    [localStorage, sessionStorage].forEach(s => {
      s.removeItem(this.TOKEN_KEY);
      s.removeItem(this.ROLE_KEY);
      s.removeItem(this.USERNAME_KEY);
      s.removeItem(this.EMPLOYEE_NAME_KEY);
    });
  }

  // חדש - בודק קודם localStorage (זכור אותי), ואם אין - נופל בחזרה
  // ל-sessionStorage. כך שאר האפליקציה (guards, interceptors וכו')
  // ממשיכה לעבוד בלי לדעת/להתעניין באיזה אחסון בפועל נעשה שימוש.
  private getItem(key: string): string | null {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key);
  }

  getToken(): string | null {
    return this.getItem(this.TOKEN_KEY);
  }

  getRole(): 'Admin' | 'Employee' | null {
    return this.getItem(this.ROLE_KEY) as 'Admin' | 'Employee' | null;
  }

  getUsername(): string | null {
    return this.getItem(this.USERNAME_KEY);
  }

  getEmployeeName(): string | null {
    return this.getItem(this.EMPLOYEE_NAME_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    return this.getRole() === 'Admin';
  }
}