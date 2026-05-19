import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@sms/core/config';

export type AdminEventType = 'TERM' | 'HOLIDAY' | 'SDL' | 'EXAM';

export interface AdminCalendarEvent {
  id?: number;
  title: string;
  event_type: AdminEventType;
  start_date: string;
  end_date: string;
  is_non_learning_day: boolean;
  description?: string;
  time?: string;
  hexColor: string;
  isFullDayHighlight: boolean;
}

export interface CreateEventPayload {
  title: string;
  event_type: AdminEventType;
  start_date: string;
  end_date: string;
  is_non_learning_day: boolean;
  description?: string;
  hexColor: string;
  isFullDayHighlight: boolean;
}

const DEFAULT_COLORS: Record<AdminEventType, string> = {
  TERM: '#2563eb',
  HOLIDAY: '#ef4444',
  SDL: '#10b981',
  EXAM: '#f59e0b',
};

@Injectable({ providedIn: 'root' })
export class AdminCalendarService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  private readonly _events = signal<AdminCalendarEvent[]>([
    { id: 1, title: 'Term 1 Begins', event_type: 'TERM', start_date: '2026-01-12', end_date: '2026-01-12', is_non_learning_day: false, hexColor: '#2563eb', isFullDayHighlight: true },
    { id: 2, title: 'Mid-Term Break', event_type: 'HOLIDAY', start_date: '2026-02-23', end_date: '2026-02-27', is_non_learning_day: true, hexColor: '#ef4444', isFullDayHighlight: true },
    { id: 3, title: 'SDL Week', event_type: 'SDL', start_date: '2026-03-09', end_date: '2026-03-13', is_non_learning_day: false, hexColor: '#10b981', isFullDayHighlight: true },
    { id: 4, title: 'End of Term Exams', event_type: 'EXAM', start_date: '2026-03-23', end_date: '2026-03-27', is_non_learning_day: false, hexColor: '#f59e0b', isFullDayHighlight: true },
    { id: 5, title: 'Staff Meeting', event_type: 'TERM', start_date: '2026-04-10', end_date: '2026-04-10', is_non_learning_day: false, hexColor: '#2563eb', isFullDayHighlight: false },
    { id: 6, title: 'Grade Submission Deadline', event_type: 'TERM', start_date: '2026-04-15', end_date: '2026-04-15', is_non_learning_day: false, hexColor: '#8b5cf6', isFullDayHighlight: false },
  ]);

  readonly events = this._events.asReadonly();

  getEvents(): Observable<AdminCalendarEvent[]> {
    return this.http.get<AdminCalendarEvent[]>(`${this.baseUrl}/lms/admin/calendar-events/`);
  }

  createEvent(payload: CreateEventPayload): Observable<AdminCalendarEvent> {
    return this.http.post<AdminCalendarEvent>(`${this.baseUrl}/lms/admin/calendar-events/`, payload);
  }

  addEvent(event: AdminCalendarEvent): void {
    this._events.update((current) => [...current, event]);
  }

  getDefaultColor(type: AdminEventType): string {
    return DEFAULT_COLORS[type] ?? '#64748b';
  }

  generateDateRange(start: Date, end: Date): string[] {
    const dates: string[] = [];
    const cur = new Date(start);
    while (cur <= end) {
      dates.push(
        `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`
      );
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  }
}