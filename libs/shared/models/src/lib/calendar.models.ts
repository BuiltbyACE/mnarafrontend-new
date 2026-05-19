/**
 * Calendar Shared Models
 * Interfaces for the unified calendar across Admin, Teacher, and Student portals
 */

export type CalendarEventType = 'HOLIDAY' | 'TERM' | 'SDL' | 'EXAM' | 'MEETING' | 'DEADLINE' | 'EVENT' | 'CLASS';

export interface CalendarEvent {
  id: string | number;
  title: string;
  event_type: string;
  date?: string;
  start_date?: string;
  end_date?: string;
  hex_color: string;
  isFullDayHighlight: boolean;
  description?: string;
  is_non_learning_day?: boolean;
  time?: string;
}

export interface CalendarDay {
  day: number | null;
  dateStr: string | null;
  events: CalendarEvent[];
  isToday: boolean;
  isCurrentMonth: boolean;
}

export interface CalendarConfig {
  weekDays: string[];
  monthLabel: string;
  year: number;
  month: number;
}

export interface CreateCalendarEventPayload {
  title: string;
  event_type: string;
  start_date: string;
  end_date: string;
  hex_color?: string;
  is_full_day_highlight?: boolean;
  is_non_learning_day?: boolean;
  description?: string;
}