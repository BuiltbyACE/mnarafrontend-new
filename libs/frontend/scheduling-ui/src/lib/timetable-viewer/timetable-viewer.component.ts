import { Component, inject, input, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SchedulingApiService, TimetableEntry, BellSchedulePeriod, TimetableVersion, DateVersionResponse } from '@sms/domain/scheduling';
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
          <button class="nav-btn" (click)="previousWeek()" title="Previous week">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7l4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <label class="date-label">
            <input
              type="date"
              class="date-picker"
              [value]="viewDateInput()"
              (change)="onDatePicked($event)"
              title="Jump to date"
            />
          </label>
          <span class="nav-label">{{ weekLabel() }}</span>
          <button class="nav-btn" (click)="nextWeek()" title="Next week">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <button class="today-btn" (click)="goToToday()">Today</button>
        </div>
        <div class="viewer-status">
          @if (loading()) {
            <span class="status-dot loading"></span>
            <span class="status-text">Loading&hellip;</span>
          } @else if (error()) {
            <span class="status-dot error"></span>
            <span class="status-text error">{{ error() }}</span>
          } @else {
            <span class="status-dot loaded"></span>
            <span class="status-text">
              @if (resolvedVersion(); as v) {
                {{ v.name }} &middot; {{ entries().length }} lessons
              } @else {
                {{ entries().length }} lessons
              }
            </span>
          }
        </div>
      </div>

      @if (bannerMessage(); as msg) {
        <div class="hist-banner" [class.is-current]="isCurrentTimetable()">
          <svg class="banner-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" stroke-width="1.2"/>
            <path d="M2 6.5h12M5.5 1v2.5M10.5 1v2.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
          <span class="banner-text">{{ msg }}</span>
          @if (!isCurrentTimetable()) {
            <button class="banner-action" (click)="goToToday()">View current</button>
          }
        </div>
      }

      <div class="viewer-grid">
        @if (noTimetable()) {
          <div class="empty-state">
            <svg class="empty-icon" width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect x="6" y="8" width="36" height="34" rx="4" stroke="#cbd5e1" stroke-width="2"/>
              <path d="M6 18h36M18 8v34M30 8v34" stroke="#cbd5e1" stroke-width="2"/>
              <path d="M14 26h8M14 32h8M26 26h8M26 32h8" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <h3 class="empty-title">No timetable for this period</h3>
            <p class="empty-desc">{{ emptyMessage() }}</p>
            <button class="today-btn empty-btn" (click)="goToToday()">Go to today</button>
          </div>
        } @else {
          <sched-timetable-grid
            [mode]="'published'"
            [entries]="entries()"
            [periods]="periods()"
            [viewDate]="viewDate()"
            [showNonTeachingBlocks]="true">
          </sched-timetable-grid>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: contents; }
    .viewer { display: flex; flex-direction: column; height: 100%; background: var(--tt-surface, #ffffff); border-radius: var(--tt-radius-card, 16px); overflow: hidden; }
    .viewer-bar { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; border-bottom: 1px solid var(--tt-border, #e9eef4); flex: 0 0 auto; }
    .viewer-nav { display: flex; align-items: center; gap: 6px; }
    .nav-btn { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border: 1px solid var(--tt-border, #e9eef4); border-radius: 8px; background: transparent; color: var(--tt-text, #0b1a2e); cursor: pointer; transition: all 0.15s ease; }
    .nav-btn:hover { border-color: var(--tt-primary-light, #2d4373); background: var(--tt-surface-alt, #f8faff); }
    .date-label { display: flex; align-items: center; }
    .date-picker { font-family: inherit; font-size: 0.75rem; padding: 3px 6px; border: 1px solid var(--tt-border, #e9eef4); border-radius: 6px; background: transparent; color: var(--tt-text, #0b1a2e); width: 130px; cursor: pointer; transition: border-color 0.15s ease; }
    .date-picker:hover, .date-picker:focus { border-color: var(--tt-primary-light, #2d4373); outline: none; }
    .date-picker::-webkit-calendar-picker-indicator { cursor: pointer; opacity: 0.6; }
    .date-picker::-webkit-calendar-picker-indicator:hover { opacity: 1; }
    .nav-label { font-size: 0.8125rem; font-weight: 600; color: var(--tt-text, #0b1a2e); min-width: 140px; text-align: center; user-select: none; }
    .today-btn { font-size: 0.6875rem; font-weight: 600; color: var(--tt-primary, #1a2a6c); background: var(--tt-primary-bg, #e8edfb); border: none; border-radius: 6px; padding: 4px 10px; cursor: pointer; transition: all 0.15s ease; white-space: nowrap; }
    .today-btn:hover { background: var(--tt-primary, #1a2a6c); color: white; }
    .viewer-status { display: flex; align-items: center; gap: 6px; }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
    .status-dot.loading { background: #f59e0b; animation: pulse 1s ease-in-out infinite; }
    .status-dot.loaded { background: #22c55e; }
    .status-dot.error { background: #ef4444; }
    .status-text { font-size: 0.6875rem; color: var(--tt-text-muted, #5e6f8d); white-space: nowrap; }
    .status-text.error { color: #ef4444; }

    .hist-banner { display: flex; align-items: center; gap: 8px; padding: 8px 16px; font-size: 0.75rem; flex: 0 0 auto; background: #fef3c7; border-bottom: 1px solid #fde68a; color: #92400e; }
    .hist-banner.is-current { background: #dcfce7; border-bottom-color: #bbf7d0; color: #166534; }
    .banner-icon { flex-shrink: 0; }
    .banner-text { flex: 1; }
    .banner-action { font-size: 0.6875rem; font-weight: 600; padding: 3px 10px; border-radius: 6px; border: none; cursor: pointer; background: var(--tt-primary, #1a2a6c); color: white; transition: opacity 0.15s ease; white-space: nowrap; }
    .banner-action:hover { opacity: 0.85; }

    .viewer-grid { flex: 1; overflow: auto; padding: 8px; }

    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 12px; padding: 48px 24px; text-align: center; }
    .empty-icon { flex-shrink: 0; }
    .empty-title { font-size: 1rem; font-weight: 600; color: var(--tt-text, #0b1a2e); margin: 0; }
    .empty-desc { font-size: 0.8125rem; color: var(--tt-text-muted, #5e6f8d); max-width: 320px; margin: 0; line-height: 1.5; }
    .empty-btn { margin-top: 4px; }

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

  readonly resolvedVersion = signal<TimetableVersion | null>(null);
  readonly resolvedTerm = signal<DateVersionResponse['term']>(null);
  readonly isCurrentTimetable = signal(true);

  readonly viewDateInput = computed(() => {
    const d = this.viewDate();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });

  readonly weekLabel = computed(() => {
    const d = this.viewDate();
    const end = new Date(d);
    end.setDate(end.getDate() + 4);
    const fmt = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fmt(d)} – ${fmt(end)}`;
  });

  readonly bannerMessage = computed(() => {
    const version = this.resolvedVersion();
    const term = this.resolvedTerm();
    if (!version || !term) return null;
    if (this.isCurrentTimetable()) {
      return `Showing current timetable for ${term.name} \u00B7 ${term.academic_year}`;
    }
    return `Viewing archived timetable from ${term.name} \u00B7 ${term.academic_year} (${this.formatDateRange(term.start_date, term.end_date)})`;
  });

  readonly noTimetable = computed(() => {
    return !this.loading() && !this.entries().length && !!this.emptyMessage();
  });

  readonly emptyMessage = computed(() => {
    const term = this.resolvedTerm();
    const version = this.resolvedVersion();
    if (!term && !version) {
      return 'The selected date falls outside any defined academic term.';
    }
    if (term && !version) {
      return `No published timetable exists for ${term.name} (${term.academic_year}). A timetable may not have been created for this period.`;
    }
    if (version && !this.entries().length) {
      return `The timetable "${version.name}" has no scheduled lessons for this week.`;
    }
    return null;
  });

  ngOnInit(): void {
    this.resolveAndLoad();
  }

  previousWeek(): void {
    const d = new Date(this.viewDate());
    d.setDate(d.getDate() - 7);
    this.viewDate.set(d);
    this.resolveAndLoad();
  }

  nextWeek(): void {
    const d = new Date(this.viewDate());
    d.setDate(d.getDate() + 7);
    this.viewDate.set(d);
    this.resolveAndLoad();
  }

  goToToday(): void {
    this.viewDate.set(this.getMonday(new Date()));
    this.resolveAndLoad();
  }

  onDatePicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.value) return;
    const picked = new Date(input.value + 'T00:00:00');
    this.viewDate.set(this.getMonday(picked));
    this.resolveAndLoad();
  }

  private resolveAndLoad(): void {
    this.loading.set(true);
    this.error.set(null);
    this.resolvedVersion.set(null);
    this.resolvedTerm.set(null);
    this.entries.set([]);

    const dateStr = this.viewDateInput();
    this.api.getVersionForDate(dateStr).subscribe({
      next: (response) => {
        this.resolvedVersion.set(response.version);
        this.resolvedTerm.set(response.term);
        this.isCurrentTimetable.set(response.is_current);

        if (response.version) {
          this.loadEntriesForVersion(response.version.id);
        } else {
          this.loading.set(false);
        }
      },
      error: () => {
        this.error.set('Failed to resolve timetable for this date.');
        this.loading.set(false);
      },
    });

    this.api.getBellSchedules().subscribe({
      next: (schedules) => {
        if (schedules.length > 0 && schedules[0].periods) {
          this.periods.set(schedules[0].periods);
        }
      },
      error: () => {},
    });
  }

  private loadEntriesForVersion(versionId: number): void {
    const params: Record<string, number | undefined> = { version: versionId };
    if (this.teacherId()) params['teacher_id'] = this.teacherId();
    if (this.yearLevelId()) params['year_level_id'] = this.yearLevelId();

    this.api.getTimetableEntries(params as any).subscribe({
      next: (entries) => {
        this.entries.set(entries);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.status === 404 ? 'Timetable not found' : 'Failed to load timetable');
        this.loading.set(false);
      },
    });
  }

  private formatDateRange(start: string, end: string): string {
    const fmt = (s: string) => {
      const d = new Date(s + 'T00:00:00');
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };
    return `${fmt(start)} – ${fmt(end)}`;
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
