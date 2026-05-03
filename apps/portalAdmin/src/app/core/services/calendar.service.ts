/**
 * Calendar Service
 * Fetches calendar events for the admin dashboard
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { getApiUrl } from '@sms/core/config';

export type CalendarEventType = 
  | 'holiday'
  | 'exam'
  | 'meeting'
  | 'event'
  | 'deadline'
  | 'assembly';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO date string
  end_date?: string;
  type: CalendarEventType;
  description?: string;
  all_day: boolean;
}

export interface CalendarResponse {
  month: number;
  year: number;
  events: CalendarEvent[];
}

@Injectable({
  providedIn: 'root',
})
export class CalendarService {
  private http = inject(HttpClient);

  // Signals for state management
  readonly events = signal<CalendarEvent[]>([]);
  readonly currentMonth = signal<number>(new Date().getMonth() + 1);
  readonly currentYear = signal<number>(new Date().getFullYear());
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  /**
   * Fetch calendar events for a specific month
   * @param month Month (1-12), defaults to current month
   * @param year Year, defaults to current year
   */
  getEvents(month?: number, year?: number): Observable<CalendarResponse> {
    this.isLoading.set(true);
    this.error.set(null);

    const targetMonth = month ?? this.currentMonth();
    const targetYear = year ?? this.currentYear();

    return this.http
      .get<CalendarResponse>(getApiUrl('/analytics/calendar/events/'), {
        params: {
          month: targetMonth.toString(),
          year: targetYear.toString(),
        },
      })
      .pipe(
        catchError((err) => {
          const message =
            err.error?.message ||
            `Failed to load calendar events (${err.status})`;
          console.error('Calendar API error:', err);
          this.error.set(message);
          this.isLoading.set(false);
          return throwError(() => new Error(message));
        })
      );
  }

  /**
   * Set events data in signal
   */
  setEvents(data: CalendarEvent[]): void {
    this.events.set(data);
    this.isLoading.set(false);
  }

  /**
   * Load events and update signal
   */
  loadEvents(month?: number, year?: number): void {
    this.getEvents(month, year).subscribe({
      next: (response) => {
        this.setEvents(response.events);
        this.currentMonth.set(response.month);
        this.currentYear.set(response.year);
      },
      error: () => {
        // Error already set in signal
      },
    });
  }

  /**
   * Check if a date has events
   */
  hasEvents(date: string): boolean {
    return this.events().some((event) => event.date === date);
  }

  /**
   * Get events for a specific date
   */
  getEventsForDate(date: string): CalendarEvent[] {
    return this.events().filter((event) => event.date === date);
  }

  /**
   * Navigate to previous month
   */
  previousMonth(): void {
    let newMonth = this.currentMonth() - 1;
    let newYear = this.currentYear();
    if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }
    this.loadEvents(newMonth, newYear);
  }

  /**
   * Navigate to next month
   */
  nextMonth(): void {
    let newMonth = this.currentMonth() + 1;
    let newYear = this.currentYear();
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    }
    this.loadEvents(newMonth, newYear);
  }
}
