export interface ShiftDefinition {
  name: string;
  roles: string[];
  // חדש - שעת התחלה/סיום בפורמט "HH:mm" (24 שעות), למשל "06:00".
  // ריק אם עדיין לא הוגדר. נדרש לחישוב מרווח מנוחה של 8 שעות בין
  // משמרות סמוכות של אותו עובד (ShiftBoardComponent).
  startTime: string;
  endTime: string;
  // חדש - ימים (בעברית) שבהם המשמרת הזו לא רצה בכלל, בכל שבוע
  // (למשל ["שישי"] - "אין משמרת לילה בימי שישי"). שינוי קבוע בתבנית.
  blockedDays: string[];
  // חדש - חסימת ימים ברמת תפקיד בודד בתוך המשמרת. מפתח = שם התפקיד
  // (בדיוק כמו במחרוזות ב-roles), ערך = ימים חסומים לתפקיד הזה.
  roleBlockedDays: { [role: string]: string[] };
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