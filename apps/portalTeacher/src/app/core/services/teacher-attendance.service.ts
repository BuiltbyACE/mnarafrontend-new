import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { getApiUrl } from '@sms/core/config';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export interface AttendanceRecord {
  studentName: string;
  studentId: string;
  status: AttendanceStatus;
  date: string;
}

export interface BatchAttendancePayload {
  classId: string;
  date: string;
  records: { studentId: string; status: AttendanceStatus }[];
}

export interface LiveRosterStudent {
  id: number;
  name: string;
  student_id: string;
  status: 'PRESENT' | 'ABSENT' | 'UNVERIFIED';
  time_logged: string | null;
  photo?: string;
}

export interface AttendanceStats {
  total_classes: number;
  total_students: number;
  present_today: number;
  absent_today: number;
  weekly: { present: number; total: number; rate: number };
  monthly: { present: number; total: number; rate: number };
  periods: { period_name: string; present: number; total: number; rate: number }[];
}

export interface LiveRosterPayload {
  has_active_class: boolean;
  class_info: {
    subject: string;
    teacher: string;
    room: string;
    start_time: string;
    end_time: string;
  } | null;
  summary: {
    total: number;
    present: number;
    absent: number;
    missing: number;
  };
  students: LiveRosterStudent[];
}

@Injectable({ providedIn: 'root' })
export class TeacherAttendanceService {
  private http = inject(HttpClient);

  readonly records = signal<AttendanceRecord[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly submitSuccess = signal(false);

  readonly liveRoster = signal<LiveRosterPayload | null>(null);
  readonly rosterLoading = signal(false);
  readonly rosterError = signal<string | null>(null);

  readonly stats = signal<AttendanceStats | null>(null);
  readonly statsLoading = signal(false);
  readonly statsError = signal<string | null>(null);

  fetchRecords(classId?: string, date?: string): void {
    this.isLoading.set(true);
    this.error.set(null);
    let endpoint = '/teachers/attendance/';
    const params: string[] = [];
    if (classId) params.push(`class=${classId}`);
    if (date) params.push(`date=${date}`);
    if (params.length) endpoint += '?' + params.join('&');

    this.http.get<AttendanceRecord[]>(getApiUrl(endpoint))
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => this.records.set(data),
        error: () => this.error.set('Failed to load attendance records'),
      });
  }

  batchMark(payload: BatchAttendancePayload): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.submitSuccess.set(false);
    this.http.post(getApiUrl('/teachers/attendance/batch/'), payload)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.submitSuccess.set(true);
          this.fetchRecords(payload.classId, payload.date);
        },
        error: () => this.error.set('Failed to submit attendance'),
      });
  }

  fetchLiveRoster(): void {
    this.rosterLoading.set(true);
    this.rosterError.set(null);
    this.http.get<LiveRosterPayload>(getApiUrl('/lms/attendance/live-roster/'))
      .pipe(finalize(() => this.rosterLoading.set(false)))
      .subscribe({
        next: (data) => this.liveRoster.set(data),
        error: () => this.rosterError.set('Failed to load live roster'),
      });
  }

  markAsAbsent(studentId: number): void {
    this.rosterLoading.set(true);
    this.http.post(getApiUrl('/teachers/attendance/live-roster/'), { student_id: studentId, status: 'ABSENT' })
      .pipe(finalize(() => this.rosterLoading.set(false)))
      .subscribe({
        next: () => this.fetchLiveRoster(),
        error: () => this.rosterError.set('Failed to update status'),
      });
  }

  fetchStats(): void {
    this.statsLoading.set(true);
    this.statsError.set(null);
    this.http.get<AttendanceStats>(getApiUrl('/teachers/attendance/stats/'))
      .pipe(finalize(() => this.statsLoading.set(false)))
      .subscribe({
        next: (data) => this.stats.set(data),
        error: () => this.statsError.set('Failed to load attendance stats'),
      });
  }
}
