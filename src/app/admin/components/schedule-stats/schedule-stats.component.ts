import { Component, OnInit, OnDestroy } from '@angular/core';
import { forkJoin, Subscription } from 'rxjs';
import { ShiftService } from '../../../services/shift.service';
import { BoardConfigurationService } from '../../../services/board-configuration.service';
import { DataRefreshService } from '../../../services/data-refresh.service';

@Component({
  selector: 'app-schedule-stats',
  templateUrl: './schedule-stats.component.html',
  styleUrls: ['./schedule-stats.component.css']
})
export class ScheduleStatsComponent implements OnInit, OnDestroy {
  employeeStats: any[] = [];
  isLoading = true;

  private allEmployees: any[] = [];
  private shifts: any[] = [];
  private nightBlockType: string | null = null;
  private refreshSubscription?: Subscription;

  showEditAvailabilityModal = false;
  editingEmployeeName = '';
  editPreferredShifts: { day: string, shift: string }[] = [];
  editNotes: string = '';
  isLoadingEdit = false;
  daysOfWeek: string[] = [];
  editShiftLabels: string[] = [];

  // חדש - בורר "הוסף הגשה לעובד": מציג רק עובדים שעדיין אין להם
  // הגשה לשבוע הפתוח (לא מופיעים ב-employeeStats).
  showAddPicker = false;

  constructor(
    private shiftService: ShiftService,
    private boardConfigService: BoardConfigurationService,
    private dataRefreshService: DataRefreshService
  ) { }

  ngOnInit(): void {
    this.loadData();

    this.refreshSubscription = this.dataRefreshService.refresh$.subscribe(() => {
      this.loadData();
    });
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
  }

  private getSubmittableWeekSunday(): Date {
    const today = new Date();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay() + 7);
    sunday.setHours(0, 0, 0, 0);
    return sunday;
  }

  private formatDateForApi(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  loadData(): void {
    this.isLoading = true;
    const weekStartParam = this.formatDateForApi(this.getSubmittableWeekSunday());

    forkJoin({
      employees: this.shiftService.getEmployees(weekStartParam),
      shifts: this.shiftService.getShifts(weekStartParam),
      config: this.boardConfigService.getConfiguration()
    }).subscribe(({ employees, shifts, config }) => {
      this.allEmployees = employees;
      this.shifts = shifts;
      this.daysOfWeek = config.workDays;
      this.editShiftLabels = config.shiftDefinitions.map(sd => sd.name);
      this.nightBlockType = config.shiftDefinitions.length > 2 ? config.shiftDefinitions[2].name : null;
      this.calculateStats();
      this.isLoading = false;
    });
  }

  private calculateStats(): void {
    const statsMap = new Map<string, any>();
    this.allEmployees.forEach(emp => {
      const name = emp.name;
      const requested = emp.requestedCount || 0;
      if (name && requested > 0) {
        statsMap.set(name, { name, total: 0, night: 0, requested, notes: emp.notes || '' });
      }
    });

    this.shifts.forEach((shift: any) => {
      const sType = shift.type || shift.Type;
      const isNight = this.nightBlockType !== null && sType === this.nightBlockType;
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

  // חדש - כל העובדים שעדיין אין להם הגשה לשבוע הפתוח (לא מופיעים
  // ב-employeeStats). זו הרשימה שמוצגת בבורר "הוסף הגשה לעובד".
  get employeesWithoutSubmission(): any[] {
    const existingNames = new Set(this.employeeStats.map(s => s.name));
    return this.allEmployees.filter(e => e.name && !existingNames.has(e.name));
  }

  openAddPicker(): void {
    this.showAddPicker = true;
  }

  closeAddPicker(): void {
    this.showAddPicker = false;
  }

  // חדש - בחירת עובד מהבורר: סוגר את הבורר, ופותח את אותו מודאל
  // עריכה (ריק, כי אין עדיין הגשה) - openEditModal כבר משתמש רק
  // ב-stat.name, אז אפשר להעביר אובייקט מינימלי כזה.
  selectEmployeeForSubmission(emp: any): void {
    this.showAddPicker = false;
    this.openEditModal({ name: emp.name });
  }

  clearAll(): void {
    if (!confirm('האם אתה בטוח? כל העובדים והנתונים יימחקו לצמיתות מהמערכת.')) return;

    this.shiftService.clearAllData().subscribe({
      next: () => {
        alert('המערכת אופסה! כל השמות והנתונים נמחקו.');
        this.loadData();
        this.dataRefreshService.notifyDataChanged();
      },
      error: (err) => {
        console.error('Delete failed:', err);
        alert('המחיקה נכשלה בשרת. בדוק את ה-Console לשגיאות.');
      }
    });
  }

  editName(stat: any): void {
    const newName = prompt('הכנס שם מעודכן לעובד:', stat.name);
    if (!newName || newName.trim() === '' || newName.trim() === stat.name) return;

    const trimmedName = newName.trim();
    const emp = this.allEmployees.find(e => e.name === stat.name);

    if (!emp || !emp.id) {
      alert('שגיאה: לא נמצא מזהה עובד. נסה לרענן (F5).');
      return;
    }

    this.shiftService.updateEmployeeName(emp.id, trimmedName).subscribe({
      next: () => {
        this.loadData();
        this.dataRefreshService.notifyDataChanged();
      },
      error: (err) => {
        console.error('שגיאה בעדכון שם העובד:', err);
        alert('שגיאה בשמירת השם החדש. נסה שוב.');
      }
    });
  }

  openEditModal(stat: any): void {
    this.editingEmployeeName = stat.name;
    this.showEditAvailabilityModal = true;
    this.isLoadingEdit = true;
    this.editPreferredShifts = [];
    this.editNotes = '';

    const weekStartParam = this.formatDateForApi(this.getSubmittableWeekSunday());
    this.shiftService.getAvailabilityForEmployee(stat.name, weekStartParam).subscribe({
      next: (res: any) => {
        this.isLoadingEdit = false;
        if (res && res.found) {
          this.editPreferredShifts = (res.preferredShifts || []).map((p: any) => ({ day: p.day, shift: p.shift }));
          this.editNotes = res.notes || '';
        }
      },
      error: (err) => {
        this.isLoadingEdit = false;
        console.error('שגיאה בטעינת ההגשה לעריכה:', err);
      }
    });
  }

  closeEditModal(): void {
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
      weekStartDate: this.getSubmittableWeekSunday(),
      preferredShifts: this.editPreferredShifts,
      notes: this.editNotes
    };

    this.shiftService.submitEmployeeAvailability(payload).subscribe({
      next: () => {
        this.closeEditModal();
        this.loadData();
        this.dataRefreshService.notifyDataChanged();
      },
      error: (err) => {
        console.error('שגיאה בשמירת ההגשה הערוכה:', err);
        alert('שגיאה בשמירת ההגשה. נסה שוב.');
      }
    });
  }
}