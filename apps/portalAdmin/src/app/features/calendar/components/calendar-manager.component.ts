import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { AdminCalendarService, AdminCalendarEvent, AdminEventType, CreateEventPayload } from '../services/admin-calendar.service';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const PRESET_COLORS: { label: string; hex: string }[] = [
  { label: 'Term Blue', hex: '#2563eb' },
  { label: 'Holiday Red', hex: '#ef4444' },
  { label: 'SDL Green', hex: '#10b981' },
  { label: 'Exam Amber', hex: '#f59e0b' },
  { label: 'Meeting Purple', hex: '#8b5cf6' },
];

interface AdminCalendarDay {
  day: number | null;
  dateStr: string | null;
  events: AdminCalendarEvent[];
  isToday: boolean;
  isCurrentMonth: boolean;
}

@Component({
  selector: 'app-admin-calendar-manager',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatFormFieldModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatCardModule,
  ],
  templateUrl: './calendar-manager.component.html',
  styleUrls: ['./calendar-manager.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCalendarManagerComponent {
  private readonly calendarService = inject(AdminCalendarService);
  private readonly fb = inject(FormBuilder);

  readonly currentMonth = signal(new Date().getMonth());
  readonly currentYear = signal(new Date().getFullYear());
  readonly showPanel = signal(false);
  readonly isSubmitting = signal(false);
  readonly selectedDate = signal<Date | null>(null);
  readonly weekDays = WEEK_DAYS;

  readonly events = this.calendarService.events;

  readonly monthLabel = computed(() => {
    const monthName = MONTHS[this.currentMonth()];
    const year = this.currentYear();
    return `${monthName} ${year}`;
  });

  readonly calendarDays = computed<AdminCalendarDay[]>(() => {
    const year = this.currentYear();
    const month = this.currentMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const today = new Date();

    const result: AdminCalendarDay[] = [];

    for (let i = 0; i < startOffset; i++) {
      result.push({ day: null, dateStr: null, events: [], isToday: false, isCurrentMonth: false });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = this.formatDateStr(year, month, d);
      const dayEvents = this.events().filter((evt) => {
        return dateStr >= evt.start_date && dateStr <= evt.end_date;
      });
      const isToday =
        d === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear();
      result.push({ day: d, dateStr, events: dayEvents, isToday, isCurrentMonth: true });
    }

    while (result.length < 42) {
      result.push({ day: null, dateStr: null, events: [], isToday: false, isCurrentMonth: false });
    }

    return result;
  });

  readonly eventForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    event_type: ['TERM' as AdminEventType, Validators.required],
    start_date: [new Date(), Validators.required],
    end_date: [new Date(), Validators.required],
    is_non_learning_day: [false],
    description: [''],
    isFullDayHighlight: [true],
    hexColor: ['#2563eb'],
  });

  readonly presetColors = PRESET_COLORS;

  goToToday(): void {
    this.currentMonth.set(new Date().getMonth());
    this.currentYear.set(new Date().getFullYear());
  }

  prevMonth(): void {
    if (this.currentMonth() === 0) {
      this.currentMonth.set(11);
      this.currentYear.update((y) => y - 1);
    } else {
      this.currentMonth.update((m) => m - 1);
    }
  }

  nextMonth(): void {
    if (this.currentMonth() === 11) {
      this.currentMonth.set(0);
      this.currentYear.update((y) => y + 1);
    } else {
      this.currentMonth.update((m) => m + 1);
    }
  }

  onDayClicked(day: AdminCalendarDay): void {
    if (day.day === null || !day.dateStr) return;

    const [year, month, dayNum] = day.dateStr.split('-').map(Number);
    const clickedDate = new Date(year, month - 1, dayNum);

    this.selectedDate.set(clickedDate);
    this.eventForm.patchValue({
      start_date: clickedDate,
      end_date: clickedDate,
      hexColor: this.calendarService.getDefaultColor(this.eventForm.value.event_type as AdminEventType),
    });
    this.showPanel.set(true);
  }

  closePanel(): void {
    this.showPanel.set(false);
    this.eventForm.reset({
      event_type: 'TERM',
      is_non_learning_day: false,
      isFullDayHighlight: true,
      hexColor: '#2563eb',
      start_date: new Date(),
      end_date: new Date(),
    });
  }

  onTypeChange(type: AdminEventType): void {
    this.eventForm.patchValue({
      hexColor: this.calendarService.getDefaultColor(type),
    });
  }

  selectColor(hex: string): void {
    this.eventForm.patchValue({ hexColor: hex });
  }

  getHighlightEvent(day: AdminCalendarDay): AdminCalendarEvent | null {
    return day.events.find((e) => e.isFullDayHighlight) ?? null;
  }

  getDotEvents(day: AdminCalendarDay): AdminCalendarEvent[] {
    return day.events.filter((e) => !e.isFullDayHighlight).slice(0, 3);
  }

  getOverflowCount(day: AdminCalendarDay): number {
    return Math.max(0, day.events.filter((e) => !e.isFullDayHighlight).length - 3);
  }

  getCellBgStyle(event: AdminCalendarEvent): Record<string, string> {
    const hex = event.hexColor;
    return {
      'background-color': hex + '22',
      'border-color': hex,
    };
  }

  submitEvent(): void {
    if (this.eventForm.invalid) return;

    this.isSubmitting.set(true);
    const formValue = this.eventForm.value;
    const startDate = formValue.start_date as Date;
    const endDate = formValue.end_date as Date;

    const payload: CreateEventPayload = {
      title: formValue.title!,
      event_type: formValue.event_type as AdminEventType,
      start_date: this.formatDate(startDate),
      end_date: this.formatDate(endDate),
      is_non_learning_day: formValue.is_non_learning_day ?? false,
      description: formValue.description || '',
      hexColor: formValue.hexColor!,
      isFullDayHighlight: formValue.isFullDayHighlight ?? true,
    };

    this.calendarService.createEvent(payload).subscribe({
      next: (newEvent: AdminCalendarEvent) => {
        this.calendarService.addEvent(newEvent);
        this.isSubmitting.set(false);
        this.closePanel();
      },
      error: () => {
        const tempId = Date.now();
        const optimisticEvent: AdminCalendarEvent = {
          id: tempId,
          title: payload.title,
          event_type: payload.event_type,
          start_date: payload.start_date,
          end_date: payload.end_date,
          is_non_learning_day: payload.is_non_learning_day,
          description: payload.description,
          hexColor: payload.hexColor,
          isFullDayHighlight: payload.isFullDayHighlight,
        };
        this.calendarService.addEvent(optimisticEvent);
        this.isSubmitting.set(false);
        this.closePanel();
      },
    });
  }

  private formatDate(date: Date): string {
    return (
      date.getFullYear() +
      '-' +
      String(date.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(date.getDate()).padStart(2, '0')
    );
  }

  private formatDateStr(year: number, month: number, day: number): string {
    return (
      year +
      '-' +
      String(month + 1).padStart(2, '0') +
      '-' +
      String(day).padStart(2, '0')
    );
  }
}