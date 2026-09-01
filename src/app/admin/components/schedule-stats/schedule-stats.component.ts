import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ShiftService } from '../../../services/shift.service';
import { BoardConfigurationService } from '../../../services/board-configuration.service';

// חדש - הקומפוננטה הזו הפכה מ-@Input/@Output תלוי-הורה (שריד מת,
// לא מנותב) לעמוד עצמאי לגמרי: טוענת בעצמה עובדים+משמרות+תצורה,
// ומחשבת סטטיסטיקות בדיוק כמו הפאנל הצדדי ב-shift-board, אבל
// כעמוד רחב ונפרד עם עוד מקום לפרטים.
@Component({
  selector: 'app-schedule-stats',
  templateUrl: './schedule-stats.component.html',
  styleUrls: ['./schedule-stats.component.css']
})
export class ScheduleStatsComponent implements OnInit {
  employeeStats: any[] = [];
  isLoading = true;

  private allEmployees: any[] = [];
  private shifts: any[] = [];
  private nightBlockType: string | null = null;

  showEditAvailabilityModal = false;
  editingEmployeeName = '';
  editPreferredShifts: { day: string, shift: string }[] = [];
  editNotes: string = '';
  isLoadingEdit = false;
  daysOfWeek: string[] = [];
  editShiftLabels: string[] = [];

  constructor(
    private shiftService: ShiftService,
    private boardConfigService: BoardConfigurationService
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    forkJoin({
      employees: this.shiftService.getEmployees(),
      shifts: this.shiftService.getShifts(),
      config: this.boardConfigService.getConfiguration()
    }).subscribe(({ employees, shifts, config }) => {
      this.allEmployees = employees;
      this.shifts = shifts;
      this.daysOfWeek = config.workDays;
      this.editShiftLabels = config.shiftDefinitions.map(sd => sd.name);
      // ה"בלוק לילה" הוא השלישי בתצורה (בהתאמה למוסכמה בשאר המערכת)
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

  clearAll(): void {
    if (!confirm('האם אתה בטוח? כל העובדים והנתונים יימחקו לצמיתות מהמערכת.')) return;

    this.shiftService.clearAllData().subscribe({
      next: () => {
        alert('המערכת אופסה! כל השמות והנתונים נמחקו.');
        this.loadData();
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
      next: () => this.loadData(),
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

    this.shiftService.getAvailabilityForEmployee(stat.name).subscribe({
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

  private getCurrentWeekSunday(): Date {
    const today = new Date();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay());
    sunday.setHours(0, 0, 0, 0);
    return sunday;
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
        this.closeEditModal();
        this.loadData();
      },
      error: (err) => {
        console.error('שגיאה בשמירת ההגשה הערוכה:', err);
        alert('שגיאה בשמירת ההגשה. נסה שוב.');
      }
    });
  }
}