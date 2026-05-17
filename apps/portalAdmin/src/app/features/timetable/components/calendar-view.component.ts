import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface CalendarDay {
  day: number;
  monthOffset: -1 | 0 | 1;
  date: Date;
  isToday: boolean;
  hasClass: boolean;
  isSelected: boolean;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './calendar-view.component.html',
  styleUrls: ['./calendar-view.component.css'],
})
export class CalendarViewComponent {
  @Input() classDates: Set<string> = new Set();
  @Input() selectedDate: Date = new Date();
  @Output() dateSelected = new EventEmitter<Date>();

  readonly viewMonth = signal(new Date().getMonth());
  readonly viewYear = signal(new Date().getFullYear());
  readonly today = new Date();

  readonly dayHeaders = DAY_HEADERS;

  readonly monthLabel = computed(() => `${MONTHS[this.viewMonth()]} ${this.viewYear()}`);

  readonly calendarDays = computed<CalendarDay[]>(() => {
    const year = this.viewYear();
    const month = this.viewMonth();
    const first = new Date(year, month, 1);
    const startDow = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();

    const cells: CalendarDay[] = [];
    const selKey = dateKey(this.selectedDate);
    const todayKey = dateKey(this.today);
    const classSet = this.classDates;

    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, daysInPrev - i);
      cells.push({ day: daysInPrev - i, monthOffset: -1, date: d, isToday: dateKey(d) === todayKey, hasClass: classSet.has(dateKey(d)), isSelected: dateKey(d) === selKey });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      cells.push({ day: i, monthOffset: 0, date: d, isToday: dateKey(d) === todayKey, hasClass: classSet.has(dateKey(d)), isSelected: dateKey(d) === selKey });
    }

    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      cells.push({ day: i, monthOffset: 1, date: d, isToday: dateKey(d) === todayKey, hasClass: classSet.has(dateKey(d)), isSelected: dateKey(d) === selKey });
    }

    return cells;
  });

  selectDay(day: CalendarDay): void {
    this.dateSelected.emit(day.date);
  }

  prevMonth(): void {
    this.viewMonth.update(m => {
      if (m === 0) { this.viewYear.update(y => y - 1); return 11; }
      return m - 1;
    });
  }

  nextMonth(): void {
    this.viewMonth.update(m => {
      if (m === 11) { this.viewYear.update(y => y + 1); return 0; }
      return m + 1;
    });
  }

  goToToday(): void {
    const now = new Date();
    this.viewMonth.set(now.getMonth());
    this.viewYear.set(now.getFullYear());
    this.dateSelected.emit(now);
  }
}
