import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TieredPeriod } from '../../models/bell-schedule.model';
import { TimetableEntry } from '../../models/timetable-entry.model';

@Component({
  selector: 'app-period-cell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative p-2 min-h-[80px] border-r border-slate-800/50 flex flex-col justify-center cursor-pointer transition-all duration-150 hover:bg-slate-800/20"
         [class.bg-slate-950]="!isSelected() && !isToday()"
         [class.bg-slate-900/50]="isSelected() && !isToday()"
         [class.bg-emerald-950/30]="isToday()"
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
                <span class="text-[8px] bg-orange-900/60 text-orange-400 px-1 py-0.5 rounded font-semibold flex-shrink-0">
                  PRAC
                </span>
              }
            </div>
            <div class="text-[10px] text-slate-400 truncate leading-tight mt-0.5">
              {{ e.subject_name }}
            </div>
            <div class="text-[9px] text-slate-600 mt-1 flex items-center gap-1">
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
          <span class="text-[10px] text-indigo-400/60 uppercase tracking-widest">
            {{ period()?.name }}
          </span>
        </div>
      } @else if (period()?.period_type === 'BREAK') {
        <div class="text-center">
          <span class="text-[10px] text-amber-600/50 uppercase tracking-widest">break</span>
        </div>
      } @else if (period()?.period_type === 'TRANSITION') {
        <div class="text-center">
          <span class="text-[10px] text-slate-600/50 uppercase tracking-widest">{{ period()?.name }}</span>
        </div>
      } @else {
        <div class="text-center">
          <span class="text-[10px] text-slate-800">—</span>
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
