import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { EmployeeProfileService } from '../../../services/employee-profile.service';
import { EmployeeProfile, EmployeeManagementConfig } from '../../../Models/employee-profile.model';

@Component({
  selector: 'app-employee-management',
  templateUrl: './employee-management.component.html',
  styleUrls: ['./employee-management.component.css']
})
export class EmployeeManagementComponent implements OnInit {
  rows: EmployeeProfile[] = [];
  config: EmployeeManagementConfig = { customColumns: [] };
  isLoading = true;

  newColumnName = '';
  showAddColumn = false;

  private originalRows = new Map<string, EmployeeProfile>();

  constructor(private employeeProfileService: EmployeeProfileService) { }

  ngOnInit(): void {
    this.loadAll();
  }

  private snapshot(row: EmployeeProfile): EmployeeProfile {
    return { ...row, customFieldValues: { ...row.customFieldValues } };
  }

  loadAll(): void {
    this.isLoading = true;
    forkJoin({
      config: this.employeeProfileService.getConfig(),
      profiles: this.employeeProfileService.getAll()
    }).subscribe({
      next: ({ config, profiles }) => {
        this.config = config;
        this.originalRows.clear();

        this.rows = profiles.map(p => {
          this.config.customColumns.forEach(col => {
            if (!(col in p.customFieldValues)) p.customFieldValues[col] = '';
          });
          const row: EmployeeProfile = { ...p, password: '' };
          if (row.id) this.originalRows.set(row.id, this.snapshot(row));
          return row;
        });

        this.isLoading = false;
      },
      error: (err) => {
        console.error('שגיאה בטעינת עובדים', err);
        this.isLoading = false;
      }
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
    this.employeeProfileService.updateConfig(this.config).subscribe({
      next: () => {
        this.rows.forEach(r => {
          r.customFieldValues[name] = '';
          if (r.id) {
            const orig = this.originalRows.get(r.id);
            if (orig) orig.customFieldValues[name] = '';
          }
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
    this.employeeProfileService.updateConfig(this.config).subscribe({
      next: () => this.loadAll(),
      error: (err) => console.error('שגיאה בהסרת עמודה', err)
    });
  }

  addEmployee(): void {
    const newProfile: Partial<EmployeeProfile> = {
      fullName: '',
      email: '',
      hireDate: null,
      armedStatus: 'NotArmed',
      customFieldValues: {}
    };
    this.config.customColumns.forEach(col => newProfile.customFieldValues![col] = '');

    this.employeeProfileService.create(newProfile).subscribe({
      next: (created) => {
        const row: EmployeeProfile = { ...created, password: '' };
        this.rows.unshift(row);
        if (row.id) this.originalRows.set(row.id, this.snapshot(row));
      },
      error: (err) => {
        console.error('שגיאה בהוספת עובד', err);
        alert('שגיאה בהוספת עובד');
      }
    });
  }

  cleanupEmptyRows(): void {
    const emptyRows = this.rows.filter(r => !r.fullName || !r.fullName.trim());

    if (emptyRows.length === 0) {
      alert('אין שורות ריקות לניקוי.');
      return;
    }

    if (!confirm(`נמצאו ${emptyRows.length} שורות ריקות (בלי שם). למחוק את כולן?`)) return;

    let remaining = emptyRows.length;

    emptyRows.forEach(row => {
      if (!row.id) { remaining--; return; }
      this.employeeProfileService.delete(row.id).subscribe({
        next: () => { remaining--; if (remaining === 0) this.loadAll(); },
        error: () => { remaining--; if (remaining === 0) this.loadAll(); }
      });
    });
  }

  save(row: EmployeeProfile): void {
    if (!row.id) return;

    const original = this.originalRows.get(row.id);
    const changes: Partial<EmployeeProfile> = {};

    if (!original || row.fullName !== original.fullName) changes.fullName = row.fullName;
    if (!original || row.email !== original.email) changes.email = row.email;
    if (!original || row.hireDate !== original.hireDate) changes.hireDate = row.hireDate;
    // הוחלף - armedStatus (מחרוזת) במקום isArmed (בוליאני)
    if (!original || row.armedStatus !== original.armedStatus) changes.armedStatus = row.armedStatus;

    const customChanged = !original || JSON.stringify(row.customFieldValues) !== JSON.stringify(original.customFieldValues);
    if (customChanged) changes.customFieldValues = row.customFieldValues;

    if (row.username && row.username.trim() && row.username !== (original?.username || '')) {
      changes.username = row.username.trim();
      changes.systemRole = row.systemRole || 'Employee';
    }

    if (row.password && row.password.trim()) {
      changes.password = row.password.trim();
      if (!changes.username && row.username) {
        changes.username = row.username.trim();
        changes.systemRole = row.systemRole || 'Employee';
      }
    }

    if (original?.username && row.systemRole !== original.systemRole && !changes.username) {
      changes.username = row.username || original.username;
      changes.systemRole = row.systemRole || 'Employee';
    }

    if (Object.keys(changes).length === 0) {
      alert('אין שינויים לשמור');
      return;
    }

    this.employeeProfileService.update(row.id, changes).subscribe({
      next: () => {
        alert('נשמר בהצלחה');
        row.password = '';
        if (row.id) this.originalRows.set(row.id, this.snapshot(row));
      },
      error: (err) => {
        console.error('שגיאה בשמירה', err);
        alert(err.error?.error || err.error || 'שגיאה בשמירה');
      }
    });
  }

  removeAccess(row: EmployeeProfile): void {
    if (!row.id) return;
    if (!confirm(`להסיר את הגישה למערכת של "${row.username}"? העובד/ת עצמו/ה יישאר/תישאר במערכת, רק לא יוכל/תוכל להתחבר יותר.`)) return;

    this.employeeProfileService.removeAccess(row.id).subscribe({
      next: () => this.loadAll(),
      error: (err) => {
        console.error('שגיאה בהסרת גישה', err);
        alert('שגיאה בהסרת הגישה');
      }
    });
  }

  deleteProfile(row: EmployeeProfile): void {
    const warning = row.username
      ? `למחוק את הכרטיס של ${row.fullName || 'עובד ללא שם'} לצמיתות? שים לב - יש לו גישה למערכת (${row.username}) שתימחק גם היא, ולוח המשמרות/הגשות הזמינות שלו יישארו ללא עובד מקושר.`
      : `למחוק את הכרטיס של ${row.fullName || 'עובד ללא שם'} לצמיתות?`;

    if (!row.id || !confirm(warning)) return;

    this.employeeProfileService.delete(row.id).subscribe({
      next: () => {
        this.rows = this.rows.filter(r => r.id !== row.id);
        if (row.id) this.originalRows.delete(row.id);
      },
      error: (err) => console.error('שגיאה במחיקה', err)
    });
  }
}