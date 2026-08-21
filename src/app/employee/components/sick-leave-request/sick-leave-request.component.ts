import { Component } from '@angular/core';
import { SickLeaveService } from '../../../services/sickleave.service';
import { SickLeaveRequest } from '../../../Models/sickLeaveRequest.model';

@Component({
  selector: 'app-sick-leave-request',
  templateUrl: './sick-leave-request.component.html',
  styleUrls: ['./sick-leave-request.component.css']
})
export class SickLeaveRequestComponent {
  employeeName: string = '';
  startDate: string = '';
  endDate: string = '';
  reason: string = '';

  isSubmitting = false;
  isLoadingHistory = false;
  myRequests: SickLeaveRequest[] = [];
  historyLoaded = false;

  constructor(private sickLeaveService: SickLeaveService) { }

  submitRequest(): void {
    if (!this.employeeName.trim()) {
      alert('נא להזין שם!');
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

    this.sickLeaveService.submitRequest({
      employeeName: this.employeeName.trim(),
      startDate: this.startDate,
      endDate: this.endDate,
      reason: this.reason.trim() || undefined
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        alert('בקשת ימי המחלה נשלחה בהצלחה! היא ממתינה לאישור מנהל.');
        this.startDate = '';
        this.endDate = '';
        this.reason = '';
        if (this.historyLoaded) {
          this.loadMyRequests();
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error(err);
        alert('שגיאה בשליחת הבקשה: ' + (err.error?.error || err.error || 'בדוק חיבור לשרת'));
      }
    });
  }

  loadMyRequests(): void {
    if (!this.employeeName.trim()) {
      alert('נא להזין שם קודם');
      return;
    }

    this.isLoadingHistory = true;
    this.sickLeaveService.getForEmployee(this.employeeName.trim()).subscribe({
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