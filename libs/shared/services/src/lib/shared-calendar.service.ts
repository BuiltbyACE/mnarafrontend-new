import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { CalendarEvent, CalendarDay } from '@sms/shared/models';
import { environment } from '@sms/core/config';

export function buildCalendarDays(year: number, month: number, events: CalendarEvent[]): CalendarDay[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const today = new Date();
  const todayDate = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();

  const eventsMap = new Map<string, CalendarEvent[]>();
  for (const evt of events) {
    const dates = expandEventDates(evt);
    for (const dateKey of dates) {
      if (!dateKey) continue;
      const existing = eventsMap.get(dateKey) ?? [];
      existing.push(evt);
      eventsMap.set(dateKey, existing);
    }
  }

  const formatDateStr = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const result: CalendarDay[] = [];

  for (let i = 0; i < startOffset; i++) {
    result.push({ day: null, dateStr: null, events: [], isToday: false, isCurrentMonth: false });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = formatDateStr(year, month, d);
    const dayEvents = eventsMap.get(dateStr) ?? [];
    result.push({
      day: d,
      dateStr,
      events: dayEvents,
      isToday: d === todayDate && month === todayMonth && year === todayYear,
      isCurrentMonth: true,
    });
  }

  while (result.length < 42) {
    result.push({ day: null, dateStr: null, events: [], isToday: false, isCurrentMonth: false });
  }

  return result;
}

function expandEventDates(evt: CalendarEvent): string[] {
  if (evt.date) return [evt.date];
  if (evt.start_date && evt.end_date) {
    const dates: string[] = [];
    const start = new Date(evt.start_date.split('T')[0]);
    const end = new Date(evt.end_date.split('T')[0]);
    const cur = new Date(start);
    while (cur <= end) {
      dates.push(
        `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`
      );
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  }
  if (evt.start_date) return [evt.start_date.split('T')[0]];
  return [];
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

@Injectable({ providedIn: 'root' })
export class SharedCalendarService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/lms/calendar/events`;

  readonly currentMonth = signal(new Date().getMonth());
  readonly currentYear = signal(new Date().getFullYear());
  readonly events = signal<CalendarEvent[]>([]);
  readonly isLoading = signal(false);

  readonly monthLabel = computed(() => {
    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return `${MONTHS[this.currentMonth()]} ${this.currentYear()}`;
  });

  readonly calendarDays = computed<CalendarDay[]>(() => {
    return buildCalendarDays(this.currentYear(), this.currentMonth(), this.events());
  });

  private mapEvent(raw: any): CalendarEvent {
    return {
      id: raw.id,
      title: raw.title,
      event_type: raw.event_type,
      date: raw.date,
      start_date: raw.start_date,
      end_date: raw.end_date,
      hexColor: raw.hexColor ?? raw.hex_color,
      isFullDayHighlight: raw.isFullDayHighlight ?? raw.is_full_day_highlight,
      description: raw.description,
      is_non_learning_day: raw.is_non_learning_day,
      time: raw.time,
    };
  }


  fetchEvents(month: number, year: number): Observable<CalendarEvent[]> {
    this.isLoading.set(true);
    const params = new HttpParams()
      .set('month', String(month + 1))
      .set('year', String(year));

    return this.http.get<PaginatedResponse<any> | any[]>(this.baseUrl, { params }).pipe(
      map((res) => {
        const rawEvents = Array.isArray(res) ? res : (res.results ?? []);
        return rawEvents.map((e: any) => this.mapEvent(e));
      }),
      tap({
        next: (events) => {
          this.events.set(events);
          this.currentMonth.set(month);
          this.currentYear.set(year);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      })
    );
  }

  fetchCurrentMonth(): Observable<CalendarEvent[]> {
    return this.fetchEvents(this.currentMonth(), this.currentYear());
  }

  goToNextMonth(): Observable<CalendarEvent[]> {
    let month = this.currentMonth();
    let year = this.currentYear();
    if (month === 11) {
      month = 0;
      year += 1;
    } else {
      month += 1;
    }
    return this.fetchEvents(month, year);
  }

  goToPreviousMonth(): Observable<CalendarEvent[]> {
    let month = this.currentMonth();
    let year = this.currentYear();
    if (month === 0) {
      month = 11;
      year -= 1;
    } else {
      month -= 1;
    }
    return this.fetchEvents(month, year);
  }

  goToToday(): Observable<CalendarEvent[]> {
    const today = new Date();
    return this.fetchEvents(today.getMonth(), today.getFullYear());
  }

  addEvent(event: CalendarEvent): void {
    this.events.update((current) => [...current, event]);
  }

  removeEvent(eventId: string | number): void {
    this.events.update((current) => current.filter((e) => e.id !== eventId));
  }

  mapToGrid(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
    const map = new Map<string, CalendarEvent[]>();
    for (const evt of events) {
      const dates = expandEventDates(evt);
      for (const dateKey of dates) {
        if (!dateKey) continue;
        const existing = map.get(dateKey) ?? [];
        existing.push(evt);
        map.set(dateKey, existing);
      }
    }
    return map;
  }

  getHighlightEventsForDay(dayEvents: CalendarEvent[]): CalendarEvent[] {
    return dayEvents.filter((e) => e.isFullDayHighlight);
  }

  getDotEventsForDay(dayEvents: CalendarEvent[]): CalendarEvent[] {
    return dayEvents.filter((e) => !e.isFullDayHighlight).slice(0, 3);
  }

  getOverflowCount(dayEvents: CalendarEvent[]): number {
    return Math.max(0, dayEvents.filter((e) => !e.isFullDayHighlight).length - 3);
  }
}