import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@sms/core/config';
import { BellSchedule, TieredPeriod } from '../models/bell-schedule.model';
import {
  TimetableEntry,
  TimetableEntryWrite,
  WeekViewResponse,
} from '../models/timetable-entry.model';

@Injectable({ providedIn: 'root' })
export class TimetableApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/lms/timetable`;

  getBellSchedules(): Observable<BellSchedule[]> {
    return this.http.get<BellSchedule[]>(`${this.baseUrl}/bell-schedules/`);
  }

  getBellScheduleDetail(id: number): Observable<BellSchedule> {
    return this.http.get<BellSchedule>(`${this.baseUrl}/bell-schedules/${id}/`);
  }

  getTieredPeriods(scheduleId?: number): Observable<TieredPeriod[]> {
    const params = scheduleId ? new HttpParams().set('schedule', scheduleId) : undefined;
    return this.http.get<TieredPeriod[]>(`${this.baseUrl}/tiered-periods/`, { params });
  }

  getEntries(params?: {
    term?: number;
    day?: number;
    teacher?: number;
    year_group?: number;
  }): Observable<TimetableEntry[]> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.term) httpParams = httpParams.set('term', params.term);
      if (params.day !== undefined) httpParams = httpParams.set('day', params.day);
      if (params.teacher) httpParams = httpParams.set('teacher', params.teacher);
      if (params.year_group) httpParams = httpParams.set('year_group', params.year_group);
    }
    return this.http.get<TimetableEntry[]>(`${this.baseUrl}/entries/`, { params: httpParams });
  }

  getWeekView(params?: {
    term?: number;
    teacher?: number;
    year_group?: number;
  }): Observable<WeekViewResponse> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.term) httpParams = httpParams.set('term', params.term);
      if (params.teacher) httpParams = httpParams.set('teacher', params.teacher);
      if (params.year_group) httpParams = httpParams.set('year_group', params.year_group);
    }
    return this.http.get<WeekViewResponse>(`${this.baseUrl}/entries/week/`, { params: httpParams });
  }

  createEntry(data: TimetableEntryWrite): Observable<TimetableEntry> {
    return this.http.post<TimetableEntry>(`${this.baseUrl}/entries/`, data);
  }

  updateEntry(id: number, data: Partial<TimetableEntryWrite>): Observable<TimetableEntry> {
    return this.http.patch<TimetableEntry>(`${this.baseUrl}/entries/${id}/`, data);
  }

  deleteEntry(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/entries/${id}/`);
  }

  checkConflicts(termId: number): Observable<import('../models/conflict.model').ConflictCheckResponse> {
    return this.http.get<import('../models/conflict.model').ConflictCheckResponse>(
      `${this.baseUrl}/conflicts/`,
      { params: new HttpParams().set('term', termId) }
    );
  }
}
