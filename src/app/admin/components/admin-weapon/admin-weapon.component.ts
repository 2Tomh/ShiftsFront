import { Component, OnInit } from '@angular/core';
import { WeaponTracking } from '../../../Models/weapon-tracking.model';
import { WeaponTrackingService } from '../../../services/weapon-tracking.service';
import { ShiftService } from '../../../services/shift.service'; // הנחה - זה השירות שכבר מחזיר את רשימת העובדים בפרויקט (shift-board משתמש בו). אם יש EmployeeService נפרד, יש להחליף.

@Component({
  selector: 'app-admin-weapon',
  templateUrl: './admin-weapon.component.html',
  styleUrls: ['./admin-weapon.component.css']
})
export class AdminWeaponComponent implements OnInit {
  employeesList: WeaponTracking[] = [];

  // חדש - כל העובדים במערכת (מטבלת Employees), לצורך מילוי בורר
  // העובדים (employee picker modal).
  allEmployees: any[] = [];

  // חדש - האם מודאל בחירת העובד להוספה פתוח כרגע.
  showAddPicker = false;

  isAdding = false;
  isRemoving = false;

  constructor(
    private weaponService: WeaponTrackingService,
    private shiftService: ShiftService
  ) {}

  ngOnInit(): void {
    this.loadAllTracking();
    this.loadAllEmployees();
  }

  loadAllTracking(): void {
    this.weaponService.getAllTracking().subscribe(data => {
      this.employeesList = data;
    });
  }

  // חדש - טוען את כל העובדים במערכת, למילוי בורר העובדים.
  loadAllEmployees(): void {
    this.shiftService.getEmployees().subscribe({
      next: (data: any[]) => {
        this.allEmployees = data;
      },
      error: (err) => console.error('שגיאה בטעינת רשימת העובדים', err)
    });
  }

  // חדש - עובדים שעדיין אין להם רשומת מעקב (כלומר לא מופיעים כרגע
  // ב-employeesList), כדי שהבורר לא יאפשר להוסיף כפילות.
  get availableEmployeesToAdd(): any[] {
    const existingIds = new Set(this.employeesList.map(e => e.employeeId));
    return this.allEmployees.filter(emp => !existingIds.has(emp.id));
  }

  openAddPicker(): void {
    this.showAddPicker = true;
  }

  closeAddPicker(): void {
    this.showAddPicker = false;
  }

  // חדש - לחיצה ישירה על שם עובד ברשימת הבורר: מוסיפה אותו מיידית
  // לרשומת המעקב וסוגרת את המודאל.
  selectEmployeeToAdd(emp: any): void {
    if (this.isAdding) return;

    this.isAdding = true;
    this.weaponService.addEmployee(emp.id).subscribe({
      next: () => {
        this.isAdding = false;
        this.showAddPicker = false;
        this.loadAllTracking();
      },
      error: (err) => {
        this.isAdding = false;
        console.error('שגיאה בהוספת עובד למעקב', err);
        alert('שגיאה בהוספת העובד. נסה שוב.');
      }
    });
  }

  // חדש - מסיר עובד מרשימת המעקב (לא מוחק את העובד עצמו מהמערכת -
  // רק את רשומת המעקב שלו כאן).
  removeEmployee(item: WeaponTracking): void {
    if (!confirm(`להסיר את ${item.employeeName || item.employeeId} ממעקב הנשק?`)) return;

    this.isRemoving = true;
    this.weaponService.removeEmployee(item.employeeId).subscribe({
      next: () => {
        this.isRemoving = false;
        this.employeesList = this.employeesList.filter(e => e.employeeId !== item.employeeId);
      },
      error: (err) => {
        this.isRemoving = false;
        console.error('שגיאה בהסרת עובד ממעקב', err);
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