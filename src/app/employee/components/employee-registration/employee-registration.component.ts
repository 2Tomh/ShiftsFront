import { Component, OnInit } from '@angular/core';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ShiftService } from '../../../services/shift.service';
import { VacationService } from '../../../services/vacation.service';
import { AuthService } from '../../../services/auth.service';
import { HolidayService } from '../../../services/holiday.service';
import { BoardConfigurationService } from '../../../services/board-configuration.service';
import { Holiday } from '../../../Models/holiday.model';

// חדש - כל שבוע שעובד יכול להגיש עבורו זמינות מנוהל בנפרד: לכל
// שבוע יש את התאריכים שלו, את המשמרות שסומנו בו, הערות משלו, ימים
// חסומים (חופשה מאושרת) משלו וכו'. הדדליין (locked/deadlineLabel)
// נשאר משותף לכולם - זה עדיין "מועד ההגשה השבועי" הגלובלי, לא
// דדליין נפרד לכל שבוע.
interface WeekEntry {
  offset: number; // כמה שבועות קדימה מהשבוע הנוכחי (1 = השבוע הבא)
  dates: Date[];
  preferredShifts: { day: string, shift: string }[];
  notes: string;
  blockedDays: Set<string>;
  vacationBanner: string;
  isSubmitting: boolean;
  holidaysByDate: Map<string, Holiday>;
}

@Component({
  selector: 'app-employee-registration',
  templateUrl: './employee-registration.component.html',
  styleUrls: ['./employee-registration.component.css']
})
export class EmployeeRegistrationComponent implements OnInit {
  employeeName: string = '';
  dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  shiftLabels = ['בוקר', 'צהריים', 'לילה'];

  // חדש - רשימת השבועות הפתוחים להגשה (לפי config.submissionWeeksCount
  // שהמנהל קבע בהגדרות לוח). ברירת מחדל שבוע אחד, בדיוק כמו ההתנהגות
  // המקורית, עד שהתצורה נטענת בפועל.
  weeks: WeekEntry[] = [];
  isLoadingConfig = true;

  // תוקן - במקום להציג את כל השבועות אחד מתחת לשני, מציגים שבוע
  // אחד בכל פעם ומנווטים בין ה"כרטיסים" עם חצים (בדיוק כמו ניווט
  // השבועות בלוח המנהל).
  selectedWeekIndex = 0;

  isLocked = false;
  deadlineLabel: string = '';

  constructor(
    private shiftService: ShiftService,
    private vacationService: VacationService,
    private authService: AuthService,
    private holidayService: HolidayService,
    private boardConfigService: BoardConfigurationService
  ) { }

  ngOnInit(): void {
    this.employeeName = this.authService.getEmployeeName() || this.authService.getUsername() || '';
    this.computeDeadline();
    this.loadWeeksConfigThenInit();
  }

  private loadWeeksConfigThenInit(): void {
    this.isLoadingConfig = true;
    this.boardConfigService.getConfiguration().subscribe({
      next: (config: any) => {
        const count = (config?.submissionWeeksCount && config.submissionWeeksCount >= 1)
          ? config.submissionWeeksCount
          : 1;
        this.buildWeeks(count);
        this.isLoadingConfig = false;
      },
      error: () => {
        // אם התצורה לא נטענה מסיבה כלשהי - נופלים בחזרה להתנהגות
        // המקורית (שבוע אחד), כדי לא לשבור את ההגשה לגמרי.
        this.buildWeeks(1);
        this.isLoadingConfig = false;
      }
    });
  }

  private buildWeeks(count: number): void {
    this.weeks = [];
    this.selectedWeekIndex = 0;
    for (let offset = 1; offset <= count; offset++) {
      const dates = this.computeWeekDates(offset);
      this.weeks.push({
        offset,
        dates,
        preferredShifts: [],
        notes: '',
        blockedDays: new Set<string>(),
        vacationBanner: '',
        isSubmitting: false,
        holidaysByDate: new Map<string, Holiday>()
      });
    }

    this.weeks.forEach(week => {
      this.loadHolidaysForWeek(week);
      if (this.employeeName) {
        this.checkVacationConflictsForWeek(week);
        this.loadExistingAvailabilityForWeek(week);
      }
    });
  }

  // חדש - השבוע המוצג כרגע (getter נוח לשימוש ב-HTML במקום
  // weeks[selectedWeekIndex] בכל מקום).
  get currentWeek(): WeekEntry | null {
    return this.weeks[this.selectedWeekIndex] || null;
  }

  goToPreviousWeek(): void {
    if (this.selectedWeekIndex > 0) {
      this.selectedWeekIndex--;
    }
  }

  goToNextWeek(): void {
    if (this.selectedWeekIndex < this.weeks.length - 1) {
      this.selectedWeekIndex++;
    }
  }

  // שבוע היעד (שאליו שייכת ההגשה בפועל), לפי offset (1 = השבוע הבא,
  // 2 = השבוע שאחריו וכו').
  private computeWeekDates(offset: number): Date[] {
    const today = new Date();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay() + (offset * 7));
    sunday.setHours(0, 0, 0, 0);
    return this.dayNames.map((_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      return d;
    });
  }

  // חדש - יום ראשון של השבוע *הנוכחי* (לא שבוע היעד) - משמש רק
  // לחישוב הדדליין (יום שלישי שלו). זה נשאר גלובלי (לא תלוי שבוע
  // יעד ספציפי) - ההגשה לכל השבועות הפתוחים ננעלת יחד.
  private getCurrentWeekSunday(): Date {
    const today = new Date();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay());
    sunday.setHours(0, 0, 0, 0);
    return sunday;
  }

  formatDateLabel(date: Date): string {
    return `${date.getDate()}/${date.getMonth() + 1}`;
  }

  private formatDateForApi(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private loadHolidaysForWeek(week: WeekEntry): void {
    const dates = week.dates;
    const startYear = dates[0].getFullYear();
    const endYear = dates[6].getFullYear();

    const holidaysStartYear$ = this.holidayService.getHolidays(startYear).pipe(
      catchError(err => {
        console.warn('שגיאה בטעינת חגים (שנה ' + startYear + '), ממשיכים בלי תוויות חג:', err);
        return of([] as Holiday[]);
      })
    );
    const holidaysEndYear$ = startYear !== endYear
      ? this.holidayService.getHolidays(endYear).pipe(
          catchError(err => {
            console.warn('שגיאה בטעינת חגים (שנה ' + endYear + '), ממשיכים בלי תוויות חג:', err);
            return of([] as Holiday[]);
          })
        )
      : of([] as Holiday[]);

    holidaysStartYear$.subscribe(holidaysA => {
      holidaysEndYear$.subscribe(holidaysB => {
        week.holidaysByDate = new Map();
        [...holidaysA, ...holidaysB].forEach(h => week.holidaysByDate.set(h.date, h));
      });
    });
  }

  getHolidayForDay(week: WeekEntry, dayIndex: number): Holiday | undefined {
    const d = week.dates[dayIndex];
    if (!d) return undefined;
    return week.holidaysByDate.get(this.formatDateForApi(d));
  }

  isHolidayForDay(week: WeekEntry, dayIndex: number): boolean {
    return !!this.getHolidayForDay(week, dayIndex);
  }

  // תוקן - קריטי: הדדליין מחושב לפי יום שלישי של *השבוע הנוכחי*,
  // ומשותף לכל השבועות הפתוחים להגשה יחד (לא דדליין נפרד לכל שבוע).
  private computeDeadline(): void {
    const currentSunday = this.getCurrentWeekSunday();
    const tuesday = new Date(currentSunday);
    tuesday.setDate(tuesday.getDate() + 2);
    tuesday.setHours(15, 0, 0, 0);
    this.deadlineLabel = this.formatDateLabel(tuesday);
    this.isLocked = new Date() > tuesday;
  }

  loadExistingAvailabilityForWeek(week: WeekEntry): void {
    const weekStartParam = this.formatDateForApi(week.dates[0]);
    this.shiftService.getAvailabilityForEmployee(this.employeeName, weekStartParam).subscribe({
      next: (result: any) => {
        if (result?.found) {
          week.preferredShifts = (result.preferredShifts || []).map((p: any) => ({
            day: p.day,
            shift: p.shift
          }));
          week.notes = result.notes || '';
        }
      },
      error: () => { }
    });
  }

  isSelected(week: WeekEntry, day: string, shift: string): boolean {
    return week.preferredShifts.some(s => s.day === day && s.shift === shift);
  }

  isDayBlocked(week: WeekEntry, day: string): boolean {
    return week.blockedDays.has(day);
  }

  togglePreference(week: WeekEntry, day: string, shift: string): void {
    if (week.blockedDays.has(day) || this.isLocked) return;

    const index = week.preferredShifts.findIndex(s => s.day === day && s.shift === shift);
    if (index > -1) {
      week.preferredShifts.splice(index, 1);
    } else {
      week.preferredShifts.push({ day, shift });
    }
  }

  toggleAllShiftsForDay(week: WeekEntry, day: string): void {
    if (week.blockedDays.has(day) || this.isLocked) return;

    const allSelected = this.shiftLabels.every(shift => this.isSelected(week, day, shift));

    if (allSelected) {
      week.preferredShifts = week.preferredShifts.filter(s => s.day !== day);
    } else {
      this.shiftLabels.forEach(shift => {
        if (!this.isSelected(week, day, shift)) {
          week.preferredShifts.push({ day, shift });
        }
      });
    }
  }

  toggleAllDaysForShift(week: WeekEntry, shift: string): void {
    if (this.isLocked) return;

    const relevantDays = this.dayNames.filter(day => !week.blockedDays.has(day));
    if (relevantDays.length === 0) return;

    const allSelected = relevantDays.every(day => this.isSelected(week, day, shift));

    if (allSelected) {
      week.preferredShifts = week.preferredShifts.filter(s => s.shift !== shift);
    } else {
      relevantDays.forEach(day => {
        if (!this.isSelected(week, day, shift)) {
          week.preferredShifts.push({ day, shift });
        }
      });
    }
  }

  checkVacationConflictsForWeek(week: WeekEntry): void {
    const name = this.employeeName.trim();
    week.blockedDays.clear();
    week.vacationBanner = '';

    if (!name) return;

    this.vacationService.getForEmployee(name).subscribe({
      next: (requests) => {
        const approved = requests.filter(r => r.status === 'Approved');
        if (approved.length === 0) return;

        const dates = week.dates;
        const ranges: string[] = [];

        approved.forEach(v => {
          const start = new Date(v.startDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(v.endDate);
          end.setHours(0, 0, 0, 0);

          let overlapsThisWeek = false;
          dates.forEach((d, i) => {
            if (d >= start && d <= end) {
              week.blockedDays.add(this.dayNames[i]);
              overlapsThisWeek = true;
            }
          });

          if (overlapsThisWeek) {
            ranges.push(`${this.formatDateLabel(start)}–${this.formatDateLabel(end)}`);
          }
        });

        week.preferredShifts = week.preferredShifts.filter(s => !week.blockedDays.has(s.day));

        if (week.blockedDays.size > 0) {
          week.vacationBanner = `שימי לב: יש לך חופשה מאושרת בתאריכים ${ranges.join(', ')} - לא ניתן להגיש זמינות לימים אלו.`;
        }
      },
      error: () => { }
    });
  }

  submitAvailabilityForWeek(week: WeekEntry): void {
    if (this.isLocked) {
      alert('המועד להגשה/עריכה עבר.');
      return;
    }

    if (!this.employeeName.trim()) {
      alert("שגיאה: לא זוהה שם עובד מחובר. נסי להתחבר מחדש.");
      return;
    }

    const payload = {
      employeeName: this.employeeName.trim(),
      weekStartDate: week.dates[0],
      preferredShifts: week.preferredShifts,
      notes: week.notes
    };

    week.isSubmitting = true;

    this.shiftService.submitEmployeeAvailability(payload).subscribe({
      next: () => {
        week.isSubmitting = false;
        alert(`תודה, הזמינות לשבוע ${this.formatDateLabel(week.dates[0])}–${this.formatDateLabel(week.dates[6])} נשמרה בהצלחה! ניתן להמשיך לערוך עד יום שלישי בשעה 15:00.`);
      },
      error: (err: any) => {
        week.isSubmitting = false;
        console.error(err);
        alert(err.error?.error || "שגיאה בשליחת הנתונים.");
      }
    });
  }
}