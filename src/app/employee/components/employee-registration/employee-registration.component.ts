import { Component, OnInit } from '@angular/core';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ShiftService } from '../../../services/shift.service';
import { VacationService } from '../../../services/vacation.service';
import { AuthService } from '../../../services/auth.service';
import { HolidayService } from '../../../services/holiday.service';
import { Holiday } from '../../../Models/holiday.model';

@Component({
  selector: 'app-employee-registration',
  templateUrl: './employee-registration.component.html',
  styleUrls: ['./employee-registration.component.css']
})
export class EmployeeRegistrationComponent implements OnInit {
  employeeName: string = '';
  notes: string = '';
  dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  private readonly weekOffset: number = 1;

  preferredShifts: { day: string, shift: string }[] = [];

  shiftLabels = ['בוקר', 'צהריים', 'לילה'];

  blockedDays = new Set<string>();
  vacationBanner: string = '';

  isSubmitting = false;

  isLocked = false;
  deadlineLabel: string = '';

  private holidaysByDate: Map<string, Holiday> = new Map();

  constructor(
    private shiftService: ShiftService,
    private vacationService: VacationService,
    private authService: AuthService,
    private holidayService: HolidayService
  ) { }

  ngOnInit(): void {
    this.employeeName = this.authService.getEmployeeName() || this.authService.getUsername() || '';
    this.computeDeadline();
    this.loadHolidays();
    if (this.employeeName) {
      this.checkVacationConflicts();
      this.loadExistingAvailability();
    }
  }

  // שבוע היעד (שאליו שייכת ההגשה בפועל) - נשאר "השבוע הבא".
  private getWeekSunday(): Date {
    const today = new Date();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay() + (this.weekOffset * 7));
    sunday.setHours(0, 0, 0, 0);
    return sunday;
  }

  // חדש - יום ראשון של השבוע *הנוכחי* (לא שבוע היעד) - משמש רק
  // לחישוב הדדליין (יום שלישי שלו).
  private getCurrentWeekSunday(): Date {
    const today = new Date();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay());
    sunday.setHours(0, 0, 0, 0);
    return sunday;
  }

  get weekDates(): Date[] {
    const sunday = this.getWeekSunday();
    return this.dayNames.map((_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      return d;
    });
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

  private loadHolidays(): void {
    const dates = this.weekDates;
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
        this.holidaysByDate = new Map();
        [...holidaysA, ...holidaysB].forEach(h => this.holidaysByDate.set(h.date, h));
      });
    });
  }

  getHolidayForDay(dayIndex: number): Holiday | undefined {
    const d = this.weekDates[dayIndex];
    if (!d) return undefined;
    return this.holidaysByDate.get(this.formatDateForApi(d));
  }

  isHolidayForDay(dayIndex: number): boolean {
    return !!this.getHolidayForDay(dayIndex);
  }

  // תוקן - קריטי: הדדליין מחושב עכשיו לפי יום שלישי של *השבוע
  // הנוכחי* (getCurrentWeekSunday), לא לפי יום שלישי של שבוע היעד
  // (weekDates, ששייך לשבוע הבא). ההגיון העסקי: "מגישים השבוע
  // זמינות לשבוע הבא, עד יום שלישי של השבוע הזה עצמו".
  private computeDeadline(): void {
    const currentSunday = this.getCurrentWeekSunday();
    const tuesday = new Date(currentSunday);
    tuesday.setDate(tuesday.getDate() + 2);
    tuesday.setHours(15, 0, 0, 0);
    this.deadlineLabel = this.formatDateLabel(tuesday);
    this.isLocked = new Date() > tuesday;
  }

  loadExistingAvailability(): void {
    const weekStartParam = this.formatDateForApi(this.getWeekSunday());
    this.shiftService.getAvailabilityForEmployee(this.employeeName, weekStartParam).subscribe({
      next: (result: any) => {
        if (result?.found) {
          this.preferredShifts = (result.preferredShifts || []).map((p: any) => ({
            day: p.day,
            shift: p.shift
          }));
          this.notes = result.notes || '';
        }
      },
      error: () => { }
    });
  }

  isSelected(day: string, shift: string): boolean {
    return this.preferredShifts.some(s => s.day === day && s.shift === shift);
  }

  isDayBlocked(day: string): boolean {
    return this.blockedDays.has(day);
  }

  togglePreference(day: string, shift: string) {
    if (this.blockedDays.has(day) || this.isLocked) return;

    const index = this.preferredShifts.findIndex(s => s.day === day && s.shift === shift);
    if (index > -1) {
      this.preferredShifts.splice(index, 1);
    } else {
      this.preferredShifts.push({ day, shift });
    }
  }

  toggleAllShiftsForDay(day: string): void {
    if (this.blockedDays.has(day) || this.isLocked) return;

    const allSelected = this.shiftLabels.every(shift => this.isSelected(day, shift));

    if (allSelected) {
      this.preferredShifts = this.preferredShifts.filter(s => s.day !== day);
    } else {
      this.shiftLabels.forEach(shift => {
        if (!this.isSelected(day, shift)) {
          this.preferredShifts.push({ day, shift });
        }
      });
    }
  }

  toggleAllDaysForShift(shift: string): void {
    if (this.isLocked) return;

    const relevantDays = this.dayNames.filter(day => !this.blockedDays.has(day));
    if (relevantDays.length === 0) return;

    const allSelected = relevantDays.every(day => this.isSelected(day, shift));

    if (allSelected) {
      this.preferredShifts = this.preferredShifts.filter(s => s.shift !== shift);
    } else {
      relevantDays.forEach(day => {
        if (!this.isSelected(day, shift)) {
          this.preferredShifts.push({ day, shift });
        }
      });
    }
  }

  checkVacationConflicts(): void {
    const name = this.employeeName.trim();
    this.blockedDays.clear();
    this.vacationBanner = '';

    if (!name) return;

    this.vacationService.getForEmployee(name).subscribe({
      next: (requests) => {
        const approved = requests.filter(r => r.status === 'Approved');
        if (approved.length === 0) return;

        const dates = this.weekDates;
        const ranges: string[] = [];

        approved.forEach(v => {
          const start = new Date(v.startDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(v.endDate);
          end.setHours(0, 0, 0, 0);

          let overlapsThisWeek = false;
          dates.forEach((d, i) => {
            if (d >= start && d <= end) {
              this.blockedDays.add(this.dayNames[i]);
              overlapsThisWeek = true;
            }
          });

          if (overlapsThisWeek) {
            ranges.push(`${this.formatDateLabel(start)}–${this.formatDateLabel(end)}`);
          }
        });

        this.preferredShifts = this.preferredShifts.filter(s => !this.blockedDays.has(s.day));

        if (this.blockedDays.size > 0) {
          this.vacationBanner = `שימי לב: יש לך חופשה מאושרת בתאריכים ${ranges.join(', ')} - לא ניתן להגיש זמינות לימים אלו.`;
        }
      },
      error: () => { }
    });
  }

  submitAvailability() {
    if (this.isLocked) {
      alert('המועד להגשה/עריכה לשבוע זה עבר.');
      return;
    }

    if (!this.employeeName.trim()) {
      alert("שגיאה: לא זוהה שם עובד מחובר. נסי להתחבר מחדש.");
      return;
    }

    const weekStart = this.getWeekSunday();

    const payload = {
      employeeName: this.employeeName.trim(),
      weekStartDate: weekStart,
      preferredShifts: this.preferredShifts,
      notes: this.notes
    };

    this.isSubmitting = true;

    this.shiftService.submitEmployeeAvailability(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        alert(`תודה, הזמינות נשמרה בהצלחה! ניתן להמשיך לערוך עד יום שלישי בשעה 15:00.`);
      },
      error: (err: any) => {
        this.isSubmitting = false;
        console.error(err);
        alert(err.error?.error || "שגיאה בשליחת הנתונים.");
      }
    });
  }
}