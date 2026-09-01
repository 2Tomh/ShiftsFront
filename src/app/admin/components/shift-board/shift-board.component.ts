import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ShiftService } from '../../../services/shift.service';
import { BoardConfigurationService } from '../../../services/board-configuration.service';
import { Shift } from '../../../Models/shift.model';
import { ShiftType } from '../../../Models/shiftType.enum';
import { BoardConfiguration, ExtraRowEntry } from '../../../Models/board-configuration.model';

interface DynamicShiftBlock {
  type: ShiftType;
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

  private dayMap: { [key: string]: string } = {
    'ראשון': 'Sunday', 'שני': 'Monday', 'שלישי': 'Tuesday', 'רביעי': 'Wednesday',
    'חמישי': 'Thursday', 'שישי': 'Friday', 'שבת': 'Saturday'
  };

  // מגבלה: תמיד עד 3 "בלוקי משמרת", כי ה-Backend (ShiftType Enum)
  // תומך רק ב-3 ערכים קבועים (Morning/Afternoon/Night). אינדקס
  // בתצורה -> Enum קבוע, בלי קשר לשם שהמנהל בחר להציג.
  private readonly indexToEnum: ShiftType[] = [ShiftType.Morning, ShiftType.Afternoon, ShiftType.Night];
  private readonly indexToIcon: string[] = ['☀️', '🌤️', '🌙'];

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
   */
  loadData(): void {
    forkJoin({
      employees: this.shiftService.getEmployees(),
      shifts: this.shiftService.getShifts(),
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

    // חותכים ל-3 בלוקים מקסימום, כי זו מגבלת ה-Enum בשרת. אם המנהל
    // הגדיר יותר מ-3 משמרות ב"הגדרות לוח" - רק 3 הראשונות מוצגות כאן.
    this.shiftBlocks = config.shiftDefinitions.slice(0, 3).map((sd, i) => ({
      type: this.indexToEnum[i],
      label: sd.name,
      roles: sd.roles,
      icon: this.indexToIcon[i]
    }));
  }

  private loadShiftsOnly(): void {
    this.shiftService.getShifts().subscribe(shifts => {
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
        statsMap.set(name, { name: name, total: 0, night: 0, requested: requested });
      }
    });

    this.shifts.forEach((shift: any) => {
      const sType = this.getShiftTypeString(shift.type);
      const isNight = sType === 'Night';
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
    const targetTypeStr = this.getShiftTypeString(shiftType);
    const shift = this.shifts.find((s: any) => {
      const sDay = s.day || s.Day;
      const sType = this.getShiftTypeString(s.type || s.Type);
      return sDay === dayNameEnglish && sType === targetTypeStr;
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
    const targetTypeStr = this.getShiftTypeString(type).toLowerCase();

    return this.shifts.find((s: any) => {
      const sDay = (s.day || s.Day || '').toString();
      const sType = this.getShiftTypeString(s.type || s.Type).toLowerCase();
      return sDay === dayNameEnglish && sType === targetTypeStr;
    });
  }

  private getShiftTypeString(type: any): string {
    if (type === ShiftType.Morning || type === 'Morning' || type === 0 || type === '0') return 'Morning';
    if (type === ShiftType.Afternoon || type === 'Afternoon' || type === 1 || type === '1') return 'Afternoon';
    if (type === ShiftType.Night || type === 'Night' || type === 2 || type === '2') return 'Night';
    return type?.toString() || '';
  }

  private getCurrentWeekSunday(): Date {
    const today = new Date();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay());
    sunday.setHours(0, 0, 0, 0);
    return sunday;
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

  clearAllAvailabilities() {
    if (confirm("האם אתה בטוח? כל העובדים והנתונים יימחקו לצמיתות מהמערכת.")) {
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

  publishWeek(): void {
    if (!confirm('לפרסם את הלוח הנוכחי לעובדים? הם יוכלו לראות אותו החל מעכשיו.')) return;

    this.isPublishing = true;
    this.shiftService.publishWeek().subscribe({
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
    if (!confirm("האם למחוק הכל וליצור שבוע חדש?")) return;

    const nextSunday = this.getCurrentWeekSunday();

    this.shiftService.generateWeek(nextSunday).subscribe({
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

  saveEditedAvailability(): void {
    const payload = {
      employeeName: this.editingEmployeeName,
      weekStartDate: this.getCurrentWeekSunday(),
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