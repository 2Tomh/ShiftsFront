import { Component, OnInit } from '@angular/core';
import { WeaponTracking, WeaponTrackingConfig } from '../../../Models/weapon-tracking.model';
import { WeaponTrackingService } from '../../../services/weapon-tracking.service';
import { ShiftService } from '../../../services/shift.service';

@Component({
  selector: 'app-admin-weapon',
  templateUrl: './admin-weapon.component.html',
  styleUrls: ['./admin-weapon.component.css']
})
export class AdminWeaponComponent implements OnInit {
  employeesList: WeaponTracking[] = [];

  allEmployees: any[] = [];

  showAddPicker = false;

  isAdding = false;
  isRemoving = false;

  // חדש - תצורת עמודות מותאמות אישית, בדיוק כמו ב"ניהול עובדים"
  config: WeaponTrackingConfig = { customColumns: [] };
  newColumnName = '';
  showAddColumn = false;

  constructor(
    private weaponService: WeaponTrackingService,
    private shiftService: ShiftService
  ) {}

  ngOnInit(): void {
    this.loadConfig();
    this.loadAllTracking();
    this.loadAllEmployees();
  }

  loadConfig(): void {
    this.weaponService.getConfig().subscribe({
      next: (config) => {
        this.config = config;
        // ודא שלכל שורה קיימת יש ערך (גם ריק) לכל עמודה - כדי
        // שהטופס לא יישבר אם עמודה נוספה אחרי שהעובד כבר נוסף
        this.employeesList.forEach(item => {
          this.config.customColumns.forEach(col => {
            if (!item.customFieldValues) item.customFieldValues = {};
            if (!(col in item.customFieldValues)) item.customFieldValues[col] = '';
          });
        });
      },
      error: (err) => console.error('שגיאה בטעינת תצורת עמודות', err)
    });
  }

  addColumn(): void {
    const name = this.newColumnName.trim();
    if (!name) return;
    if (this.config.customColumns.includes(name)) {
      alert('עמודה בשם הזה כבר קיימת');
      return;
    }

    this.config.customColumns.push(name);
    this.weaponService.updateConfig(this.config).subscribe({
      next: () => {
        this.employeesList.forEach(item => {
          if (!item.customFieldValues) item.customFieldValues = {};
          item.customFieldValues[name] = '';
        });
        this.newColumnName = '';
        this.showAddColumn = false;
      },
      error: (err) => {
        console.error('שגיאה בהוספת עמודה', err);
        alert('שגיאה בהוספת העמודה');
      }
    });
  }

  removeColumn(colName: string): void {
    if (!confirm(`להסיר את העמודה "${colName}" מכולם? הנתונים שבה יימחקו.`)) return;

    this.config.customColumns = this.config.customColumns.filter(c => c !== colName);
    this.weaponService.updateConfig(this.config).subscribe({
      next: () => this.loadAllTracking(),
      error: (err) => console.error('שגיאה בהסרת עמודה', err)
    });
  }

  loadAllTracking(): void {
    this.weaponService.getAllTracking().subscribe(data => {
      this.employeesList = data.map(item => {
        const converted: WeaponTracking = {
          ...item,
          refreshDate: this.toDateInputValue(item.refreshDate),
          licenseDate: this.toDateInputValue((item as any).licenseDate),
          btfAppointmentDate: this.toDatetimeLocalValue(item.btfAppointmentDate)
        };
        if (!converted.customFieldValues) converted.customFieldValues = {};
        this.config.customColumns.forEach(col => {
          if (!(col in converted.customFieldValues)) converted.customFieldValues[col] = '';
        });
        return converted;
      });
    });
  }

  loadAllEmployees(): void {
    const weekStartParam = this.formatDateForApi(this.getCurrentWeekSunday());
    this.shiftService.getEmployees(weekStartParam).subscribe({
      next: (data: any[]) => {
        this.allEmployees = data;
      },
      error: (err) => console.error('שגיאה בטעינת רשימת העובדים', err)
    });
  }

  private getCurrentWeekSunday(): Date {
    const today = new Date();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay());
    sunday.setHours(0, 0, 0, 0);
    return sunday;
  }

  private formatDateForApi(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // חדש - המרת ערך תאריך שמגיע מהשרת (למשל ISO עם שעה/Z) לפורמט
  // yyyy-MM-dd שאותו <input type="date"> יודע להציג
  private toDateInputValue(value: any): string | null {
    if (!value) return null;
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // חדש - המרת ערך תאריך+שעה מהשרת לפורמט yyyy-MM-ddTHH:mm
  // שאותו <input type="datetime-local"> יודע להציג
  private toDatetimeLocalValue(value: any): string | null {
    if (!value) return null;
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day}T${hh}:${mm}`;
  }

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

  // חדש - מספר הימים שנותרו עד תאריך הרענון. שלילי = כבר עבר.
  daysUntilRefresh(item: WeaponTracking): number | null {
    if (!item.refreshDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const refresh = new Date(item.refreshDate);
    refresh.setHours(0, 0, 0, 0);
    return Math.round((refresh.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  // חדש - סטטוס ויזואלי: "red" אם עבר/פחות משבוע, "orange" אם פחות
  // מחודש, אחרת null (רגיל)
  refreshStatus(item: WeaponTracking): 'red' | 'orange' | null {
    const days = this.daysUntilRefresh(item);
    if (days === null) return null;
    if (days <= 7) return 'red';
    if (days <= 30) return 'orange';
    return null;
  }

  saveChanges(item: WeaponTracking): void {
    this.weaponService.updateTracking(item.employeeId, item).subscribe({
      next: () => alert('השינויים נשמרו בהצלחה'),
      error: (err) => console.error('שגיאה בשמירה', err)
    });
  }
}