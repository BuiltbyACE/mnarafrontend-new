import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarModule, CalendarEvent } from 'angular-calendar';
import {
  BellSchedulePeriod,
  TimetableEntry,
  EntryDraft,
} from '@sms/domain/scheduling';

@Component({
  selector: 'sched-timetable-grid',
  standalone: true,
  imports: [CommonModule, CalendarModule],
  template: `
    <div class="timetable-grid" [class.readonly]="mode === 'published'">
      <mwl-calendar-week-view
        [viewDate]="viewDate"
        [events]="calendarEvents"
        [dayStartHour]="7"
        [dayEndHour]="18"
        [hourSegments]="2"
        (eventTimesChanged)="onEventMoved($event)"
        (hourSegmentClicked)="onSlotClicked($event)">
      </mwl-calendar-week-view>
    </div>
  `,
  styles: [`
    .timetable-grid { height: 100%; }
    .timetable-grid.readonly { pointer-events: none; opacity: 0.9; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimetableGridComponent {
  @Input() mode: 'draft' | 'published' = 'draft';
  @Input() entries: TimetableEntry[] = [];
  @Input() periods: BellSchedulePeriod[] = [];
  @Input() viewDate: Date = new Date();

  @Output() entryMoved = new EventEmitter<EntryDraft>();
  @Output() slotClicked = new EventEmitter<{ period: BellSchedulePeriod; day: number }>();

  get calendarEvents(): CalendarEvent[] {
    return this.entries.map(e => ({
      id: e.id.toString(),
      start: new Date(),
      end: new Date(),
      title: e.subject_name,
      color: { primary: '#3b82f6', secondary: '#dbeafe' },
      meta: e,
      draggable: this.mode === 'draft',
    }));
  }

  onEventMoved(_event: { event: CalendarEvent }): void { }

  onSlotClicked(_event: unknown): void { }
}
