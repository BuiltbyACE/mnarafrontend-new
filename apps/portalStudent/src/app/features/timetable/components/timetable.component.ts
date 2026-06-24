import { Component, computed, signal, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TimetableService } from '../services/timetable.service';
import { CalendarViewComponent } from './calendar-view.component';

type Weekday = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

const DAYS: Weekday[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

interface SlotInfo {
  sequence: number;
  startTime: string;
}

interface GridEntry {
  subject: string;
  classroom: string;
  teacher?: string;
}

type GridData = { [day: string]: { [sequence: number]: GridEntry } };

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

@Component({
  selector: 'app-student-timetable',
  standalone: true,
  imports: [DatePipe, MatIconModule, CalendarViewComponent],
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
          <button class="today-btn" (click)="resetToToday()">This Week</button>
        </div>
      </header>

      <div class="timetable-body">
        <aside class="calendar-sidebar">
          <app-calendar-view
            [classDates]="classDates()"
            [selectedDate]="selectedDate()"
            (dateSelected)="onDateSelected($event)"
          />
        </aside>

        <div class="timetable-container">
          <div class="timetable-grid">
            <div class="grid-header corner"></div>
            @for (day of days; track day) {
              <div class="grid-header day-header" [class.today]="day === todayDay()">
                <span class="day-name">{{ day }}</span>
                <span class="day-date">{{ dayDate(day) | date:'d MMM' }}</span>
              </div>
            }

            @for (slot of slots(); track slot.sequence) {
              <div class="time-label">{{ slot.startTime }}</div>
              @for (day of days; track day) {
                @let entry = grid()[day]?.[slot.sequence];
                @let isCurrent = currentSequence() === slot.sequence && day === todayDay();
                <div class="grid-cell" [class.current]="isCurrent" [class.has-class]="!!entry">
                  @if (entry) {
                    <div class="cell-content">
                      <span class="cell-subject">{{ entry.subject }}</span>
                      <span class="cell-room">{{ entry.classroom }}</span>
                      @if (entry.teacher) {
                        <span class="cell-teacher">{{ entry.teacher }}</span>
                      }
                    </div>
                  }
                </div>
              }
            }
          </div>
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
    .timetable-page { padding: 32px; max-width: 1360px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
    .page-header h1 { font-size: 28px; font-weight: 600; color: var(--mnara-text); margin: 0 0 4px; }
    .week-label { font-size: 14px; color: var(--mnara-text-secondary); }
    .header-actions { display: flex; align-items: center; gap: 8px; }
    .nav-btn {
      display: flex; align-items: center; justify-content: center;
      width: 36px; height: 36px;
      border: 1px solid var(--mnara-border); border-radius: 8px;
      background: var(--mnara-surface); cursor: pointer; color: var(--mnara-text);
    }
    .nav-btn:hover { background: var(--mnara-primary-light); border-color: var(--mnara-primary); }
    .today-btn {
      padding: 8px 16px; border: none; border-radius: 8px;
      background: var(--mnara-primary); color: #fff;
      font-weight: 600; font-size: 13px; cursor: pointer;
    }
    .today-btn:hover { background: var(--mnara-primary-dark); }
    .timetable-body { display: flex; gap: 24px; align-items: flex-start; }
    .calendar-sidebar { flex: 0 0 320px; position: sticky; top: 32px; }
    .timetable-container {
      flex: 1; overflow-x: auto; border-radius: 12px;
      border: 1px solid var(--mnara-border); background: var(--mnara-surface); min-width: 0;
    }
    .timetable-grid { display: grid; grid-template-columns: 80px repeat(5, 1fr); min-width: 580px; }
    .grid-header {
      padding: 12px 8px; font-size: 13px; font-weight: 600;
      color: var(--mnara-text-secondary); text-align: center;
      border-bottom: 1px solid var(--mnara-border); background: var(--mnara-bg);
    }
    .day-header { display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .day-header.today { background: var(--mnara-primary-light); color: var(--mnara-primary-dark); }
    .day-name { font-size: 13px; }
    .day-date { font-size: 11px; font-weight: 400; }
    .time-label {
      padding: 8px; font-size: 12px; color: var(--mnara-text-secondary);
      text-align: right; border-right: 1px solid var(--mnara-border);
      border-bottom: 1px solid var(--mnara-border); background: var(--mnara-bg); font-weight: 500;
    }
    .grid-cell {
      padding: 6px; border-right: 1px solid var(--mnara-border);
      border-bottom: 1px solid var(--mnara-border); min-height: 64px;
      transition: background 0.15s;
    }
    .grid-cell:nth-child(6n+1) { border-right: none; }
    .grid-cell.current { background: #eff6ff; box-shadow: inset 0 0 0 2px var(--mnara-primary); border-radius: 4px; }
    .grid-cell.has-class { background: var(--mnara-primary-light); }
    .cell-content { display: flex; flex-direction: column; gap: 2px; }
    .cell-subject { font-size: 12px; font-weight: 600; color: var(--mnara-primary-dark); line-height: 1.3; }
    .cell-room { font-size: 11px; color: var(--mnara-text-secondary); }
    .cell-teacher { font-size: 10px; color: var(--mnara-text-secondary); font-style: italic; }
    @media (max-width: 1024px) {
      .timetable-body { flex-direction: column; }
      .calendar-sidebar { flex: none; width: 100%; position: static; }
    }
  `],
})
export class TimetableComponent {
  private service = inject(TimetableService);

  readonly weekOffset = signal(0);
  readonly selectedDate = signal(new Date());
  readonly days = DAYS;
  readonly today: Date = new Date();

  readonly slots = computed<SlotInfo[]>(() => {
    const entries = this.service.entries();
    const seen = new Map<number, string>();
    for (const entry of entries) {
      if (!seen.has(entry.period_sequence)) {
        seen.set(entry.period_sequence, entry.period_start);
      }
    }
    return Array.from(seen.entries())
      .map(([sequence, startTime]) => ({ sequence, startTime }))
      .sort((a, b) => a.sequence - b.sequence);
  });

  readonly grid = computed<GridData>(() => {
    const entries = this.service.entries();
    const grid: GridData = {};
    for (const day of DAYS) grid[day] = {};

    for (const entry of entries) {
      const dayName = entry.day_name || DAYS[entry.day_of_week] || '';
      if (!dayName) continue;
      grid[dayName]![entry.period_sequence] = {
        subject: entry.subject_name,
        classroom: entry.room_detail?.name ?? '',
        teacher: entry.teacher_name,
      };
    }
    return grid;
  });

  readonly weekStart = computed(() => {
    const d = new Date(this.today);
    d.setDate(d.getDate() + this.weekOffset() * 7);
    const day = d.getDay();
    d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
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

  readonly currentSequence = computed(() => {
    const now = new Date();
    const total = now.getHours() * 60 + now.getMinutes();
    const currentSlot = [...this.slots()].reverse().find(s => {
      const [h, m] = s.startTime.split(':').map(Number);
      return total >= h * 60 + (m || 0);
    });
    return currentSlot?.sequence ?? 0;
  });

  readonly classDates = computed<Set<string>>(() => {
    const entries = this.service.entries();
    if (!entries.length) return new Set();
    const ws = this.weekStart();
    const dates = new Set<string>();
    for (const day of DAYS) {
      const hasLesson = entries.some(e => (e.day_name || DAYS[e.day_of_week]) === day);
      if (hasLesson) {
        const idx = DAYS.indexOf(day);
        const d = new Date(ws);
        d.setDate(d.getDate() + idx);
        dates.add(dateKey(d));
      }
    }
    return dates;
  });

  constructor() {
    this.service.fetchTimetable();
  }

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
    this.selectedDate.set(new Date());
  }

  onDateSelected(date: Date): void {
    this.selectedDate.set(date);
    const diffDays = Math.floor((date.getTime() - this.today.getTime()) / 86400000);
    this.weekOffset.set(Math.round(diffDays / 7));
  }
}
