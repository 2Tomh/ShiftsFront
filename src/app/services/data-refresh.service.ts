import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

// חדש - שירות "גשר" קטן בין shift-board ל-schedule-stats (ובעתיד כל
// רכיב אחר שצריך לדעת שהנתונים השתנו). הם רכיבים עצמאיים לגמרי בלי
// Input/Output ביניהם, אז אין דרך אחרת לרכיב אחד "לספר" לשני שהוא
// טען מחדש/שינה שיבוץ - חוץ מ-Subject משותף כזה ש-providedIn: 'root'
// (אותה מופע יחיד לכל האפליקציה).
@Injectable({
  providedIn: 'root'
})
export class DataRefreshService {
  private refreshSource = new Subject<void>();

  // כל רכיב שרוצה לדעת "משהו השתנה, טען מחדש" נרשם ל-Observable הזה.
  refresh$ = this.refreshSource.asObservable();

  // כל רכיב שמבצע פעולה שיכולה להשפיע על נתונים המוצגים במקום אחר
  // (שיבוץ עובד, מחיקה, רענון, פרסום שבוע וכו') קורא לזה כדי להודיע
  // לכל המאזינים.
  notifyDataChanged(): void {
    this.refreshSource.next();
  }
}