import {
  Component,
  input,
  output,
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
  readonly calendarDays = input<CalendarDay[]>([]);
  readonly weekDays = input<string[]>(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);

  readonly dayClicked = output<CalendarDay>();
  readonly eventClicked = output<CalendarEvent>();

  onDayClick(day: CalendarDay): void {
    if (day.day !== null) {
      this.dayClicked.emit(day);
    }
  }

  onEventClick(event: CalendarEvent, day: CalendarDay, $event: PointerEvent): void {
    $event.stopPropagation();
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