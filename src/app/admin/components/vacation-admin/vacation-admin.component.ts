import { Component, OnInit } from '@angular/core';
import { VacationService } from '../../../services/vacation.service';
import { VacationRequest } from '../../../Models/vacationRequest.model';

@Component({
  selector: 'app-vacation-admin',
  templateUrl: './vacation-admin.component.html',
  styleUrls: ['./vacation-admin.component.css']
})
export class VacationAdminComponent implements OnInit {
  requests: VacationRequest[] = [];
  // תוקן - ברירת מחדל "הכל" במקום "ממתינות".
  activeFilter: 'All' | 'Pending' | 'Approved' | 'Rejected' = 'All';
  isLoading = false;

  // חדש - עריכת בקשה קיימת (תאריכים/סיבה) inline בשורה עצמה.
  editingId: string | null = null;
  editStartDate: string = '';
  editEndDate: string = '';
  editReason: string = '';

  constructor(private vacationService: VacationService) { }

  ngOnInit(): void {
    this.loadRequests();
  }

  setFilter(filter: 'All' | 'Pending' | 'Approved' | 'Rejected'): void {
    this.activeFilter = filter;
    this.loadRequests();
  }

  loadRequests(): void {
    this.isLoading = true;
    const statusParam = this.activeFilter === 'All' ? undefined : this.activeFilter;

    this.vacationService.getAll(statusParam).subscribe({
      next: (data) => {
        this.isLoading = false;
        this.requests = data;
      },
      error: (err) => {
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  approve(req: VacationRequest): void {
    // Optimistic UI - מעדכנים מיד במסך, ומתקנים אם השרת נכשל
    const previousStatus = req.status;
    req.status = 'Approved';

    this.vacationService.updateStatus(req.id, 'Approved').subscribe({
      next: () => {
        if (this.activeFilter !== 'All' && this.activeFilter !== 'Approved') {
          this.loadRequests(); // הבקשה כבר לא שייכת לתצוגה המסוננת הנוכחית
        }
      },
      error: (err) => {
        req.status = previousStatus;
        console.error(err);
        alert('שגיאה באישור הבקשה');
      }
    });
  }

  reject(req: VacationRequest): void {
    const note = prompt('סיבת דחייה (אופציונלי):', '') || undefined;
    const previousStatus = req.status;
    req.status = 'Rejected';
    req.adminNote = note;

    this.vacationService.updateStatus(req.id, 'Rejected', note).subscribe({
      next: () => {
        if (this.activeFilter !== 'All' && this.activeFilter !== 'Rejected') {
          this.loadRequests();
        }
      },
      error: (err) => {
        req.status = previousStatus;
        console.error(err);
        alert('שגיאה בדחיית הבקשה');
      }
    });
  }

  // חדש - עריכה
  startEdit(req: VacationRequest): void {
    this.editingId = req.id;
    this.editStartDate = this.toDateInputValue(req.startDate);
    this.editEndDate = this.toDateInputValue(req.endDate);
    this.editReason = req.reason || '';
  }

  isEditing(req: VacationRequest): boolean {
    return this.editingId === req.id;
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editStartDate = '';
    this.editEndDate = '';
    this.editReason = '';
  }

  saveEdit(req: VacationRequest): void {
    if (!this.editStartDate || !this.editEndDate) {
      alert('יש לספק תאריך התחלה וסיום');
      return;
    }
    if (this.editEndDate < this.editStartDate) {
      alert('תאריך הסיום לא יכול להיות לפני תאריך ההתחלה');
      return;
    }

    const payload = {
      startDate: this.editStartDate,
      endDate: this.editEndDate,
      reason: this.editReason || undefined
    };

    this.vacationService.editRequest(req.id, payload).subscribe({
      next: () => {
        req.startDate = this.editStartDate;
        req.endDate = this.editEndDate;
        req.reason = this.editReason;
        this.cancelEdit();
      },
      error: (err) => {
        console.error(err);
        alert('שגיאה בשמירת השינויים');
      }
    });
  }

  // חדש - מחיקה
  deleteRequest(req: VacationRequest): void {
    if (!confirm(`למחוק לצמיתות את בקשת החופשה של ${req.employeeName}?`)) return;

    this.vacationService.deleteRequest(req.id).subscribe({
      next: () => {
        this.requests = this.requests.filter(r => r.id !== req.id);
      },
      error: (err) => {
        console.error(err);
        alert('שגיאה במחיקת הבקשה');
      }
    });
  }

  private toDateInputValue(date: any): string {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'Pending': return 'ממתינה';
      case 'Approved': return 'אושרה';
      case 'Rejected': return 'נדחתה';
      default: return status;
    }
  }
}