import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ShiftService } from '../../../services/shift.service';
import { Shift } from '../../../Models/shift.model';
import { ShiftType } from '../../../Models/shiftType.enum';

@Component({
  selector: 'app-shift-board',
  templateUrl: './shift-board.component.html',
  styleUrls: ['./shift-board.component.css']
})
export class ShiftBoardComponent implements OnInit {
  shifts: Shift[] = [];
  allEmployees: any[] = [];
  employeeStats: any[] = [];
  daysOfWeek: string[] = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  isProcessing = false;
  isPublishing = false;

  private dayMap: { [key: string]: string } = {
    'ראשון': 'Sunday', 'שני': 'Monday', 'שלישי': 'Tuesday', 'רביעי': 'Wednesday',
    'חמישי': 'Thursday', 'שישי': 'Friday', 'שבת': 'Saturday'
  };

  shiftTypes = [
    { type: ShiftType.Morning, label: 'בוקר', class: 'shift-morning' },
    { type: ShiftType.Afternoon, label: 'צהריים', class: 'shift-afternoon' },
    { type: ShiftType.Night, label: 'לילה', class: 'shift-night' }
  ];

  // חדש: הוחלף מנגנון ה-Popup בבנק מועמדים ישיר בכל תא. מערכי התפקידים
  // האלה מגדירים "לאיזה תפקיד לנסות לשבץ" כשלוחצים על שם בבנק.
  mainRoles = ['אחמ״ש', 'סייר', 'בקרה'];
  morningRoles = ['מאבטח', 'אחמ״ש', 'סייר', 'בקרה'];
  guardRoles = ['מאבטח'];

  /**
   * חדש - מנגנון "בחירת יעד מפורש": לחיצה על "+" בקובייה ריקה קובעת
   * לאיזה יום/משמרת/תפקיד בדיוק לשבץ את הלחיצה הבאה בבנק. כך במקום
   * שהבנק "ינחש" את התפקיד הפנוי הראשון, המנהל בוחר בעצמו בדיוק לאיזה
   * תפקיד - זה פותר מקרה שבו רוצים לשבץ למשל ל"בקרה" ספציפית, לא
   * לתפקיד הראשון הפנוי שנמצא.
   */
  selectedTarget: { dayIndex: number, shiftType: any, role: string } | null = null;

  // ===== מודאל עריכת הגשה (למנהל) =====
  showEditAvailabilityModal = false;
  editingEmployeeName = '';
  editPreferredShifts: { day: string, shift: string }[] = [];
  editNotes: string = '';
  isLoadingEdit = false;
  editShiftLabels = ['בוקר', 'צהריים', 'לילה'];

  constructor(private shiftService: ShiftService) { }

  ngOnInit(): void {
    this.loadData();
  }

  /**
   * תוקן: היה כאן שרשור רציף - getEmployees(), ורק אחרי שהוא חוזר,
   * getShifts() נקרא בתוך ה-callback שלו. זה אומר שני round-trips
   * לשרת בזה אחר זה, במקום במקביל - כמעט מכפיל את זמן ההמתנה סתם,
   * כי שתי הקריאות בכלל לא תלויות אחת בשנייה. forkJoin מריץ את שתיהן
   * במקביל, וממתין רק עד ששתיהן חוזרות (הכי איטית מביניהן קובעת
   * את הזמן הכולל, לא הסכום של שתיהן).
   */
  loadData(): void {
    forkJoin({
      employees: this.shiftService.getEmployees(),
      shifts: this.shiftService.getShifts()
    }).subscribe(({ employees, shifts }) => {
      this.allEmployees = employees;
      this.shifts = shifts;
      this.calculateStats();
    });
  }

  /**
   * חדש - טעינה "קלה": רק המשמרות, בלי לגעת ברשימת העובדים/הגשות.
   * שיבוץ, הסרה, והחלפה (selectCandidate/removeEmployee) משנים אך
   * ורק את Shifts.Assignments - אין שום סיבה לטעון מחדש גם את כל
   * העובדים וההגשות שלהם בכל לחיצה, כפי שקרה קודם עם loadData().
   * זה חוסך round-trip שלם ל-MongoDB Atlas בכל פעולה כזו.
   */
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

      // תוקן: עובדים שנוצרו אך ורק דרך הגשת חופשה/מחלה (find-or-create
      // ב-VacationsController/SickLeaveController) מקבלים רשומת Employee
      // בלי שום הגשת זמינות בפועל - requestedCount שלהם תמיד 0. אין סיבה
      // שהם יופיעו ב"סיכום עובדים" (שמיועד למי שהגיש זמינות למשמרות),
      // אז מדלגים על כל מי שלא הגיש בכלל.
      if (name && requested > 0) {
        statsMap.set(name, {
          name: name,
          total: 0,
          night: 0,
          requested: requested
        });
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

  /**
   * חדש - מחזיר את כל מי שהגיש זמינות ליום/משמרת מסוימים, ללא תלות
   * בתפקיד (כי העובד לא בוחר תפקיד בהגשה) - זה "הבנק" שמוצג בכל תא.
   */
  getCandidatesForCell(dayIndex: number, shiftType: any): any[] {
    const foundShiftType = this.shiftTypes.find(st => st.type === shiftType);
    const shiftLabel = foundShiftType ? foundShiftType.label : '';

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

  /**
   * חדש - חוזרים לתצוגה מוטבעת (inline) של הרשימה בתוך כל תא, בלי
   * Popup/Popover - בדיוק כמו בתמונת הייחוס. לחיצה על שם: אם הוא כבר
   * משובץ לתפקיד הזה - מסירה אותו (טוגל); אחרת משבצת אותו.
   */
  selectCandidate(dayIndex: number, shiftType: any, role: string, candidate: any): void {
    if (this.getEmployeeForRole(dayIndex, shiftType, role) === candidate.fullName) {
      this.removeEmployee(dayIndex, shiftType, role);
    } else {
      this.assignFromBank(dayIndex, shiftType, role, candidate);
    }
  }

  /** האם המועמד הזה כבר משובץ לתפקיד הספציפי הזה ביום/משמרת הזו */
  isCandidateAssignedToRole(dayIndex: number, shiftType: any, fullName: string, role: string): boolean {
    return this.getEmployeeForRole(dayIndex, shiftType, role) === fullName;
  }

  /** חדש - האם המועמד משובץ לאחד מהתפקידים ברשימה (לשימוש בבנק המשותף) */
  isCandidateAssignedToAny(dayIndex: number, shiftType: any, fullName: string, roles: string[]): boolean {
    return roles.some(role => this.getEmployeeForRole(dayIndex, shiftType, role) === fullName);
  }

  /**
   * חדש - לחיצה על "+" בקובייה ריקה: קובעת/מבטלת יעד שיבוץ מפורש.
   * לחיצה חוזרת על אותו "+" מבטלת את הבחירה (טוגל).
   */
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

  /**
   * תוקן - לשימוש בבנק המשותף: אם יש יעד נבחר במפורש (המנהל לחץ "+"
   * על תפקיד ספציפי) - משבצים בדיוק אליו, בלי לנחש. אחרת (המנהל פשוט
   * לחץ על שם בבנק בלי לבחור "+" קודם) - נופלים חזרה להתנהגות הישנה:
   * מחפשים את התפקיד הפנוי הראשון מבין הרשימה.
   */
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

  /**
   * תוקן - עכשיו כל תא שוב שייך לתפקיד ספציפי אחד (חזרה ל-3 שורות
   * אמיתיות בטבלה), אז לחיצה על מועמד משבצת ישירות לתפקיד הזה בדיוק -
   * בלי לחפש "תפקיד פנוי ראשון" כמו בגרסת הבנק המשותף הקודמת.
   */
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

    // Optimistic UI - עדכון/הוספה מיידיים במסך, עם rollback אם השרת מסרב.
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

  /**
   * חדש - נגזר (computed) מתוך shifts שכבר נטענו: השבוע נחשב "פורסם"
   * רק אם יש משמרות בכלל, וכולן מסומנות isPublished=true. אם המנהל
   * הרגע יצר שבוע חדש (generate-week) - הוא תמיד יתחיל כטיוטה.
   */
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
        this.loadData(); // רענון כדי לעדכן את isPublished בכל משמרת
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

    // Optimistic UI: מסירים מיידית מהמסך *לפני* שהשרת בכלל ענה, כדי
    // שהפעולה תרגיש מיידית ולא תלויה במהירות הרשת/Atlas. שומרים גיבוי
    // של האיבר שהוסר, כדי שאם השרת יחזיר שגיאה - נחזיר אותו למקומו
    // (rollback) ונודיע למשתמש, במקום שהמסך יישאר במצב שגוי בשקט.
    const removedIndex = shift.assignments.findIndex((a: any) => a.role === role);
    const removedAssignment = removedIndex > -1 ? shift.assignments[removedIndex] : null;
    if (removedIndex > -1) {
      shift.assignments.splice(removedIndex, 1);
    }

    this.isProcessing = true;
    this.shiftService.assignEmployee(shift.id, null, role).subscribe({
      next: () => {
        this.isProcessing = false;
        // הצלחה - המסך כבר מעודכן, רק מסנכרנים ברקע (בלי לחסום) כדי
        // שהסטטיסטיקות (calculateStats) יתעדכנו בדיוק לפי מה שבאמת נשמר.
        this.loadShiftsOnly();
      },
      error: (err) => {
        this.isProcessing = false;
        console.error(err);
        // Rollback: השרת סירב - מחזירים את האיבר שהוסר בחזרה למקומו
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

    // תוקן: קודם זה עדכן רק את המצב המקומי בדפדפן ולא נשמר בשרת בכלל -
    // אחרי רענון (F5) השם היה חוזר לישן. עכשיו קוראים ל-endpoint אמיתי
    // שגם שומר את השם וגם מתקן את הצילומים (snapshots) שלו בכל מקום
    // אחר שהוא מופיע (הגשות זמינות, שיבוצים בלוח), ורק בהצלחה מרעננים
    // את כל הנתונים מהשרת - כדי שהתצוגה תמיד תשקף את מה שבאמת נשמר.
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
} 