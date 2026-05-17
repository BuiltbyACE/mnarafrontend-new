import { Component, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

interface TimetableEntry {
  subject: string;
  classroom: string;
  teacher?: string;
}

type Weekday = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

const DAYS: Weekday[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const TIME_SLOTS: string[] = [
  '7:30', '8:30', '9:30', '10:30', '11:30',
  '12:30', '13:30', '14:30', '15:30', '16:30'
];

@Component({
  selector: 'app-teacher-timetable',
  standalone: true,
  imports: [DatePipe, MatCardModule, MatIconModule, MatChipsModule],
  template: `
    <div class="timetable-page">
      <header class="page-header">
        <div>
          <h1>My Timetable</h1>
          <span class="week-label">Week of {{ weekStart() | date:'d MMM yyyy' }}</span>
        </div>
        <div class="header-actions">
          <button class="nav-btn" (click)="navigateWeek(-1)">
            <mat-icon>chevron_left</mat-icon>
          </button>
          <button class="nav-btn" (click)="navigateWeek(1)">
            <mat-icon>chevron_right</mat-icon>
          </button>
          <button class="today-btn" (click)="resetToToday()">Today</button>
        </div>
      </header>

      <div class="timetable-container">
        <div class="timetable-grid">
          <div class="grid-header corner"></div>
          @for (day of days; track day) {
            <div
              class="grid-header day-header"
              [class.today]="day === todayDay()"
            >
              <span class="day-name">{{ day }}</span>
              <span class="day-date">{{ dayDate(day) | date:'d MMM' }}</span>
            </div>
          }

          @for (slot of timeSlots; track slot) {
            <div class="time-label">{{ slot }}</div>
            @for (day of days; track day) {
              @let entry = timetable()[day]?.[slot];
              @let isCurrent = currentSlot() === slot && day === todayDay();
              <div
                class="grid-cell"
                [class.current]="isCurrent"
                [class.has-class]="!!entry"
              >
                @if (entry) {
                  <div class="cell-content">
                    <span class="cell-subject">{{ entry.subject }}</span>
                    <span class="cell-room">{{ entry.classroom }}</span>
                  </div>
                }
              </div>
            }
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --mnara-primary: #2563eb;
      --mnara-primary-light: #dbeafe;
      --mnara-primary-dark: #1e40af;
      --mnara-bg: #f1f5f9;
      --mnara-surface: #ffffff;
      --mnara-text: #1e293b;
      --mnara-text-secondary: #64748b;
      --mnara-border: #e2e8f0;
      display: block;
      min-height: 100vh;
      background: var(--mnara-bg);
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    }
    .timetable-page {
      padding: 32px;
      max-width: 1280px;
      margin: 0 auto;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
    }
    .page-header h1 {
      font-size: 28px;
      font-weight: 600;
      color: var(--mnara-text);
      margin: 0 0 4px;
    }
    .week-label {
      font-size: 14px;
      color: var(--mnara-text-secondary);
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .nav-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: 1px solid var(--mnara-border);
      border-radius: 8px;
      background: var(--mnara-surface);
      cursor: pointer;
      color: var(--mnara-text);
    }
    .nav-btn:hover {
      background: var(--mnara-primary-light);
      border-color: var(--mnara-primary);
    }
    .today-btn {
      padding: 8px 16px;
      border: none;
      border-radius: 8px;
      background: var(--mnara-primary);
      color: #fff;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
    }
    .today-btn:hover {
      background: var(--mnara-primary-dark);
    }
    .timetable-container {
      overflow-x: auto;
      border-radius: 12px;
      border: 1px solid var(--mnara-border);
      background: var(--mnara-surface);
    }
    .timetable-grid {
      display: grid;
      grid-template-columns: 80px repeat(5, 1fr);
      min-width: 720px;
    }
    .grid-header {
      padding: 12px 8px;
      font-size: 13px;
      font-weight: 600;
      color: var(--mnara-text-secondary);
      text-align: center;
      border-bottom: 1px solid var(--mnara-border);
      background: var(--mnara-bg);
    }
    .day-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }
    .day-header.today {
      background: var(--mnara-primary-light);
      color: var(--mnara-primary-dark);
    }
    .day-name {
      font-size: 13px;
    }
    .day-date {
      font-size: 11px;
      font-weight: 400;
    }
    .time-label {
      padding: 8px;
      font-size: 12px;
      color: var(--mnara-text-secondary);
      text-align: right;
      border-right: 1px solid var(--mnara-border);
      border-bottom: 1px solid var(--mnara-border);
      background: var(--mnara-bg);
      font-weight: 500;
    }
    .grid-cell {
      padding: 6px;
      border-right: 1px solid var(--mnara-border);
      border-bottom: 1px solid var(--mnara-border);
      min-height: 64px;
      transition: background 0.15s;
    }
    .grid-cell:nth-child(6n+1) {
      border-right: none;
    }
    .grid-cell.current {
      background: #eff6ff;
      box-shadow: inset 0 0 0 2px var(--mnara-primary);
      border-radius: 4px;
    }
    .grid-cell.has-class {
      background: var(--mnara-primary-light);
    }
    .cell-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .cell-subject {
      font-size: 12px;
      font-weight: 600;
      color: var(--mnara-primary-dark);
      line-height: 1.3;
    }
    .cell-room {
      font-size: 11px;
      color: var(--mnara-text-secondary);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimetableComponent {
  readonly weekOffset = signal(0);
  readonly timeSlots = TIME_SLOTS;
  readonly days = DAYS;

  readonly today: Date = new Date();

  readonly weekStart = computed(() => {
    const d = new Date(this.today);
    d.setDate(d.getDate() + this.weekOffset() * 7);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  readonly todayDay = computed((): Weekday | null => {
    const now = new Date();
    const ws = this.weekStart();
    const diff = Math.floor((now.getTime() - ws.getTime()) / 86400000);
    if (diff >= 0 && diff < 5) return DAYS[diff];
    return null;
  });

  readonly currentSlot = computed(() => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const total = h * 60 + m;
    for (let i = TIME_SLOTS.length - 1; i >= 0; i--) {
      const [hr, min] = TIME_SLOTS[i].split(':').map(Number);
      if (total >= hr * 60 + (min || 0)) return TIME_SLOTS[i];
    }
    return '';
  });

  private readonly mockTimetable: Record<Weekday, Record<string, TimetableEntry>> = {
    Monday: {
      '7:30': { subject: 'Mathematics', classroom: 'Rm 12' },
      '8:30': { subject: 'Physics', classroom: 'Lab 3' },
      '9:30': { subject: 'Mathematics', classroom: 'Rm 12' },
      '10:30': { subject: 'Free Period', classroom: '—' },
      '11:30': { subject: 'English Literature', classroom: 'Rm 8' },
      '12:30': { subject: 'Lunch Break', classroom: '—' },
      '13:30': { subject: 'History', classroom: 'Rm 5' },
      '14:30': { subject: 'Free Period', classroom: '—' },
      '15:30': { subject: 'Staff Meeting', classroom: 'Conf Rm' },
      '16:30': { subject: '—', classroom: '' },
    },
    Tuesday: {
      '7:30': { subject: 'Chemistry', classroom: 'Lab 1' },
      '8:30': { subject: 'Physics', classroom: 'Lab 3' },
      '9:30': { subject: 'Chemistry', classroom: 'Lab 1' },
      '10:30': { subject: 'Mathematics', classroom: 'Rm 12' },
      '11:30': { subject: 'Free Period', classroom: '—' },
      '12:30': { subject: 'Lunch Break', classroom: '—' },
      '13:30': { subject: 'Biology', classroom: 'Lab 2' },
      '14:30': { subject: 'English Literature', classroom: 'Rm 8' },
      '15:30': { subject: 'Free Period', classroom: '—' },
      '16:30': { subject: '—', classroom: '' },
    },
    Wednesday: {
      '7:30': { subject: 'Biology', classroom: 'Lab 2' },
      '8:30': { subject: 'Mathematics', classroom: 'Rm 12' },
      '9:30': { subject: 'Physics', classroom: 'Lab 3' },
      '10:30': { subject: 'Chemistry', classroom: 'Lab 1' },
      '11:30': { subject: 'History', classroom: 'Rm 5' },
      '12:30': { subject: 'Lunch Break', classroom: '—' },
      '13:30': { subject: 'Free Period', classroom: '—' },
      '14:30': { subject: 'English Literature', classroom: 'Rm 8' },
      '15:30': { subject: 'Mathematics', classroom: 'Rm 12' },
      '16:30': { subject: '—', classroom: '' },
    },
    Thursday: {
      '7:30': { subject: 'English Literature', classroom: 'Rm 8' },
      '8:30': { subject: 'History', classroom: 'Rm 5' },
      '9:30': { subject: 'Biology', classroom: 'Lab 2' },
      '10:30': { subject: 'Mathematics', classroom: 'Rm 12' },
      '11:30': { subject: 'Free Period', classroom: '—' },
      '12:30': { subject: 'Lunch Break', classroom: '—' },
      '13:30': { subject: 'Physics', classroom: 'Lab 3' },
      '14:30': { subject: 'Chemistry', classroom: 'Lab 1' },
      '15:30': { subject: 'Free Period', classroom: '—' },
      '16:30': { subject: '—', classroom: '' },
    },
    Friday: {
      '7:30': { subject: 'Physics', classroom: 'Lab 3' },
      '8:30': { subject: 'Chemistry', classroom: 'Lab 1' },
      '9:30': { subject: 'Mathematics', classroom: 'Rm 12' },
      '10:30': { subject: 'English Literature', classroom: 'Rm 8' },
      '11:30': { subject: 'History', classroom: 'Rm 5' },
      '12:30': { subject: 'Lunch Break', classroom: '—' },
      '13:30': { subject: 'Biology', classroom: 'Lab 2' },
      '14:30': { subject: 'Free Period', classroom: '—' },
      '15:30': { subject: 'Sports', classroom: 'Field' },
      '16:30': { subject: '—', classroom: '' },
    },
  };

  readonly timetable = signal(this.mockTimetable);

  dayDate(day: Weekday): Date {
    const ws = this.weekStart();
    const idx = DAYS.indexOf(day);
    const d = new Date(ws);
    d.setDate(d.getDate() + idx);
    return d;
  }

  navigateWeek(delta: number): void {
    this.weekOffset.update(v => v + delta);
  }

  resetToToday(): void {
    this.weekOffset.set(0);
  }
}
