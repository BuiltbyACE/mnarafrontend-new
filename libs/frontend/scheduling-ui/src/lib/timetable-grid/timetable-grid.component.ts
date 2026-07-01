import { Component, input, output, ChangeDetectionStrategy, computed, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarWeekViewComponent, CalendarEvent, CalendarEventTimesChangedEvent, provideCalendar, DateAdapter } from 'angular-calendar';
import {
  BellSchedulePeriod,
  TimetableEntry,
  EntryDraft,
  ConflictError,
} from '@sms/domain/scheduling';
import { NativeDateAdapter } from '../date-adapters/native-date-adapter';
function addDays(date: Date, days: number): Date {
  const r = new Date(date);
  r.setDate(r.getDate() + days);
  return r;
}

function setTime(date: Date, hours: number, minutes: number): Date {
  const r = new Date(date);
  r.setHours(hours, minutes, 0, 0);
  return r;
}

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

const PERIOD_TYPE_COLORS: Record<string, { primary: string; secondary: string }> = {
  TEACHING_BLOCK: { primary: '#1a2a6c', secondary: '#e8edfb' },
  BREAK: { primary: '#d97706', secondary: '#fef3c7' },
  INSTITUTIONAL_BLOCK: { primary: '#7c3aed', secondary: '#ede9fe' },
};

const PERIOD_TYPE_LABELS: Record<string, string> = {
  TEACHING_BLOCK: 'Lesson',
  BREAK: 'Break',
  INSTITUTIONAL_BLOCK: 'Institutional',
};

function getPeriodColor(periodType: string) {
  return PERIOD_TYPE_COLORS[periodType] ?? { primary: '#64748b', secondary: '#f1f5f9' };
}

function parseTime(time: string): { hours: number; minutes: number } {
  const [h, m] = time.split(':').map(Number);
  return { hours: h, minutes: m };
}

@Component({
  selector: 'sched-timetable-grid',
  standalone: true,
  imports: [CommonModule, CalendarWeekViewComponent],
  providers: [...provideCalendar({ provide: DateAdapter, useClass: NativeDateAdapter })],
  template: `
    <div
      class="timetable-grid"
      [class.is-draft]="mode() === 'draft'"
      [class.is-published]="mode() === 'published'">
      <mwl-calendar-week-view
        [viewDate]="viewDate()"
        [events]="calendarEvents()"
        [dayStartHour]="dayStartHour()"
        [dayEndHour]="dayEndHour()"
        [hourSegments]="hourSegments()"
        [eventTemplate]="eventTemplate"
        (eventTimesChanged)="onEventMoved($event)"
        (hourSegmentClicked)="onSlotClicked($event)"
        (eventClicked)="onEntryClick($event)">
      </mwl-calendar-week-view>

      <ng-template #eventTemplate let-event="event">
        <div
          class="cal-event"
          [class.is-break]="event.meta?.period_type === 'BREAK'"
          [class.is-institutional]="event.meta?.period_type === 'INSTITUTIONAL_BLOCK'"
          [class.is-draggable]="event.draggable"
          [title]="eventTitle(event)">
          <div class="cal-event-header">
            <span class="cal-event-title">{{ event.title }}</span>
            @if (event.meta?.period_type !== 'TEACHING_BLOCK') {
              <span class="cal-event-badge">{{ periodLabel(event.meta?.period_type) }}</span>
            }
          </div>
          @if (event.meta?.teacher_name || event.meta?.classroom_name) {
            <div class="cal-event-meta">
              @if (event.meta?.teacher_name) {
                <span class="cal-event-teacher">{{ event.meta.teacher_name }}</span>
              }
              @if (event.meta?.classroom_name) {
                <span class="cal-event-room">{{ event.meta.classroom_name }}</span>
              }
            </div>
          }
        </div>
      </ng-template>

      @if (conflicts().length > 0) {
        <div class="conflict-ghosts">
          @for (c of conflicts(); track c.code) {
            <div class="conflict-marker" [title]="c.message">
              <span class="marker-dot"></span>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .timetable-grid { position: relative; height: 100%; overflow: hidden; border-radius: var(--tt-radius-card, 16px); }
    .timetable-grid.is-published { opacity: 0.9; pointer-events: none; }
    .conflict-marker { position: absolute; top: 0; right: 0; width: 8px; height: 8px; border-radius: 50%; background: #ef4444; }
    .cal-event { padding: 2px 4px; height: 100%; overflow: hidden; cursor: pointer; }
    .cal-event.is-break { opacity: 0.7; cursor: default; }
    .cal-event.is-institutional { opacity: 0.8; cursor: default; background: repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(124,58,237,0.05) 8px, rgba(124,58,237,0.05) 16px) !important; }
    .cal-event-header { display: flex; align-items: center; gap: 4px; }
    .cal-event-title { font-size: 11px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .cal-event-badge { font-size: 9px; padding: 0 4px; border-radius: 3px; background: rgba(255,255,255,0.3); white-space: nowrap; }
    .cal-event-meta { display: flex; gap: 6px; margin-top: 1px; }
    .cal-event-teacher, .cal-event-room { font-size: 9px; opacity: 0.8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
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
  readonly slotClicked = output<{ period: BellSchedulePeriod; day: number }>();
  readonly entryClicked = output<TimetableEntry>();

  readonly dayStartHour = computed(() => {
    const p = this.periods();
    if (p.length === 0) return 7;
    return Math.min(...p.map(p => parseTime(p.start_time).hours));
  });

  readonly dayEndHour = computed(() => {
    const p = this.periods();
    if (p.length === 0) return 18;
    return Math.max(...p.map(p => parseTime(p.end_time).hours)) + 1;
  });

  readonly hourSegments = computed(() => {
    const p = this.periods();
    if (p.length === 0) return 2;
    const durations = p.map(p => {
      const s = parseTime(p.start_time);
      const e = parseTime(p.end_time);
      return (e.hours * 60 + e.minutes) - (s.hours * 60 + s.minutes);
    });
    const minDuration = Math.min(...durations);
    if (minDuration <= 15) return 4;
    if (minDuration <= 30) return 2;
    return 1;
  });

  @ViewChild('eventTemplate', { static: true }) eventTemplate!: TemplateRef<any>;

  readonly periodLabel = (type: string): string =>
    PERIOD_TYPE_LABELS[type] ?? type;

  readonly eventTitle = (event: CalendarEvent<TimetableEntry>): string => {
    const meta = event.meta;
    if (!meta) return event.title;
    const parts = [event.title];
    if (meta.teacher_name) parts.push(`Teacher: ${meta.teacher_name}`);
    if (meta.classroom_name) parts.push(`Room: ${meta.classroom_name}`);
    return parts.join(' · ');
  };

  calendarEvents = computed(() => {
    const monday = getMonday(this.viewDate());
    const entries = this.entries();
    const periods = this.periods();
    const events: CalendarEvent<TimetableEntry>[] = [];

    for (const e of entries) {
      const period = periods.find(p => p.id === e.bell_schedule_period);
      if (!period) continue;

      const dayDate = addDays(monday, e.day_of_week);
      const { hours: startH, minutes: startM } = parseTime(period.start_time);
      const { hours: endH, minutes: endM } = parseTime(period.end_time);
      const colors = getPeriodColor(period.period_type);

      events.push({
        id: e.id.toString(),
        start: setTime(dayDate, startH, startM),
        end: setTime(dayDate, endH, endM),
        title: e.subject_name,
        color: colors,
        meta: {
          ...e,
          period_type: period.period_type,
          period_label: period.label,
        },
        draggable: this.mode() === 'draft' && period.period_type === 'TEACHING_BLOCK',
        resizable: { beforeStart: false, afterEnd: false },
      } as CalendarEvent<TimetableEntry>);
    }

    if (this.showNonTeachingBlocks()) {
      for (const p of periods) {
        if (p.period_type === 'TEACHING_BLOCK') continue;

        for (let day = 0; day < 5; day++) {
          const hasEntry = entries.some(
            e => e.bell_schedule_period === p.id && e.day_of_week === day
          );
          if (hasEntry) continue;

          const dayDate = addDays(monday, day);
          const { hours: startH, minutes: startM } = parseTime(p.start_time);
          const { hours: endH, minutes: endM } = parseTime(p.end_time);
          const colors = getPeriodColor(p.period_type);

          events.push({
            id: `block-${p.id}-${day}`,
            start: setTime(dayDate, startH, startM),
            end: setTime(dayDate, endH, endM),
            title: p.label,
            color: colors,
            meta: {
              period_type: p.period_type,
              period_label: p.label,
            } as unknown as TimetableEntry,
            draggable: false,
            resizable: { beforeStart: false, afterEnd: false },
            cssClass: `cal-event-type-${p.period_type.toLowerCase()}`,
          } as CalendarEvent);
        }
      }
    }

    return events;
  });

  onEventMoved(event: CalendarEventTimesChangedEvent): void {
    const entry = event.event.meta as TimetableEntry;
    if (!entry || !entry.id) return;

    const dayIndex = event.newStart.getDay();
    const adjustedDay = dayIndex === 0 ? 6 : dayIndex - 1;

    const timeStr = `${String(event.newStart.getHours()).padStart(2, '0')}:${String(event.newStart.getMinutes()).padStart(2, '0')}`;
    const matchingPeriod = this.periods().find(
      p => p.day_of_week === adjustedDay && p.start_time <= timeStr && p.end_time > timeStr,
    );

    if (!matchingPeriod || matchingPeriod.period_type !== 'TEACHING_BLOCK') return;

    this.entryMoved.emit({
      course_workspace_id: entry.course_workspace,
      bell_schedule_period_id: matchingPeriod.id,
      day_of_week: adjustedDay,
      year_level_id: entry.year_level,
      timetable_version_id: entry.timetable_version,
      teacher_id: entry.teacher_id,
    });
  }

  onSlotClicked(segment: { date: Date; sourceEvent: MouseEvent }): void {
    if (this.mode() !== 'draft') return;

    const dayIndex = segment.date.getDay();
    const adjustedDay = dayIndex === 0 ? 6 : dayIndex - 1;

    const timeStr = `${String(segment.date.getHours()).padStart(2, '0')}:${String(segment.date.getMinutes()).padStart(2, '0')}`;
    const matchingPeriod = this.periods().find(
      p => p.day_of_week === adjustedDay && p.start_time <= timeStr && p.end_time > timeStr,
    );

    if (!matchingPeriod || matchingPeriod.period_type !== 'TEACHING_BLOCK') return;
    this.slotClicked.emit({ period: matchingPeriod, day: adjustedDay });
  }

  onEntryClick(payload: { event: CalendarEvent; sourceEvent: MouseEvent | KeyboardEvent }): void {
    const entry = payload.event.meta as TimetableEntry;
    if (entry && entry.id) this.entryClicked.emit(entry);
  }
}
