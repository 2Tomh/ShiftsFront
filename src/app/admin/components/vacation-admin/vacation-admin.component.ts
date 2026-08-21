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
  activeFilter: 'All' | 'Pending' | 'Approved' | 'Rejected' = 'Pending';
  isLoading = false;

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

  statusLabel(status: string): string {
    switch (status) {
      case 'Pending': return 'ממתינה';
      case 'Approved': return 'אושרה';
      case 'Rejected': return 'נדחתה';
      default: return status;
    }
  }
}