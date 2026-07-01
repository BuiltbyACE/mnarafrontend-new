import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Observable } from 'rxjs';
import { getApiUrl, environment } from '@sms/core/config';
import { TokenStorageService } from '@sms/core/auth';

export interface CampusStats {
  students_on_campus: number;
  student_capacity: number;
  staff_on_campus: number;
  staff_capacity: number;
  active_zones: ActiveZone[];
}

export interface ActiveZone {
  name: string;
  present: number;
  capacity: number;
}

export interface LiveEvent {
  id: string;
  timestamp: string;
  type: 'ENTRY' | 'EXIT' | 'SCAN';
  role: 'STUDENT' | 'TEACHER' | 'STAFF';
  name: string;
  location: string;
  direction?: 'IN' | 'OUT';
}

@Injectable({ providedIn: 'root' })
export class LiveCampusService {
  private http = inject(HttpClient);
  private tokenStorage = inject(TokenStorageService);

  readonly campusStats = signal<CampusStats | null>(null);
  readonly statsLoading = signal(false);
  readonly statsError = signal<string | null>(null);

  private socket$: WebSocketSubject<LiveEvent> | null = null;

  getBaselineStats(): void {
    this.statsLoading.set(true);
    this.statsError.set(null);
    this.http.get<CampusStats>(getApiUrl('/analytics/live-campus-status/'))
      .subscribe({
        next: (data) => { this.campusStats.set(data); this.statsLoading.set(false); },
        error: () => { this.statsError.set('Failed to load campus stats'); this.statsLoading.set(false); },
      });
  }

  connectWebSocket(): Observable<LiveEvent> {
    if (!this.socket$ || this.socket$.closed) {
      const token = this.tokenStorage.getAccessToken();
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const baseUrl = environment.apiBaseUrl.replace(/^https?:\/\//, '').replace(/\/api\/v1\/?$/, '');
      const query = token ? `?token=${token}` : '';
      const wsUrl = `${wsProtocol}//${baseUrl}/ws/campus/live/${query}`;
      this.socket$ = webSocket<LiveEvent>(wsUrl);
    }
    return this.socket$.asObservable();
  }

  disconnect(): void {
    this.socket$?.complete();
    this.socket$ = null;
  }
}
