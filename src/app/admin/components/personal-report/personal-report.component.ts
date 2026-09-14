import { Component, OnInit } from '@angular/core';
import { ShiftService } from '../../../services/shift.service';
import { EmployeeHistoryEntry } from '../../../Models/employee-history-entry.model';

interface CalendarDay {
  dayName: string;
  dateLabel: string;
  dateKey: string;
  summary: string; // תוקן - שורה אחת מאוחדת ("בוקר, צהריים") במקום רשימת בועות
}

interface CalendarWeek {
  weekLabel: string;
  days: CalendarDay[];
}

@Component({
  selector: 'app-personal-report',
  templateUrl: './personal-report.component.html',
  styleUrls: ['./personal-report.component.css']
})
export class PersonalReportComponent implements OnInit {
  allEmployeeNames: string[] = [];
  selectedEmployee = '';

  isEmployeePickerOpen = false;
  employeeSearchQuery = '';

  startDate = '';
  endDate = '';

  allDayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  selectedDays = new Set<string>(this.allDayNames); // ברירת מחדל - כל הימים מסומנים

  isLoading = false;
  hasSearched = false;
  results: EmployeeHistoryEntry[] = [];

  constructor(private shiftService: ShiftService) { }

  ngOnInit(): void {
    const today = new Date();
    const monthAgo = new Date();
    monthAgo.setDate(today.getDate() - 30);

    this.endDate = this.formatDateForInput(today);
    this.startDate = this.formatDateForInput(monthAgo);

    this.shiftService.getEmployees(this.formatDateForInput(today)).subscribe({
      next: (employees) => {
        this.allEmployeeNames = employees.map((e: any) => e.name).sort();
      },
      error: (err) => {
        console.error('שגיאה בטעינת רשימת העובדים', err);
      }
    });
  }

  private formatDateForInput(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // ===== בורר עובד מותאם אישית =====
  get filteredEmployeeNames(): string[] {
    const query = this.employeeSearchQuery.trim();
    if (!query) return this.allEmployeeNames;
    return this.allEmployeeNames.filter(name => name.includes(query));
  }

  toggleEmployeePicker(): void {
    this.isEmployeePickerOpen = !this.isEmployeePickerOpen;
    if (this.isEmployeePickerOpen) {
      this.employeeSearchQuery = '';
    }
  }

  closeEmployeePicker(): void {
    this.isEmployeePickerOpen = false;
  }

  selectEmployee(name: string): void {
    this.selectedEmployee = name;
    this.isEmployeePickerOpen = false;
  }

  toggleDay(day: string): void {
    if (this.selectedDays.has(day)) {
      this.selectedDays.delete(day);
    } else {
      this.selectedDays.add(day);
    }
  }

  isDaySelected(day: string): boolean {
    return this.selectedDays.has(day);
  }

  search(): void {
    if (!this.selectedEmployee) {
      alert('נא לבחור עובד');
      return;
    }
    if (!this.startDate || !this.endDate) {
      alert('נא לבחור טווח תאריכים מלא');
      return;
    }
    if (this.endDate < this.startDate) {
      alert('תאריך הסיום לא יכול להיות לפני תאריך ההתחלה');
      return;
    }

    this.isLoading = true;
    this.hasSearched = true;

    this.shiftService.getEmployeeHistory(this.selectedEmployee, this.startDate, this.endDate).subscribe({
      next: (data) => {
        // מציגים רק את מה שהעובד הגיש כהעדפה (Submitted), לא משמרות
        // בפועל/חופשה/מחלה - זה מה שרלוונטי לדוח הזה.
        this.results = data.filter(entry =>
          entry.entryType === 'Submitted' && this.selectedDays.has(entry.dayOfWeek)
        );
        this.isLoading = false;
      },
      error: (err) => {
        console.error('שגיאה בטעינת הדוח', err);
        this.isLoading = false;
        if (err.status === 404) {
          this.results = [];
        } else {
          alert('שגיאה בטעינת הדוח');
        }
      }
    });
  }

  // ===== תצוגת לוח שבועי =====
  // כל שבוע (ראשון-שבת) מוצג כשורת עמודות, ובכל יום שורה אחת
  // מאוחדת של כל המשמרות שהוגשו ("בוקר, צהריים"), בלי מלל מיותר.
  get calendarWeeks(): CalendarWeek[] {
    if (!this.startDate || !this.endDate) return [];

    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    end.setHours(23, 59, 59, 999);

    // עוגן לתחילת השבוע (יום ראשון) שמכיל את תאריך ההתחלה, כדי
    // שהלוח תמיד יציג שבועות שלמים (ראשון-שבת), לא קטועים.
    const anchor = new Date(start);
    anchor.setDate(anchor.getDate() - anchor.getDay());
    anchor.setHours(0, 0, 0, 0);

    const detailsByDate = new Map<string, string[]>();
    this.results.forEach(entry => {
      const key = this.dateKeyFromString(entry.date);
      if (!detailsByDate.has(key)) detailsByDate.set(key, []);
      detailsByDate.get(key)!.push(entry.details);
    });

    const weeks: CalendarWeek[] = [];
    const cursor = new Date(anchor);

    while (cursor <= end) {
      const days: CalendarDay[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(cursor);
        d.setDate(cursor.getDate() + i);
        const key = this.dateKey(d);
        const dayDetails = detailsByDate.get(key) || [];
        days.push({
          dayName: this.allDayNames[i],
          dateLabel: this.formatDateShort(d),
          dateKey: key,
          summary: dayDetails.length > 0 ? dayDetails.join(', ') : '—'
        });
      }

      const weekEnd = new Date(cursor);
      weekEnd.setDate(cursor.getDate() + 6);
      weeks.push({ weekLabel: this.formatWeekLabel(cursor, weekEnd), days });

      cursor.setDate(cursor.getDate() + 7);
    }

    return weeks;
  }

  private dateKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private dateKeyFromString(dateStr: string): string {
    return this.dateKey(new Date(dateStr));
  }

  private formatDateShort(d: Date): string {
    const day = String(d.getDate()).padStart(2, '0');
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}.${m}`;
  }

  private formatWeekLabel(start: Date, end: Date): string {
    const sD = start.getDate();
    const sM = start.getMonth() + 1;
    const eD = end.getDate();
    const eM = end.getMonth() + 1;
    return sM === eM ? `${sD}-${eD}.${sM}` : `${sD}.${sM} - ${eD}.${eM}`;
  }
}