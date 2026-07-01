import { CalendarOptions } from '@fullcalendar/core';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';

export function buildCalendarOptions(
  overrides: Partial<CalendarOptions> = {},
): CalendarOptions {
  return {
    plugins: [timeGridPlugin, interactionPlugin, dayGridPlugin],
    initialView: 'timeGridWeek',
    headerToolbar: false,
    allDaySlot: false,
    slotMinTime: '07:00:00',
    slotMaxTime: '18:00:00',
    slotDuration: '00:30:00',
    slotLabelInterval: '01:00',
    slotLabelFormat: {
      hour: 'numeric',
      minute: '2-digit',
      omitZeroMinute: false,
      meridiem: 'short',
    },
    dayHeaderFormat: {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      omitCommas: true,
    },
    weekends: true,
    hiddenDays: [0, 6],
    height: 'auto',
    expandRows: true,
    nowIndicator: false,
    editable: false,
    droppable: false,
    selectable: false,
    selectMirror: false,
    eventDurationEditable: false,
    eventStartEditable: false,
    eventOverlap: true,
    eventOrder: 'start',
    eventDisplay: 'block',
    displayEventTime: true,
    displayEventEnd: true,
    eventTimeFormat: {
      hour: 'numeric',
      minute: '2-digit',
      omitZeroMinute: false,
      meridiem: 'short',
    },
    dayMaxEvents: false,
    ...overrides,
  };
}
