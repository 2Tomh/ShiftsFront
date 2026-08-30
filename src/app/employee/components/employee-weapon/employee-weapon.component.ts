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

  private currentEmployeeId = '12345'; // החלף ב-ID של העובד המחובר בפועל
  private managerEmail = 'manager@company.com'; // מייל המנהל

  constructor(private weaponService: WeaponTrackingService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.weaponService.getEmployeeTracking(this.currentEmployeeId).subscribe(data => {
      if (data) this.tracking = data;
    });
  }

  sendDeclaration(): void {
    // פתיחת חלון מייל חדש עם נושא ותוכן מוכנים מראש
    const subject = encodeURIComponent('הצהרת בריאות להוצאת נשק אישי');
    const body = encodeURIComponent('שלום,\n\nאני מגיש את הצהרת הבריאות שלי לצורך הוצאת נשק אישי.\n\nבברכה,\nעובד');
    window.open(`mailto:${this.managerEmail}?subject=${subject}&body=${body}`, '_blank');

    // עדכון הסטטוס בשרת ובבסיס הנתונים
    this.weaponService.sendHealthDeclaration(this.currentEmployeeId).subscribe({
      next: () => {
        this.tracking.healthDeclarationSent = true;
      },
      error: (err) => console.error('שגיאה בעדכון הסטטוס', err)
    });
  }

  sendBtf(): void {
    // פתיחת חלון מייל חדש לבט"פ
    const subject = encodeURIComponent('בקשה לבט"פ להוצאת נשק אישי');
    const body = encodeURIComponent('שלום,\n\nאני מעוניין להגיש בקשה לבט"פ לצורך הוצאת נשק אישי.\n\nבברכה,\nעובד');
    window.open(`mailto:${this.managerEmail}?subject=${subject}&body=${body}`, '_blank');

    // עדכון הסטטוס בשרת ובבסיס הנתונים
    this.weaponService.sendBtfRequest(this.currentEmployeeId).subscribe({
      next: () => {
        this.tracking.btfRequestSubmitted = true;
      },
      error: (err) => console.error('שגיאה בעדכון הסטטוס', err)
    });
  }
}