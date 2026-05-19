import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { getApiUrl } from '@sms/core/config';

export interface TimetableEntry {
  id?: number;
  subject_name: string;
  classroom_name: string;
  teacher_name: string;
  time: string;
  duration: number;
  day: string;
  color?: string;
}

export interface TimetableSlot {
  id: number;
  subject_name: string;
  classroom_name: string;
  teacher_name: string;
  time: string;
  end_time: string;
  day: string;
  color: string;
}

export type Weekday = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
export type DayCode = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY';

export interface TimetableData {
  [day: string]: { [time: string]: TimetableEntry };
}

@Injectable({ providedIn: 'root' })
export class TimetableService {
  private http = inject(HttpClient);
  readonly data = signal<TimetableData | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly masterSlots = signal<TimetableSlot[]>([]);
  readonly masterLoading = signal(false);

  fetchTimetable(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get<TimetableData>(getApiUrl('/academics/my-timetable/'))
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => this.data.set(res),
        error: () => this.error.set('Failed to load timetable'),
      });
  }

  fetchMasterTimetable(filterType: 'teacher' | 'classroom', filterId: number): void {
    this.masterLoading.set(true);
    const params = `${filterType}_id=${filterId}`;
    this.http.get<TimetableSlot[]>(getApiUrl(`/lms/timetable/master/?${params}`))
      .pipe(finalize(() => this.masterLoading.set(false)))
      .subscribe({
        next: (slots) => this.masterSlots.set(slots),
        error: () => this.masterSlots.set([]),
      });
  }

  clearMasterTimetable(): void {
    this.masterSlots.set([]);
  }
}