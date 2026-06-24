import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@sms/core/config';
import { TimetableEntry, WeekViewResponse } from '../models/timetable-entry.model';
import { BellSchedule, TieredPeriod } from '../models/timetable-slot.model';
import { ConflictCheckResponse } from '../models/timetable-conflict.model';
import { TimetableEvent } from '../models/timetable-event.model';
import { LiveLocatorResponse, TeacherOption } from '../models/live-status.model';
import {
  TimetableVersion,
  TimetableVersionWrite,
  CloneVersionPayload,
  VersionCompareResult,
  AuditLogFilter,
  PaginatedAuditLog,
} from '../models/timetable-version.model';
import {
  StudentTimetableResponse,
  mapStudentResponseToEntries,
  mapStudentResponseToEvents,
} from '../mappers/student-timetable.mapper';
import {
  TeacherTimetableResponse,
  mapTeacherResponseToEntries,
} from '../mappers/teacher-timetable.mapper';

@Injectable({ providedIn: 'root' })
export class TimetableApiService {
  private readonly http = inject(HttpClient);

  getBellSchedules(): Observable<BellSchedule[]> {
    return this.http.get<BellSchedule[]>(
      `${environment.apiBaseUrl}/lms/timetable/bell-schedules/`
    );
  }

  getBellScheduleDetail(id: number): Observable<BellSchedule> {
    return this.http.get<BellSchedule>(
      `${environment.apiBaseUrl}/lms/timetable/bell-schedules/${id}/`
    );
  }

  getTieredPeriods(scheduleId?: number): Observable<TieredPeriod[]> {
    const params = scheduleId
      ? new HttpParams().set('schedule', scheduleId)
      : undefined;
    return this.http.get<TieredPeriod[]>(
      `${environment.apiBaseUrl}/lms/timetable/tiered-periods/`,
      { params }
    );
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
      if (params.day !== undefined)
        httpParams = httpParams.set('day', params.day);
      if (params.teacher) httpParams = httpParams.set('teacher', params.teacher);
      if (params.year_group)
        httpParams = httpParams.set('year_group', params.year_group);
    }
    return this.http.get<TimetableEntry[]>(
      `${environment.apiBaseUrl}/lms/timetable/entries/`,
      { params: httpParams }
    );
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
      if (params.year_group)
        httpParams = httpParams.set('year_group', params.year_group);
    }
    return this.http.get<WeekViewResponse>(
      `${environment.apiBaseUrl}/lms/timetable/entries/week/`,
      { params: httpParams }
    );
  }

  getStudentTimetable(): Observable<{ entries: TimetableEntry[]; events: TimetableEvent[] }> {
    return this.http
      .get<StudentTimetableResponse>(`${environment.apiBaseUrl}/lms/my-timetable/`)
      .pipe(
        map((res) => ({
          entries: mapStudentResponseToEntries(res),
          events: mapStudentResponseToEvents(res),
        }))
      );
  }

  getTeacherTimetable(): Observable<TimetableEntry[]> {
    return this.http
      .get<TeacherTimetableResponse>(
        `${environment.apiBaseUrl}/academics/my-timetable/`
      )
      .pipe(map((res) => mapTeacherResponseToEntries(res)));
  }

  createEntry(data: import('../models/timetable-entry.model').TimetableEntryWrite): Observable<TimetableEntry> {
    return this.http.post<TimetableEntry>(
      `${environment.apiBaseUrl}/lms/timetable/entries/`,
      data
    );
  }

  updateEntry(id: number, data: Partial<import('../models/timetable-entry.model').TimetableEntryWrite>): Observable<TimetableEntry> {
    return this.http.patch<TimetableEntry>(
      `${environment.apiBaseUrl}/lms/timetable/entries/${id}/`,
      data
    );
  }

  deleteEntry(id: number): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiBaseUrl}/lms/timetable/entries/${id}/`
    );
  }

  validateEntry(data: {
    teacher_id: number;
    year_group_id: number;
    tiered_period_id: number;
    day_of_week: number;
    subject_id?: number;
    room_id?: number;
    academic_term_id: number;
  }): Observable<{ is_valid: boolean; errors: any[]; warnings: any[] }> {
    return this.http.post<{ is_valid: boolean; errors: any[]; warnings: any[] }>(
      `${environment.apiBaseUrl}/lms/timetable/validate/`,
      data
    );
  }

  checkBulk(
    academicTermId: number,
    entries: any[]
  ): Observable<{ results: any[] }> {
    return this.http.post<{ results: any[] }>(
      `${environment.apiBaseUrl}/lms/timetable/check-bulk/`,
      { academic_term_id: academicTermId, entries }
    );
  }

  checkConflicts(termId: number): Observable<ConflictCheckResponse> {
    return this.http.get<ConflictCheckResponse>(
      `${environment.apiBaseUrl}/lms/timetable/conflicts/`,
      { params: new HttpParams().set('term', termId) }
    );
  }

  getTeacherStatus(teacherId: number): Observable<LiveLocatorResponse> {
    return this.http.get<LiveLocatorResponse>(
      `${environment.apiBaseUrl}/lms/timetable/locate/${teacherId}/`
    );
  }

  getTeachers(): Observable<TeacherOption[]> {
    return this.http.get<TeacherOption[]>(
      `${environment.apiBaseUrl}/lms/teachers/`
    );
  }

  getClassrooms(): Observable<{ id: number; name: string; year_level_name: string }[]> {
    return this.http.get<{ id: number; name: string; year_level_name: string }[]>(
      `${environment.apiBaseUrl}/academics/classrooms/`
    );
  }

  getVersions(termId?: number): Observable<TimetableVersion[]> {
    const params = termId
      ? new HttpParams().set('term', termId)
      : undefined;
    return this.http.get<TimetableVersion[]>(
      `${environment.apiBaseUrl}/lms/timetable/versions/`,
      { params }
    );
  }

  getVersion(id: number): Observable<TimetableVersion> {
    return this.http.get<TimetableVersion>(
      `${environment.apiBaseUrl}/lms/timetable/versions/${id}/`
    );
  }

  createVersion(data: TimetableVersionWrite): Observable<TimetableVersion> {
    return this.http.post<TimetableVersion>(
      `${environment.apiBaseUrl}/lms/timetable/versions/`,
      data
    );
  }

  cloneVersion(id: number, payload: CloneVersionPayload): Observable<TimetableVersion> {
    return this.http.post<TimetableVersion>(
      `${environment.apiBaseUrl}/lms/timetable/versions/${id}/clone/`,
      payload
    );
  }

  publishVersion(id: number): Observable<TimetableVersion> {
    return this.http.post<TimetableVersion>(
      `${environment.apiBaseUrl}/lms/timetable/versions/${id}/publish/`,
      {}
    );
  }

  archiveVersion(id: number): Observable<TimetableVersion> {
    return this.http.post<TimetableVersion>(
      `${environment.apiBaseUrl}/lms/timetable/versions/${id}/archive/`,
      {}
    );
  }

  rollbackVersion(id: number): Observable<TimetableVersion> {
    return this.http.post<TimetableVersion>(
      `${environment.apiBaseUrl}/lms/timetable/versions/${id}/rollback/`,
      {}
    );
  }

  compareVersions(id: number, withId: number): Observable<VersionCompareResult> {
    return this.http.get<VersionCompareResult>(
      `${environment.apiBaseUrl}/lms/timetable/versions/${id}/compare/`,
      { params: new HttpParams().set('with', withId) }
    );
  }

  getAuditLog(filters?: AuditLogFilter): Observable<PaginatedAuditLog> {
    let params = new HttpParams();
    if (filters) {
      if (filters.version != null) params = params.set('version', filters.version);
      if (filters.action)      params = params.set('action', filters.action);
      if (filters.entity_type) params = params.set('entity_type', filters.entity_type);
      if (filters.date_from)   params = params.set('date_from', filters.date_from);
      if (filters.date_to)     params = params.set('date_to', filters.date_to);
      if (filters.page != null) params = params.set('page', filters.page);
    }
    return this.http.get<PaginatedAuditLog>(
      `${environment.apiBaseUrl}/lms/timetable/audit-log/`,
      { params }
    );
  }
}
