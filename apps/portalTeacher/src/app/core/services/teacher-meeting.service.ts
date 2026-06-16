import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { getApiUrl } from '@sms/core/config';
import { Meeting } from '../../shared/models/teacher.models';

interface RawMeeting {
  id: string;
  title: string;
  meeting_type: string;
  scheduled_at: string;
  status: string;
  organizer: number;
  organizer_name: string;
  participant_count: number;
  meeting_link: string | null;
  location: string | null;
}

interface Paginated<T> { results?: T[]; }

@Injectable({ providedIn: 'root' })
export class TeacherMeetingService {
  private readonly http = inject(HttpClient);

  private readonly data = signal<Meeting[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  readonly allMeetings = this.data.asReadonly();

  readonly upcomingMeetings = computed(() =>
    this.data().filter(m => new Date(m.date) >= new Date(new Date().toDateString()))
  );

  readonly pastMeetings = computed(() =>
    this.data().filter(m => new Date(m.date) < new Date(new Date().toDateString()))
  );

  fetchMeetings(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get<Paginated<RawMeeting> | RawMeeting[]>(getApiUrl('/communication/meetings/'))
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          const rows = Array.isArray(res) ? res : (res.results ?? []);
          this.data.set(rows.map(r => this.mapMeeting(r)));
        },
        error: () => {
          this.data.set([]);
          this.error.set('Failed to load meetings');
        },
      });
  }

  private mapMeeting(r: RawMeeting): Meeting {
    const scheduled = r.scheduled_at ? new Date(r.scheduled_at) : null;
    return {
      id: String(r.id),
      title: r.title,
      date: r.scheduled_at,
      time: scheduled
        ? scheduled.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '',
      organizer: r.organizer_name || 'School',
      location: r.location ?? undefined,
      attendeeCount: r.participant_count ?? 0,
      joinUrl: r.meeting_link ?? undefined,
    };
  }
}
