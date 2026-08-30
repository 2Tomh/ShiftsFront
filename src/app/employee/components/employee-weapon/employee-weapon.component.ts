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

  // תוקן - הוסר לגמרי currentEmployeeId הקשיח ('12345'). השרת מזהה
  // את העובד לפי ה-Token, אז אין צורך (וגם לא בטוח) להעביר ID מהפרונט.
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

  sendDeclaration(): void {
    const subject = encodeURIComponent('הצהרת בריאות להוצאת נשק אישי');
    const body = encodeURIComponent('שלום,\n\nאני מגיש את הצהרת הבריאות שלי לצורך הוצאת נשק אישי.\n\nבברכה,\nעובד');
    window.open(`mailto:${this.managerEmail}?subject=${subject}&body=${body}`, '_blank');

    this.weaponService.sendHealthDeclaration().subscribe({
      next: () => {
        this.tracking.healthDeclarationSent = true;
      },
      error: (err) => console.error('שגיאה בעדכון הסטטוס', err)
    });
  }

  sendBtf(): void {
    const subject = encodeURIComponent('בקשה לבט"פ להוצאת נשק אישי');
    const body = encodeURIComponent('שלום,\n\nאני מעוניין להגיש בקשה לבט"פ לצורך הוצאת נשק אישי.\n\nבברכה,\nעובד');
    window.open(`mailto:${this.managerEmail}?subject=${subject}&body=${body}`, '_blank');

    this.weaponService.sendBtfRequest().subscribe({
      next: () => {
        this.tracking.btfRequestSubmitted = true;
      },
      error: (err) => console.error('שגיאה בעדכון הסטטוס', err)
    });
  }
}