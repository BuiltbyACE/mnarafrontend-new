import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize, Observable } from 'rxjs';
import { getApiUrl } from '@sms/core/config';

export interface LiveClassDTO {
  id: string;
  title: string;
  subject: string;
  teacher: string;
  teacher_initials: string;
  scheduled_at: string;
  duration_minutes: number;
  status: 'live' | 'upcoming' | 'past';
  participant_count: number;
  max_participants: number;
  description: string;
}

export interface LiveClassesPayload {
  live_now: LiveClassDTO | null;
  upcoming: LiveClassDTO[];
  past: LiveClassDTO[];
}

export interface Participant {
  id: string;
  name: string;
  initials: string;
  isMuted: boolean;
  isVideoOn: boolean;
  isSpeaking: boolean;
  isTeacher: boolean;
}

@Injectable({ providedIn: 'root' })
export class LiveClassService {
  private http = inject(HttpClient);

  readonly payload = signal<LiveClassesPayload | null>(null);
  readonly isLoading = signal(true);
  readonly participants = signal<Participant[]>([
    { id: 'p1', name: 'Mr. Kamau', initials: 'MK', isMuted: false, isVideoOn: true, isSpeaking: true, isTeacher: true },
    { id: 'p2', name: 'You', initials: 'YU', isMuted: false, isVideoOn: true, isSpeaking: false, isTeacher: false },
    { id: 'p3', name: 'Alice Wanjiku', initials: 'AW', isMuted: true, isVideoOn: true, isSpeaking: false, isTeacher: false },
    { id: 'p4', name: 'Brian Ochieng', initials: 'BO', isMuted: false, isVideoOn: false, isSpeaking: false, isTeacher: false },
    { id: 'p5', name: 'Catherine Muthoni', initials: 'CM', isMuted: true, isVideoOn: true, isSpeaking: false, isTeacher: false },
    { id: 'p6', name: 'Daniel Kiprop', initials: 'DK', isMuted: true, isVideoOn: false, isSpeaking: false, isTeacher: false },
    { id: 'p7', name: 'Esther Akinyi', initials: 'EA', isMuted: false, isVideoOn: true, isSpeaking: false, isTeacher: false },
  ]);

  fetchClasses(): void {
    this.isLoading.set(true);
    this.http.get<LiveClassesPayload>(getApiUrl('/lms/live-classes/'))
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => this.payload.set(data),
        error: () => this.payload.set(null),
      });
  }

  joinClass(roomId: string): Observable<unknown> {
    return this.http.post(getApiUrl(`/lms/live-classes/${roomId}/join/`), {});
  }

  leaveClass(roomId: string): void {
    this.http.post(getApiUrl(`/lms/live-classes/${roomId}/leave/`), {}).subscribe();
  }
}
