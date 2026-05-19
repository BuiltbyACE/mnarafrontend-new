import { Component, computed, signal, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TimetableService, TimetableSlot } from '../services/timetable.service';
import { CalendarViewComponent } from './calendar-view.component';

type Weekday = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
type DayCode = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY';

const DAYS: Weekday[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DAY_CODES: DayCode[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
const TIME_SLOTS: string[] = [
  '07:30', '08:30', '09:30', '10:30', '11:30',
  '12:30', '13:30', '14:30', '15:30', '16:30',
];

interface FilterOption {
  id: number;
  name: string;
}

@Component({
  selector: 'app-admin-timetable',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    MatIconModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    CalendarViewComponent,
  ],
  templateUrl: './timetable.component.html',
  styles: [`
    :host {
      --mnara-primary: #2563eb;
      --mnara-primary-light: #dbeafe;
      --mnara-primary-dark: #1e40af;
      --mnara-bg: #f0f4ff;
      --mnara-surface: #ffffff;
      --mnara-text: #1e293b;
      --mnara-text-secondary: #64748b;
      --mnara-border: #e2e8f0;
      --mnara-success: #10b981;
      display: block;
      min-height: 100vh;
      background: var(--mnara-bg);
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    }
    .timetable-page { padding: 32px; max-width: 1440px; margin: 0 auto; }

    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .page-header-left { flex: 1; }
    .page-header h1 { font-size: 26px; font-weight: 700; color: var(--mnara-text); margin: 0 0 4px; }
    .week-label { font-size: 14px; color: var(--mnara-text-secondary); }

    .filter-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      background: var(--mnara-surface);
      border: 1px solid var(--mnara-border);
      border-radius: 10px;
      margin-bottom: 20px;
    }
    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 200px;
    }
    .filter-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--mnara-text-secondary);
    }
    .filter-select {
      width: 100%;
      height: 40px;
      border: 1px solid var(--mnara-border);
      border-radius: 8px;
      padding: 0 12px;
      font-size: 14px;
      color: var(--mnara-text);
      background: var(--mnara-bg);
      cursor: pointer;
      appearance: none;
      -webkit-appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 12px center;
      padding-right: 32px;
      transition: border-color 0.15s ease;
    }
    .filter-select:focus {
      outline: none;
      border-color: var(--mnara-primary);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
    .filter-divider { width: 1px; height: 40px; background: var(--mnara-border); flex-shrink: 0; }
    .filter-clear-btn {
      height: 36px;
      padding: 0 14px;
      border: 1px solid var(--mnara-border);
      border-radius: 8px;
      background: transparent;
      color: var(--mnara-text-secondary);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-top: 18px;
      transition: all 0.15s ease;
    }
    .filter-clear-btn:hover { background: #fee2e2; border-color: #ef4444; color: #dc2626; }

    .header-actions { display: flex; align-items: center; gap: 8px; }
    .nav-btn {
      display: flex; align-items: center; justify-content: center;
      width: 36px; height: 36px;
      border: 1px solid var(--mnara-border); border-radius: 8px;
      background: var(--mnara-surface); cursor: pointer; color: var(--mnara-text);
    }
    .nav-btn:hover { background: var(--mnara-primary-light); border-color: var(--mnara-primary); }
    .today-btn {
      padding: 8px 16px; border: none; border-radius: 8px;
      background: var(--mnara-primary); color: #fff;
      font-weight: 600; font-size: 13px; cursor: pointer;
    }
    .today-btn:hover { background: var(--mnara-primary-dark); }

    .timetable-body { display: flex; gap: 24px; align-items: flex-start; }
    .calendar-sidebar { flex: 0 0 300px; position: sticky; top: 32px; }
    .timetable-container {
      flex: 1; overflow-x: auto; border-radius: 12px;
      border: 1px solid var(--mnara-border); background: var(--mnara-surface); min-width: 0;
      position: relative;
    }

    .grid-header-row {
      display: grid;
      grid-template-columns: 80px repeat(5, 1fr);
      min-width: 700px;
    }
    .grid-header {
      padding: 12px 8px; font-size: 13px; font-weight: 600;
      color: var(--mnara-text-secondary); text-align: center;
      border-bottom: 1px solid var(--mnara-border); background: var(--mnara-bg);
    }
    .grid-header.corner { border-right: 1px solid var(--mnara-border); }
    .day-header { display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .day-header.today-header { background: var(--mnara-primary-light); color: var(--mnara-primary-dark); }
    .day-name { font-size: 13px; }
    .day-date { font-size: 11px; font-weight: 400; }

    .grid-body { position: relative; min-height: 660px; }

    .grid-row {
      display: grid;
      grid-template-columns: 80px repeat(5, 1fr);
      min-width: 700px;
    }
    .time-label {
      padding: 8px; font-size: 11px; color: var(--mnara-text-secondary);
      text-align: right; border-right: 1px solid var(--mnara-border);
      border-bottom: 1px solid var(--mnara-border); background: var(--mnara-bg);
      font-weight: 500; display: flex; align-items: flex-start; justify-content: flex-end;
      padding-top: 6px;
    }
    .grid-cell {
      padding: 4px; border-right: 1px solid var(--mnara-border);
      border-bottom: 1px solid var(--mnara-border); min-height: 64px;
      position: relative; transition: background 0.15s;
    }
    .grid-cell:nth-child(6n+1) { border-right: none; }
    .grid-cell.current-cell { background: #eff6ff; }

    .slot-card {
      display: flex; flex-direction: column; gap: 2px;
      padding: 6px 8px; border-radius: 6px;
      border-left: 4px solid; background: rgba(37, 99, 235, 0.06);
      cursor: pointer; transition: box-shadow 0.15s ease, transform 0.12s ease;
      height: 100%;
    }
    .slot-card:hover {
      box-shadow: 0 3px 10px rgba(37, 99, 235, 0.15);
      transform: translateY(-1px);
    }
    .slot-subject { font-size: 11px; font-weight: 700; color: var(--mnara-primary-dark); line-height: 1.3; }
    .slot-time { font-size: 10px; color: var(--mnara-text-secondary); font-weight: 500; }
    .slot-room { font-size: 10px; color: var(--mnara-text-secondary); }
    .slot-teacher { font-size: 10px; color: var(--mnara-text-secondary); opacity: 0.75; }

    .empty-state {
      position: absolute; inset: 0;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(2px); z-index: 5;
      text-align: center; padding: 2rem;
    }
    .empty-icon { font-size: 3rem; width: 3rem; height: 3rem; color: var(--mnara-text-secondary); margin-bottom: 0.75rem; opacity: 0.4; }
    .empty-title { font-size: 1rem; font-weight: 600; color: var(--mnara-text); margin: 0 0 0.375rem; }
    .empty-desc { font-size: 0.8125rem; color: var(--mnara-text-secondary); margin: 0; max-width: 320px; }

    .loading-overlay {
      position: absolute; inset: 0;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255, 255, 255, 0.7); z-index: 6;
    }

    .spin { animation: spin 1.2s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 1024px) {
      .timetable-body { flex-direction: column; }
      .calendar-sidebar { flex: none; width: 100%; position: static; }
    }
  `],
})
export class TimetableComponent {
  private service = inject(TimetableService);

  readonly weekOffset = signal(0);
  readonly selectedDate = signal(new Date());
  readonly timeSlots = TIME_SLOTS;
  readonly days = DAYS;

  readonly selectedFilterType = signal<'teacher' | 'classroom' | null>(null);
  readonly selectedFilterId = signal<number | null>(null);
  readonly isFiltered = signal(false);

  readonly mockTeachers: FilterOption[] = [
    { id: 1, name: 'Mr. Kiprop Samuel' },
    { id: 2, name: 'Ms. Wambui Anne' },
    { id: 3, name: 'Mr. Otieno Brian' },
    { id: 4, name: 'Ms. Cherono Faith' },
    { id: 5, name: 'Mr. Kamau John' },
  ];

  readonly mockClassrooms: FilterOption[] = [
    { id: 1, name: 'Form 1A' },
    { id: 2, name: 'Form 1B' },
    { id: 3, name: 'Form 2A' },
    { id: 4, name: 'Form 2B' },
    { id: 5, name: 'Form 3A' },
    { id: 6, name: 'Form 3B' },
    { id: 7, name: 'Form 4A' },
  ];

  readonly timetable = computed(() => this.service.data() ?? {
    Monday: {}, Tuesday: {}, Wednesday: {}, Thursday: {}, Friday: {},
  });

  readonly slots = this.service.masterSlots;
  readonly isLoading = this.service.masterLoading;

  readonly today: Date = new Date();

  readonly weekStart = computed(() => {
    const d = new Date(this.today);
    d.setDate(d.getDate() + this.weekOffset() * 7);
    const day = d.getDay();
    d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
    d.setHours(0, 0, 0, 0);
    return d;
  });

  readonly todayDay = computed((): Weekday | null => {
    const now = new Date();
    const ws = this.weekStart();
    const diff = Math.floor((now.getTime() - ws.getTime()) / 86400000);
    if (diff >= 0 && diff < 5) return DAYS[diff];
    return null;
  });

  readonly currentSlot = computed(() => {
    const now = new Date();
    const total = now.getHours() * 60 + now.getMinutes();
    for (let i = TIME_SLOTS.length - 1; i >= 0; i--) {
      const [hr, min] = TIME_SLOTS[i].split(':').map(Number);
      if (total >= hr * 60 + (min || 0)) return TIME_SLOTS[i];
    }
    return '';
  });

  readonly classDates = computed<Set<string>>(() => {
    const data = this.service.data();
    if (!data) return new Set();
    const ws = this.weekStart();
    const dates = new Set<string>();
    for (const day of DAYS) {
      const entries = data[day];
      if (entries && Object.keys(entries).length > 0) {
        const idx = DAYS.indexOf(day);
        const d = new Date(ws);
        d.setDate(d.getDate() + idx);
        dates.add(this.dateKey(d));
      }
    }
    return dates;
  });

  constructor() {
    this.service.fetchTimetable();
  }

  private dateKey(d: Date): string {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  dayDate(day: Weekday): Date {
    const ws = this.weekStart();
    const idx = DAYS.indexOf(day);
    const d = new Date(ws);
    d.setDate(d.getDate() + idx);
    return d;
  }

  navigateWeek(delta: number): void {
    this.weekOffset.update((v) => v + delta);
  }

  resetToToday(): void {
    this.weekOffset.set(0);
    this.selectedDate.set(new Date());
  }

  onDateSelected(date: Date): void {
    this.selectedDate.set(date);
    const diffDays = Math.floor((date.getTime() - this.today.getTime()) / 86400000);
    this.weekOffset.set(Math.round(diffDays / 7));
  }

  onFilterChange(type: 'teacher' | 'classroom', id: number): void {
    this.selectedFilterType.set(type);
    this.selectedFilterId.set(id);
    this.isFiltered.set(true);
    this.service.fetchMasterTimetable(type, id);
  }

  onTeacherSelect(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const id = parseInt(target.value, 10);
    if (id) {
      this.onFilterChange('teacher', id);
    }
  }

  onClassSelect(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const id = parseInt(target.value, 10);
    if (id) {
      this.onFilterChange('classroom', id);
    }
  }

  clearFilter(): void {
    this.selectedFilterType.set(null);
    this.selectedFilterId.set(null);
    this.isFiltered.set(false);
    this.service.clearMasterTimetable();
  }

  getSlotsForDay(day: Weekday): TimetableSlot[] {
    const dayCode = day.toUpperCase() as DayCode;
    return this.slots().filter((s) => s.day === dayCode);
  }

  getSlotsForCell(day: Weekday, time: string): TimetableSlot[] {
    return this.getSlotsForDay(day).filter((s) => s.time === time);
  }

  getSlotColor(slot: TimetableSlot): string {
    if (slot.color && slot.color.startsWith('#')) {
      return slot.color;
    }
    const colors: Record<string, string> = {
      MONDAY: '#2563eb',
      TUESDAY: '#7c3aed',
      WEDNESDAY: '#0891b2',
      THURSDAY: '#059669',
      FRIDAY: '#dc2626',
    };
    return colors[slot.day] ?? '#2563eb';
  }
}