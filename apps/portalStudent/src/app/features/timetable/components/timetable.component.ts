import { Component, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TimetableService, TimetableEvent, TimetableLesson } from '../services/timetable.service';

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DAY_INDEX: Record<string, number> = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5 };

@Component({
  selector: 'app-student-timetable',
  imports: [
    MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule,
  ],
  templateUrl: './timetable.component.html',
  styleUrl: './timetable.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimetableComponent implements OnInit {
  readonly service = inject(TimetableService);
  readonly week = DAY_ORDER;

  ngOnInit(): void {
    this.service.fetchTimetable();
  }

  private getMonday(): Date {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  private fmt(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private dateForDay(dayName: string): Date {
    const monday = this.getMonday();
    const offset = (DAY_INDEX[dayName] || 1) - 1;
    const date = new Date(monday);
    date.setDate(monday.getDate() + offset);
    return date;
  }

  getEventsForDay(dayName: string): TimetableEvent[] {
    const target = this.dateForDay(dayName);
    const targetStr = this.fmt(target);
    return this.service.timetableData().events.filter(
      (e) => e.start_date <= targetStr && e.end_date >= targetStr,
    );
  }

  getLessonsForDay(dayName: string): TimetableLesson[] {
    return this.service.timetableData().lessons.filter((l) => l.day_of_week === dayName);
  }

  eventTypeClass(type: string): string {
    const mapping: Record<string, string> = {
      HOLIDAY: 'bg-red-100 text-red-700 border-red-200',
      EXAM: 'bg-amber-100 text-amber-700 border-amber-200',
      SDL: 'bg-green-100 text-green-700 border-green-200',
      LESSON: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    };
    return mapping[type] || 'bg-gray-100';
  }
}
