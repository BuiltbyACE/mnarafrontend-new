import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TieredPeriod, TimetableEntry } from '@sms/domain/timetable';

const PERIOD_CELL_BG: Record<string, string> = {
  ACADEMIC:      'bg-white',
  INSTITUTIONAL: 'bg-indigo-50/60',
  BREAK:         'bg-amber-50/80',
  TRANSITION:    'bg-slate-50/80',
  LUNCH:         'bg-stone-50/80',
  QURAN:         'bg-emerald-50/60',
};

@Component({
  selector: 'app-period-cell',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="relative p-2.5 min-h-[88px] rounded-xl border border-transparent flex flex-col justify-center cursor-pointer transition-all duration-150
                hover:border-blue-200 hover:shadow-sm group m-1"
         [class]="periodBg()"
         [class.bg-blue-50/40]="isSelected()"
         [class.ring-2]="isToday()"
         [class.ring-emerald-300]="isToday()"
         [class.ring-offset-1]="isToday()"
         (click)="handleClick()">

      @if (entry(); as e) {
        <!-- Subject name - visually dominant -->
        <div class="font-bold text-[13px] leading-tight truncate"
             [ngStyle]="{'color': subjectColor(e)}">
          {{ e.subject_name }}
        </div>
        <!-- Subject code -->
        <div class="text-[10px] text-[var(--tt-text-faint)] truncate mt-0.5">
          {{ e.subject_code }}
        </div>
        <!-- Teacher name - secondary -->
        <div class="text-[10px] text-[var(--tt-text-muted)] truncate mt-1 flex items-center gap-1">
          <mat-icon class="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">person</mat-icon>
          {{ e.teacher_name }}
        </div>
        <!-- Room badge + practical tag -->
        <div class="flex items-center gap-1 mt-1 flex-wrap">
          @if (e.room_detail?.name) {
            <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-100 text-[8px] font-semibold text-slate-500">
              <mat-icon class="text-[8px]">meeting_room</mat-icon>
              {{ e.room_detail!.name }}
            </span>
          }
          @if (e.is_practical) {
            <span class="text-[8px] bg-orange-100 text-orange-700 px-1 py-0.5 rounded font-semibold">
              PRAC
            </span>
          }
        </div>
        <!-- Subject category color dot (bottom-right) -->
        <div class="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full opacity-60"
             [ngStyle]="{'background-color': subjectColor(e)}"></div>
      } @else if (period()?.period_type === 'INSTITUTIONAL') {
        <div class="text-center">
          <mat-icon class="text-base text-indigo-300 mb-0.5">auto_stories</mat-icon>
          <div class="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">
            {{ period()?.name }}
          </div>
        </div>
      } @else if (period()?.period_type === 'BREAK') {
        <div class="text-center">
          <mat-icon class="text-base text-amber-300 mb-0.5">free_breakfast</mat-icon>
          <div class="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">break</div>
          @if (period()?.duration_minutes) {
            <div class="text-[9px] text-amber-300">{{ period()?.duration_minutes }}m</div>
          }
        </div>
      } @else if (period()?.period_type === 'TRANSITION') {
        <div class="text-center">
          <mat-icon class="text-base text-slate-300 mb-0.5">swap_horiz</mat-icon>
          <div class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{{ period()?.name }}</div>
        </div>
      } @else {
        <div class="text-center">
          <mat-icon class="text-base text-slate-200">add</mat-icon>
        </div>
      }
    </div>
  `,
})
export class PeriodCellComponent {
  readonly entry = input<TimetableEntry | null>(null);
  readonly period = input<TieredPeriod | null>(null);
  readonly isToday = input(false);
  readonly isSelected = input(false);
  readonly cellClicked = output<TimetableEntry | null>();

  protected readonly periodBg = computed(() => {
    const type = this.period()?.period_type;
    return PERIOD_CELL_BG[type ?? ''] ?? 'bg-white';
  });

  protected handleClick(): void {
    this.cellClicked.emit(this.entry());
  }

  protected subjectColor(entry: TimetableEntry): string {
    const colors: Record<string, string> = {
      Core: '#34d399',
      Islamic: '#818cf8',
      Science: '#38bdf8',
      Humanities: '#fb923c',
      Technical: '#f472b6',
      Creative: '#facc15',
      Sport: '#4ade80',
      Language: '#a78bfa',
      Literacy: '#6ee7b7',
    };
    return colors[entry.subject_category] ?? '#94a3b8';
  }
}
