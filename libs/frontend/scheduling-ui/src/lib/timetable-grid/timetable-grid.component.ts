import {
  Component, input, output, computed, viewChild,
  ElementRef, ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import type { CalendarOptions, EventClickArg, EventDropArg, DateSelectArg } from '@fullcalendar/core';
import type { EventInput } from '@fullcalendar/core';
import {
  TimetableEntry,
  BellSchedulePeriod,
  ConflictError,
  EntryDraft,
  mapEntriesToEvents,
  mapPeriodsToNonTeachingEvents,
  buildCalendarOptions,
} from '@sms/domain/scheduling';

@Component({
  selector: 'sched-timetable-grid',
  standalone: true,
  imports: [CommonModule, FullCalendarModule],
  template: `
    <div class="tt-grid-wrapper" [class.is-draft]="mode() === 'draft'" [class.is-published]="mode() === 'published'">
      <full-calendar
        [options]="calendarOptions()"
        [events]="calendarEvents()">
      </full-calendar>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .tt-grid-wrapper { height: 100%; min-height: 400px; }
    .tt-grid-wrapper :host ::ng-deep .fc { font-family: inherit; }
    .tt-grid-wrapper :host ::ng-deep .fc .fc-toolbar { display: none; }
    .tt-grid-wrapper :host ::ng-deep .fc .fc-view-harness { background: #fff; }
    .tt-grid-wrapper :host ::ng-deep .fc .fc-col-header-cell { padding: 8px 4px; background: #f8faff; border-bottom: 1px solid #e9eef4; }
    .tt-grid-wrapper :host ::ng-deep .fc .fc-col-header-cell-cushion { font-size: 0.75rem; font-weight: 600; color: #1e293b; text-decoration: none; }
    .tt-grid-wrapper :host ::ng-deep .fc .fc-timegrid-slot { height: 32px; border-bottom: 1px solid #f1f5f9; }
    .tt-grid-wrapper :host ::ng-deep .fc .fc-timegrid-slot-lane { cursor: pointer; }
    .tt-grid-wrapper :host ::ng-deep .fc .fc-timegrid-slot-label { vertical-align: middle; }
    .tt-grid-wrapper :host ::ng-deep .fc .fc-timegrid-slot-label-cushion { font-size: 0.6875rem; font-weight: 500; color: #64748b; padding: 0 4px; }
    .tt-grid-wrapper :host ::ng-deep .fc .fc-timegrid-now-indicator-line { border-color: #ef4444; }
    .tt-grid-wrapper :host ::ng-deep .fc .fc-timegrid-now-indicator-arrow { border-color: #ef4444; }
    .tt-grid-wrapper :host ::ng-deep .fc .fc-event { border-radius: 6px; border-left-width: 3px; padding: 2px 4px; font-size: 0.75rem; transition: box-shadow 0.15s ease; cursor: pointer; margin: 1px 0; }
    .tt-grid-wrapper :host ::ng-deep .fc .fc-event:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.1); z-index: 5; }
    .tt-grid-wrapper :host ::ng-deep .fc .fc-event .fc-event-main { padding: 0; }
    .tt-grid-wrapper :host ::ng-deep .fc .fc-event .fc-event-title { font-weight: 600; font-size: 0.6875rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
    .tt-grid-wrapper :host ::ng-deep .fc .fc-event .fc-event-time { font-size: 0.625rem; opacity: 0.8; }
    .tt-grid-wrapper :host ::ng-deep .fc .tt-event-draggable { cursor: grab; }
    .tt-grid-wrapper :host ::ng-deep .fc .tt-event-draggable:active { cursor: grabbing; }
    .tt-grid-wrapper :host ::ng-deep .fc .tt-event-block { opacity: 0.85; pointer-events: none; }
    .tt-grid-wrapper :host ::ng-deep .fc .tt-event-block .fc-event-title { font-weight: 500; }
    .tt-grid-wrapper :host ::ng-deep .fc .tt-event-non-assignable { opacity: 0.5; cursor: not-allowed; }
    .tt-grid-wrapper :host ::ng-deep .fc .tt-event-break { background: repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(217,119,6,0.06) 6px, rgba(217,119,6,0.06) 12px) !important; }
    .tt-grid-wrapper :host ::ng-deep .fc .tt-event-institutional { background: repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(124,58,237,0.06) 6px, rgba(124,58,237,0.06) 12px) !important; }
    .tt-grid-wrapper :host ::ng-deep .fc .tt-event-conflict { border-left-color: #dc2626 !important; border-left-width: 4px !important; box-shadow: 0 0 0 1px #fecaca !important; }
    .tt-grid-wrapper :host ::ng-deep .fc .tt-event-conflict .fc-event-title { color: #991b1b; }
    .tt-grid-wrapper :host ::ng-deep .fc .fc-highlight { background: rgba(26,42,108,0.08); }
    .tt-grid-wrapper :host ::ng-deep .fc .fc-more-link { font-size: 0.6875rem; color: #1a2a6c; font-weight: 600; }
    .tt-grid-wrapper :host ::ng-deep .fc .fc-day-today { background: transparent; }
    .tt-grid-wrapper :host ::ng-deep .fc .fc-scrollgrid { border-color: #e9eef4; }
    .tt-grid-wrapper :host ::ng-deep .fc .fc-scrollgrid td { border-color: #e9eef4; }
    .tt-grid-wrapper :host ::ng-deep .fc .fc-scrollgrid-section > td { border: none; }
    .tt-grid-wrapper.is-draft :host ::ng-deep .fc .fc-timegrid-col { min-height: 600px; }
    .tt-grid-wrapper.is-published { opacity: 0.95; }
    .tt-grid-wrapper.is-published :host ::ng-deep .fc .fc-timegrid-col { pointer-events: none; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimetableGridComponent {
  readonly mode = input<'draft' | 'published'>('draft');
  readonly entries = input<TimetableEntry[]>([]);
  readonly periods = input<BellSchedulePeriod[]>([]);
  readonly viewDate = input(new Date());
  readonly conflicts = input<ConflictError[]>([]);
  readonly showNonTeachingBlocks = input(true);

  readonly entryMoved = output<EntryDraft>();
  readonly entryRemoved = output<{ entry: TimetableEntry; revert: () => void }>();
  readonly slotClicked = output<{ period: BellSchedulePeriod; day: number }>();
  readonly entryClicked = output<TimetableEntry>();
  readonly externalDrop = output<{ draft: EntryDraft; revert: () => void }>();

  readonly conflictingIds = computed(() => {
    const c = this.conflicts();
    const ids = new Set<number>();
    for (const err of c) {
      const id = err.context?.['clashing_entry_id'] as number | undefined;
      if (id) ids.add(id);
    }
    return ids;
  });

  readonly calendarEvents = computed<EventInput[]>(() => {
    const entries = this.entries();
    const periods = this.periods();
    const viewDate = this.viewDate();
    const mode = this.mode();
    const conflictingIds = this.conflictingIds();

    let events = mapEntriesToEvents(entries, periods, viewDate, mode, conflictingIds);

    if (this.showNonTeachingBlocks()) {
      const nonTeaching = mapPeriodsToNonTeachingEvents(periods, entries, viewDate);
      events = [...events, ...nonTeaching];
    }

    return events;
  });

  readonly calendarOptions = computed<CalendarOptions>(() => {
    const mode = this.mode();
    const isDraft = mode === 'draft';

    return buildCalendarOptions({
      initialDate: this.viewDate(),
      editable: isDraft,
      droppable: isDraft,
      eventStartEditable: isDraft,
      eventDurationEditable: false,
      selectable: isDraft,
      eventDrop: (info: EventDropArg) => this.handleEventDrop(info),
      eventClick: (info: EventClickArg) => this.handleEventClick(info),
      select: (info: DateSelectArg) => this.handleSlotSelect(info),
    });
  });

  private handleEventDrop(info: EventDropArg): void {
    const entry = info.event.extendedProps['entry'] as TimetableEntry | undefined;
    if (!entry || !entry.id) return;

    const dayIndex = info.event.start?.getDay() ?? 0;
    const adjustedDay = dayIndex === 0 ? 6 : dayIndex - 1;

    const timeStr = `${String(info.event.start!.getHours()).padStart(2, '0')}:${String(info.event.start!.getMinutes()).padStart(2, '0')}`;
    const matchingPeriod = this.periods().find(
      p => p.start_time <= timeStr && p.end_time > timeStr,
    );

    if (!matchingPeriod || matchingPeriod.period_type !== 'TEACHING_BLOCK') {
      // Dragged to a non-teaching block or outside grid — ask to remove
      this.entryRemoved.emit({ entry, revert: () => info.revert() });
      return;
    }

    this.entryMoved.emit({
      course_workspace_id: entry.course_workspace,
      bell_schedule_period_id: matchingPeriod.id,
      day_of_week: adjustedDay,
      year_level_id: entry.year_level,
      timetable_version_id: entry.timetable_version,
      teacher_id: entry.teacher_id,
    });
  }

  private handleEventClick(info: EventClickArg): void {
    const entry = info.event.extendedProps['entry'] as TimetableEntry | undefined;
    if (entry && entry.id) {
      this.entryClicked.emit(entry);
    }
  }

  private handleSlotSelect(info: DateSelectArg): void {
    if (this.mode() !== 'draft') return;

    const dayIndex = info.start.getDay();
    const adjustedDay = dayIndex === 0 ? 6 : dayIndex - 1;

    const timeStr = `${String(info.start.getHours()).padStart(2, '0')}:${String(info.start.getMinutes()).padStart(2, '0')}`;
    const matchingPeriod = this.periods().find(
      p => p.start_time <= timeStr && p.end_time > timeStr,
    );

    if (!matchingPeriod || matchingPeriod.period_type !== 'TEACHING_BLOCK') return;
    this.slotClicked.emit({ period: matchingPeriod, day: adjustedDay });
  }
}
