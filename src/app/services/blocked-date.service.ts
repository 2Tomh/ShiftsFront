import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { BlockedDate } from '../Models/blocked-date.model';

@Injectable({
  providedIn: 'root'
})
export class BlockedDateService {
  private apiUrl = `${environment.apiUrl}/BlockedDates`;

  constructor(private http: HttpClient) { }

  getAll(): Observable<BlockedDate[]> {
    return this.http.get<BlockedDate[]>(this.apiUrl);
  }

  create(date: string, reason: string): Observable<BlockedDate> {
    return this.http.post<BlockedDate>(this.apiUrl, { date, reason });
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}