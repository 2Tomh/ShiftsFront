import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { NotificationService, AppNotification } from '../../../../services/notification.service';

@Component({
  selector: 'app-employee-layout',
  templateUrl: './employee-layout.component.html',
  styleUrls: ['./employee-layout.component.css']
})
export class EmployeeLayoutComponent implements OnInit {
  // חדש - תור ההתראות שממתינות להצגה. מציגים אחת בכל פעם (פופאפ),
  // וכשסוגרים אותה עוברים לבאה בתור, עד שהתור מתרוקן.
  pendingNotifications: AppNotification[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadNotifications();
  }

  get employeeName(): string | null {
    return this.authService.getEmployeeName() || this.authService.getUsername();
  }

  get currentNotification(): AppNotification | null {
    return this.pendingNotifications.length > 0 ? this.pendingNotifications[0] : null;
  }

  loadNotifications(): void {
    this.notificationService.getUnread().subscribe({
      next: (notifications) => {
        this.pendingNotifications = notifications;
      },
      error: () => { }
    });
  }

  dismissCurrentNotification(): void {
    const current = this.currentNotification;
    if (!current) return;

    this.notificationService.markAsRead(current.id).subscribe({
      next: () => {
        this.pendingNotifications.shift();
      },
      error: () => {
        this.pendingNotifications.shift();
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}