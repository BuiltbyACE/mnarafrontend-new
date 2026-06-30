import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimetableGridComponent } from '../timetable-grid/timetable-grid.component';
import { TimetableEntry, BellSchedulePeriod } from '@sms/domain/scheduling';

@Component({
  selector: 'sched-readonly-grid',
  standalone: true,
  imports: [CommonModule, TimetableGridComponent],
  template: `
    <div class="readonly-timetable">
      <sched-timetable-grid
        [mode]="'published'"
        [entries]="entries"
        [periods]="periods">
      </sched-timetable-grid>
    </div>
  `,
  styles: [`
    .readonly-timetable { opacity: 0.95; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReadonlyGridComponent {
  @Input() entries: TimetableEntry[] = [];
  @Input() periods: BellSchedulePeriod[] = [];
}
