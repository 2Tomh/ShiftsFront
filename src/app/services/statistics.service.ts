import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { StatisticsResult } from '../Models/statistics.model';

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  constructor(private http: HttpClient) { }

  getStatistics(startDate: string, endDate: string): Observable<StatisticsResult> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.get<StatisticsResult>(`${environment.apiUrl}/Statistics`, { params });
  }
}