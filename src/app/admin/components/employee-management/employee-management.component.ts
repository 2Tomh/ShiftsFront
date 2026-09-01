import { Component, OnInit } from '@angular/core';
import { EmployeeProfileService } from '../../../services/employee-profile.service';
import { EmployeeProfile, EmployeeManagementConfig } from '../../../Models/employee-profile.model';

@Component({
  selector: 'app-employee-management',
  templateUrl: './employee-management.component.html',
  styleUrls: ['./employee-management.component.css']
})
export class EmployeeManagementComponent implements OnInit {
  profiles: EmployeeProfile[] = [];
  config: EmployeeManagementConfig = { customColumns: [] };
  isLoading = true;

  newColumnName = '';
  showAddColumn = false;

  constructor(private employeeProfileService: EmployeeProfileService) { }

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.isLoading = true;
    this.employeeProfileService.getConfig().subscribe(config => {
      this.config = config;
      this.employeeProfileService.getAll().subscribe(profiles => {
        // ודא שלכל עובד יש ערך (גם ריק) לכל עמודה מותאמת אישית קיימת,
        // כדי שהטופס לא יישבר אם עמודה נוספה אחרי שהעובד כבר נוצר
        this.profiles = profiles.map(p => {
          this.config.customColumns.forEach(col => {
            if (!(col in p.customFieldValues)) p.customFieldValues[col] = '';
          });
          return p;
        });
        this.isLoading = false;
      });
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
        this.profiles.forEach(p => p.customFieldValues[name] = '');
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
      isArmed: false,
      customFieldValues: {}
    };
    this.config.customColumns.forEach(col => newProfile.customFieldValues![col] = '');

    this.employeeProfileService.create(newProfile).subscribe({
      next: (created) => {
        this.profiles.push(created);
      },
      error: (err) => {
        console.error('שגיאה בהוספת עובד', err);
        alert('שגיאה בהוספת עובד');
      }
    });
  }

  save(profile: EmployeeProfile): void {
    if (!profile.id) return;
    this.employeeProfileService.update(profile.id, profile).subscribe({
      next: () => alert('נשמר בהצלחה'),
      error: (err) => {
        console.error('שגיאה בשמירה', err);
        alert('שגיאה בשמירה');
      }
    });
  }

  deleteProfile(profile: EmployeeProfile): void {
    if (!profile.id) return;
    if (!confirm(`למחוק את הכרטיס של ${profile.fullName || 'עובד ללא שם'} לצמיתות?`)) return;

    this.employeeProfileService.delete(profile.id).subscribe({
      next: () => {
        this.profiles = this.profiles.filter(p => p.id !== profile.id);
      },
      error: (err) => console.error('שגיאה במחיקה', err)
    });
  }
}