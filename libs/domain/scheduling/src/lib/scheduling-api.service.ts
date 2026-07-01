import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  BellSchedule,
  BellSchedulePeriod,
  TimetableVersion,
  TimetableEntry,
  TeachingRequirement,
  TimetableAuditLog,
  EntryDraft,
  ValidationResult,
  DateVersionResponse,
  Teacher,
  YearLevel,
} from './models';
import { environment } from '@sms/core/config';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

@Injectable({ providedIn: 'root' })
export class SchedulingApiService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/lms`;

  private extractPaginated<T>(obs: Observable<PaginatedResponse<T>>): Observable<T[]> {
    return obs.pipe(map(res => res.results));
  }

  getVersionForDate(date: string): Observable<DateVersionResponse> {
    return this.http.get<DateVersionResponse>(`${this.base}/timetable/versions/for-date/`, {
      params: new HttpParams().set('date', date),
    });
  }

  getBellSchedules(keyStage?: number): Observable<BellSchedule[]> {
    let params = new HttpParams();
    if (keyStage !== undefined) params = params.set('key_stage', keyStage);
    return this.extractPaginated(
      this.http.get<PaginatedResponse<BellSchedule>>(`${this.base}/timetable/frontend/bell-schedules/`, { params }),
    );
  }

  getVersions(termId?: number): Observable<TimetableVersion[]> {
    let params = new HttpParams();
    if (termId !== undefined) params = params.set('term', termId);
    return this.extractPaginated(
      this.http.get<PaginatedResponse<TimetableVersion>>(`${this.base}/timetable/frontend/versions/`, { params }),
    );
  }

  createVersion(data: { term: number; notes?: string }): Observable<TimetableVersion> {
    return this.http.post<TimetableVersion>(`${this.base}/timetable/versions/`, data);
  }

  publishVersion(id: number): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(`${this.base}/timetable/versions/${id}/publish/`, {});
  }

  archiveVersion(id: number): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(`${this.base}/timetable/versions/${id}/archive/`, {});
  }

  getTimetableEntries(params: {
    version?: number;
    status?: string;
    teacher_id?: number;
    year_level_id?: number;
  }): Observable<TimetableEntry[]> {
    let httpParams = new HttpParams();
    if (params.version !== undefined) httpParams = httpParams.set('version', params.version);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.teacher_id !== undefined) httpParams = httpParams.set('teacher_id', params.teacher_id);
    if (params.year_level_id !== undefined) httpParams = httpParams.set('year_level_id', params.year_level_id);
    return this.extractPaginated(
      this.http.get<PaginatedResponse<TimetableEntry>>(`${this.base}/timetable/frontend/entries/`, { params: httpParams }),
    );
  }

  createEntry(draft: EntryDraft): Observable<TimetableEntry> {
    return this.http.post<TimetableEntry>(`${this.base}/timetable/frontend/entries/create/`, draft);
  }

  updateEntry(id: number, draft: Partial<EntryDraft>): Observable<TimetableEntry> {
    return this.http.patch<TimetableEntry>(`${this.base}/timetable/frontend/entries/${id}/`, draft);
  }

  deleteEntry(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/timetable/frontend/entries/${id}/delete/`);
  }

  validateEntry(draft: EntryDraft): Observable<ValidationResult> {
    return this.http.post<ValidationResult>(`${this.base}/timetable/frontend/entries/validate/`, draft);
  }

  getRequirements(termId: number, versionId?: number): Observable<TeachingRequirement[]> {
    let params = new HttpParams();
    params = params.set('term', termId);
    if (versionId !== undefined) params = params.set('version_id', versionId);
    return this.extractPaginated(
      this.http.get<PaginatedResponse<TeachingRequirement>>(`${this.base}/timetable/frontend/requirements/`, { params }),
    );
  }

  getTeachers(): Observable<Teacher[]> {
    return this.http.get<Teacher[]>(`${this.base}/timetable/frontend/teachers/`);
  }

  getYearLevels(): Observable<YearLevel[]> {
    return this.http.get<YearLevel[]>(`${this.base}/timetable/frontend/year-levels/`);
  }

  getAuditLogs(versionId?: number): Observable<TimetableAuditLog[]> {
    let params = new HttpParams();
    if (versionId !== undefined) params = params.set('version', versionId);
    return this.extractPaginated(
      this.http.get<PaginatedResponse<TimetableAuditLog>>(`${this.base}/timetable/frontend/audit-logs/`, { params }),
    );
  }
}
