import { Component, input, output, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { TimetableStateService } from '../../services/timetable-state.service';
import { TimetableApiService } from '../../services/timetable-api.service';
import { PeriodCellComponent } from '../period-cell/period-cell.component';
import { TieredPeriod, DAY_LABELS, DAY_SHORT_LABELS } from '../../models/bell-schedule.model';
import { TimetableEntry } from '../../models/timetable-entry.model';

@Component({
  selector: 'app-timetable-grid',
  standalone: true,
  imports: [CommonModule, ScrollingModule, PeriodCellComponent],
  template: `
    <div class="flex flex-col h-full bg-slate-950 text-white rounded-xl overflow-hidden border border-slate-800">
      <!-- Header Row -->
      <div class="grid grid-cols-[160px_repeat(5,1fr)] border-b border-slate-800 bg-slate-900/50">
        <div class="p-3 text-xs font-semibold text-slate-500 uppercase tracking-widest border-r border-slate-800">
          Time
        </div>
        @for (day of dayColumns; track day.value) {
          <div class="p-3 text-center"
               [class.bg-emerald-950/30]="day.isToday"
               [class.text-emerald-400]="day.isToday"
               [class.text-slate-400]="!day.isToday">
            <div class="text-xs font-bold uppercase tracking-wide">{{ day.shortLabel }}</div>
            <div class="text-[10px] text-slate-600 mt-0.5">{{ day.fullLabel }}</div>
          </div>
        }
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="flex-1 flex items-center justify-center">
          <div class="flex flex-col items-center gap-3">
            <div class="h-8 w-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
            <span class="text-sm text-slate-500">Loading timetable...</span>
          </div>
        </div>
      }

      <!-- Error State -->
      @if (errorMessage(); as err) {
        <div class="flex-1 flex items-center justify-center p-8">
          <div class="text-center">
            <div class="text-4xl mb-3">⚠️</div>
            <p class="text-sm text-red-400">{{ err }}</p>
            <button (click)="loadTimetable()"
                    class="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-red-900/40 text-red-400 hover:bg-red-900/60 transition-colors">
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
            <p class="text-sm text-slate-500">No bell schedule configured for this view.</p>
            <p class="text-xs text-slate-700 mt-1">
              Ask an administrator to seed bell schedules and assign timetable entries.
            </p>
          </div>
        </div>
      }

      <!-- Table Rows -->
      @if (activePeriods().length > 0) {
        <cdk-virtual-scroll-viewport itemSize="80" class="flex-1">
          <div class="min-h-full">
            @for (period of activePeriods(); track period.id) {
              <div class="grid grid-cols-[160px_repeat(5,1fr)] border-b border-slate-800/50 transition-colors duration-150"
                   [class.bg-indigo-950/10]="period.period_type === 'INSTITUTIONAL'"
                   [class.bg-amber-950/10]="period.period_type === 'BREAK'"
                   [class.bg-slate-900/30]="period.period_type === 'TRANSITION'"
                   [class.hover:bg-slate-800/30]="period.is_assignable">

                <!-- Time Axis Cell -->
                <div class="p-3 border-r border-slate-800 flex flex-col justify-center min-h-[80px]">
                  <span class="text-xs text-slate-300 font-medium">{{ formatTime(period.start_time) }}</span>
                  <span class="text-[10px] text-slate-600 mt-0.5">{{ formatTime(period.end_time) }}</span>
                  <span class="text-[9px] text-slate-700 mt-1">{{ period.duration_minutes }}m</span>
                  @if (period.period_type !== 'ACADEMIC') {
                    <span class="mt-1 text-[9px] px-1.5 py-0.5 rounded-full text-center font-semibold"
                          [class.bg-amber-900/60]="period.period_type === 'BREAK'"
                          [class.text-amber-400]="period.period_type === 'BREAK'"
                          [class.bg-indigo-900/60]="period.period_type === 'INSTITUTIONAL'"
                          [class.text-indigo-400]="period.period_type === 'INSTITUTIONAL'"
                          [class.bg-slate-800/60]="period.period_type === 'TRANSITION'"
                          [class.text-slate-400]="period.period_type === 'TRANSITION'">
                      {{ period.name }}
                    </span>
                  }
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
    :host { display: block; height: 100%; }
    cdk-virtual-scroll-viewport { height: 100%; }
  `],
})
export class TimetableGridComponent implements OnInit {
  readonly yearGroupId = input<number>();
  readonly teacherId = input<number>();
  readonly termId = input<number>();
  readonly entryClicked = output<TimetableEntry>();

  private state = inject(TimetableStateService);
  private api = inject(TimetableApiService);

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

  ngOnInit(): void {
    this.loadTimetable();
  }

  protected formatTime(time: string): string {
    return time ? time.substring(0, 5) : '';
  }

  protected getEntry(periodId: number, dayIndex: number): TimetableEntry | null {
    const dayMap = this.state.gridMap().get(periodId);
    return dayMap?.get(dayIndex) ?? null;
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

    this.api.getWeekView({
      term: termId,
      ...(teacherId ? { teacher: teacherId } : {}),
      ...(yearGroupId ? { year_group: yearGroupId } : {}),
    }).subscribe({
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
      },
      error: (err) => {
        this.state.setLoading(false);
        this.state.setError(err.status === 0
          ? 'Cannot connect to server. Check your connection.'
          : `Failed to load timetable: ${err.statusText || 'Unknown error'}`);
      },
    });

    this.api.getBellSchedules().subscribe({
      next: (schedules) => {
        if (schedules.length > 0) {
          const schedule = schedules[0];
          this.api.getTieredPeriods(schedule.id).subscribe({
            next: (periods) => this.state.setBellSchedule(periods),
          });
        }
      },
    });
  }
}
