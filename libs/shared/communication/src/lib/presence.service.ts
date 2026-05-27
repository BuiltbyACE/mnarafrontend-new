import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '@sms/core/config';
import { PresenceStatus } from './communication.models';
import { RealtimeService } from './realtime.service';

@Injectable({ providedIn: 'root' })
export class PresenceService {
  private readonly http = inject(HttpClient);
  private readonly realtime = inject(RealtimeService);
  private readonly baseUrl = `${environment.apiBaseUrl}/communication`;

  readonly presences = signal<Record<number, PresenceStatus>>({});

  constructor() {
    this.realtime.onMessage<{ user_id: string; status: PresenceStatus; last_seen: string }>('presence_update')
      .subscribe((update) => {
        this.presences.update((map) => ({
          ...map,
          [Number(update.user_id)]: update.status,
        }));
      });
  }

  fetchStatuses(userIds?: number[]): void {
    let params = new HttpParams();
    if (userIds?.length) {
      userIds.forEach((id) => {
        params = params.append('user_ids', String(id));
      });
    }
    this.http.get<Record<string, PresenceStatus>>(`${this.baseUrl}/users/status/`, { params })
      .subscribe((statusMap) => {
        const mapped: Record<number, PresenceStatus> = {};
        for (const [key, val] of Object.entries(statusMap)) {
          mapped[Number(key)] = val;
        }
        this.presences.update((prev) => ({ ...prev, ...mapped }));
      });
  }

  isOnline(userId: number): boolean {
    return this.presences()[userId] === 'online';
  }

  getStatus(userId: number): PresenceStatus {
    return this.presences()[userId] ?? 'offline';
  }
}
