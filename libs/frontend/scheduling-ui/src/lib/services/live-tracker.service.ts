import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, switchMap, tap, catchError, of } from 'rxjs';
import { environment } from '@sms/core/config';
import { LiveLocatorResponse, StaffLocation, TeacherStatus } from '../models/live-status.model';

@Injectable({ providedIn: 'root' })
export class LiveTrackerService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/timetable`;

  private _locations = signal<StaffLocation[]>([]);
  private _polling = signal(false);
  private _error = signal<string | null>(null);

  readonly locations = this._locations.asReadonly();
  readonly polling = this._polling.asReadonly();
  readonly error = this._error.asReadonly();

  readonly inClassCount = computed(() =>
    this._locations().filter(l => l.status === 'IN_CLASS').length
  );

  readonly availableCount = computed(() =>
    this._locations().filter(l => l.status === 'AVAILABLE').length
  );

  locateTeacher(teacherId: number): Observable<LiveLocatorResponse> {
    return this.http.get<LiveLocatorResponse>(`${this.base}/locate/${teacherId}/`).pipe(
      tap(response => this._updateLocal(response)),
    );
  }

  locateAll(): Observable<LiveLocatorResponse[]> {
    return this.http.get<LiveLocatorResponse[]>(`${this.base}/locate/all/`).pipe(
      tap(responses => this._locations.set(responses.map(r => this._toStaffLocation(r)))),
      catchError(err => {
        this._error.set('Failed to load staff locations');
        return of([]);
      }),
    );
  }

  startPolling(intervalMs = 30000): void {
    if (this._polling()) return;
    this._polling.set(true);
    interval(intervalMs).pipe(
      switchMap(() => this.locateAll()),
    ).subscribe();
  }

  stopPolling(): void {
    this._polling.set(false);
  }

  private _updateLocal(response: LiveLocatorResponse): void {
    this._locations.update(locations => {
      const idx = locations.findIndex(l => l.teacherId === response.teacher_id);
      const updated = this._toStaffLocation(response);
      if (idx >= 0) {
        const copy = [...locations];
        copy[idx] = updated;
        return copy;
      }
      return [...locations, updated];
    });
  }

  private _toStaffLocation(r: LiveLocatorResponse): StaffLocation {
    return {
      teacherId: r.teacher_id,
      teacherName: r.teacher_name,
      status: r.status,
      location: r.location,
      context: r.context
        ? [r.context.subject, r.context.year_group, r.context.period].filter(Boolean).join(' · ')
        : '',
      lastUpdated: new Date(r.queried_at),
    };
  }
}
