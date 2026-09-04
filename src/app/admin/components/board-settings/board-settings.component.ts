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
        // תוקן - הגנה על תצורות ישנות שנטענו מהשרת בלי startTime/
        // endTime (למשל לפני שהשדות האלה נוספו למודל) - לא נכשל,
        // פשוט משלים מחרוזת ריקה.
        this.config.shiftDefinitions.forEach(sd => {
          if (sd.startTime === undefined || sd.startTime === null) sd.startTime = '';
          if (sd.endTime === undefined || sd.endTime === null) sd.endTime = '';
        });
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

  // תוקן - כולל עכשיו startTime/endTime (מחרוזת ריקה כברירת מחדל),
  // כדי לתאום למודל ShiftDefinition המעודכן. המנהל ימלא אותן בעצמו
  // דרך שדות השעה החדשים בתבנית.
  addShiftDefinition(): void {
    this.config.shiftDefinitions.push({ name: '', roles: [], startTime: '', endTime: '' });
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

    // חדש - לא חוסם שמירה אם השעות ריקות (כדי לא לשבור זרימת עבודה
    // קיימת), אבל מזהיר את המנהל שבלי שעות חוק מרווח המנוחה של 8
    // שעות לא יעבוד עבור המשמרת הזו.
    const missingHours = this.config.shiftDefinitions.filter(s => !s.startTime || !s.endTime);
    if (missingHours.length > 0) {
      const names = missingHours.map(s => s.name || '(ללא שם)').join(', ');
      const proceed = confirm(
        `למשמרות הבאות אין שעות התחלה/סיום מוגדרות: ${names}.\n` +
        `בלי שעות, בדיקת מרווח המנוחה של 8 שעות לא תעבוד עבורן.\n\n` +
        `לשמור בכל זאת?`
      );
      if (!proceed) return;
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