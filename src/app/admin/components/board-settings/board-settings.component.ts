import { Component, OnInit } from '@angular/core';
import { BoardConfigurationService } from '../../../services/board-configuration.service';
import { BlockedDateService } from '../../../services/blocked-date.service';
import { BoardConfiguration, ShiftDefinition } from '../../../Models/board-configuration.model';
import { BlockedDate } from '../../../Models/blocked-date.model';

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
    extraRowNames: [],
    submissionWeeksCount: 1
  };

  isLoading = true;
  isSaving = false;

  // שדה עזר להוספת תפקיד חדש לכל משמרת (אחד לכל אינדקס משמרת)
  newRoleInputs: string[] = [];

  // חדש - תאריכים ספציפיים חסומים (חג/סגירה וכו'), נפרד מהתצורה
  // הקבועה - נטען ונשמר בנפרד, לא חלק מ-BoardConfiguration.
  blockedDates: BlockedDate[] = [];
  isLoadingBlockedDates = true;
  newBlockedDate = '';
  newBlockedReason = '';

  constructor(
    private boardConfigService: BoardConfigurationService,
    private blockedDateService: BlockedDateService
  ) { }

  ngOnInit(): void {
    this.loadConfiguration();
    this.loadBlockedDates();
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
          if (!sd.blockedDays) sd.blockedDays = [];
          if (!sd.roleBlockedDays) sd.roleBlockedDays = {};
        });
        // חדש - הגנה דומה על submissionWeeksCount: תצורות ישנות
        // שנוצרו לפני הוספת השדה הזה, או ערך לא תקין (0/שלילי) -
        // ברירת מחדל 1 שבוע (ההתנהגות המקורית, לא שוברת כלום).
        if (!this.config.submissionWeeksCount || this.config.submissionWeeksCount < 1) {
          this.config.submissionWeeksCount = 1;
        }
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
    this.config.shiftDefinitions.push({ name: '', roles: [], startTime: '', endTime: '', blockedDays: [], roleBlockedDays: {} });
    this.newRoleInputs.push('');
  }

  // חדש - האם המשמרת בשורה shiftIndex חסומה ביום day (קבוע בתבנית).
  isDayBlockedForShift(shiftIndex: number, day: string): boolean {
    return this.config.shiftDefinitions[shiftIndex].blockedDays.includes(day);
  }

  // חדש - הפעלה/כיבוי חסימה של יום מסוים למשמרת ספציפית. משמרת
  // חסומה ביום מסוים פשוט לא תיווצר בכלל ב"צור שבוע חדש" עבור אותו יום.
  toggleBlockedDay(shiftIndex: number, day: string): void {
    const shift = this.config.shiftDefinitions[shiftIndex];
    const index = shift.blockedDays.indexOf(day);
    if (index > -1) {
      shift.blockedDays.splice(index, 1);
    } else {
      shift.blockedDays.push(day);
    }
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
    const shift = this.config.shiftDefinitions[shiftIndex];
    const roleName = shift.roles[roleIndex];
    shift.roles.splice(roleIndex, 1);
    // חדש - מנקה גם את חסימות הימים שהוגדרו לתפקיד הזה, אם היו
    if (shift.roleBlockedDays && shift.roleBlockedDays[roleName]) {
      delete shift.roleBlockedDays[roleName];
    }
  }

  // חדש - האם תפקיד ספציפי (role) בתוך משמרת shiftIndex חסום ביום day.
  isRoleDayBlocked(shiftIndex: number, role: string, day: string): boolean {
    const map = this.config.shiftDefinitions[shiftIndex].roleBlockedDays;
    return !!(map && map[role] && map[role].includes(day));
  }

  // חדש - הפעלה/כיבוי חסימה של יום מסוים לתפקיד ספציפי בתוך משמרת.
  // בניגוד ל-toggleBlockedDay (חוסם את כל המשמרת), זה חוסם רק תפקיד
  // אחד - שאר התפקידים באותה משמרת/יום ממשיכים לפעול כרגיל.
  toggleRoleBlockedDay(shiftIndex: number, role: string, day: string): void {
    const shift = this.config.shiftDefinitions[shiftIndex];
    if (!shift.roleBlockedDays[role]) shift.roleBlockedDays[role] = [];
    const list = shift.roleBlockedDays[role];
    const index = list.indexOf(day);
    if (index > -1) {
      list.splice(index, 1);
    } else {
      list.push(day);
    }
  }

  // חדש - כמה שבועות מראש עובדים יכולים להגיש זמינות עבורם. מוגבל
  // בין 1 ל-8 (יותר מזה כנראה טעות הקלדה, ואין סיבה עסקית סבירה
  // לפתוח יותר משבועיים-שלושה מראש בדרך כלל).
  increaseSubmissionWeeks(): void {
    const current = this.config.submissionWeeksCount || 1;
    if (current < 8) {
      this.config.submissionWeeksCount = current + 1;
    }
  }

  decreaseSubmissionWeeks(): void {
    const current = this.config.submissionWeeksCount || 1;
    if (current > 1) {
      this.config.submissionWeeksCount = current - 1;
    }
  }

  // ===== תאריכים ספציפיים חסומים (חג/סגירה) =====

  loadBlockedDates(): void {
    this.isLoadingBlockedDates = true;
    this.blockedDateService.getAll().subscribe({
      next: (dates) => {
        this.blockedDates = dates;
        this.isLoadingBlockedDates = false;
      },
      error: (err) => {
        console.error('שגיאה בטעינת תאריכים חסומים', err);
        this.isLoadingBlockedDates = false;
      }
    });
  }

  addBlockedDate(): void {
    if (!this.newBlockedDate) {
      alert('יש לבחור תאריך');
      return;
    }
    const reason = this.newBlockedReason.trim() || 'ללא סיבה';

    this.blockedDateService.create(this.newBlockedDate, reason).subscribe({
      next: () => {
        this.newBlockedDate = '';
        this.newBlockedReason = '';
        this.loadBlockedDates();
      },
      error: (err) => {
        console.error('שגיאה בהוספת תאריך חסום', err);
        alert('שגיאה בהוספת התאריך. נסה שוב.');
      }
    });
  }

  removeBlockedDate(date: BlockedDate): void {
    if (!date.id) return;
    if (!confirm(`להסיר את החסימה של ${date.date}?`)) return;

    this.blockedDateService.delete(date.id).subscribe({
      next: () => this.loadBlockedDates(),
      error: (err) => {
        console.error('שגיאה בהסרת תאריך חסום', err);
        alert('שגיאה בהסרת התאריך. נסה שוב.');
      }
    });
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

    // חדש - הגנה על ערך תקין לכמות שבועות ההגשה לפני שמירה
    if (!this.config.submissionWeeksCount || this.config.submissionWeeksCount < 1) {
      this.config.submissionWeeksCount = 1;
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