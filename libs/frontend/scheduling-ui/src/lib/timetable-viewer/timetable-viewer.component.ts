import { Component, inject, input, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SchedulingApiService, TimetableEntry, BellSchedulePeriod } from '@sms/domain/scheduling';
import { TimetableGridComponent } from '../timetable-grid/timetable-grid.component';

type ViewerMode = 'teacher' | 'student' | 'class';

@Component({
  selector: 'sched-timetable-viewer',
  standalone: true,
  imports: [CommonModule, TimetableGridComponent],
  template: `
    <div class="viewer">
      <div class="viewer-bar">
        <div class="viewer-nav">
          <button class="nav-btn" (click)="previousWeek()">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7l4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <span class="nav-label">{{ weekLabel() }}</span>
          <button class="nav-btn" (click)="nextWeek()">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <button class="today-btn" (click)="goToToday()">Today</button>
        </div>
        <div class="viewer-status">
          @if (loading()) {
            <span class="status-dot loading"></span>
          } @else if (error()) {
            <span class="status-dot error"></span>
            <span class="status-text error">{{ error() }}</span>
          } @else {
            <span class="status-dot loaded"></span>
            <span class="status-text">{{ entries().length }} lessons</span>
          }
        </div>
      </div>

      <div class="viewer-grid">
        <sched-timetable-grid
          [mode]="'published'"
          [entries]="entries()"
          [periods]="periods()"
          [viewDate]="viewDate()"
          [showNonTeachingBlocks]="true">
        </sched-timetable-grid>
      </div>
    </div>
  `,
  styles: [`
    .viewer { display: flex; flex-direction: column; height: 100%; background: var(--tt-surface, #ffffff); border-radius: var(--tt-radius-card, 16px); overflow: hidden; }
    .viewer-bar { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--tt-border, #e9eef4); }
    .viewer-nav { display: flex; align-items: center; gap: 8px; }
    .nav-btn { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border: 1px solid var(--tt-border, #e9eef4); border-radius: 8px; background: transparent; color: var(--tt-text, #0b1a2e); cursor: pointer; transition: all 0.15s ease; }
    .nav-btn:hover { border-color: var(--tt-primary-light, #2d4373); background: var(--tt-surface-alt, #f8faff); }
    .nav-label { font-size: 0.8125rem; font-weight: 600; color: var(--tt-text, #0b1a2e); min-width: 140px; text-align: center; }
    .today-btn { font-size: 0.6875rem; font-weight: 600; color: var(--tt-primary, #1a2a6c); background: var(--tt-primary-bg, #e8edfb); border: none; border-radius: 6px; padding: 4px 10px; cursor: pointer; transition: all 0.15s ease; }
    .today-btn:hover { background: var(--tt-primary, #1a2a6c); color: white; }
    .viewer-status { display: flex; align-items: center; gap: 6px; }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; }
    .status-dot.loading { background: #f59e0b; animation: pulse 1s ease-in-out infinite; }
    .status-dot.loaded { background: #22c55e; }
    .status-dot.error { background: #ef4444; }
    .status-text { font-size: 0.6875rem; color: var(--tt-text-muted, #5e6f8d); }
    .status-text.error { color: #ef4444; }
    .viewer-grid { flex: 1; overflow: auto; padding: 8px; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimetableViewerComponent implements OnInit {
  private api = inject(SchedulingApiService);

  readonly mode = input<ViewerMode>('teacher');
  readonly teacherId = input<number | undefined>();
  readonly yearLevelId = input<number | undefined>();
  readonly versionId = input<number | undefined>();

  readonly viewDate = signal(this.getMonday(new Date()));
  readonly entries = signal<TimetableEntry[]>([]);
  readonly periods = signal<BellSchedulePeriod[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly weekLabel = computed(() => {
    const d = this.viewDate();
    const end = new Date(d);
    end.setDate(end.getDate() + 4);
    const fmt = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fmt(d)} – ${fmt(end)}`;
  });

  ngOnInit(): void {
    this.fetchData();
  }

  previousWeek(): void {
    const d = new Date(this.viewDate());
    d.setDate(d.getDate() - 7);
    this.viewDate.set(d);
    this.fetchData();
  }

  nextWeek(): void {
    const d = new Date(this.viewDate());
    d.setDate(d.getDate() + 7);
    this.viewDate.set(d);
    this.fetchData();
  }

  goToToday(): void {
    this.viewDate.set(this.getMonday(new Date()));
    this.fetchData();
  }

  private fetchData(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.getBellSchedules().subscribe({
      next: (schedules) => {
        if (schedules.length > 0 && schedules[0].periods) {
          this.periods.set(schedules[0].periods);
        }
      },
      error: () => {},
    });

    const params: Record<string, number | undefined> = {};
    if (this.teacherId()) params['teacher_id'] = this.teacherId();
    if (this.yearLevelId()) params['year_level_id'] = this.yearLevelId();
    if (this.versionId()) params['version'] = this.versionId();

    this.api.getTimetableEntries(params as any).subscribe({
      next: (entries) => {
        this.entries.set(entries);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.status === 404 ? 'Timetable not yet published' : 'Failed to load timetable');
        this.loading.set(false);
      },
    });
  }

  private getMonday(d: Date): Date {
    const date = new Date(d);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diff);
    date.setHours(0, 0, 0, 0);
    return date;
  }
}
