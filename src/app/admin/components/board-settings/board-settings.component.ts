import { Component, OnInit } from '@angular/core';
import { BoardConfigurationService } from '../../../services/board-configuration.service';
import { BoardConfiguration, ShiftDefinition } from '../../../Models/board-configuration.model';

@Component({
  selector: 'app-board-settings',
  templateUrl: './board-settings.component.html',
  styleUrls: ['./board-settings.component.css']
})
export class BoardSettingsComponent implements OnInit {
  allDayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  config: BoardConfiguration = {
    workDays: [],
    shiftDefinitions: [],
    extraRowNames: []
  };

  isLoading = true;
  isSaving = false;

  // שדות עזר להוספת שורה עצמאית חדשה
  newExtraRowName = '';

  // שדה עזר להוספת תפקיד חדש לכל משמרת (אחד לכל אינדקס משמרת)
  newRoleInputs: string[] = [];

  constructor(private boardConfigService: BoardConfigurationService) { }

  ngOnInit(): void {
    this.loadConfiguration();
  }

  loadConfiguration(): void {
    this.isLoading = true;
    this.boardConfigService.getConfiguration().subscribe({
      next: (config) => {
        this.config = config;
        this.newRoleInputs = this.config.shiftDefinitions.map(() => '');
        this.isLoading = false;
      },
      error: (err) => {
        console.error('שגיאה בטעינת תצורת הלוח', err);
        this.isLoading = false;
      }
    });
  }

  isDaySelected(day: string): boolean {
    return this.config.workDays.includes(day);
  }

  toggleDay(day: string): void {
    const index = this.config.workDays.indexOf(day);
    if (index > -1) {
      this.config.workDays.splice(index, 1);
    } else {
      // שומרים על סדר קבוע לפי allDayNames, לא לפי סדר הלחיצה
      this.config.workDays = this.allDayNames.filter(
        d => this.config.workDays.includes(d) || d === day
      );
    }
  }

  addShiftDefinition(): void {
    this.config.shiftDefinitions.push({ name: '', roles: [] });
    this.newRoleInputs.push('');
  }

  removeShiftDefinition(index: number): void {
    if (!confirm('להסיר את המשמרת הזו לגמרי מהתצורה?')) return;
    this.config.shiftDefinitions.splice(index, 1);
    this.newRoleInputs.splice(index, 1);
  }

  addRole(shiftIndex: number): void {
    const roleName = this.newRoleInputs[shiftIndex]?.trim();
    if (!roleName) return;
    this.config.shiftDefinitions[shiftIndex].roles.push(roleName);
    this.newRoleInputs[shiftIndex] = '';
  }

  removeRole(shiftIndex: number, roleIndex: number): void {
    this.config.shiftDefinitions[shiftIndex].roles.splice(roleIndex, 1);
  }

  addExtraRow(): void {
    const name = this.newExtraRowName.trim();
    if (!name) return;
    if (this.config.extraRowNames.includes(name)) {
      alert('שורה בשם הזה כבר קיימת');
      return;
    }
    this.config.extraRowNames.push(name);
    this.newExtraRowName = '';
  }

  removeExtraRow(index: number): void {
    this.config.extraRowNames.splice(index, 1);
  }

  save(): void {
    if (this.config.workDays.length === 0) {
      alert('יש לבחור לפחות יום עבודה אחד');
      return;
    }
    if (this.config.shiftDefinitions.length === 0) {
      alert('יש להגדיר לפחות משמרת אחת');
      return;
    }
    const emptyShiftName = this.config.shiftDefinitions.some(s => !s.name.trim());
    if (emptyShiftName) {
      alert('לכל משמרת חייב להיות שם');
      return;
    }

    this.isSaving = true;
    this.boardConfigService.updateConfiguration(this.config).subscribe({
      next: () => {
        this.isSaving = false;
        alert('התצורה נשמרה בהצלחה! השינויים יופיעו בלוח המשמרות.');
      },
      error: (err) => {
        this.isSaving = false;
        console.error('שגיאה בשמירת התצורה', err);
        alert('שגיאה בשמירת התצורה. נסה שוב.');
      }
    });
  }
}