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
  // הערה - זו התבנית הגלובלית שממנה נזרעות שורות עצמאיות לשבוע
  // חדש כשהוא נוצר (ShiftsController.GenerateWeek). התוכן בפועל
  // שמוצג לכל שבוע קיים מגיע מ-ExtraRowDefinition (למטה).
  extraRowNames: string[];
  // חדש - כמה שבועות מראש עובדים יכולים להגיש זמינות בו-זמנית
  // (1 = ברירת מחדל, התנהגות מקורית). נקבע ע"י המנהל בהגדרות לוח.
  submissionWeeksCount?: number;
}

export interface ExtraRowEntry {
  id?: string;
  rowName: string;
  day: string;
  text: string;
  // חדש - "yyyy-MM-dd", לאיזה שבוע הטקסט הזה שייך. בלעדיו כל
  // השבועות חלקו בטעות את אותה רשומה לפי (rowName, day) בלבד.
  weekStartDate: string;
}

// חדש - שם שורה עצמאית ספציפי לשבוע (ראו ExtraRowDefinition.cs
// בשרת). זה מה שקובע אילו שורות עצמאיות בכלל קיימות לשבוע נתון -
// בניגוד ל-BoardConfiguration.extraRowNames שהוא רק תבנית גלובלית
// לזריעת שבועות חדשים.
export interface ExtraRowDefinition {
  id?: string;
  rowName: string;
  weekStartDate: string;
}