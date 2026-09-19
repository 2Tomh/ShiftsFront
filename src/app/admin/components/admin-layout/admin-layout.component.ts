import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent {
  // תוקן - היה קבוע ל-true, אז בכל רענון (גם בטלפון) התפריט נפתח
  // אוטומטית מעל התוכן. עכשיו תלוי ברוחב המסך בזמן הטעינה: פתוח
  // כברירת מחדל בדסקטופ (כמו קודם), סגור כברירת מחדל במובייל.
  // 700 כאן חייב להישאר זהה למספר ב-@media (max-width: 700px)
  // שב-admin-layout.component.css, אחרת ייווצר פער בין השניים.
  isSidenavOpen = window.innerWidth > 700;

  constructor(private authService: AuthService, private router: Router) { }

  get username(): string | null {
    return this.authService.getUsername();
  }

  toggleSidenav(): void {
    this.isSidenavOpen = !this.isSidenavOpen;
  }

  // חדש - בחירת לשונית מהתפריט (במובייל, כשהוא פתוח כ"מגירה" מעל
  // התוכן) צריכה גם לסגור אותו אוטומטית - אחרת התפריט נשאר פתוח
  // מעל העמוד החדש שנטען, במקום להתפנות ולתת לראות אותו. בדסקטופ
  // (מעל 700px) זה לא רלוונטי - שם הבחירה בלשונית לא אמורה לסגור
  // את התפריט הרגיל.
  onNavLinkClick(): void {
    if (window.innerWidth <= 700) {
      this.isSidenavOpen = false;
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}