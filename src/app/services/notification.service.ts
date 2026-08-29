import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

// חדש - שירות פשוט להתראות בתוך האתר (In-App). בודק אם יש התראות
// שטרם נצפו, ומאפשר לסמן אותן כ"נצפו" אחרי שהמשתמש ראה אותן.
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private http: HttpClient) { }

  getUnread() {
    return this.http.get<AppNotification[]>(`${environment.apiUrl}/Notifications/unread`);
  }

  markAsRead(id: string) {
    return this.http.put(`${environment.apiUrl}/Notifications/${id}/mark-read`, {});
  }
}