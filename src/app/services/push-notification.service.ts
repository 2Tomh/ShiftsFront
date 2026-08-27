import { Injectable } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  constructor(private swPush: SwPush, private http: HttpClient) { }

  get isSupported(): boolean {
    return this.swPush.isEnabled;
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  subscribeToPush(): Promise<void> {
    if (!this.swPush.isEnabled) {
      alert('הדפדפן הזה לא תומך בהתראות Push, או שהאתר לא נטען דרך HTTPS.');
      return Promise.resolve();
    }

    const convertedKey = this.urlBase64ToUint8Array(environment.vapidPublicKey);

    return this.swPush.requestSubscription({
      serverPublicKey: convertedKey as unknown as string
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