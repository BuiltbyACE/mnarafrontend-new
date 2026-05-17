import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe, LowerCasePipe, NgClass, NgStyle } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { CalendarEvent } from '../../shared/models/teacher.models';
import { TeacherCalendarService } from '../../core/services/teacher-calendar.service';

@Component({
  selector: 'app-teacher-calendar',
  standalone: true,
  imports: [
    DatePipe,
    LowerCasePipe,
    NgClass,
    NgStyle,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="calendar-container">
      <header class="page-header">
        <h1>Calendar</h1>
        <p class="subtitle">School events and important dates</p>
      </header>

      <div class="calendar-layout">
        <div class="calendar-main">
          <mat-card class="calendar-card" appearance="outlined">
            <mat-card-content>
              <div class="month-header">
                <button mat-icon-button (click)="previousMonth()">
                  <mat-icon>chevron_left</mat-icon>
                </button>
                <h2 class="month-title">{{ currentDate() | date:'MMMM yyyy' }}</h2>
                <button mat-icon-button (click)="nextMonth()">
                  <mat-icon>chevron_right</mat-icon>
                </button>
              </div>

              <div class="weekday-header">
                @for (day of weekDays; track day) {
                  <span class="weekday-label">{{ day }}</span>
                }
              </div>

              <div class="days-grid">
                @for (day of calendarDays(); track $index) {
                  @if (day === null) {
                    <div class="day-cell empty"></div>
                  } @else {
                    <div
                      class="day-cell"
                      [class.today]="isToday(day)"
                      [class.has-events]="getEventsForDay(day).length > 0"
                    >
                      <span class="day-number">{{ day }}</span>
                      <div class="event-dots">
                        @for (evt of getEventsForDay(day).slice(0, 3); track evt.id) {
                          <span
                            class="event-dot"
                            [ngClass]="'type-' + (evt.type | lowercase)"
                            [title]="evt.title"
                          ></span>
                        }
                        @if (getEventsForDay(day).length > 3) {
                          <span class="more-events">+{{ getEventsForDay(day).length - 3 }}</span>
                        }
                      </div>
                    </div>
                  }
                }
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="legend-card" appearance="outlined">
            <mat-card-content>
              <div class="legend-items">
                <span class="legend-item"><span class="legend-dot type-class"></span>CLASS</span>
                <span class="legend-item"><span class="legend-dot type-meeting"></span>MEETING</span>
                <span class="legend-item"><span class="legend-dot type-exam"></span>EXAM</span>
                <span class="legend-item"><span class="legend-dot type-event"></span>EVENT</span>
                <span class="legend-item"><span class="legend-dot type-deadline"></span>DEADLINE</span>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <div class="calendar-sidebar">
          <mat-card class="upcoming-card" appearance="outlined">
            <mat-card-header>
              <mat-card-title>Upcoming Events</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              @if (upcomingEvents().length === 0) {
                <p class="no-events">No upcoming events</p>
              }
              @for (evt of upcomingEvents(); track evt.id) {
                <div class="upcoming-item">
                  <span class="upcoming-dot" [ngClass]="'type-' + (evt.type | lowercase)"></span>
                  <div class="upcoming-info">
                    <span class="upcoming-title">{{ evt.title }}</span>
                    <span class="upcoming-date">{{ evt.date | date:'MMM d' }}{{ evt.time ? ', ' + evt.time : '' }}</span>
                  </div>
                  <mat-chip-row class="type-chip" [ngClass]="'type-' + (evt.type | lowercase)">
                    {{ evt.type }}
                  </mat-chip-row>
                </div>
              }
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: `
    :host {
      --mnara-primary: #2563eb;
      --mnara-primary-dark: #1d4ed8;
      --mnara-primary-light: #dbeafe;
      --mnara-surface: #ffffff;
      --mnara-surface-hover: #f1f5f9;
      --mnara-background: #f0f4ff;
      --mnara-text: #1e293b;
      --mnara-text-secondary: #64748b;
      --mnara-border: #e2e8f0;
      --cal-class: #2563eb;
      --cal-meeting: #10b981;
      --cal-exam: #ef4444;
      --cal-event: #8b5cf6;
      --cal-deadline: #f59e0b;
      display: block;
      min-height: 100vh;
      background: var(--mnara-background);
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      color: var(--mnara-text);
    }
    .calendar-container { max-width: 1100px; margin: 0 auto; padding: 24px; }
    .page-header { margin-bottom: 24px; }
    .page-header h1 { font-size: 28px; font-weight: 600; margin: 0 0 4px; }
    .subtitle { color: var(--mnara-text-secondary); font-size: 14px; margin: 0; }
    .calendar-layout { display: grid; grid-template-columns: 1fr 320px; gap: 24px; align-items: start; }
    @media (max-width: 860px) { .calendar-layout { grid-template-columns: 1fr; } }
    .calendar-card { background: var(--mnara-surface); }
    .month-header { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 8px 0 20px; }
    .month-title { font-size: 20px; font-weight: 600; min-width: 200px; text-align: center; }
    .weekday-header { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; margin-bottom: 4px; }
    .weekday-label { text-align: center; font-size: 11px; font-weight: 600; color: var(--mnara-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; padding: 8px 0; }
    .days-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
    .day-cell {
      min-height: 80px; padding: 6px; border-radius: 6px;
      background: var(--mnara-surface-hover); cursor: pointer;
      transition: background 0.15s, box-shadow 0.15s;
      display: flex; flex-direction: column;
    }
    .day-cell:hover { background: var(--mnara-primary-light); }
    .day-cell.today { background: #eff6ff; box-shadow: inset 0 0 0 2px var(--mnara-primary); }
    .day-cell.empty { background: transparent; cursor: default; }
    .day-number { font-size: 13px; font-weight: 600; color: var(--mnara-text); margin-bottom: 4px; }
    .today .day-number { color: var(--mnara-primary); }
    .event-dots { display: flex; flex-wrap: wrap; gap: 3px; margin-top: auto; }
    .event-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
    .event-dot.type-class { background: var(--cal-class); }
    .event-dot.type-meeting { background: var(--cal-meeting); }
    .event-dot.type-exam { background: var(--cal-exam); }
    .event-dot.type-event { background: var(--cal-event); }
    .event-dot.type-deadline { background: var(--cal-deadline); }
    .more-events { font-size: 9px; color: var(--mnara-text-secondary); font-weight: 500; line-height: 1; }
    .legend-card { background: var(--mnara-surface); margin-top: 16px; }
    .legend-items { display: flex; flex-wrap: wrap; gap: 16px; }
    .legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; color: var(--mnara-text-secondary); }
    .legend-dot { width: 8px; height: 8px; border-radius: 50%; }
    .legend-dot.type-class { background: var(--cal-class); }
    .legend-dot.type-meeting { background: var(--cal-meeting); }
    .legend-dot.type-exam { background: var(--cal-exam); }
    .legend-dot.type-event { background: var(--cal-event); }
    .legend-dot.type-deadline { background: var(--cal-deadline); }
    .upcoming-card { background: var(--mnara-surface); }
    .upcoming-card mat-card-title { font-size: 18px; font-weight: 600; }
    .no-events { color: var(--mnara-text-secondary); font-size: 14px; text-align: center; padding: 24px; }
    .upcoming-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--mnara-border); }
    .upcoming-item:last-child { border-bottom: none; }
    .upcoming-dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 4px; flex-shrink: 0; }
    .upcoming-dot.type-class { background: var(--cal-class); }
    .upcoming-dot.type-meeting { background: var(--cal-meeting); }
    .upcoming-dot.type-exam { background: var(--cal-exam); }
    .upcoming-dot.type-event { background: var(--cal-event); }
    .upcoming-dot.type-deadline { background: var(--cal-deadline); }
    .upcoming-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .upcoming-title { font-size: 14px; font-weight: 600; color: var(--mnara-text); }
    .upcoming-date { font-size: 12px; color: var(--mnara-text-secondary); }
    .type-chip { font-size: 10px !important; padding: 0 6px !important; min-height: 20px !important; }
    .type-chip.type-class { background: #dbeafe !important; color: #1d4ed8 !important; }
    .type-chip.type-meeting { background: #d1fae5 !important; color: #065f46 !important; }
    .type-chip.type-exam { background: #fee2e2 !important; color: #991b1b !important; }
    .type-chip.type-event { background: #ede9fe !important; color: #5b21b6 !important; }
    .type-chip.type-deadline { background: #fef3c7 !important; color: #92400e !important; }
  `,
})
export class CalendarComponent {
  private calendarService = inject(TeacherCalendarService);

  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  currentDate = this.calendarService.currentDate;
  calendarDays = this.calendarService.calendarDays;
  upcomingEvents = this.calendarService.upcomingEvents;

  isToday(day: number): boolean {
    return this.calendarService.isToday(day);
  }

  getEventsForDay(day: number): CalendarEvent[] {
    return this.calendarService.getEventsForDay(day);
  }

  previousMonth(): void {
    this.calendarService.previousMonth();
  }

  nextMonth(): void {
    this.calendarService.nextMonth();
  }
}
