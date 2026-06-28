import { Component, input, output, computed, effect, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { TimetableStateService, TimetableApiService, TimetableEntry, TieredPeriod, BellSchedule, DAY_LABELS, DAY_SHORT_LABELS } from '@sms/domain/timetable';
import { PeriodCellComponent } from '../period-cell/period-cell.component';

@Component({
  selector: 'app-timetable-grid',
  standalone: true,
  imports: [CommonModule, ScrollingModule, PeriodCellComponent],
  template: `
    <div class="flex flex-col h-full bg-white rounded-xl overflow-hidden border border-[var(--tt-border)] shadow-sm">
      <!-- Header Row -->
      <div class="grid grid-cols-[120px_repeat(5,1fr)] border-b border-[var(--tt-border)] bg-gradient-to-r from-[var(--tt-surface-alt)] to-white">
        <div class="p-3 text-center text-xs font-semibold text-[var(--tt-text-subtle)] uppercase tracking-widest">
          Time
        </div>
        @for (day of dayColumns; track day.value) {
          <div class="p-3 text-center border-l border-[var(--tt-border)]"
               [class.bg-emerald-50]="day.isToday"
               [class.text-emerald-700]="day.isToday"
               [class.text-[var(--tt-text-muted)]]="!day.isToday">
            <div class="text-xs font-bold uppercase tracking-wide">{{ day.shortLabel }}</div>
            <div class="text-[10px] text-[var(--tt-text-subtle)] mt-0.5">{{ day.fullLabel }}</div>
          </div>
        }
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="flex-1 flex items-center justify-center">
          <div class="flex flex-col items-center gap-3">
            <div class="h-8 w-8 rounded-full border-2 border-[var(--tt-primary)] border-t-transparent animate-spin"></div>
            <span class="text-sm text-[var(--tt-text-muted)]">Loading timetable...</span>
          </div>
        </div>
      }

      <!-- Error State -->
      @if (errorMessage(); as err) {
        <div class="flex-1 flex items-center justify-center p-8">
          <div class="text-center">
            <div class="text-4xl mb-3">⚠️</div>
            <p class="text-sm text-[var(--tt-danger-text)]">{{ err }}</p>
            <button (click)="loadTimetable()"
                    class="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--tt-danger-bg)] text-[var(--tt-danger-text)] hover:bg-red-200 transition-colors">
              Retry
            </button>
          </div>
        </div>
      }

      <!-- Empty State -->
      @if (!isLoading() && !errorMessage() && activePeriods().length === 0) {
        <div class="flex-1 flex items-center justify-center p-8">
          <div class="text-center">
            <div class="text-4xl mb-3">📅</div>
            <p class="text-sm text-[var(--tt-text-muted)]">No bell schedule configured for this view.</p>
            <p class="text-xs text-[var(--tt-text-faint)] mt-1">
              Ask an administrator to seed bell schedules and assign timetable entries.
            </p>
          </div>
        </div>
      }

      <!-- Table Rows -->
      @if (activePeriods().length > 0) {
        <cdk-virtual-scroll-viewport itemSize="96" class="flex-1">
          <div class="min-h-full">
            @for (period of activePeriods(); track period.id) {
              <div class="grid grid-cols-[120px_repeat(5,1fr)] border-b border-[var(--tt-border)] py-0.5
                          transition-colors duration-150">

                <!-- Time Axis Cell -->
                <div class="p-2 flex flex-col justify-center items-center text-center min-h-[96px]">
                  <span class="text-xs font-bold text-[var(--tt-text)]">{{ formatTime(period.start_time) }}</span>
                  <span class="text-[10px] text-[var(--tt-text-faint)]">{{ formatTime(period.end_time) }}</span>
                  <span class="text-[8px] text-[var(--tt-text-subtle)] mt-0.5 font-semibold">{{ period.duration_minutes }}m</span>
                </div>

                <!-- Entry Cells -->
                @for (dayIndex of [0,1,2,3,4]; track dayIndex) {
                  <app-period-cell
                    [entry]="getEntry(period.id, dayIndex)"
                    [period]="period"
                    [isToday]="dayIndex === todayIndex"
                    [isSelected]="dayIndex === selectedDay()"
                    (cellClicked)="onCellClick($event)">
                  </app-period-cell>
                }
              </div>
            }
          </div>
        </cdk-virtual-scroll-viewport>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block; height: 100%;
      --tt-border: #e9eef4;
      --tt-surface-alt: #f8faff;
      --tt-text-subtle: #8a9bb5;
      --tt-text-muted: #5e6f8d;
      --tt-text-faint: #64748b;
      --tt-primary: #1a2a6c;
      --tt-primary-bg: #e8edfb;
      --tt-text: #0b1a2e;
      --tt-danger-text: #dc2626;
      --tt-danger-bg: #fee2e2;
      --tt-border-strong: #cbd5e1;
    }
    cdk-virtual-scroll-viewport { height: 100%; }
  `],
})
export class TimetableGridComponent implements OnInit {
  readonly yearGroupId = input<number | null>();
  readonly teacherId = input<number | null>();
  readonly termId = input<number | null>();
  readonly entryClicked = output<TimetableEntry>();

  private state = inject(TimetableStateService);
  private api = inject(TimetableApiService);
  private destroyRef = inject(DestroyRef);

  protected activePeriods = this.state.activePeriods;
  protected selectedDay = this.state.selectedDay;
  protected isLoading = this.state.isLoading;
  protected errorMessage = this.state.error;

  protected todayIndex = new Date().getDay() - 1;

  protected dayColumns = [0, 1, 2, 3, 4].map((d) => ({
    value: d,
    shortLabel: DAY_SHORT_LABELS[d as 0|1|2|3|4],
    fullLabel: DAY_LABELS[d as 0|1|2|3|4],
    isToday: d === this.todayIndex,
  }));

  constructor() {
    effect(() => {
      this.termId();
      this.yearGroupId();
      this.teacherId();
      this.loadTimetable();
    });
  }

  ngOnInit(): void {
    // Initial load is handled by the effect
  }

  protected formatTime(time: string): string {
    return time ? time.substring(0, 5) : '';
  }

  protected getEntry(periodId: number, dayIndex: number): TimetableEntry | null {
    const dayMap = this.state.gridMap().get(periodId);
    const entries = dayMap?.get(dayIndex);
    return entries && entries.length > 0 ? entries[0] : null;
  }

  protected onCellClick(entry: TimetableEntry | null): void {
    if (entry) {
      this.entryClicked.emit(entry);
    }
  }

  protected loadTimetable(): void {
    this.state.setLoading(true);
    this.state.setError(null);

    const yearGroupId = this.yearGroupId();
    const teacherId = this.teacherId();
    const termId = this.termId();

    const params: { term?: number; teacher?: number; year_group?: number } = {};
    if (termId != null) params.term = termId;
    if (teacherId != null) params.teacher = teacherId;
    if (yearGroupId != null) params.year_group = yearGroupId;
    this.api.getWeekView(params).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (response) => {
        const allEntries = [
          ...response.monday,
          ...response.tuesday,
          ...response.wednesday,
          ...response.thursday,
          ...response.friday,
        ];
        this.state.setEntries(allEntries);
        this.state.setLoading(false);

        if (allEntries.length > 0) {
          this._resolveBellSchedule(allEntries);
        }
      },
      error: (err) => {
        this.state.setLoading(false);
        this.state.setError(err.status === 0
          ? 'Cannot connect to server. Check your connection.'
          : `Failed to load timetable: ${err.statusText || 'Unknown error'}`);
      },
    });
  }

  private _resolveBellSchedule(entries: TimetableEntry[]): void {
    const usedPeriodIds = new Set(entries.map((e) => Number(e.tiered_period)));

    this.api.getTieredPeriods().pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (allPeriods) => {
        if (!allPeriods || allPeriods.length === 0) { this._fallbackBellSchedule(usedPeriodIds); return; }

        const matchedSchedules = new Set<number>();
        for (const p of allPeriods) {
          if (usedPeriodIds.has(p.id)) { matchedSchedules.add(p.schedule); }
        }

        if (matchedSchedules.size > 0) {
          const merged = allPeriods.filter((p) => matchedSchedules.has(p.schedule));
          merged.sort((a, b) => {
            if (a.start_time !== b.start_time) return a.start_time < b.start_time ? -1 : 1;
            return a.sequence - b.sequence;
          });
          this.state.setBellSchedule(merged);
        } else {
          this._fallbackBellSchedule(usedPeriodIds);
        }
      },
      error: () => { this._fallbackBellSchedule(usedPeriodIds); },
    });
  }

  private _fallbackBellSchedule(usedPeriodIds?: Set<number>): void {
    this.api.getBellSchedules().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (schedules) => {
        if (schedules.length > 0) {
          this._trySchedule(schedules, 0, usedPeriodIds);
        }
      },
      error: () => {},
    });
  }

  private _trySchedule(schedules: BellSchedule[], index: number, usedPeriodIds?: Set<number>): void {
    if (index >= schedules.length) { return; }
    this.api.getTieredPeriods(schedules[index].id).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (periods) => {
        if (periods.length > 0) {
          const matched = usedPeriodIds && usedPeriodIds.size > 0
            ? periods.filter((p) => usedPeriodIds!.has(p.id))
            : periods;
          this.state.setBellSchedule(matched.length > 0 ? matched : periods);
        } else {
          this._trySchedule(schedules, index + 1, usedPeriodIds);
        }
      },
      error: () => { this._trySchedule(schedules, index + 1, usedPeriodIds); },
    });
  }
}
