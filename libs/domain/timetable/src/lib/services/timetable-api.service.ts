import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

function unwrapList<T>() {
  return map((resp: any) => {
    if (resp && typeof resp === 'object' && 'results' in resp && Array.isArray(resp.results)) {
      return resp.results as T[];
    }
    return resp as T[];
  });
}
import { environment } from '@sms/core/config';
import { TIMETABLE_API_CONTRACTS } from '../contracts/api-contracts';
import { AcademicTerm, Room, SubjectCode, TimetableEntry, WeekViewResponse, YearGroup, YearLevel } from '../models/timetable-entry.model';
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

export interface TimetableStats {
  active_version: string;
  total_entries: number;
  total_classes: number;
  conflicts: number;
  capacity_warnings: number;
  availability_issues: number;
}

@Injectable({ providedIn: 'root' })
export class TimetableApiService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiBaseUrl}${TIMETABLE_API_CONTRACTS.v1.base}`;
  private readonly E = TIMETABLE_API_CONTRACTS.v1.endpoints;

  getBellSchedules(): Observable<BellSchedule[]> {
    return this.http.get<BellSchedule[]>(`${this.api}${this.E.bellSchedules}`).pipe(unwrapList<BellSchedule>());
  }

  getBellScheduleDetail(id: number): Observable<BellSchedule> {
    return this.http.get<BellSchedule>(`${this.api}${this.E.bellScheduleDetail(id)}`);
  }

  getTieredPeriods(scheduleId?: number): Observable<TieredPeriod[]> {
    const params = scheduleId
      ? new HttpParams().set('schedule', scheduleId)
      : undefined;
    return this.http.get<TieredPeriod[]>(
      `${this.api}${this.E.tieredPeriods}`,
      { params }
    ).pipe(unwrapList<TieredPeriod>());
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
      `${this.api}${this.E.entries}`,
      { params: httpParams }
    ).pipe(unwrapList<TimetableEntry>());
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
      `${this.api}${this.E.weekView}`,
      { params: httpParams }
    );
  }

  getStudentTimetable(): Observable<{ entries: TimetableEntry[]; events: TimetableEvent[] }> {
    return this.http
      .get<StudentTimetableResponse>(`${environment.apiBaseUrl}${TIMETABLE_API_CONTRACTS.myTimetable.student}`)
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
        `${environment.apiBaseUrl}${TIMETABLE_API_CONTRACTS.myTimetable.teacher}`
      )
      .pipe(map((res) => mapTeacherResponseToEntries(res)));
  }

  createEntry(data: import('../models/timetable-entry.model').TimetableEntryWrite): Observable<TimetableEntry> {
    return this.http.post<TimetableEntry>(
      `${this.api}${this.E.entries}`,
      data
    );
  }

  updateEntry(id: number, data: Partial<import('../models/timetable-entry.model').TimetableEntryWrite>): Observable<TimetableEntry> {
    return this.http.patch<TimetableEntry>(
      `${this.api}${this.E.entryDetail(id)}`,
      data
    );
  }

  deleteEntry(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.api}${this.E.entries}${id}/`
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
      `${this.api}/validate/`,
      data
    );
  }

  checkBulk(
    academicTermId: number,
    entries: any[]
  ): Observable<{ results: any[] }> {
    return this.http.post<{ results: any[] }>(
      `${this.api}/check-bulk/`,
      { academic_term_id: academicTermId, entries }
    );
  }

  checkConflicts(termId: number): Observable<ConflictCheckResponse> {
    return this.http.get<ConflictCheckResponse>(
      `${this.api}${this.E.conflicts}`,
      { params: new HttpParams().set('term', termId) }
    );
  }

  getTeacherStatus(teacherId: number): Observable<LiveLocatorResponse> {
    return this.http.get<LiveLocatorResponse>(
      `${this.api}${this.E.locate(teacherId)}`
    );
  }

  getTeachers(): Observable<TeacherOption[]> {
    return this.http.get<TeacherOption[]>(
      `${environment.apiBaseUrl}/lms/teachers/`
    ).pipe(unwrapList<TeacherOption>());
  }

  getClassrooms(): Observable<{ id: number; name: string; year_level_name: string }[]> {
    return this.http.get<{ id: number; name: string; year_level_name: string }[]>(
      `${environment.apiBaseUrl}/academics/classrooms/`
    ).pipe(unwrapList<{ id: number; name: string; year_level_name: string }>());
  }

  getYearGroups(yearLevel?: number): Observable<YearGroup[]> {
    let params: HttpParams | undefined;
    if (yearLevel) params = new HttpParams().set('year_level', yearLevel);
    return this.http.get<YearGroup[]>(
      `${environment.apiBaseUrl}/academics/classrooms/`,
      { params }
    ).pipe(unwrapList<YearGroup>());
  }

  getYearLevels(keyStage?: string): Observable<YearLevel[]> {
    let params: HttpParams | undefined;
    if (keyStage) params = new HttpParams().set('key_stage', keyStage);
    return this.http.get<YearLevel[]>(
      `${environment.apiBaseUrl}/academics/year-levels/`,
      { params }
    ).pipe(unwrapList<YearLevel>());
  }

  getAcademicTerms(): Observable<AcademicTerm[]> {
    return this.http.get<AcademicTerm[]>(
      `${environment.apiBaseUrl}/lms/terms/`
    ).pipe(unwrapList<AcademicTerm>());
  }

  getRooms(roomType?: string): Observable<Room[]> {
    let params: HttpParams | undefined;
    if (roomType) params = new HttpParams().set('room_type', roomType);
    return this.http.get<Room[]>(
      `${this.api}${this.E.rooms}`,
      { params }
    ).pipe(unwrapList<Room>());
  }

  createRoom(data: Partial<Room>): Observable<Room> {
    return this.http.post<Room>(`${this.api}${this.E.rooms}`, data);
  }

  updateRoom(id: number, data: Partial<Room>): Observable<Room> {
    return this.http.patch<Room>(`${this.api}${this.E.rooms}${id}/`, data);
  }

  deleteRoom(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}${this.E.rooms}${id}/`);
  }

  getSubjectCodes(category?: string): Observable<SubjectCode[]> {
    let params: HttpParams | undefined;
    if (category) params = new HttpParams().set('category', category);
    return this.http.get<SubjectCode[]>(
      `${this.api}${this.E.subjectCodes}`,
      { params }
    ).pipe(unwrapList<SubjectCode>());
  }

  createSubjectCode(data: Partial<SubjectCode>): Observable<SubjectCode> {
    return this.http.post<SubjectCode>(`${this.api}${this.E.subjectCodes}`, data);
  }

  updateSubjectCode(id: number, data: Partial<SubjectCode>): Observable<SubjectCode> {
    return this.http.patch<SubjectCode>(`${this.api}${this.E.subjectCodes}${id}/`, data);
  }

  deleteSubjectCode(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}${this.E.subjectCodes}${id}/`);
  }

  getVersions(termId?: number): Observable<TimetableVersion[]> {
    const params = termId
      ? new HttpParams().set('term', termId)
      : undefined;
    return this.http.get<TimetableVersion[]>(
      `${this.api}/versions/`,
      { params }
    ).pipe(unwrapList<TimetableVersion>());
  }

  getVersion(id: number): Observable<TimetableVersion> {
    return this.http.get<TimetableVersion>(
      `${this.api}/versions/${id}/`
    );
  }

  createVersion(data: TimetableVersionWrite): Observable<TimetableVersion> {
    return this.http.post<TimetableVersion>(
      `${this.api}/versions/`,
      data
    );
  }

  cloneVersion(id: number, payload: CloneVersionPayload): Observable<TimetableVersion> {
    return this.http.post<TimetableVersion>(
      `${this.api}/versions/${id}/clone/`,
      payload
    );
  }

  publishVersion(id: number): Observable<TimetableVersion> {
    return this.http.post<TimetableVersion>(
      `${this.api}/versions/${id}/publish/`,
      {}
    );
  }

  archiveVersion(id: number): Observable<TimetableVersion> {
    return this.http.post<TimetableVersion>(
      `${this.api}/versions/${id}/archive/`,
      {}
    );
  }

  rollbackVersion(id: number): Observable<TimetableVersion> {
    return this.http.post<TimetableVersion>(
      `${this.api}/versions/${id}/rollback/`,
      {}
    );
  }

  compareVersions(id: number, withId: number): Observable<VersionCompareResult> {
    return this.http.get<VersionCompareResult>(
      `${this.api}/versions/${id}/compare/`,
      { params: new HttpParams().set('with', withId) }
    );
  }

  getStats(termId: number): Observable<TimetableStats> {
    return this.http.get<TimetableStats>(
      `${this.api}/stats/`,
      { params: new HttpParams().set('term', termId) }
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
      `${this.api}/audit-log/`,
      { params }
    );
  }
}
