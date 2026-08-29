import { Component, OnInit, OnDestroy } from '@angular/core';
import { ShiftService } from '../../../services/shift.service';
import { Shift } from '../../../Models/shift.model';

@Component({
  selector: 'app-schedule-view',
  templateUrl: './schedule-view.component.html',
  styleUrls: ['./schedule-view.component.css']
})
export class ScheduleViewComponent implements OnInit, OnDestroy {
  shifts: Shift[] = [];
  isLoading = true;
  lastUpdated: Date | null = null;
  highlightName: string = '';

  daysOfWeek: string[] = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  shiftTypes = [
    { label: 'בוקר', icon: '☀️', cssClass: 'shift-morning' },
    { label: 'צהריים', icon: '🌤️', cssClass: 'shift-afternoon' },
    { label: 'לילה', icon: '🌙', cssClass: 'shift-night' }
  ];

  roles = ['אחמ״ש', 'סייר', 'בקרה'];

  private refreshInterval: any;

  constructor(
    private shiftService: ShiftService
  ) { }

  ngOnInit(): void {
    this.loadShifts();
    this.refreshInterval = setInterval(() => this.loadShifts(), 30000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  loadShifts(): void {
    this.shiftService.getPublishedShifts().subscribe({
      next: (data) => {
        this.shifts = data;
        this.isLoading = false;
        this.lastUpdated = new Date();
      },
      error: (err) => {
        console.error('שגיאה בטעינת הלוח:', err);
        this.isLoading = false;
      }
    });
  }

  refreshNow(): void {
    this.isLoading = true;
    this.loadShifts();
  }

  getEmployeeForRole(dayName: string, shiftTypeLabel: string, role: string): string {
    const shift = this.shifts.find((s: any) => {
      const sDay = this.translateDayToHebrew(s.day || s.Day);
      const sType = this.getShiftTypeLabel(s.type || s.Type);
      return sDay === dayName && sType === shiftTypeLabel;
    });

    const assignments = (shift as any)?.assignments || (shift as any)?.Assignments;
    if (!assignments) return '';

    const assignment = assignments.find((a: any) => (a.role || a.Role) === role);
    return assignment ? assignment.employeeName : '';
  }

  isMe(dayName: string, shiftTypeLabel: string, role: string): boolean {
    if (!this.highlightName.trim()) return false;
    const name = this.getEmployeeForRole(dayName, shiftTypeLabel, role);
    return name.trim() === this.highlightName.trim();
  }

  private translateDayToHebrew(englishDay: string): string {
    const map: { [key: string]: string } = {
      'Sunday': 'ראשון', 'Monday': 'שני', 'Tuesday': 'שלישי', 'Wednesday': 'רביעי',
      'Thursday': 'חמישי', 'Friday': 'שישי', 'Saturday': 'שבת'
    };
    return map[englishDay] || englishDay;
  }

  private getShiftTypeLabel(type: any): string {
    if (type === 'Morning' || type === 0 || type === '0') return 'בוקר';
    if (type === 'Afternoon' || type === 1 || type === '1') return 'צהריים';
    if (type === 'Night' || type === 2 || type === '2') return 'לילה';
    return '';
  }

  // חדש: אותה לוגיקה כמו שורת "כללי/מאבטח" בלוח המנהל - קשורה
  // למשמרת הבוקר (לפי המבנה המקורי), ולא רלוונטית ביום שישי/שבת.
  getGuardForDay(dayIndex: number): string {
    return this.getEmployeeForRole(this.daysOfWeek[dayIndex], 'בוקר', 'מאבטח');
  }
}