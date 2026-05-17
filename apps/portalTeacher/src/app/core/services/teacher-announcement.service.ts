import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { getApiUrl } from '@sms/core/config';
import { Announcement } from '../../shared/models/teacher.models';

@Injectable({ providedIn: 'root' })
export class TeacherAnnouncementService {
  private http = inject(HttpClient);
  readonly announcements = signal<Announcement[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  fetchAnnouncements(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get<Announcement[]>(getApiUrl('/lms/announcements/'))
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => this.announcements.set(data),
        error: () => this.error.set('Failed to load announcements'),
      });
  }
}
