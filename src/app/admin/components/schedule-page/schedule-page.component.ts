import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-schedule-page',
  templateUrl: './schedule-page.component.html',
  styleUrls: ['./schedule-page.component.css']
})
export class SchedulePageComponent implements OnInit {
  isPublishing = false;
  isWeekPublished = false;
  shifts: any[] = [];
  employeeStats: any[] = [];
  
  // משתני מודאל עריכה
  showEditAvailabilityModal = false;
  editingEmployeeName = '';
  isLoadingEdit = false;
  editNotes = '';
  daysOfWeek = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  editShiftLabels = ['בוקר', 'צהריים', 'לילה'];

  ngOnInit(): void {
    // טעינת נתונים ראשונית
  }

  generateWeek(): void {
    // לוגיקה ליצירת שבוע חדש
  }

  publishWeek(): void {
    // לוגיקה לפרסום הלוח
  }

  clearAllAvailabilities(): void {
    // לוגיקת ניקוי הגשות
  }

  editEmployeeName(stat: any): void {
    // לוגיקת עריכת שם עובד
  }

  openEditAvailabilityModal(stat: any): void {
    this.editingEmployeeName = stat.name;
    this.showEditAvailabilityModal = true;
  }

  closeEditAvailabilityModal(): void {
    this.showEditAvailabilityModal = false;
  }

  isEditSelected(day: string, shiftLabel: string): boolean {
    return false; // לוגיקת בדיקת בחירה
  }

  toggleEditPreference(day: string, shiftLabel: string): void {
    // לוגיקת שינוי העדפה במודאל
  }

  saveEditedAvailability(): void {
    // שמירת ההגשה הערוכה
  }
}