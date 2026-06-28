import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  TimetableApiService,
  BellSchedule,
  TieredPeriod,
  DAY_LABELS,
} from '@sms/domain/timetable';

const PERIOD_COLORS: Record<string, { bar: string; bg: string; text: string; label: string }> = {
  ACADEMIC:      { bar: 'bg-blue-500',      bg: 'bg-white',         text: 'text-slate-800',    label: 'Academic' },
  INSTITUTIONAL: { bar: 'bg-indigo-400',     bg: 'bg-indigo-50',     text: 'text-indigo-700',   label: 'Institutional' },
  BREAK:         { bar: 'bg-amber-400',      bg: 'bg-amber-50',      text: 'text-amber-700',    label: 'Break' },
  TRANSITION:    { bar: 'bg-slate-400',      bg: 'bg-slate-50',      text: 'text-slate-500',    label: 'Transition' },
  LUNCH:         { bar: 'bg-stone-400',      bg: 'bg-stone-50',      text: 'text-stone-600',    label: 'Lunch' },
  QURAN:         { bar: 'bg-emerald-500',    bg: 'bg-emerald-50',    text: 'text-emerald-700',  label: 'Quran' },
};

function periodStyle(type: string) {
  return PERIOD_COLORS[type] ?? { bar: 'bg-slate-300', bg: 'bg-slate-50', text: 'text-slate-600', label: type };
}

@Component({
  selector: 'app-bell-schedules',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  template: `
    <div class="p-6 max-w-[1200px] mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Bell Schedules</h1>
          <p class="text-sm text-slate-500 mt-1">View bell schedule configurations and their period breakdowns</p>
        </div>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          @for (i of [1,2,3]; track i) {
            <div class="h-52 rounded-2xl bg-slate-100 animate-pulse"></div>
          }
        </div>
      }

      <!-- Error -->
      @if (errorMsg()) {
        <div class="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-sm text-red-700">
          <mat-icon fontSet="material-icons-outlined" class="text-red-500 shrink-0">error_outline</mat-icon>
          {{ errorMsg() }}
        </div>
      }

      <!-- Legend -->
      <div class="flex flex-wrap items-center gap-3 mb-5 px-4 py-2.5 rounded-xl bg-white border border-slate-200">
        <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Legend</span>
        @for (entry of legendItems(); track entry.label) {
          <span class="inline-flex items-center gap-1.5 text-xs text-slate-600">
            <span class="w-2.5 h-2.5 rounded-sm" [class]="entry.bar"></span>
            {{ entry.label }}
          </span>
        }
      </div>

      <!-- Schedule cards -->
      @if (!loading() && schedules().length > 0) {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          @for (s of schedules(); track s.id) {
            <div class="rounded-2xl border border-slate-200 bg-white overflow-hidden
                        transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                 [class.ring-2]="selectedId() === s.id"
                 [class.ring-primary/40]="selectedId() === s.id"
                 [class.opacity-60]="!s.is_active">
              <!-- Card header -->
              <button type="button"
                   class="px-5 py-4 flex items-center justify-between cursor-pointer w-full text-left border-0 bg-transparent"
                   (click)="toggleDetail(s.id)">
                <div class="flex items-start gap-3">
                  <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <mat-icon class="text-xl">schedule</mat-icon>
                  </div>
                  <div>
                    <h3 class="font-semibold text-slate-900">{{ s.name }}</h3>
                    <div class="flex items-center gap-2 mt-1 flex-wrap">
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <mat-icon class="text-[11px]">layers</mat-icon>
                        {{ s.tier }}
                      </span>
                      <span class="inline-flex items-center gap-1 text-xs text-slate-400">
                        <mat-icon class="text-[13px]">calendar_today</mat-icon>
                        {{ daysLabel(s.applies_on_days) }}
                      </span>
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  @if (!s.is_active) {
                    <span class="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Inactive</span>
                  }
                  <mat-icon fontSet="material-icons-outlined" class="text-slate-400 transition-transform duration-200"
                            [class.rotate-180]="selectedId() === s.id">
                    expand_more
                  </mat-icon>
                </div>
              </button>

              <!-- Mini timeline preview (collapsed) -->
              @if (selectedId() !== s.id && s.periods && s.periods.length > 0) {
                <div class="px-5 pb-4">
                  <div class="flex items-center gap-0.5 h-2 rounded-full overflow-hidden">
                    @for (p of s.periods; track p.id) {
                      <div class="h-full flex-1 first:rounded-l-full last:rounded-r-full"
                           [class]="periodStyle(p.period_type).bar"
                           [matTooltip]="p.name"
                           [style.opacity]="p.period_type === 'ACADEMIC' ? '1' : '0.5'">
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Expanded detail -->
              @if (selectedId() === s.id) {
                <div class="border-t border-slate-100">
                  @if (detailLoading()) {
                    <div class="flex items-center justify-center py-10">
                      <div class="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                    </div>
                  } @else if (periods().length > 0) {
                    <!-- Timeline header -->
                    <div class="px-5 py-3 bg-slate-50/50 border-b border-slate-100">
                      <div class="flex items-center justify-between text-xs text-slate-400">
                        <span class="font-semibold text-slate-500 uppercase tracking-wider">
                          {{ periods().length }} Periods
                        </span>
                        <span>{{ periods()[0]?.start_time?.substring(0,5) }} – {{ periods()[periods().length-1]?.end_time?.substring(0,5) }}</span>
                      </div>
                    </div>

                    <!-- Period timeline list -->
                    <div class="px-5 py-3 space-y-1">
                      @for (p of periods(); track p.id) {
                        @let style = periodStyle(p.period_type);
                        <div class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors duration-150 hover:bg-slate-50"
                             [class]="style.bg">
                          <!-- Sequence badge -->
                          <div class="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                            <span class="text-xs font-bold text-slate-500">{{ p.sequence }}</span>
                          </div>

                          <!-- Color bar -->
                          <div class="w-1 h-8 rounded-full shrink-0" [class]="style.bar"></div>

                          <!-- Period info -->
                          <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2">
                              <span class="font-medium text-slate-800" [class]="style.text">{{ p.name }}</span>
                              @if (p.period_type !== 'ACADEMIC') {
                                <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                                      [class]="style.bg + ' ' + style.text">
                                  {{ style.label }}
                                </span>
                              }
                            </div>
                            <div class="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                              <span>{{ p.start_time?.substring(0,5) }} – {{ p.end_time?.substring(0,5) }}</span>
                              @if (p.duration_minutes) {
                                <span>· {{ p.duration_minutes }}m</span>
                              }
                            </div>
                          </div>

                          <!-- Assignable indicator -->
                          @if (!p.is_assignable) {
                            <mat-icon fontSet="material-icons-outlined"
                                      class="text-xs text-slate-300" matTooltip="Not assignable">lock</mat-icon>
                          }
                        </div>
                      }
                    </div>
                  } @else {
                    <p class="text-sm text-slate-400 text-center py-10">No periods configured for this schedule.</p>
                  }
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Empty state -->
      @if (!loading() && !errorMsg() && schedules().length === 0) {
        <div class="flex flex-col items-center justify-center py-20 text-center">
          <div class="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <mat-icon fontSet="material-icons-outlined" class="text-3xl text-slate-400">schedule</mat-icon>
          </div>
          <h3 class="text-base font-semibold text-slate-700">No bell schedules</h3>
          <p class="text-sm text-slate-400 mt-1">Bell schedules define the daily period structure. They are seeded by administrators.</p>
        </div>
      }
    </div>
  `,
})
export class BellSchedulesPage implements OnInit {
  private api = inject(TimetableApiService);

  protected schedules = signal<BellSchedule[]>([]);
  protected periods = signal<TieredPeriod[]>([]);
  protected loading = signal(false);
  protected detailLoading = signal(false);
  protected errorMsg = signal<string | null>(null);
  protected selectedId = signal<number | null>(null);

  protected readonly legendItems = computed(() =>
    Object.entries(PERIOD_COLORS).map(([key, val]) => ({ key, ...val }))
  );

  protected readonly periodStyle = periodStyle;

  ngOnInit(): void {
    this.loadSchedules();
  }

  private loadSchedules(): void {
    this.loading.set(true);
    this.errorMsg.set(null);
    this.api.getBellSchedules().subscribe({
      next: (list) => { this.schedules.set(list); this.loading.set(false); },
      error: (err) => { this.errorMsg.set(`Failed to load schedules (${err.status})`); this.loading.set(false); },
    });
  }

  protected toggleDetail(id: number): void {
    if (this.selectedId() === id) {
      this.selectedId.set(null);
      this.periods.set([]);
      return;
    }
    this.selectedId.set(id);
    this.loadDetail(id);
  }

  private loadDetail(id: number): void {
    this.detailLoading.set(true);
    this.periods.set([]);
    this.api.getBellScheduleDetail(id).subscribe({
      next: (schedule) => {
        this.periods.set(schedule.periods ?? []);
        this.detailLoading.set(false);
      },
      error: () => {
        this.api.getTieredPeriods(id).subscribe({
          next: (periods) => { this.periods.set(periods); this.detailLoading.set(false); },
          error: () => { this.detailLoading.set(false); },
        });
      },
    });
  }

  protected daysLabel(days: number[]): string {
    return days.map((d) => DAY_LABELS[d as 0|1|2|3|4]?.substring(0, 3)).join(', ');
  }
}
