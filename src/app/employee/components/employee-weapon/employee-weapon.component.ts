import { Component, OnInit } from '@angular/core';
import { WeaponTracking } from '../../../Models/weapon-tracking.model';
import { WeaponTrackingService } from '../../../services/weapon-tracking.service';
import { ManagerSettingsService } from '../../../services/ManagerSettings.service';

@Component({
  selector: 'app-employee-weapon',
  templateUrl: './employee-weapon.component.html',
  styleUrls: ['./employee-weapon.component.css']
})
export class EmployeeWeaponComponent implements OnInit {
  tracking: WeaponTracking = {
    employeeId: '',
    healthDeclarationSent: false,
    btfRequestSubmitted: false,
    btfAppointmentDate: null,
    psychologistAppointment: false,
    refreshDate: null,
    licenseDate: null,
    customFieldValues: {}
  };

  // תוקן - במקום קבוע hardcoded, נטען מהשרת (ManagerSettingsService)
  // בטעינת הקומפוננטה. ככה אם המנהל מעדכן את המייל שלו ב"פרטי מנהל",
  // זה משתקף כאן אוטומטית בלי לגעת בקוד. עד שהטעינה מסתיימת, נשאר
  // ריק - ראה ההגנה ב-openGmailCompose למטה.
  private managerEmail = '';

  constructor(
    private weaponService: WeaponTrackingService,
    private managerSettingsService: ManagerSettingsService
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.loadManagerEmail();
  }

  loadData(): void {
    this.weaponService.getMyTracking().subscribe(data => {
      if (data) this.tracking = data;
    });
  }

  private loadManagerEmail(): void {
    this.managerSettingsService.get().subscribe({
      next: (settings) => {
        this.managerEmail = settings?.email || '';
      },
      error: (err) => {
        console.error('שגיאה בטעינת פרטי המנהל (מייל יעד):', err);
      }
    });
  }

  // חדש - true אם תאריך הרענון נמצא תוך 30 יום (או כבר עבר) - מדגיש
  // ויזואלית את הכרטיס בצהוב/אדום כדי שהעובד ישים לב בעצמו, לא רק
  // דרך ההתראה שנוצרת אוטומטית.
  isRefreshSoon(): boolean {
    if (!this.tracking.refreshDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const refresh = new Date(this.tracking.refreshDate);
    refresh.setHours(0, 0, 0, 0);
    const daysLeft = Math.round((refresh.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 30;
  }

  private openGmailCompose(subject: string, body: string): void {
    // תוקן - אם פרטי המנהל עוד לא נטענו (או שהמנהל מעולם לא הגדיר
    // מייל ב"פרטי מנהל"), לא פותחים חלון עם "to=" ריק בשקט - עדיף
    // להתריע לעובד במפורש כדי שינסה שוב או ידווח שההגדרה חסרה.
    if (!this.managerEmail) {
      alert('כתובת המייל של המנהל עדיין לא נטענה או לא הוגדרה במערכת. נסה שוב בעוד רגע, ואם זה חוזר - דווח למנהל.');
      return;
    }

    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${this.managerEmail}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank');
  }

  sendDeclaration(): void {
    this.openGmailCompose(
      'הצהרת בריאות להוצאת נשק אישי',
      'שלום,\n\nאני מגיש את הצהרת הבריאות שלי לצורך הוצאת נשק אישי.\n\nבברכה,\nעובד'
    );

    this.weaponService.sendHealthDeclaration().subscribe({
      next: () => {
        this.tracking.healthDeclarationSent = true;
      },
      error: (err) => console.error('שגיאה בעדכון הסטטוס', err)
    });
  }

  sendBtf(): void {
    this.openGmailCompose(
      'בקשה לבט"פ להוצאת נשק אישי',
      'שלום,\n\nאני מעוניין להגיש בקשה לבט"פ לצורך הוצאת נשק אישי.\n\nבברכה,\nעובד'
    );

    this.weaponService.sendBtfRequest().subscribe({
      next: () => {
        this.tracking.btfRequestSubmitted = true;
      },
      error: (err) => console.error('שגיאה בעדכון הסטטוס', err)
    });
  }
}