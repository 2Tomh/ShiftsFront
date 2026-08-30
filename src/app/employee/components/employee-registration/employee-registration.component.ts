import { Component, OnInit } from '@angular/core';
import { ShiftService } from '../../../services/shift.service';
import { VacationService } from '../../../services/vacation.service';
import { AuthService } from '../../../services/auth.service';

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

  // חדש - נעילת ההגשה. ניתן לערוך עד יום שלישי 15:00 של השבוע
  // המוגש, ולאחר מכן ההגשה ננעלת (השרת אוכף את זה גם בעצמו,
  // כאן זה רק כדי לחסום ולהראות הודעה מוקדם יותר בממשק).
  isLocked = false;
  deadlineLabel: string = '';

  constructor(
    private shiftService: ShiftService,
    private vacationService: VacationService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.employeeName = this.authService.getEmployeeName() || this.authService.getUsername() || '';
    this.computeDeadline();
    if (this.employeeName) {
      this.checkVacationConflicts();
      this.loadExistingAvailability();
    }
  }

  private getWeekSunday(): Date {
    const today = new Date();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay() + (this.weekOffset * 7));
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

  // חדש - יום שלישי (אינדקס 2) של השבוע המוגש, בשעה 15:00.
  // אחרי הרגע הזה - ההגשה ננעלת, גם בממשק וגם בשרת.
  private computeDeadline(): void {
    const tuesday = new Date(this.weekDates[2]);
    tuesday.setHours(15, 0, 0, 0);
    this.deadlineLabel = this.formatDateLabel(tuesday);
    this.isLocked = new Date() > tuesday;
  }

  // חדש - טוען הגשה קיימת של העובד (אם יש) כדי שהוא יראה ויוכל
  // לערוך את מה שכבר שלח לשבוע הזה, במקום להתחיל מטופס ריק כל פעם.
  loadExistingAvailability(): void {
    this.shiftService.getAvailabilityForEmployee(this.employeeName).subscribe({
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