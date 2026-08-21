import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// חדש - שומר גישה כללי: מוודא שהמשתמש מחובר בכלל (כל תפקיד), לפני
// שהוא נכנס לאזור העובד. אם לא מחובר - מפנה אוטומטית ל-/login.
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) { }

  canActivate(): boolean {
    if (this.authService.isLoggedIn()) {
      return true;
    }
    this.router.navigate(['/login']);
    return false;
  }
}