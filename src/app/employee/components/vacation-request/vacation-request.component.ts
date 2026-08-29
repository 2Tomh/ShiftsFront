import { Component, OnInit } from '@angular/core';
import { VacationService } from '../../../services/vacation.service';
import { VacationRequest } from '../../../Models/vacationRequest.model';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-vacation-request',
  templateUrl: './vacation-request.component.html',
  styleUrls: ['./vacation-request.component.css']
})
export class VacationRequestComponent implements OnInit {
  employeeName: string = '';
  startDate: string = '';
  endDate: string = '';
  reason: string = '';

  isSubmitting = false;
  isLoadingHistory = false;
  myRequests: VacationRequest[] = [];
  historyLoaded = false;

  constructor(
    private vacationService: VacationService,
    private authService: AuthService
  ) { }

  // חדש - קריטי: השם נלקח אוטומטית מהזהות המחוברת (Login), ולא
  // מוקלד ידנית יותר - אותה סיבה בדיוק כמו בטופס הגשת הזמינות: שם
  // שהוקלד בטעות שונה מזה שנוצר ב"ניהול משתמשים" יוצר רשומת עובד
  // כפולה ומנותקת. גם ההיסטוריה נטענת אוטומטית מיד, בלי צורך ללחוץ
  // כפתור או להקליד שוב את השם.
  ngOnInit(): void {
    this.employeeName = this.authService.getEmployeeName() || this.authService.getUsername() || '';
    if (this.employeeName) {
      this.loadMyRequests();
    }
  }

  submitRequest(): void {
    if (!this.employeeName.trim()) {
      alert('שגיאה: לא זוהה שם עובד מחובר. נסי להתחבר מחדש.');
      return;
    }
    if (!this.startDate || !this.endDate) {
      alert('נא לבחור תאריך התחלה ותאריך סיום');
      return;
    }
    if (this.endDate < this.startDate) {
      alert('תאריך הסיום לא יכול להיות לפני תאריך ההתחלה');
      return;
    }

    this.isSubmitting = true;

    this.vacationService.submitRequest({
      employeeName: this.employeeName.trim(),
      startDate: this.startDate,
      endDate: this.endDate,
      reason: this.reason.trim() || undefined
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        alert('בקשת החופשה נשלחה בהצלחה! היא ממתינה לאישור מנהל.');
        this.startDate = '';
        this.endDate = '';
        this.reason = '';
        this.loadMyRequests();
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error(err);
        alert('שגיאה בשליחת הבקשה: ' + (err.error?.error || err.error || 'בדוק חיבור לשרת'));
      }
    });
  }

  loadMyRequests(): void {
    if (!this.employeeName.trim()) return;

    this.isLoadingHistory = true;
    this.vacationService.getForEmployee(this.employeeName.trim()).subscribe({
      next: (requests) => {
        this.isLoadingHistory = false;
        this.myRequests = requests;
        this.historyLoaded = true;
      },
      error: (err) => {
        this.isLoadingHistory = false;
        console.error(err);
      }
    });
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'Pending': return 'ממתינה לאישור';
      case 'Approved': return 'אושרה';
      case 'Rejected': return 'נדחתה';
      default: return status;
    }
  }
}