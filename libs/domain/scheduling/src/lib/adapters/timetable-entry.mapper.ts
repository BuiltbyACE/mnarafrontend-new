import { EventInput } from '@fullcalendar/core';
import { TimetableEntry, BellSchedulePeriod, ConflictError } from '../models';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const PERIOD_TYPE_COLORS: Record<string, { backgroundColor: string; borderColor: string; textColor: string }> = {
  TEACHING_BLOCK: { backgroundColor: '#e8edfb', borderColor: '#1a2a6c', textColor: '#1a2a6c' },
  BREAK: { backgroundColor: '#fef3c7', borderColor: '#d97706', textColor: '#92400e' },
  INSTITUTIONAL_BLOCK: { backgroundColor: '#ede9fe', borderColor: '#7c3aed', textColor: '#5b21b6' },
  TRANSITION: { backgroundColor: '#f1f5f9', borderColor: '#64748b', textColor: '#475569' },
};

export const PERIOD_TYPE_ICONS: Record<string, string> = {
  TEACHING_BLOCK: '\u{1F4D6}',
  BREAK: '\u{1F9CA}',
  INSTITUTIONAL_BLOCK: '\u{1F54A}',
  TRANSITION: '\u{1F500}',
};

export const PERIOD_TYPE_LABELS: Record<string, string> = {
  TEACHING_BLOCK: 'Lesson',
  BREAK: 'Break',
  INSTITUTIONAL_BLOCK: 'Institutional',
  TRANSITION: 'Transition',
};

function parseTime(time: string): { hours: number; minutes: number } {
  const [h, m] = time.split(':').map(Number);
  return { hours: h, minutes: m };
}

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

const SUBJECT_COLORS: string[] = [
  '#1a2a6c', '#2d4373', '#4a5d8a',
  '#7c3aed', '#6d28d9', '#5b21b6',
  '#0d9488', '#0f766e', '#115e59',
  '#b45309', '#d97706', '#f59e0b',
  '#dc2626', '#ef4444', '#991b1b',
  '#2563eb', '#3b82f6', '#1d4ed8',
  '#059669', '#10b981', '#047857',
];

function hashColor(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getSubjectColor(subjectName: string): { backgroundColor: string; borderColor: string; textColor: string } {
  const idx = hashColor(subjectName) % SUBJECT_COLORS.length;
  const base = SUBJECT_COLORS[idx];
  return {
    backgroundColor: `${base}14`,
    borderColor: base,
    textColor: base,
  };
}

export function getPeriodColor(periodType: string): { backgroundColor: string; borderColor: string; textColor: string } {
  return PERIOD_TYPE_COLORS[periodType] ?? { backgroundColor: '#f1f5f9', borderColor: '#64748b', textColor: '#475569' };
}

export function mapEntriesToEvents(
  entries: TimetableEntry[],
  periods: BellSchedulePeriod[],
  viewDate: Date,
  mode: 'draft' | 'published',
  conflictingIds: Set<number>,
): EventInput[] {
  const monday = getMonday(viewDate);
  const events: EventInput[] = [];

  for (const entry of entries) {
    const period = periods.find(p => p.id === entry.bell_schedule_period);
    if (!period) continue;

    const dayDate = addDays(monday, entry.day_of_week);
    const { hours: startH, minutes: startM } = parseTime(period.start_time);
    const { hours: endH, minutes: endM } = parseTime(period.end_time);
    const colors = entry.subject_name
      ? getSubjectColor(entry.subject_name)
      : getPeriodColor(period.period_type);

    const isDraft = mode === 'draft';
    const isTeaching = period.period_type === 'TEACHING_BLOCK';
    const isConflict = conflictingIds.has(entry.id);

    events.push({
      id: entry.id.toString(),
      start: setTime(dayDate, startH, startM),
      end: setTime(dayDate, endH, endM),
      title: entry.subject_name || period.label || 'Lesson',
      backgroundColor: isConflict ? '#fef2f2' : colors.backgroundColor,
      borderColor: isConflict ? '#dc2626' : colors.borderColor,
      textColor: isConflict ? '#991b1b' : colors.textColor,
      classNames: [
        'tt-event',
        isDraft && isTeaching ? 'tt-event-draggable' : '',
        !isTeaching ? 'tt-event-block' : '',
        isConflict ? 'tt-event-conflict' : '',
        period.period_type === 'BREAK' ? 'tt-event-break' : '',
        period.period_type === 'INSTITUTIONAL_BLOCK' ? 'tt-event-institutional' : '',
        isDraft && !isTeaching ? 'tt-event-non-assignable' : '',
      ].filter(Boolean),
      editable: isDraft && isTeaching,
      durationEditable: false,
      startEditable: isDraft && isTeaching,
      display: 'block',
      extendedProps: {
        entry,
        periodType: period.period_type,
        periodLabel: period.label,
        isTeachingBlock: isTeaching,
        teacherName: entry.teacher_name,
        classroomName: entry.classroom_name,
        yearLevel: entry.year_level,
        subjectName: entry.subject_name,
        dayOfWeek: entry.day_of_week,
        periodId: period.id,
      },
    });
  }

  return events;
}

export function mapPeriodsToNonTeachingEvents(
  periods: BellSchedulePeriod[],
  entries: TimetableEntry[],
  viewDate: Date,
): EventInput[] {
  const monday = getMonday(viewDate);
  const events: EventInput[] = [];

  for (const p of periods) {
    if (p.period_type === 'TEACHING_BLOCK') continue;

    for (let day = 0; day < 5; day++) {
      const hasEntry = entries.some(
        e => e.bell_schedule_period === p.id && e.day_of_week === day,
      );
      if (hasEntry) continue;

      const dayDate = addDays(monday, day);
      const { hours: startH, minutes: startM } = parseTime(p.start_time);
      const { hours: endH, minutes: endM } = parseTime(p.end_time);
      const colors = getPeriodColor(p.period_type);

      const typeIcon = PERIOD_TYPE_ICONS[p.period_type] ?? '';
      const typeLabel = PERIOD_TYPE_LABELS[p.period_type] ?? '';

      events.push({
        id: `block-${p.id}-${day}`,
        start: setTime(dayDate, startH, startM),
        end: setTime(dayDate, endH, endM),
        title: `${typeIcon} ${p.label}`,
        backgroundColor: colors.backgroundColor,
        borderColor: colors.borderColor,
        textColor: colors.textColor,
        classNames: ['tt-event', 'tt-event-block', `tt-type-${p.period_type.toLowerCase()}`],
        editable: false,
        startEditable: false,
        durationEditable: false,
        display: 'block',
        extendedProps: {
          periodType: p.period_type,
          periodLabel: p.label,
          isTeachingBlock: false,
          typeLabel,
        },
      });
    }
  }

  return events;
}
