import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { CalendarEvent } from '../../shared/models/teacher.models';

@Injectable({ providedIn: 'root' })
export class TeacherCalendarService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/lms/calendar/events';

  readonly currentDate = signal(new Date());
  readonly events = signal<CalendarEvent[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  readonly calendarDays = computed(() => {
    const d = this.currentDate();
    const year = d.getFullYear();
    const month = d.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDow = firstDay.getDay();
    const days: (number | null)[] = [];
    for (let i = 0; i < startDow; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  });

  readonly upcomingEvents = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.events()
      .filter((evt: CalendarEvent) => new Date(evt.date) >= today)
      .sort((a: CalendarEvent, b: CalendarEvent) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  });

  fetchEvents(month: number, year: number): Observable<CalendarEvent[]> {
    this.isLoading.set(true);
    this.error.set(null);
    const params = new HttpParams()
      .set('month', String(month + 1))
      .set('year', String(year));

    return this.http.get<CalendarEvent[]>(this.baseUrl, { params }).pipe(
      tap({
        next: (events: CalendarEvent[]) => {
          this.events.set(events ?? []);
          this.isLoading.set(false);
        },
        error: () => {
          this.events.set([]);
          this.error.set('Failed to load calendar events');
          this.isLoading.set(false);
        },
      })
    );
  }

  fetchCurrentMonth(): void {
    const d = this.currentDate();
    this.fetchEvents(d.getMonth(), d.getFullYear()).subscribe();
  }

  isToday(day: number): boolean {
    const d = this.currentDate();
    const today = new Date();
    return day === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
  }

  getEventsForDay(day: number): CalendarEvent[] {
    const d = this.currentDate();
    const target = this.formatDate(d.getFullYear(), d.getMonth(), day);
    return this.events().filter((evt: CalendarEvent) => evt.date === target);
  }

  previousMonth(): void {
    const d = this.currentDate();
    this.currentDate.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  nextMonth(): void {
    const d = this.currentDate();
    this.currentDate.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  private formatDate(year: number, month: number, day: number): string {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
}
