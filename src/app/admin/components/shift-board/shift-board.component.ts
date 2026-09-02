import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ShiftService } from '../../../services/shift.service';
import { BoardConfigurationService } from '../../../services/board-configuration.service';
import { Shift } from '../../../Models/shift.model';
import { BoardConfiguration, ExtraRowEntry } from '../../../Models/board-configuration.model';

interface DynamicShiftBlock {
  type: string;
  label: string;
  roles: string[];
  icon: string;
}

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

  // חדש - הכל נטען מהתצורה (BoardConfiguration) במקום להיות קבוע
  // בקוד. daysOfWeek ו-shiftBlocks מתמלאים ב-loadData(), לא כברירת
  // מחדל קבועה יותר.
  daysOfWeek: string[] = [];
  shiftBlocks: DynamicShiftBlock[] = [];
  extraRowNames: string[] = [];
  extraRowEntries: ExtraRowEntry[] = [];

  // תוקן - במקום <input type="date"> חופשי (שאפשר לבחור בו כל יום
  // באמצע שבוע), הניווט הוא רק בקפיצות של שבוע שלם (previousWeek/
  // nextWeek/goToCurrentWeek) - כך selectedWeekStart הוא *תמיד* יום
  // ראשון, בלי אפשרות לבחור תאריך אחר בטעות.
  selectedWeekStart: Date = this.snapToSunday(new Date());

  private dayMap: { [key: string]: string } = {
    'ראשון': 'Sunday', 'שני': 'Monday', 'שלישי': 'Tuesday', 'רביעי': 'Wednesday',
    'חמישי': 'Thursday', 'שישי': 'Friday', 'שבת': 'Saturday'
  };

  // חדש - היסט (במספר ימים מיום ראשון) לכל שם יום בעברית. משמש
  // לחישוב התאריך הספציפי של כל עמודה בטבלה לפי selectedWeekStart.
  private readonly hebrewDayOffsets: { [key: string]: number } = {
    'ראשון': 0, 'שני': 1, 'שלישי': 2, 'רביעי': 3,
    'חמישי': 4, 'שישי': 5, 'שבת': 6
  };

  // תוקן - אין יותר מגבלת 3 (לא indexToEnum, לא Enum בכלל) - כמה
  // בלוקי משמרת שיהיו בתצורה, כולם יוצגו. type הוא כעת פשוט שם
  // המשמרת עצמו (מחרוזת), שתואם בדיוק למה שנשמר ב-Shift.Type בשרת.
  private readonly icons = ['☀️', '🌤️', '🌙', '⭐', '🌗', '🌌'];

  selectedTarget: { dayIndex: number, shiftType: any, role: string } | null = null;

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
    private boardConfigService: BoardConfigurationService
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  /**
   * תוקן - נטען עכשיו גם config וגם extraRows, לצד employees ו-
   * shifts כבר קיימים, הכל במקביל (forkJoin), לא ברצף.
   * חדש - shifts נטענים עכשיו מסוננים ל-selectedWeekStart בלבד.
   */
  loadData(): void {
    const weekStartParam = this.formatDateForApi(this.selectedWeekStart);

    forkJoin({
      employees: this.shiftService.getEmployees(),
      shifts: this.shiftService.getShifts(weekStartParam),
      config: this.boardConfigService.getConfiguration(),
      extraRows: this.boardConfigService.getExtraRows()
    }).subscribe(({ employees, shifts, config, extraRows }) => {
      this.allEmployees = employees;
      this.shifts = shifts;
      this.applyConfiguration(config);
      this.extraRowEntries = extraRows;
      this.calculateStats();
    });
  }

  private applyConfiguration(config: BoardConfiguration): void {
    this.daysOfWeek = config.workDays;
    this.extraRowNames = config.extraRowNames || [];

    // תוקן - כל המשמרות מהתצורה, בלי הגבלת 3. type הוא שם המשמרת
    // עצמו (מחרוזת), לא Enum - זה בדיוק מה שנשמר ב-Shift.Type בשרת.
    this.shiftBlocks = config.shiftDefinitions.map((sd, i) => ({
      type: sd.name,
      label: sd.name,
      roles: sd.roles,
      icon: this.icons[i % this.icons.length]
    }));
  }

  private loadShiftsOnly(): void {
    const weekStartParam = this.formatDateForApi(this.selectedWeekStart);
    this.shiftService.getShifts(weekStartParam).subscribe(shifts => {
      this.shifts = shifts;
      this.calculateStats();
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

  // מצמיד תאריך *כלשהו* ליום ראשון של אותו השבוע.
  private snapToSunday(date: Date): Date {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private getCurrentWeekSunday(): Date {
    return this.snapToSunday(new Date());
  }

  // פורמט yyyy-MM-dd לפי הזמן המקומי (לא UTC), לשליחה ל-API.
  private formatDateForApi(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // חדש - פורמט dd/MM קצר לתצוגה בלבד (בכותרות הימים ובטווח השבוע).
  private formatDateForDisplay(date: Date): string {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${d}/${m}`;
  }

  // חדש - טווח התאריכים של השבוע הנבחר, לתצוגה ליד הניווט
  // (למשל "06/09 - 12/09").
  get selectedWeekRangeLabel(): string {
    const start = this.selectedWeekStart;
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${this.formatDateForDisplay(start)} - ${this.formatDateForDisplay(end)}`;
  }

  // חדש - התאריך הספציפי (dd/MM) של עמודת יום נתון בטבלה, לפי
  // selectedWeekStart. משמש בכותרת הטבלה מתחת לשם היום.
  getDateLabelForDay(dayName: string): string {
    const offset = this.hebrewDayOffsets[dayName];
    if (offset === undefined) return '';
    const d = new Date(this.selectedWeekStart);
    d.setDate(d.getDate() + offset);
    return this.formatDateForDisplay(d);
  }

  // חדש - ניווט שבוע אחורה. תמיד קפיצה של 7 ימים בדיוק, כך
  // selectedWeekStart נשאר תמיד יום ראשון.
  previousWeek(): void {
    const d = new Date(this.selectedWeekStart);
    d.setDate(d.getDate() - 7);
    this.selectedWeekStart = d;
    this.loadData();
  }

  // חדש - ניווט שבוע קדימה.
  nextWeek(): void {
    const d = new Date(this.selectedWeekStart);
    d.setDate(d.getDate() + 7);
    this.selectedWeekStart = d;
    this.loadData();
  }

  // חדש - קפיצה מיידית לשבוע הנוכחי (מהיום).
  goToCurrentWeek(): void {
    this.selectedWeekStart = this.snapToSunday(new Date());
    this.loadData();
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

      if (hasMatch) {
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

    const openRole = roles.find(role => !this.getEmployeeForRole(dayIndex, shiftType, role));
    if (!openRole) {
      alert('כל התפקידים כבר מאוישים במשמרת הזו. הסירי קודם שיבוץ קיים (×).');
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
      alert("שגיאה: לא נמצאה משמרת תואמת במערכת. נסה לרענן (F5).");
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

  // ⚠️ שים לב - הפעולה הזו עדיין גלובלית לחלוטין (מוחקת את כל
  // העובדים, כל ההגשות וכל המשמרות בכל השבועות, לא רק את השבוע
  // הנבחר). עד שנעדכן גם את EmployeesController.ResetAll בצד השרת
  // כדי שיקבל weekStart, מומלץ להימנע מהכפתור הזה כשעובדים על כמה
  // שבועות מקבילים.
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
    return this.shifts.length > 0 && this.shifts.every((s: any) => s.isPublished);
  }

  // מפרסם רק את השבוע הנבחר (selectedWeekStart), לא את כל המשמרות
  // בכל השבועות.
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

  // יוצר את השבוע לפי selectedWeekStart (השבוע שמוצג כרגע בניווט),
  // לא תמיד את "השבוע הנוכחי". כך אפשר ליצור גם את שבוע החגים מבלי
  // לגעת בשבוע הרגיל.
  generateWeek() {
    if (!confirm("האם למחוק את השבוע הנבחר וליצור אותו מחדש?")) return;

    this.shiftService.generateWeek(this.selectedWeekStart).subscribe({
      next: (res: any) => {
        alert(res.message);
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

    this.shiftService.getAvailabilityForEmployee(stat.name).subscribe({
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

  // שולח את weekStartDate של השבוע הנבחר (selectedWeekStart), לא
  // תמיד את השבוע הנוכחי, כדי שעריכת הגשה תשויך לשבוע הנכון.
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

  // ===== שורות עצמאיות (תיגבורים/מטווחים/חפיפות) =====
  // ⚠️ שים לב - extraRowEntries עדיין מפתח (rowName, day) בלבד, בלי
  // תאריך/שבוע. כלומר אם תמלא "תיגבור" ליום שני בשבוע הרגיל, אותו
  // ערך יופיע גם ביום שני של שבוע החגים.

  getExtraRowText(rowName: string, dayIndex: number): string {
    const dayEng = this.dayMap[this.daysOfWeek[dayIndex]];
    const entry = this.extraRowEntries.find(e => e.rowName === rowName && e.day === dayEng);
    return entry ? entry.text : '';
  }

  updateExtraRowText(rowName: string, dayIndex: number, text: string): void {
    const dayEng = this.dayMap[this.daysOfWeek[dayIndex]];
    const entry: ExtraRowEntry = { rowName, day: dayEng, text };

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