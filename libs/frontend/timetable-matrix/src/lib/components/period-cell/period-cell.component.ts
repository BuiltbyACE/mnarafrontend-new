import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TieredPeriod, TimetableEntry } from '@sms/domain/timetable';

@Component({
  selector: 'app-period-cell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative p-2 min-h-[80px] border-r border-[var(--tt-border)] flex flex-col justify-center cursor-pointer transition-all duration-150 hover:bg-[var(--tt-surface-alt)]"
         [class.bg-white]="!isSelected() && !isToday()"
         [class.bg-[var(--tt-primary-bg)]]="isSelected() && !isToday()"
         [class.bg-emerald-50]="isToday()"
         [class.border-l-2]="isToday()"
         [class.border-emerald-500]="isToday()"
         (click)="handleClick()">

      @if (entry(); as e) {
        <!-- Subject Badge -->
        <div class="flex items-start gap-1.5">
          <span class="w-1 self-stretch rounded-full flex-shrink-0"
                [ngStyle]="{'background-color': subjectColor(e)}"></span>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-1">
              <span class="text-[11px] font-bold tracking-wide truncate"
                    [ngStyle]="{'color': subjectColor(e)}">
                {{ e.subject_code }}
              </span>
              @if (e.is_practical) {
                <span class="text-[8px] bg-orange-100 text-orange-700 px-1 py-0.5 rounded font-semibold flex-shrink-0">
                  PRAC
                </span>
              }
            </div>
            <div class="text-[10px] text-[var(--tt-text-faint)] truncate leading-tight mt-0.5">
              {{ e.subject_name }}
            </div>
            <div class="text-[9px] text-[var(--tt-text-muted)] mt-1 flex items-center gap-1">
              <span>{{ e.teacher_name }}</span>
              @if (e.room_detail?.name) {
                <span>·</span>
                <span>{{ e.room_detail!.name }}</span>
              }
            </div>
          </div>
        </div>
      } @else if (period()?.period_type === 'INSTITUTIONAL') {
        <div class="text-center">
          <span class="text-[10px] text-indigo-400 uppercase tracking-widest">
            {{ period()?.name }}
          </span>
        </div>
      } @else if (period()?.period_type === 'BREAK') {
        <div class="text-center">
          <span class="text-[10px] text-amber-400 uppercase tracking-widest">break</span>
        </div>
      } @else if (period()?.period_type === 'TRANSITION') {
        <div class="text-center">
          <span class="text-[10px] text-[var(--tt-text-subtle)] uppercase tracking-widest">{{ period()?.name }}</span>
        </div>
      } @else {
        <div class="text-center">
          <span class="text-[10px] text-[var(--tt-border-strong)]">—</span>
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
