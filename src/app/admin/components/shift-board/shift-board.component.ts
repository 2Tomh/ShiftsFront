import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-shift-board',
  templateUrl: './shift-board.component.html',
  styleUrls: ['./shift-board.component.css']
})
export class ShiftBoardComponent implements OnInit {
  isPublishing = false;
  isWeekPublished = false;
  shifts: any[] = [];
  employeeStats: any[] = [];

  // --- הוסף את המשתנים האלה כאן ---
  daysOfWeek = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  
  morningRoles = ['אחמ״ש', 'סייר', 'בקרה', 'מאבטח'];
  mainRoles = ['אחמ״ש', 'סייר', 'בקרה'];

  shiftTypes = [
    { type: 'Morning', label: 'בוקר' },
    { type: 'Afternoon', label: 'צהריים' },
    { type: 'Night', label: 'לילה' }
  ];

  // משתני בחירת תאים ושיבוץ
  selectedCell: { dayIndex: number; shiftType: string; role: string } | null = null;
  
  // משתני מודאל עריכה
  showEditAvailabilityModal = false;
  editingEmployeeName = '';
  isLoadingEdit = false;
  editNotes = '';
  editShiftLabels = ['בוקר', 'צהריים', 'לילה'];

  ngOnInit(): void {
    this.loadBoardData();
  }

  loadBoardData(): void {
    // טעינת נתונים ראשונית מהשרת
  }

  generateWeek(): void {
    console.log('נוצר שבוע חדש');
  }

  publishWeek(): void {
    this.isPublishing = true;
    setTimeout(() => {
      this.isPublishing = false;
      this.isWeekPublished = true;
    }, 1000);
  }

  clearAllAvailabilities(): void {
    if (confirm('האם אתה בטוח שברצונך לנקות את כל הגשות העובדים?')) {
      this.employeeStats = [];
    }
  }

  editEmployeeName(stat: any): void {
    const newName = prompt('הכנס שם חדש לעובד:', stat.name);
    if (newName && newName.trim()) {
      stat.name = newName.trim();
    }
  }

  openEditAvailabilityModal(stat: any): void {
    this.editingEmployeeName = stat.name;
    this.showEditAvailabilityModal = true;
    this.isLoadingEdit = false;
  }

  closeEditAvailabilityModal(): void {
    this.showEditAvailabilityModal = false;
    this.editNotes = '';
  }

  isEditSelected(day: string, shiftLabel: string): boolean {
    return false;
  }

  toggleEditPreference(day: string, shiftLabel: string): void {}

  saveEditedAvailability(): void {
    this.closeEditAvailabilityModal();
  }

  // פונקציות עזר עבור הטבלה (התאם ללוגיקה הקיימת שלך אם יש)
  getCandidatesForCell(dayIndex: number, shiftType: string): any[] {
    return [];
  }

  isCandidateAssignedToAny(dayIndex: number, shiftType: string, fullName: string, roles: string[]): boolean {
    return false;
  }

  assignFromSharedBank(dayIndex: number, shiftType: string, candidate: any, roles: string[]): void {}

  isSelectingRole(dayIndex: number, shiftType: string, role: string): boolean {
    return this.selectedCell?.dayIndex === dayIndex && 
           this.selectedCell?.shiftType === shiftType && 
           this.selectedCell?.role === role;
  }

  getEmployeeForRole(dayIndex: number, shiftType: string, role: string): string | null {
    return null;
  }

  removeEmployee(dayIndex: number, shiftType: string, role: string): void {}

  startSelectingRole(dayIndex: number, shiftType: string, role: string): void {
    this.selectedCell = { dayIndex, shiftType, role };
  }
}