import { Injectable, inject, signal } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { TimetableApiService, TimetableEntry, TimetableEvent } from '@sms/domain/timetable';

@Injectable({ providedIn: 'root' })
export class TimetableService {
  private api = inject(TimetableApiService);

  readonly entries = signal<TimetableEntry[]>([]);
  readonly events = signal<TimetableEvent[]>([]);
  readonly isLoading = signal(true);

  fetchTimetable(): void {
    this.isLoading.set(true);
    this.api.getStudentTimetable()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.entries.set(res.entries);
          this.events.set(res.events);
        },
        error: () => {
          this.entries.set([]);
          this.events.set([]);
        },
      });
  }
}
