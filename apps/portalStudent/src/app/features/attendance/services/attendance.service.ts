import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, finalize } from 'rxjs/operators';
import { environment } from '@sms/core/config';

export interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  remarks: string;
}

export interface AttendancePayload {
  stats: {
    attendance_percentage: number;
    days_present: number;
    days_late: number;
    days_absent: number;
    days_excused: number;
  };
  logs: AttendanceRecord[];
}

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private http = inject(HttpClient);

  readonly attendanceData = signal<AttendancePayload | null>(null);
  readonly isLoading = signal(true);

  fetchAttendance(): void {
    this.isLoading.set(true);
    this.http
      .get<any>(`${environment.apiBaseUrl}/students/attendance/`)
      .pipe(
        tap((data) => this.attendanceData.set(data)),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe();
  }
}
