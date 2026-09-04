import { Component, OnInit } from '@angular/core';
import { WeaponTracking } from '../../../Models/weapon-tracking.model';
import { WeaponTrackingService } from '../../../services/weapon-tracking.service';

@Component({
  selector: 'app-admin-weapon',
  templateUrl: './admin-weapon.component.html',
  styleUrls: ['./admin-weapon.component.css']
})
export class AdminWeaponComponent implements OnInit {
  employeesList: WeaponTracking[] = [];

  constructor(private weaponService: WeaponTrackingService) {}

  ngOnInit(): void {
    this.loadAllTracking();
  }

  loadAllTracking(): void {
    this.weaponService.getAllTracking().subscribe(data => {
      this.employeesList = data;
    });
  }

  toggleBtfDate(item: WeaponTracking, event: any): void {
    if (event.target.checked) {
      item.btfAppointmentDate = new Date().toISOString().substring(0, 16);
    } else {
      item.btfAppointmentDate = null;
    }
  }

  saveChanges(item: WeaponTracking): void {
    this.weaponService.updateTracking(item.employeeId, item).subscribe({
      next: () => alert('השינויים נשמרו בהצלחה'),
      error: (err) => console.error('שגיאה בשמירה', err)
    });
  }
}