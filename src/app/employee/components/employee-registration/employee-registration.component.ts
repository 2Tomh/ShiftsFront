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

  // חדש: ימים חסומים בגלל חופשה מאושרת + הודעה להצגה למשתמש
  blockedDays = new Set<string>();
  vacationBanner: string = '';

  constructor(
    private shiftService: ShiftService,
    private vacationService: VacationService,
    private authService: AuthService
  ) { }

  // חדש - קריטי: השם נלקח אוטומטית מהזהות המחוברת (Login), ולא
  // מוקלד ידנית יותר - זה פותר את הבאג "ההגשה נעלמת/משתמש כפול":
  // קודם, אם העובד הקליד שם שונה במעט מזה שהאדמין רשם ליצירת המשתמש
  // שלו (רווח נוסף, כינוי, סדר שונה), נוצרה רשומת Employee חדשה
  // ונפרדת בשרת (find-or-create לפי שם), והעובד "נעלם" מבחינת
  // המנהל - כי הוא בפועל נוצר כמישהו אחר לגמרי. בודקים חפיפה לחופשה
  // מייד עם הכניסה לדף (לא מחכים ל-blur יותר, כי אין יותר הקלדה בכלל).
  ngOnInit(): void {
    this.employeeName = this.authService.getEmployeeName() || this.authService.getUsername() || '';
    if (this.employeeName) {
      this.checkVacationConflicts();
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

  isSelected(day: string, shift: string): boolean {
    return this.preferredShifts.some(s => s.day === day && s.shift === shift);
  }

  isDayBlocked(day: string): boolean {
    return this.blockedDays.has(day);
  }

  togglePreference(day: string, shift: string) {
    // הגנה נוספת - גם אם מישהו יצליח ללחוץ על כפתור מבוטל (למשל
    // דרך DevTools), הלוגיקה עצמה לא תאפשר לבחור יום חסום.
    if (this.blockedDays.has(day)) return;

    const index = this.preferredShifts.findIndex(s => s.day === day && s.shift === shift);
    if (index > -1) {
      this.preferredShifts.splice(index, 1);
    } else {
      this.preferredShifts.push({ day, shift });
    }
  }

  /**
   * בודקת אם לעובד יש חופשה מאושרת שחופפת לשבוע שמוצג בטופס,
   * וחוסמת את הימים הרלוונטיים. נקראת אוטומטית ב-ngOnInit (כי השם
   * כבר ידוע מייד, לא צריך לחכות ל-blur של שדה טקסט שכבר לא קיים).
   */
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

        // מסירים בחירות קיימות בימים שהתבררו כחסומים
        this.preferredShifts = this.preferredShifts.filter(s => !this.blockedDays.has(s.day));

        if (this.blockedDays.size > 0) {
          this.vacationBanner = `שימי לב: יש לך חופשה מאושרת בתאריכים ${ranges.join(', ')} - לא ניתן להגיש זמינות לימים אלו.`;
        }
      },
      error: () => {
        // כשל בבדיקה לא אמור לחסום את המשתמש מלהגיש בכלל - השרת
        // עדיין יבדוק את זה בעצמו כהגנה אמיתית.
      }
    });
  }

  submitAvailability() {
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

    this.shiftService.submitEmployeeAvailability(payload).subscribe({
      next: () => {
        alert(`תודה, הזמינות נשלחה בהצלחה!`);
        this.resetForm();
      },
      error: (err: any) => {
        console.error(err);
        // מציג את הודעת השגיאה האמיתית מהשרת (כולל רשימת הימים
        // החסומים, אם השרת חסם בגלל חופשה) במקום הודעה גנרית.
        alert(err.error?.error || "שגיאה בשליחת הנתונים.");
      }
    });
  }

  resetForm() {
    // לא מאפסים employeeName יותר - הוא קבוע ותואם לזהות המחוברת,
    // לא שדה טופס שצריך "לנקות" בין הגשות.
    this.preferredShifts = [];
    this.notes = '';
    this.blockedDays.clear();
    this.vacationBanner = '';
  }
}