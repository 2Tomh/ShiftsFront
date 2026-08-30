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
    this.weaponService.sendHealthDeclaration(this.currentEmployeeId).subscribe({
      next: () => {
        alert('ההצהרה נשלחה בהצלחה למנהל');
        this.tracking.healthDeclarationSent = true;
      },
      error: (err) => console.error('שגיאה בשליחת ההצהרה', err)
    });
  }

  sendBtf(): void {
    this.weaponService.sendBtfRequest(this.currentEmployeeId).subscribe({
      next: () => {
        alert('בקשת הבט"פ נשלחה בהצלחה למנהל');
        this.tracking.btfRequestSubmitted = true;
      },
      error: (err) => console.error('שגיאה בשליחת בקשת הבט"פ', err)
    });
  }
}