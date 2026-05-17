import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { getApiUrl } from '@sms/core/config';

export interface TimetableEntry {
  subject: string;
  classroom: string;
  teacher?: string;
}

export type Weekday = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export interface TimetableData {
  [day: string]: { [time: string]: TimetableEntry };
}

@Injectable({ providedIn: 'root' })
export class TeacherTimetableService {
  private http = inject(HttpClient);
  readonly data = signal<TimetableData | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  fetchTimetable(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get<TimetableData>(getApiUrl('/academics/my-timetable/'))
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => this.data.set(data),
        error: () => this.error.set('Failed to load timetable'),
      });
  }
}
