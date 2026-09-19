import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { BoardConfiguration, ExtraRowEntry, ExtraRowDefinition } from '../Models/board-configuration.model';

@Injectable({
  providedIn: 'root'
})
export class BoardConfigurationService {
  constructor(private http: HttpClient) { }

  getConfiguration() {
    return this.http.get<BoardConfiguration>(`${environment.apiUrl}/BoardConfiguration`);
  }

  updateConfiguration(config: BoardConfiguration) {
    return this.http.put(`${environment.apiUrl}/BoardConfiguration`, config);
  }

  // תוקן - weekStart אופציונלי: אם נשלח, מסנן רק לשורות העצמאיות
  // של השבוע הזה. בלעדיו, כל השבועות חלקו בטעות את אותן רשומות.
  getExtraRows(weekStart?: string) {
    let params = new HttpParams();
    if (weekStart) {
      params = params.set('weekStart', weekStart);
    }
    return this.http.get<ExtraRowEntry[]>(`${environment.apiUrl}/BoardConfiguration/extra-rows`, { params });
  }

  updateExtraRow(entry: ExtraRowEntry) {
    return this.http.put(`${environment.apiUrl}/BoardConfiguration/extra-rows`, entry);
  }

  // חדש - שמות השורות העצמאיות עצמן, ספציפי לשבוע. מחליף את
  // ההסתמכות על config.extraRowNames הגלובלי בקומפוננטות שמציגות
  // לוח (ShiftBoardComponent, ScheduleViewComponent), כדי שמחיקת
  // שורה לשבוע אחד לא תשפיע על שבועות אחרים.
  getExtraRowNames(weekStart: string) {
    const params = new HttpParams().set('weekStart', weekStart);
    return this.http.get<ExtraRowDefinition[]>(`${environment.apiUrl}/BoardConfiguration/extra-row-names`, { params });
  }

  addExtraRowName(rowName: string, weekStart: string) {
    return this.http.post<ExtraRowDefinition>(`${environment.apiUrl}/BoardConfiguration/extra-row-names`, {
      rowName,
      weekStartDate: weekStart
    });
  }

  removeExtraRowName(id: string) {
    return this.http.delete(`${environment.apiUrl}/BoardConfiguration/extra-row-names/${id}`);
  }
}