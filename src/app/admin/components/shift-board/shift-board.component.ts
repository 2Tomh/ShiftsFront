import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ShiftService } from '../../../services/shift.service';
import { BoardConfigurationService } from '../../../services/board-configuration.service';
import { DataRefreshService } from '../../../services/data-refresh.service';
import { VacationService } from '../../../services/vacation.service';
import { SickLeaveService } from '../../../services/sickleave.service';
import { BlockedDateService } from '../../../services/blocked-date.service';
import { HolidayService } from '../../../services/holiday.service';
import { Shift } from '../../../Models/shift.model';
import { BoardConfiguration, ExtraRowEntry, ExtraRowDefinition } from '../../../Models/board-configuration.model';
import { Holiday } from '../../../Models/holiday.model';

interface DynamicShiftBlock {
  type: string;
  label: string;
  roles: string[];
  icon: string;
  startTime: string;
  endTime: string;
  blockedDays: string[];
  roleBlockedDays: { [role: string]: string[] };
}

type RestSeverity = 'orange' | 'red';

@Component({
  selector: 'app-shift-board',
  templateUrl: './shift-board.component.html',
  styleUrls: ['./shift-board.component.css']
})
export class ShiftBoardComponent implements OnInit {
  shifts: Shift[] = [];
  allEmployees: any[] = [];
  employeeStats: any[] = [];
  isProcessing = false;
  isPublishing = false;

  daysOfWeek: string[] = [];
  shiftBlocks: DynamicShiftBlock[] = [];

  // תוקן - extraRowNames כבר לא נגזר מ-config.extraRowNames הגלובלי
  // (שהיה משותף לכל השבועות ולכן מחיקה השפיעה על כולם). עכשיו הוא
  // נגזר מ-extraRowDefs, שמגיעים מ-endpoint ספציפי-לשבוע.
  extraRowDefs: ExtraRowDefinition[] = [];
  get extraRowNames(): string[] {
    return this.extraRowDefs.map(d => d.rowName);
  }
  extraRowEntries: ExtraRowEntry[] = [];

  // חדש - שדה עזר להוספת שורה עצמאית לשבוע הנוכחי בלבד (לא לתבנית
  // הגלובלית - זו נערכת ב"הגדרות לוח").
  newExtraRowNameForWeek = '';
  isSavingExtraRow = false;

  isProcessingExtraRow: { [rowName: string]: boolean } = {};

  selectedWeekStart: Date = this.getNextWeekSunday();

  // חדש - תצוגת מובייל: איזה יום מוצג כרגע (0 = הימני ביותר ב-daysOfWeek).
  // מאותחל ליום של היום אם הוא בתוך השבוע המוצג, אחרת ליום הראשון.
  mobileSelectedDayIndex = 0;

  // חדש - טוגל בין תצוגת המטריצה המלאה (עם בנק המועמדים) לתצוגה נקייה
  // שמציגה רק את המשובצים בפועל, בלי עמודת המועמדים. לא משכפל שום
  // לוגיקה - שתי התצוגות קוראות לאותן פונקציות בדיוק (getEmployeeForRole,
  // startTextEdit, isCellBlocked וכו').
  viewMode: 'matrix' | 'clean' = 'matrix';

  setViewMode(mode: 'matrix' | 'clean'): void {
    this.viewMode = mode;
  }

  private restSeverityMap: Map<string, RestSeverity> = new Map();

  private approvedLeaves: { employeeName: string; start: Date; end: Date }[] = [];

  private blockedDatesByDate: Map<string, string> = new Map();

  private holidaysByDate: Map<string, Holiday> = new Map();

  private dayMap: { [key: string]: string } = {
    'ראשון': 'Sunday', 'שני': 'Monday', 'שלישי': 'Tuesday', 'רביעי': 'Wednesday',
    'חמישי': 'Thursday', 'שישי': 'Friday', 'שבת': 'Saturday'
  };

  private readonly hebrewDayOffsets: { [key: string]: number } = {
    'ראשון': 0, 'שני': 1, 'שלישי': 2, 'רביעי': 3,
    'חמישי': 4, 'שישי': 5, 'שבת': 6
  };

  private readonly icons = ['☀️', '🌤️', '🌙', '⭐', '🌗', '🌌'];

  selectedTarget: { dayIndex: number, shiftType: any, role: string } | null = null;

  // עריכת טקסט חופשי inline בתוך התא (במקום prompt() קופץ)
  editingTextCell: { dayIndex: number, shiftType: any, role: string } | null = null;
  editingTextValue: string = '';
  @ViewChild('textInput') textInputRef?: ElementRef<HTMLInputElement>;

  showEditAvailabilityModal = false;
  editingEmployeeName = '';
  editPreferredShifts: { day: string, shift: string }[] = [];
  editNotes: string = '';
  isLoadingEdit = false;
  get editShiftLabels(): string[] {
    return this.shiftBlocks.map(b => b.label);
  }

  constructor(
    private shiftService: ShiftService,
    private boardConfigService: BoardConfigurationService,
    private dataRefreshService: DataRefreshService,
    private vacationService: VacationService,
    private sickLeaveService: SickLeaveService,
    private blockedDateService: BlockedDateService,
    private holidayService: HolidayService
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    const weekStartParam = this.formatDateForApi(this.selectedWeekStart);

    const weekEndDate = new Date(this.selectedWeekStart);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    const startYear = this.selectedWeekStart.getFullYear();
    const endYear = weekEndDate.getFullYear();

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

    forkJoin({
      employees: this.shiftService.getEmployees(weekStartParam),
      shifts: this.shiftService.getShifts(weekStartParam),
      config: this.boardConfigService.getConfiguration(),
      extraRows: this.boardConfigService.getExtraRows(weekStartParam),
      extraRowDefs: this.boardConfigService.getExtraRowNames(weekStartParam).pipe(
        catchError(err => {
          console.warn('שגיאה בטעינת שמות שורות עצמאיות לשבוע - ממשיכים בלי שורות עצמאיות:', err);
          return of([] as ExtraRowDefinition[]);
        })
      ),
      vacations: this.vacationService.getAll('Approved'),
      sickLeaves: this.sickLeaveService.getAll('Approved'),
      blockedDates: this.blockedDateService.getAll(),
      holidaysStartYear: holidaysStartYear$,
      holidaysEndYear: holidaysEndYear$
    }).subscribe(({ employees, shifts, config, extraRows, extraRowDefs, vacations, sickLeaves, blockedDates, holidaysStartYear, holidaysEndYear }) => {
      this.allEmployees = employees;
      this.shifts = shifts;
      this.applyConfiguration(config);
      this.extraRowEntries = extraRows;
      this.extraRowDefs = extraRowDefs || [];
      this.approvedLeaves = [
        ...vacations.map((v: any) => ({ employeeName: v.employeeName, start: new Date(v.startDate), end: new Date(v.endDate) })),
        ...sickLeaves.map((s: any) => ({ employeeName: s.employeeName, start: new Date(s.startDate), end: new Date(s.endDate) }))
      ];
      this.blockedDatesByDate = new Map();
      (blockedDates as any[]).forEach(bd => {
        const d = new Date(bd.date);
        if (d >= this.selectedWeekStart && d <= weekEndDate) {
          this.blockedDatesByDate.set(this.formatDateForApi(d), bd.reason || '');
        }
      });

      this.holidaysByDate = new Map();
      [...holidaysStartYear, ...holidaysEndYear].forEach(h => this.holidaysByDate.set(h.date, h));

      this.calculateStats();
      this.computeRestViolations();
      this.dataRefreshService.notifyDataChanged();
    });
  }

  private applyConfiguration(config: BoardConfiguration): void {
    this.daysOfWeek = config.workDays;

    this.shiftBlocks = config.shiftDefinitions.map((sd, i) => ({
      type: sd.name,
      label: sd.name,
      roles: sd.roles,
      icon: this.icons[i % this.icons.length],
      startTime: sd.startTime || '',
      endTime: sd.endTime || '',
      blockedDays: sd.blockedDays || [],
      roleBlockedDays: sd.roleBlockedDays || {}
    }));

    this.mobileSelectedDayIndex = this.getTodayIndexInWeek();
  }

  // חדש - מוצא את האינדקס של "היום" בתוך daysOfWeek הנוכחי, כדי
  // שתצוגת המובייל תיפתח ישר על היום הרלוונטי במקום תמיד על ראשון.
  // אם היום לא נמצא בשבוע המוצג (למשל צופים בשבוע אחר), נשאר על 0.
  private getTodayIndexInWeek(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < this.daysOfWeek.length; i++) {
      const d = this.getDateForDayIndex(i);
      if (d.getTime() === today.getTime()) return i;
    }
    return 0;
  }

  prevMobileDay(): void {
    if (this.mobileSelectedDayIndex > 0) {
      this.mobileSelectedDayIndex--;
    }
  }

  nextMobileDay(): void {
    if (this.mobileSelectedDayIndex < this.daysOfWeek.length - 1) {
      this.mobileSelectedDayIndex++;
    }
  }

  private loadShiftsOnly(): void {
    const weekStartParam = this.formatDateForApi(this.selectedWeekStart);
    this.shiftService.getShifts(weekStartParam).subscribe(shifts => {
      this.shifts = shifts;
      this.calculateStats();
      this.computeRestViolations();
      this.dataRefreshService.notifyDataChanged();
    });
  }

  // חדש - הוספת שורה עצמאית לשבוע הנוכחי (המוצג כרגע) בלבד. לא נוגע
  // בתבנית הגלובלית ב"הגדרות לוח", ולא בשום שבוע אחר.
  addExtraRowForWeek(): void {
    const name = this.newExtraRowNameForWeek.trim();
    if (!name) {
      alert('יש להקליד שם לשורה החדשה לפני לחיצה על "הוסף"');
      return;
    }

    if (this.extraRowNames.includes(name)) {
      alert('שורה בשם הזה כבר קיימת בשבוע הזה');
      return;
    }

    const weekStartParam = this.formatDateForApi(this.selectedWeekStart);
    this.isSavingExtraRow = true;

    this.boardConfigService.addExtraRowName(name, weekStartParam).subscribe({
      next: (def) => {
        this.isSavingExtraRow = false;
        this.extraRowDefs.push(def);
        this.newExtraRowNameForWeek = '';
      },
      error: (err) => {
        this.isSavingExtraRow = false;
        console.error('שגיאה בהוספת שורה עצמאית לשבוע:', err);
        alert(err.error || 'שגיאה בהוספת השורה. נסה שוב.');
      }
    });
  }

  // חדש - הסרת שורה עצמאית מהשבוע הנוכחי בלבד. השרת גם מוחק את
  // התוכן שהוקלד בפועל תחתיה לשבוע הזה - שבועות אחרים לא מושפעים.
  removeExtraRowForWeek(def: ExtraRowDefinition): void {
    if (!def.id) return;
    if (!confirm(`להסיר את השורה "${def.rowName}" מהשבוע הזה? התוכן שהוקלד תחתיה לשבוע הזה יימחק. שבועות אחרים לא יושפעו.`)) return;

    this.isProcessingExtraRow[def.rowName] = true;

    this.boardConfigService.removeExtraRowName(def.id).subscribe({
      next: () => {
        delete this.isProcessingExtraRow[def.rowName];
        this.extraRowDefs = this.extraRowDefs.filter(d => d.id !== def.id);
        this.extraRowEntries = this.extraRowEntries.filter(e => e.rowName !== def.rowName);
      },
      error: (err) => {
        delete this.isProcessingExtraRow[def.rowName];
        console.error('שגיאה בהסרת שורה עצמאית מהשבוע:', err);
        alert('שגיאה בהסרת השורה. נסה שוב.');
      }
    });
  }

  calculateStats(): void {
    const statsMap = new Map<string, any>();
    this.allEmployees.forEach(emp => {
      const name = emp.name;
      const requested = emp.requestedCount || 0;
      if (name && requested > 0) {
        statsMap.set(name, { name: name, total: 0, night: 0, requested: requested, notes: emp.notes || '' });
      }
    });

    this.shifts.forEach((shift: any) => {
      const sType = shift.type || shift.Type;
      const isNight = this.shiftBlocks.length > 2 && sType === this.shiftBlocks[2].type;
      const assignments = shift.assignments || [];
      assignments.forEach((ass: any) => {
        const name = ass.employeeName;
        if (name && statsMap.has(name)) {
          const current = statsMap.get(name);
          current.total++;
          if (isNight) current.night++;
        }
      });
    });
    this.employeeStats = Array.from(statsMap.values()).sort((a, b) => b.total - a.total);
  }

  getEmployeeForRole(dayIndex: number, shiftType: any, role: string): string {
    const dayNameHebrew = this.daysOfWeek[dayIndex];
    const dayNameEnglish = this.dayMap[dayNameHebrew];
    const shift = this.shifts.find((s: any) => {
      const sDay = s.day || s.Day;
      const sType = s.type || s.Type;
      return sDay === dayNameEnglish && sType === shiftType;
    });
    const assignments = (shift as any)?.assignments || (shift as any)?.Assignments;
    if (assignments) {
      const assignment = assignments.find((a: any) => (a.role || a.Role) === role);
      return assignment ? assignment.employeeName : '';
    }
    return '';
  }

  getShiftForDay(dayIndex: number, type: any): Shift | undefined {
    const dayNameHebrew = this.daysOfWeek[dayIndex];
    const dayNameEnglish = this.dayMap[dayNameHebrew];

    return this.shifts.find((s: any) => {
      const sDay = (s.day || s.Day || '').toString();
      const sType = s.type || s.Type;
      return sDay === dayNameEnglish && sType === type;
    });
  }

  isBlockedDayForShift(dayIndex: number, block: DynamicShiftBlock): boolean {
    const dayName = this.daysOfWeek[dayIndex];
    return block.blockedDays.includes(dayName);
  }

  isDateBlockedForDayIndex(dayIndex: number): boolean {
    const d = this.getDateForDayIndex(dayIndex);
    return this.blockedDatesByDate.has(this.formatDateForApi(d));
  }

  getBlockedDateReason(dayIndex: number): string {
    const d = this.getDateForDayIndex(dayIndex);
    return this.blockedDatesByDate.get(this.formatDateForApi(d)) || '';
  }

  isCellBlocked(dayIndex: number, block: DynamicShiftBlock): boolean {
    return this.isDateBlockedForDayIndex(dayIndex) || this.isBlockedDayForShift(dayIndex, block);
  }

  getCellBlockedLabel(dayIndex: number, block: DynamicShiftBlock): string {
    return this.getBlockedDateReason(dayIndex) || 'אין משמרת';
  }

  isFullDayBlocked(dayIndex: number): boolean {
    return this.isDateBlockedForDayIndex(dayIndex);
  }

  isRoleBlockedForDay(dayIndex: number, block: DynamicShiftBlock, role: string): boolean {
    const dayName = this.daysOfWeek[dayIndex];
    const blocked = block.roleBlockedDays[role];
    return !!(blocked && blocked.includes(dayName));
  }

  getHolidayForDayIndex(dayIndex: number): Holiday | undefined {
    const d = this.getDateForDayIndex(dayIndex);
    return this.holidaysByDate.get(this.formatDateForApi(d));
  }

  isHolidayForDayIndex(dayIndex: number): boolean {
    return !!this.getHolidayForDayIndex(dayIndex);
  }

  private snapToSunday(date: Date): Date {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private getNextWeekSunday(): Date {
    const d = this.snapToSunday(new Date());
    d.setDate(d.getDate() + 7);
    return d;
  }

  previousWeek(): void {
    const d = new Date(this.selectedWeekStart);
    d.setDate(d.getDate() - 7);
    this.selectedWeekStart = d;
    this.loadData();
  }

  nextWeek(): void {
    const d = new Date(this.selectedWeekStart);
    d.setDate(d.getDate() + 7);
    this.selectedWeekStart = d;
    this.loadData();
  }

  goToCurrentWeek(): void {
    this.selectedWeekStart = this.getNextWeekSunday();
    this.loadData();
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

  get selectedWeekRangeLabel(): string {
    const start = this.selectedWeekStart;
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${this.formatDateForDisplay(start)} - ${this.formatDateForDisplay(end)}`;
  }

  private getFullDateForDay(dayName: string): Date | null {
    const offset = this.hebrewDayOffsets[dayName];
    if (offset === undefined) return null;
    const d = new Date(this.selectedWeekStart);
    d.setDate(d.getDate() + offset);
    return d;
  }

  getDateLabelForDay(dayName: string): string {
    const d = this.getFullDateForDay(dayName);
    return d ? this.formatDateForDisplay(d) : '';
  }

  private getDateForDayIndex(dayIndex: number): Date {
    const dayName = this.daysOfWeek[dayIndex];
    const d = this.getFullDateForDay(dayName) || new Date(this.selectedWeekStart);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  isEmployeeOnApprovedLeave(employeeName: string, dayIndex: number): boolean {
    if (!employeeName) return false;
    const day = this.getDateForDayIndex(dayIndex);
    return this.approvedLeaves.some(l => {
      if (l.employeeName !== employeeName) return false;
      const start = new Date(l.start);
      start.setHours(0, 0, 0, 0);
      const end = new Date(l.end);
      end.setHours(0, 0, 0, 0);
      return day >= start && day <= end;
    });
  }

  getAssignmentTooltip(dayIndex: number, shiftType: any, employeeName: string): string {
    if (this.isEmployeeOnApprovedLeave(employeeName, dayIndex)) {
      return 'שים לב: לעובד/ת יש אישור חופשה/מילואים ביום זה';
    }
    const severity = this.getRestSeverity(dayIndex, shiftType, employeeName);
    if (severity === 'red') return 'פחות מ-8 שעות הפרש ממשמרת סמוכה';
    if (severity === 'orange') return 'בדיוק 8 שעות הפרש ממשמרת סמוכה';
    return '';
  }

  private buildShiftDateTime(dayIndex: number, block: DynamicShiftBlock): { start: Date, end: Date } | null {
    if (!block.startTime || !block.endTime) return null;

    const dayName = this.daysOfWeek[dayIndex];
    const offset = this.hebrewDayOffsets[dayName];
    if (offset === undefined) return null;

    const dayDate = new Date(this.selectedWeekStart);
    dayDate.setDate(dayDate.getDate() + offset);

    const [sh, sm] = block.startTime.split(':').map(Number);
    const [eh, em] = block.endTime.split(':').map(Number);
    if ([sh, sm, eh, em].some(n => isNaN(n))) return null;

    const start = new Date(dayDate);
    start.setHours(sh, sm, 0, 0);

    const end = new Date(dayDate);
    end.setHours(eh, em, 0, 0);
    if (end.getTime() <= start.getTime()) {
      end.setDate(end.getDate() + 1);
    }

    return { start, end };
  }

  private computeRestViolations(): void {
    this.restSeverityMap = new Map();

    const perEmployee = new Map<string, { dayIndex: number, block: DynamicShiftBlock, start: Date, end: Date }[]>();

    this.shiftBlocks.forEach(block => {
      this.daysOfWeek.forEach((dayName, dayIndex) => {
        const dt = this.buildShiftDateTime(dayIndex, block);
        if (!dt) return;

        block.roles.forEach(role => {
          const name = this.getEmployeeForRole(dayIndex, block.type, role);
          if (!name) return;

          if (!perEmployee.has(name)) perEmployee.set(name, []);
          const list = perEmployee.get(name)!;
          if (!list.some(e => e.dayIndex === dayIndex && e.block === block)) {
            list.push({ dayIndex, block, start: dt.start, end: dt.end });
          }
        });
      });
    });

    perEmployee.forEach((assignments, employeeName) => {
      const sorted = [...assignments].sort((a, b) => a.start.getTime() - b.start.getTime());
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const curr = sorted[i];
        const gapHours = (curr.start.getTime() - prev.end.getTime()) / (1000 * 60 * 60);

        if (gapHours < 0) continue;

        let severity: RestSeverity | null = null;
        if (gapHours < 8) {
          severity = 'red';
        } else if (Math.abs(gapHours - 8) < 0.01) {
          severity = 'orange';
        }

        if (severity) {
          this.markRestSeverity(employeeName, prev.dayIndex, prev.block.type, severity);
          this.markRestSeverity(employeeName, curr.dayIndex, curr.block.type, severity);
        }
      }
    });
  }

  private markRestSeverity(employeeName: string, dayIndex: number, shiftType: string, severity: RestSeverity): void {
    const key = `${employeeName}|${dayIndex}|${shiftType}`;
    if (this.restSeverityMap.get(key) === 'red') return;
    this.restSeverityMap.set(key, severity);
  }

  getRestSeverity(dayIndex: number, shiftType: any, employeeName: string): RestSeverity | null {
    if (!employeeName) return null;
    return this.restSeverityMap.get(`${employeeName}|${dayIndex}|${shiftType}`) || null;
  }

  getCandidatesForCell(dayIndex: number, shiftType: any): any[] {
    const block = this.shiftBlocks.find(b => b.type === shiftType);
    const shiftLabel = block ? block.label : '';

    const currentDayHeb = this.daysOfWeek[dayIndex];
    const currentDayEng = this.dayMap[currentDayHeb];

    const result: any[] = [];

    this.allEmployees.forEach(emp => {
      const name = emp.name || emp.employeeName || emp.Name;
      const avails = emp.availabilities || emp.Availabilities || [];

      const hasMatch = avails.some((a: any) => {
        const dbDay = a.dayOfWeek || a.DayOfWeek;
        const dbPref = a.shiftPreference || a.ShiftPreference || "";
        const isDayMatch = (dbDay === currentDayEng || dbDay === currentDayHeb || dbDay === "יום " + currentDayHeb);
        const isShiftMatch = dbPref.includes(shiftLabel);
        return isDayMatch && isShiftMatch;
      });

      if (hasMatch && !this.isEmployeeOnApprovedLeave(name, dayIndex)) {
        result.push({ ...emp, fullName: name });
      }
    });

    return result;
  }

  selectCandidate(dayIndex: number, shiftType: any, role: string, candidate: any): void {
    if (this.getEmployeeForRole(dayIndex, shiftType, role) === candidate.fullName) {
      this.removeEmployee(dayIndex, shiftType, role);
    } else {
      this.assignFromBank(dayIndex, shiftType, role, candidate);
    }
  }

  isCandidateAssignedToRole(dayIndex: number, shiftType: any, fullName: string, role: string): boolean {
    return this.getEmployeeForRole(dayIndex, shiftType, role) === fullName;
  }

  isCandidateAssignedToAny(dayIndex: number, shiftType: any, fullName: string, roles: string[]): boolean {
    return roles.some(role => this.getEmployeeForRole(dayIndex, shiftType, role) === fullName);
  }

  startSelectingRole(dayIndex: number, shiftType: any, role: string): void {
    if (this.isSelectingRole(dayIndex, shiftType, role)) {
      this.selectedTarget = null;
    } else {
      this.selectedTarget = { dayIndex, shiftType, role };
    }
  }

  isSelectingRole(dayIndex: number, shiftType: any, role: string): boolean {
    return !!this.selectedTarget
      && this.selectedTarget.dayIndex === dayIndex
      && this.selectedTarget.shiftType === shiftType
      && this.selectedTarget.role === role;
  }

  assignFromSharedBank(dayIndex: number, shiftType: any, candidate: any, roles: string[]): void {
    if (this.selectedTarget && this.selectedTarget.dayIndex === dayIndex && this.selectedTarget.shiftType === shiftType) {
      const targetRole = this.selectedTarget.role;
      this.selectedTarget = null;
      this.assignFromBank(dayIndex, shiftType, targetRole, candidate);
      return;
    }

    const block = this.shiftBlocks.find(b => b.type === shiftType);
    const openRole = roles.find(role =>
      !this.getEmployeeForRole(dayIndex, shiftType, role) &&
      !(block && this.isRoleBlockedForDay(dayIndex, block, role))
    );
    if (!openRole) {
      alert('כל התפקידים כבר מאוישים או לא רלוונטיים ביום הזה. הסירי קודם שיבוץ קיים (×).');
      return;
    }
    this.assignFromBank(dayIndex, shiftType, openRole, candidate);
  }

  assignFromBank(dayIndex: number, shiftType: any, role: string, candidate: any): void {
    const employeeId = candidate.id || candidate.employeeId;
    const employeeName = candidate.fullName;

    if (!employeeId) {
      console.error("שגיאה: לא נמצא ID לעובד", candidate);
      return;
    }

    const shift = this.getShiftForDay(dayIndex, shiftType);
    if (!shift || !shift.id) {
      alert("שגיאה: המשמרת עדיין לא קיימת בשרת. לחץ קודם על כפתור 'צור שבוע חדש' למעלה כדי לאתחל את השבוע.");
      return;
    }

    const existingIndex = shift.assignments.findIndex((a: any) => a.role === role);
    const previousAssignment = existingIndex > -1 ? { ...shift.assignments[existingIndex] } : null;

    if (existingIndex > -1) {
      shift.assignments[existingIndex] = { ...shift.assignments[existingIndex], employeeName };
    } else {
      shift.assignments.push({ id: 'temp-' + Date.now(), role, employeeName } as any);
    }

    this.shiftService.assignEmployee(shift.id, employeeId, role).subscribe({
      next: () => {
        this.loadShiftsOnly();
      },
      error: (err) => {
        console.error("השיבוץ נכשל בשרת:", err);
        const revertIndex = shift.assignments.findIndex((a: any) => a.role === role);
        if (revertIndex > -1) {
          if (previousAssignment) {
            shift.assignments[revertIndex] = previousAssignment;
          } else {
            shift.assignments.splice(revertIndex, 1);
          }
        }
        alert("שגיאה בשיבוץ: " + (err.error?.message || "בדוק חיבור לשרת"));
      }
    });
  }

  // עריכת טקסט חופשי inline בתוך התא (החליף prompt() קופץ)
  startTextEdit(dayIndex: number, shiftType: any, role: string): void {
    const currentName = this.getEmployeeForRole(dayIndex, shiftType, role);
    this.editingTextValue = currentName || '';
    this.editingTextCell = { dayIndex, shiftType, role };
    this.selectedTarget = null; // סגירת מצב בחירה מהבנק אם היה פתוח

    setTimeout(() => this.textInputRef?.nativeElement?.focus());
  }

  isEditingText(dayIndex: number, shiftType: any, role: string): boolean {
    return !!this.editingTextCell
      && this.editingTextCell.dayIndex === dayIndex
      && this.editingTextCell.shiftType === shiftType
      && this.editingTextCell.role === role;
  }

  cancelTextEdit(): void {
    this.editingTextCell = null;
    this.editingTextValue = '';
  }

  saveTextEdit(): void {
    if (!this.editingTextCell) return;
    const { dayIndex, shiftType, role } = this.editingTextCell;
    const newText = this.editingTextValue.trim();
    this.editingTextCell = null;

    const shift = this.getShiftForDay(dayIndex, shiftType);
    if (!shift || !shift.id) {
      alert("שגיאה: המשמרת עדיין לא קיימת בשרת. לחץ קודם על כפתור 'צור שבוע חדש' למעלה כדי לאתחל את השבוע.");
      return;
    }

    const existingName = this.getEmployeeForRole(dayIndex, shiftType, role);
    if (newText === existingName) return; // אין שינוי בפועל

    if (!newText) {
      this.removeEmployee(dayIndex, shiftType, role);
      return;
    }

    let assignment = shift.assignments.find((a: any) => a.role === role);
    if (assignment) {
      assignment.employeeName = newText;
    } else {
      shift.assignments.push({ id: 'temp-' + Date.now(), role, employeeName: newText } as any);
    }

    this.shiftService.assignEmployee(shift.id, null, role, newText).subscribe({
      next: () => {
        this.loadShiftsOnly();
      },
      error: (err) => {
        console.error("שגיאה בשמירת טקסט חופשי:", err);
        alert("שגיאה בשמירת השינוי בשרת.");
      }
    });
  }

  onTextEditKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      (event.target as HTMLInputElement).blur(); // יגרום ל-saveTextEdit דרך (blur)
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelTextEdit();
      (event.target as HTMLInputElement).blur();
    }
  }

  clearAllAvailabilities() {
    if (confirm("האם אתה בטוח? כל העובדים והנתונים (מכל השבועות) יימחקו לצמיתות מהמערכת.")) {
      this.shiftService.clearAllData().subscribe({
        next: () => {
          this.allEmployees = [];
          this.employeeStats = [];
          this.shifts = [];
          alert("המערכת אופסה! כל השמות והנתונים נמחקו.");
          this.loadData();
        },
        error: (err) => {
          console.error("Delete failed:", err);
          alert("המחיקה נכשלה בשרת. בדוק את ה-Console לשגיאות.");
        }
      });
    }
  }

  get isWeekPublished(): boolean {
    return this.shifts.length > 0 && this.shifts.every((s: any) => s.isPublished || s.IsPublished);
  }

  publishWeek(): void {
    if (!confirm('לפרסם את הלוח הנוכחי לעובדים? הם יוכלו לראות אותו החל מעכשיו.')) return;

    this.isPublishing = true;
    const weekStartParam = this.formatDateForApi(this.selectedWeekStart);
    this.shiftService.publishWeek(weekStartParam).subscribe({
      next: (res: any) => {
        this.isPublishing = false;
        alert(res.message);
        this.loadData();
      },
      error: (err) => {
        this.isPublishing = false;
        console.error('שגיאה בפרסום:', err);
        alert('שגיאה בפרסום הלוח. נסה שוב.');
      }
    });
  }

  generateWeek() {
    if (!confirm("האם למחוק את השבוע הנבחר וליצור אותו מחדש?")) return;

    const weekStartParam = this.formatDateForApi(this.selectedWeekStart);

    this.shiftService.generateWeek(weekStartParam).subscribe({
      next: (res: any) => {
        alert(res.message || "השבוע נוצר בהצלחה!");
        this.loadData();
      },
      error: (err) => {
        console.error("שגיאה ביצירה:", err);
        alert("שגיאה ביצירה: " + (err.error?.error || err.message));
      }
    });
  }

  removeEmployee(dayIndex: number, shiftType: any, role: string) {
    if (this.isProcessing) return;
    const shift = this.getShiftForDay(dayIndex, shiftType);
    if (!shift) return;

    const removedIndex = shift.assignments.findIndex((a: any) => a.role === role);
    const removedAssignment = removedIndex > -1 ? shift.assignments[removedIndex] : null;
    if (removedIndex > -1) {
      shift.assignments.splice(removedIndex, 1);
    }

    this.isProcessing = true;
    this.shiftService.assignEmployee(shift.id, null, role).subscribe({
      next: () => {
        this.isProcessing = false;
        this.loadShiftsOnly();
      },
      error: (err) => {
        this.isProcessing = false;
        console.error(err);
        if (removedAssignment && removedIndex > -1) {
          shift.assignments.splice(removedIndex, 0, removedAssignment);
        }
        alert('שגיאה בהסרת השיבוץ. נסה שוב.');
      }
    });
  }

  openEditAvailabilityModal(stat: any): void {
    this.editingEmployeeName = stat.name;
    this.showEditAvailabilityModal = true;
    this.isLoadingEdit = true;
    this.editPreferredShifts = [];
    this.editNotes = '';

    const weekStartParam = this.formatDateForApi(this.selectedWeekStart);
    this.shiftService.getAvailabilityForEmployee(stat.name, weekStartParam).subscribe({
      next: (res: any) => {
        this.isLoadingEdit = false;
        if (res && res.found) {
          this.editPreferredShifts = (res.preferredShifts || []).map((p: any) => ({
            day: p.day,
            shift: p.shift
          }));
          this.editNotes = res.notes || '';
        }
      },
      error: (err) => {
        this.isLoadingEdit = false;
        console.error('שגיאה בטעינת ההגשה לעריכה:', err);
      }
    });
  }

  closeEditAvailabilityModal(): void {
    this.showEditAvailabilityModal = false;
    this.editingEmployeeName = '';
    this.editPreferredShifts = [];
    this.editNotes = '';
  }

  isEditSelected(day: string, shift: string): boolean {
    return this.editPreferredShifts.some(s => s.day === day && s.shift === shift);
  }

  toggleEditPreference(day: string, shift: string): void {
    const index = this.editPreferredShifts.findIndex(s => s.day === day && s.shift === shift);
    if (index > -1) {
      this.editPreferredShifts.splice(index, 1);
    } else {
      this.editPreferredShifts.push({ day, shift });
    }
  }

  saveEditedAvailability(): void {
    const payload = {
      employeeName: this.editingEmployeeName,
      weekStartDate: this.selectedWeekStart,
      preferredShifts: this.editPreferredShifts,
      notes: this.editNotes
    };

    this.shiftService.submitEmployeeAvailability(payload).subscribe({
      next: () => {
        this.closeEditAvailabilityModal();
        this.loadData();
      },
      error: (err) => {
        console.error('שגיאה בשמירת ההגשה הערוכה:', err);
        alert('שגיאה בשמירת ההגשה. נסה שוב.');
      }
    });
  }

  editEmployeeName(stat: any) {
    const newName = prompt("הכנס שם מעודכן לעובד:", stat.name);
    if (!newName || newName.trim() === "" || newName.trim() === stat.name) return;

    const trimmedName = newName.trim();
    const emp = this.allEmployees.find(e => e.name === stat.name);

    if (!emp || !emp.id) {
      alert("שגיאה: לא נמצא מזהה עובד. נסה לרענן (F5).");
      return;
    }

    this.shiftService.updateEmployeeName(emp.id, trimmedName).subscribe({
      next: () => {
        this.loadData();
      },
      error: (err) => {
        console.error('שגיאה בעדכון שם העובד:', err);
        alert('שגיאה בשמירת השם החדש. נסה שוב.');
      }
    });
  }

  getExtraRowText(rowName: string, dayIndex: number): string {
    const dayEng = this.dayMap[this.daysOfWeek[dayIndex]];
    const entry = this.extraRowEntries.find(e => e.rowName === rowName && e.day === dayEng);
    return entry ? entry.text : '';
  }

  updateExtraRowText(rowName: string, dayIndex: number, text: string): void {
    const dayEng = this.dayMap[this.daysOfWeek[dayIndex]];
    const weekStartDate = this.formatDateForApi(this.selectedWeekStart);
    const entry: ExtraRowEntry = { rowName, day: dayEng, text, weekStartDate };

    this.boardConfigService.updateExtraRow(entry).subscribe({
      next: () => {
        const existing = this.extraRowEntries.find(e => e.rowName === rowName && e.day === dayEng);
        if (existing) {
          existing.text = text;
        } else {
          this.extraRowEntries.push(entry);
        }
      },
      error: (err) => {
        console.error('שגיאה בשמירת שורה עצמאית:', err);
      }
    });
  }
}