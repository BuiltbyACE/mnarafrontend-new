import {
  Component,
  input,
  output,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CalendarEvent, CalendarDay } from '@sms/shared/models';

@Component({
  selector: 'app-calendar-grid',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './calendar-grid.component.html',
  styleUrl: './calendar-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarGridComponent {
  readonly days = input<(number | null)[]>([]);
  readonly events = input<CalendarEvent[]>([]);
  readonly currentYear = input<number>(new Date().getFullYear());
  readonly currentMonth = input<number>(new Date().getMonth());
  readonly weekDays = input<string[]>(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);

  readonly dayClicked = output<CalendarDay>();
  readonly eventClicked = output<CalendarEvent>();

  readonly calendarDays = computed<CalendarDay[]>(() => {
    const year = this.currentYear();
    const month = this.currentMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();

    const result: CalendarDay[] = [];

    for (let i = 0; i < startOffset; i++) {
      result.push({ day: null, dateStr: null, events: [], isToday: false, isCurrentMonth: false });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = this.formatDate(year, month, d);
      const dayEvents = this.events().filter((evt) => evt.date === dateStr);
      result.push({
        day: d,
        dateStr,
        events: dayEvents,
        isToday: d === todayDate && month === todayMonth && year === todayYear,
        isCurrentMonth: true,
      });
    }

    const remaining = 42 - result.length;
    for (let i = 1; i <= remaining; i++) {
      result.push({ day: null, dateStr: null, events: [], isToday: false, isCurrentMonth: false });
    }

    return result;
  });

  private formatDate(year: number, month: number, day: number): string {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  onDayClick(day: CalendarDay): void {
    if (day.day !== null) {
      this.dayClicked.emit(day);
    }
  }

  onEventClick(event: CalendarEvent, day: CalendarDay): void {
    event.stopPropagation();
    this.eventClicked.emit(event);
  }

  getHighlightEvent(day: CalendarDay): CalendarEvent | null {
    return day.events.find((e) => e.isFullDayHighlight) ?? null;
  }

  getDotEvents(day: CalendarDay): CalendarEvent[] {
    return day.events.filter((e) => !e.isFullDayHighlight).slice(0, 3);
  }

  hasOverflow(day: CalendarDay): boolean {
    return day.events.filter((e) => !e.isFullDayHighlight).length > 3;
  }

  getOverflowCount(day: CalendarDay): number {
    return Math.max(0, day.events.filter((e) => !e.isFullDayHighlight).length - 3);
  }

  getAllEvents(day: CalendarDay): CalendarEvent[] {
    return day.events;
  }

  getCellBgStyle(event: CalendarEvent): Record<string, string> {
    const hex = event.hexColor;
    return {
      'background-color': `${hex}22`,
      'border-color': hex,
    };
  }
}