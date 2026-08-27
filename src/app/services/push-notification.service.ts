import { Injectable } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

// חדש - עוטף את SwPush (ניתן ל-Injection של Angular Service Worker)
// ומטפל בכל תהליך ההרשמה להתראות Push: בקשת הרשאה מהדפדפן, קבלת
// מנוי (Subscription), ושליחתו לשרת לשמירה.
@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  constructor(private swPush: SwPush, private http: HttpClient) { }

  get isSupported(): boolean {
    return this.swPush.isEnabled;
  }

  subscribeToPush(): Promise<void> {
    if (!this.swPush.isEnabled) {
      alert('הדפדפן הזה לא תומך בהתראות Push, או שהאתר לא נטען דרך HTTPS.');
      return Promise.resolve();
    }

    return this.swPush.requestSubscription({
      serverPublicKey: environment.vapidPublicKey
    }).then(sub => {
      return this.http.post(`${environment.apiUrl}/Push/subscribe`, sub).toPromise().then(() => {
        alert('התראות הופעלו בהצלחה! תקבלי עדכון כשחופשה/מחלה תאושר או תידחה.');
      });
    }).catch(err => {
      console.error('שגיאה בהרשמה להתראות:', err);
      alert('לא הצלחנו להפעיל התראות. ייתכן שדחית את ההרשאה בדפדפן.');
    });
  }
}