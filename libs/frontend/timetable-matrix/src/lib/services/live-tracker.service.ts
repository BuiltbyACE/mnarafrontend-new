import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, Subscription, switchMap } from 'rxjs';
import { environment } from '@sms/core/config';
import { LiveLocatorResponse } from '../models/live-status.model';

@Injectable({ providedIn: 'root' })
export class LiveTrackerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/lms/timetable`;

  private pollingSub: Subscription | null = null;
  readonly liveStatus = signal<LiveLocatorResponse | null>(null);

  getTeacherStatus(teacherId: number): Observable<LiveLocatorResponse> {
    return this.http.get<LiveLocatorResponse>(
      `${this.baseUrl}/locate/${teacherId}/`
    );
  }

  startPolling(teacherId: number, intervalMs = 30_000): void {
    this.stopPolling();
    this.pollingSub = interval(intervalMs)
      .pipe(switchMap(() => this.getTeacherStatus(teacherId)))
      .subscribe({
        next: (status) => this.liveStatus.set(status),
        error: () => {},
      });
  }

  stopPolling(): void {
    this.pollingSub?.unsubscribe();
    this.pollingSub = null;
  }
}
