import { Injectable, signal, inject, DestroyRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { getApiUrl } from '@sms/core/config';
import { Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface TeacherRoom {
  id: number;
  room_id: string;
  room_name: string;
  title: string;
  subject: string;
  classroom: string;
  status: 'SCHEDULED' | 'LIVE' | 'ENDED';
  scheduled_at: string | null;
  duration_min: number;
}

export interface ZoomStartConfig {
  join_url: string;
  start_url: string;
  meeting_id: string;
  password: string;
  room_id: number;
  room_title: string;
  subject: string;
  classroom: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class TeacherLiveClassService {
  private http = inject(HttpClient);
  private destroyRef = inject(DestroyRef);

  readonly rooms = signal<TeacherRoom[]>([]);
  readonly isLoading = signal(false);

  fetchRooms(): void {
    this.isLoading.set(true);
    this.http.get<TeacherRoom[]>(getApiUrl('/lms/teacher/live-classes/')).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (data) => { this.rooms.set(data); this.isLoading.set(false); },
      error: () => this.isLoading.set(false),
    });
  }

  startClass(roomId: number): Observable<ZoomStartConfig> {
    return this.http.post<ZoomStartConfig>(getApiUrl(`/lms/teacher/live-classes/${roomId}/start/`), {});
  }

  endClass(roomId: number): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(getApiUrl(`/lms/teacher/live-classes/${roomId}/end/`), {});
  }
}
