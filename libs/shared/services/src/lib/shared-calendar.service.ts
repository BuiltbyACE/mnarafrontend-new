import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { CalendarEvent, CalendarDay } from '@sms/shared/models';

@Injectable({ providedIn: 'root' })
export class SharedCalendarService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/lms/calendar/events';

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
    const year = this.currentYear();
    const month = this.currentMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();
    const eventsMap = this.buildEventsMap();

    const result: CalendarDay[] = [];

    for (let i = 0; i < startOffset; i++) {
      result.push({ day: null, dateStr: null, events: [], isToday: false, isCurrentMonth: false });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = this.formatDateStr(year, month, d);
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
  });

  fetchEvents(month: number, year: number): Observable<CalendarEvent[]> {
    this.isLoading.set(true);
    const params = new HttpParams()
      .set('month', String(month + 1))
      .set('year', String(year));

    return this.http.get<CalendarEvent[]>(this.baseUrl, { params }).pipe(
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
      const dateKey = evt.date ?? evt.start_date?.split('T')[0] ?? '';
      if (!dateKey) continue;
      const existing = map.get(dateKey) ?? [];
      existing.push(evt);
      map.set(dateKey, existing);
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

  private buildEventsMap(): Map<string, CalendarEvent[]> {
    const map = new Map<string, CalendarEvent[]>();
    for (const evt of this.events()) {
      const startDate = evt.date ?? evt.start_date?.split('T')[0] ?? '';
      if (!startDate) continue;
      const existing = map.get(startDate) ?? [];
      existing.push(evt);
      map.set(startDate, existing);
    }
    return map;
  }

  private formatDateStr(year: number, month: number, day: number): string {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
}