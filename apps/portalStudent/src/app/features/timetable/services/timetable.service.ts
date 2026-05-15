import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { environment } from '@sms/core/config';

export interface TimetableEvent {
  id: number;
  title: string;
  type: 'holiday' | 'exam' | 'special';
  start_date: string;
  end_date: string;
  color: string;
}

export interface TimetableLesson {
  id: number;
  day_of_week: string;
  subject_name: string;
  teacher_name: string;
  room: string;
  start_time: string;
  end_time: string;
  color: string;
}

export interface TimetablePayload {
  events: TimetableEvent[];
  lessons: TimetableLesson[];
}

@Injectable({ providedIn: 'root' })
export class TimetableService {
  private http = inject(HttpClient);

  readonly timetableData = signal<TimetablePayload>({ events: [], lessons: [] });
  readonly isLoading = signal(true);

  fetchTimetable(): void {
    this.isLoading.set(true);
    this.http
      .get<TimetablePayload>(`${environment.apiBaseUrl}/lms/my-timetable/`)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => this.timetableData.set(res),
        error: () => this.timetableData.set({ events: [], lessons: [] }),
      });
  }
}
