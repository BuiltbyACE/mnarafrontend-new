import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@sms/core/config';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

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

  private readonly _events = signal<AdminCalendarEvent[]>([]);

  readonly events = this._events.asReadonly();

  constructor() {
    this.loadEvents();
  }

  private mapEvent(raw: any): AdminCalendarEvent {
    return {
      id: raw.id,
      title: raw.title,
      event_type: raw.event_type,
      start_date: raw.start_date,
      end_date: raw.end_date,
      is_non_learning_day: raw.is_non_learning_day,
      description: raw.description,
      time: raw.time,
      hexColor: raw.hexColor ?? raw.hex_color,
      isFullDayHighlight: raw.isFullDayHighlight ?? raw.is_full_day_highlight,
    };
  }

  loadEvents(): void {
    this.http.get<PaginatedResponse<any>>(`${this.baseUrl}/lms/admin/calendar-events/`)
      .pipe(map((res) => (res.results || []).map((e) => this.mapEvent(e))))
      .subscribe({
        next: (events) => this._events.set(events),
        error: () => this._events.set([]),
      });
  }

  getEvents(): Observable<AdminCalendarEvent[]> {
    return this.http.get<PaginatedResponse<any>>(`${this.baseUrl}/lms/admin/calendar-events/`)
      .pipe(map((res) => (res.results || []).map((e) => this.mapEvent(e))));
  }

  createEvent(payload: CreateEventPayload): Observable<AdminCalendarEvent> {
    return this.http.post<any>(`${this.baseUrl}/lms/admin/calendar-events/`, payload)
      .pipe(map((e) => this.mapEvent(e)));
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