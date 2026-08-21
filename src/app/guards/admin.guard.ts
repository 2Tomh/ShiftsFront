import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// חדש - שומר גישה מחמיר יותר: מוודא שהמשתמש לא רק מחובר, אלא גם
// שהתפקיד שלו הוא Admin בדיוק. עובד רגיל שינסה לגשת ל-/admin/* יופנה
// בחזרה ללוח המשמרות שלו, לא ל-login (כי הוא כן מחובר, פשוט לא מורשה).
@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) { }

  canActivate(): boolean {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return false;
    }
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/schedule']);
      return false;
    }
    return true;
  }
}