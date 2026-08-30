import { Component, OnInit } from '@angular/core';
import { WeaponTracking } from '../../../Models/weapon-tracking.model';
import { WeaponTrackingService } from '../../../services/weapon-tracking.service';

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
    psychologistAppointment: false
  };

  private readonly managerEmail = 'manager@company.com';

  constructor(private weaponService: WeaponTrackingService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.weaponService.getMyTracking().subscribe(data => {
      if (data) this.tracking = data;
    });
  }

  // חדש - פותח ישירות את Gmail בדפדפן (חלון Compose), במקום
  // mailto: שפותח את תוכנת המייל שמוגדרת כברירת מחדל במחשב (בד"כ
  // Outlook). כתובת ה-URL של Gmail: view=cm (compose message),
  // fs=1 (fullscreen compose), to/su/body בדיוק כמו ב-mailto.
  private openGmailCompose(subject: string, body: string): void {
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