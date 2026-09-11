import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Holiday } from '../Models/holiday.model';

@Injectable({
  providedIn: 'root'
})
export class HolidayService {
  private apiUrl = `${environment.apiUrl}/Holidays`;

  constructor(private http: HttpClient) { }

  getHolidays(year: number): Observable<Holiday[]> {
    return this.http.get<Holiday[]>(`${this.apiUrl}?year=${year}`);
  }
}