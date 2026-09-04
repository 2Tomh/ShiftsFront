export interface ShiftDefinition {
  name: string;
  roles: string[];
  // חדש - שעת התחלה/סיום בפורמט "HH:mm" (24 שעות), למשל "06:00".
  // ריק אם עדיין לא הוגדר. נדרש לחישוב מרווח מנוחה של 8 שעות בין
  // משמרות סמוכות של אותו עובד (ShiftBoardComponent).
  startTime: string;
  endTime: string;
}

export interface BoardConfiguration {
  id?: string;
  workDays: string[];
  shiftDefinitions: ShiftDefinition[];
  extraRowNames: string[];
}

export interface ExtraRowEntry {
  id?: string;
  rowName: string;
  day: string;
  text: string;
}