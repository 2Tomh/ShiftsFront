import { Component, OnInit } from '@angular/core';
import { WeaponTracking } from '../../../Models/weapon-tracking.model';
import { WeaponTrackingService } from '../../../services/weapon-tracking.service';
import { ShiftService } from '../../../services/shift.service';

@Component({
  selector: 'app-admin-weapon',
  templateUrl: './admin-weapon.component.html',
  styleUrls: ['./admin-weapon.component.css']
})
export class AdminWeaponComponent implements OnInit {
  employeesList: WeaponTracking[] = [];

  // חדש - כל העובדים במערכת (לצורך בחירה), ומצב תצוגת הבורר
  allEmployees: any[] = [];
  showEmployeePicker = false;

  constructor(
    private weaponService: WeaponTrackingService,
    private shiftService: ShiftService
  ) {}

  ngOnInit(): void {
    this.loadAllTracking();
  }

  loadAllTracking(): void {
    this.weaponService.getAllTracking().subscribe(data => {
      this.employeesList = data;
    });
  }

  // חדש - רשימת מי שעדיין *לא* נוסף למעקב, לבחירה בבורר
  get availableEmployees(): any[] {
    const trackedIds = new Set(this.employeesList.map(e => e.employeeId));
    return this.allEmployees.filter(e => !trackedIds.has(e.id));
  }

  openEmployeePicker(): void {
    this.showEmployeePicker = true;
    if (this.allEmployees.length === 0) {
      this.shiftService.getEmployees().subscribe(employees => {
        this.allEmployees = employees;
      });
    }
  }

  closeEmployeePicker(): void {
    this.showEmployeePicker = false;
  }

  addEmployee(employee: any): void {
    this.weaponService.addEmployee(employee.id).subscribe({
      next: () => {
        this.closeEmployeePicker();
        this.loadAllTracking();
      },
      error: (err) => {
        console.error('שגיאה בהוספת עובד', err);
        alert('שגיאה בהוספת העובד. נסה שוב.');
      }
    });
  }

  removeEmployee(item: WeaponTracking): void {
    if (!confirm(`להסיר את ${item.employeeName || 'העובד'} מהמעקב לגמרי?`)) return;

    this.weaponService.removeEmployee(item.employeeId).subscribe({
      next: () => {
        this.loadAllTracking();
      },
      error: (err) => {
        console.error('שגיאה בהסרת עובד', err);
        alert('שגיאה בהסרת העובד. נסה שוב.');
      }
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