import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username = '';
  password = '';
  isSubmitting = false;
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) { }

  submit(): void {
    if (!this.username.trim() || !this.password.trim()) {
      this.errorMessage = 'נא להזין שם משתמש וסיסמה';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.authService.login(this.username.trim(), this.password).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        // ניתוב לפי תפקיד - אדמין ללוח הניהול, עובד ללוח המשמרות שלו.
        if (res.role === 'Admin') {
          this.router.navigate(['/admin/board']);
        } else {
          this.router.navigate(['/schedule']);
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.error || 'שגיאה בהתחברות - בדוק שם משתמש וסיסמה';
      }
    });
  }
}