import { Component, OnInit, OnDestroy } from '@angular/core';
import { ShiftService } from '../../../services/shift.service';
import { BoardConfigurationService } from '../../../services/board-configuration.service';
import { Shift } from '../../../Models/shift.model';
import { BoardConfiguration, ExtraRowEntry } from '../../../Models/board-configuration.model';

interface DynamicShiftBlock {
  type: string;
  label: string;
  roles: string[];
  cssClass: string;
}

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

  daysOfWeek: string[] = [];
  shiftBlocks: DynamicShiftBlock[] = [];

  // תוקן - לא נגזר יותר מ-config.extraRowNames הגלובלי (משותף לכל
  // השבועות בכל ההיסטוריה). נטען עכשיו דרך endpoint ספציפי-לשבוע
  // (getExtraRowNames), כדי שמחיקת שורה לשבוע אחד לא תשפיע על
  // שבועות אחרים - כולל השבוע שכבר מוצג כאן.
  extraRowNames: string[] = [];
  extraRowEntries: ExtraRowEntry[] = [];

  private readonly extraBlockCssClasses = ['shift-color-4', 'shift-color-5', 'shift-color-6'];

  private getCssClassForBlock(label: string, fallbackIndex: number): string {
    if (label.includes('בוקר')) return 'shift-morning';
    if (label.includes('צהריים')) return 'shift-afternoon';
    if (label.includes('לילה')) return 'shift-night';
    return this.extraBlockCssClasses[fallbackIndex % this.extraBlockCssClasses.length];
  }

  private dayMap: { [key: string]: string } = {
    'ראשון': 'Sunday', 'שני': 'Monday', 'שלישי': 'Tuesday', 'רביעי': 'Wednesday',
    'חמישי': 'Thursday', 'שישי': 'Friday', 'שבת': 'Saturday'
  };

  private refreshInterval: any;

  // השבוע הנוכחי (המפורסם כברירת מחדל) ושבוע אחריו, כדי שיהיה
  // אפשר להציג את שניהם דרך כפתור טוגל, בלי לאבד את הלוח הנוכחי
  // כברירת מחדל בכניסה לעמוד.
  viewingNextWeek = false;
  currentWeekStart: Date = this.snapToSunday(new Date());
  nextWeekStart: Date = this.addDays(this.currentWeekStart, 7);

  constructor(
    private shiftService: ShiftService,
    private boardConfigService: BoardConfigurationService
  ) { }

  ngOnInit(): void {
    this.loadAll();
    this.refreshInterval = setInterval(() => this.loadAll(), 30000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  private snapToSunday(date: Date): Date {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  private formatDateForApi(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private formatDateForDisplay(date: Date): string {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${d}/${m}`;
  }

  get activeWeekStart(): Date {
    return this.viewingNextWeek ? this.nextWeekStart : this.currentWeekStart;
  }

  get activeWeekRangeLabel(): string {
    const start = this.activeWeekStart;
    const end = this.addDays(start, 6);
    return `${this.formatDateForDisplay(start)} - ${this.formatDateForDisplay(end)}`;
  }

  // טוגל בין הלוח הנוכחי ללוח השבוע הבא. לא מוחק כלום, רק מחליף
  // איזה שבוע מוצג כרגע וטוען הכל מחדש מהשרת לפי השבוע החדש.
  toggleWeek(): void {
    this.viewingNextWeek = !this.viewingNextWeek;
    this.loadAll();
  }

  loadAll(): void {
    this.isLoading = true;
    const weekStartParam = this.formatDateForApi(this.activeWeekStart);

    this.boardConfigService.getConfiguration().subscribe({
      next: (config) => {
        this.applyConfiguration(config);
        this.loadShifts();
      },
      error: (err) => {
        console.error('שגיאה בטעינת תצורת הלוח:', err);
        this.loadShifts();
      }
    });

    // תוקן - שמות השורות העצמאיות נטענים עכשיו ספציפית לשבוע
    // המוצג כרגע (activeWeekStart), לא כרשימה גלובלית.
    this.boardConfigService.getExtraRowNames(weekStartParam).subscribe({
      next: (defs) => this.extraRowNames = (defs || []).map(d => d.rowName),
      error: (err) => console.error('שגיאה בטעינת שמות שורות עצמאיות:', err)
    });

    // תוקן - היה חסר weekStartParam לגמרי כאן, כך שהתוכן שהוקלד
    // בפועל בשורות העצמאיות (לא רק השמות שלהן) חזר בלי סינון לפי
    // שבוע - אותה בעיה בדיוק שכבר תוקנה במקומות אחרים בשיחה הזו.
    this.boardConfigService.getExtraRows(weekStartParam).subscribe({
      next: (rows) => this.extraRowEntries = rows || [],
      error: (err) => console.error('שגיאה בטעינת שורות עצמאיות:', err)
    });
  }

  private applyConfiguration(config: BoardConfiguration): void {
    this.daysOfWeek = config.workDays;

    this.shiftBlocks = config.shiftDefinitions.map((sd, i) => ({
      type: sd.name,
      label: sd.name,
      roles: sd.roles,
      cssClass: this.getCssClassForBlock(sd.name, i)
    }));
  }

  loadShifts(): void {
    this.isLoading = true;
    const weekStartParam = this.formatDateForApi(this.activeWeekStart);

    this.shiftService.getPublishedShifts(weekStartParam).subscribe({
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
    this.loadAll();
  }

  getEmployeeForRole(dayName: string, shiftType: string, role: string): string {
    const dayEnglish = this.dayMap[dayName];
    const shift = this.shifts.find((s: any) => {
      const sDay = s.day || s.Day;
      const sType = s.type || s.Type;
      return sDay === dayEnglish && sType === shiftType;
    });

    const assignments = (shift as any)?.assignments || (shift as any)?.Assignments;
    if (!assignments) return '';

    const assignment = assignments.find((a: any) => (a.role || a.Role) === role);
    return assignment ? assignment.employeeName : '';
  }

  isMe(dayName: string, shiftType: string, role: string): boolean {
    if (!this.highlightName.trim()) return false;
    const name = this.getEmployeeForRole(dayName, shiftType, role);
    return name.trim() === this.highlightName.trim();
  }

  getExtraRowText(rowName: string, dayName: string): string {
    const dayEng = this.dayMap[dayName];
    const entry = this.extraRowEntries.find(e => e.rowName === rowName && e.day === dayEng);
    return entry ? entry.text : '';
  }
}