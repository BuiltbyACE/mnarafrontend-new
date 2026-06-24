import { Injectable, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { TimetableApiService, TimetableEntry } from '@sms/domain/timetable';

export type Weekday = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export interface TimetableData {
  [day: string]: { [time: string]: { subject: string; classroom: string; teacher?: string } };
}

const DAY_NAMES: Weekday[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

@Injectable({ providedIn: 'root' })
export class TeacherTimetableService {
  private api = inject(TimetableApiService);
  readonly data = signal<TimetableData | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  fetchTimetable(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.api.getTeacherTimetable()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (entries) => this.data.set(this.toGrid(entries)),
        error: () => this.error.set('Failed to load timetable'),
      });
  }

  private toGrid(entries: TimetableEntry[]): TimetableData {
    const grid: TimetableData = {};
    for (const day of DAY_NAMES) grid[day] = {};

    for (const entry of entries) {
      const dayName = entry.day_name || DAY_NAMES[entry.day_of_week] || '';
      if (!dayName) continue;
      grid[dayName][entry.period_start] = {
        subject: entry.subject_name,
        classroom: entry.room_detail?.name ?? '',
        teacher: entry.teacher_name,
      };
    }

    return grid;
  }
}
