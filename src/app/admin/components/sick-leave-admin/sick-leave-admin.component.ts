import { Component, OnInit } from '@angular/core';
import { SickLeaveService } from '../../../services/sickleave.service';
import { SickLeaveRequest } from '../../../Models/sickLeaveRequest.model';

@Component({
  selector: 'app-sick-leave-admin',
  templateUrl: './sick-leave-admin.component.html',
  styleUrls: ['./sick-leave-admin.component.css']
})
export class SickLeaveAdminComponent implements OnInit {
  requests: SickLeaveRequest[] = [];
  activeFilter: 'All' | 'Pending' | 'Approved' | 'Rejected' = 'Pending';
  isLoading = false;

  constructor(private sickLeaveService: SickLeaveService) { }

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

    this.sickLeaveService.getAll(statusParam).subscribe({
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

  approve(req: SickLeaveRequest): void {
    const previousStatus = req.status;
    req.status = 'Approved';

    this.sickLeaveService.updateStatus(req.id, 'Approved').subscribe({
      next: () => {
        if (this.activeFilter !== 'All' && this.activeFilter !== 'Approved') {
          this.loadRequests();
        }
      },
      error: (err) => {
        req.status = previousStatus;
        console.error(err);
        alert('שגיאה באישור הבקשה');
      }
    });
  }

  reject(req: SickLeaveRequest): void {
    const note = prompt('סיבת דחייה (אופציונלי):', '') || undefined;
    const previousStatus = req.status;
    req.status = 'Rejected';
    req.adminNote = note;

    this.sickLeaveService.updateStatus(req.id, 'Rejected', note).subscribe({
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