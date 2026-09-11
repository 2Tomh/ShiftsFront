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

  // תוקן - הכל דינמי לפי BoardConfiguration (בדיוק כמו לוח הניהול),
  // במקום רשימת roles/shiftTypes מקובעת בקוד. כך גם שורות "עצמאיות"
  // (extra rows, כמו "חפיפה"/"תגבור") מוצגות כאן, וגם תפקיד כמו
  // "מאבטח" מופיע בדיוק איפה שהוגדר בהגדרות - בלי צורך בשורת "כללי"
  // נפרדת ומקובעת שהייתה קיימת רק ב-5 הימים הראשונים.
  daysOfWeek: string[] = [];
  shiftBlocks: DynamicShiftBlock[] = [];
  extraRowNames: string[] = [];
  extraRowEntries: ExtraRowEntry[] = [];

  // תוקן - צבע נקבע לפי שם המשמרת בפועל ("בוקר"/"צהריים"/"לילה"),
  // ולא לפי הסדר שהיא מופיעה בתצורה. קודם ההתאמה הייתה לפי אינדקס
  // בלבד (בלוק ראשון = shift-morning וכו'), וזה שבר את הצבעים אם
  // סדר ההגדרות בהגדרות הלוח לא היה בדיוק בוקר->צהריים->לילה.
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

  loadAll(): void {
    this.isLoading = true;

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

    this.boardConfigService.getExtraRows().subscribe({
      next: (rows) => this.extraRowEntries = rows || [],
      error: (err) => console.error('שגיאה בטעינת שורות עצמאיות:', err)
    });
  }

  private applyConfiguration(config: BoardConfiguration): void {
    this.daysOfWeek = config.workDays;
    this.extraRowNames = config.extraRowNames || [];

    this.shiftBlocks = config.shiftDefinitions.map((sd, i) => ({
      type: sd.name,
      label: sd.name,
      roles: sd.roles,
      cssClass: this.getCssClassForBlock(sd.name, i)
    }));
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