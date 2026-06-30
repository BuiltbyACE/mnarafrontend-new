import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize, Observable } from 'rxjs';
import { getApiUrl } from '@sms/core/config';

export interface LiveClassDTO {
  id: number;
  title: string;
  subject: string;
  teacher: string;
  status?: string;
  start_time?: string;
  duration_min?: number;
  participant_count?: number;
}

export interface LiveClassesPayload {
  live_now: LiveClassDTO | null;
  upcoming: LiveClassDTO[];
  past: LiveClassDTO[];
}

export interface JoinResponse {
  join_url: string;
  meeting_id: string;
  password: string;
  room_title: string;
  teacher: string;
  subject: string;
}

@Injectable({ providedIn: 'root' })
export class LiveClassService {
  private http = inject(HttpClient);

  readonly payload = signal<LiveClassesPayload | null>(null);
  readonly isLoading = signal(true);

  fetchClasses(workspaceId?: number): void {
    this.isLoading.set(true);
    let url = '/lms/live-classes/';
    if (workspaceId) {
      url += `?workspace_id=${workspaceId}`;
    }
    this.http.get<LiveClassesPayload>(getApiUrl(url))
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => this.payload.set(data),
        error: () => this.payload.set(null),
      });
  }

  joinClass(roomId: number): Observable<JoinResponse> {
    return this.http.post<JoinResponse>(getApiUrl(`/lms/live-classes/${roomId}/join/`), {});
  }
}
