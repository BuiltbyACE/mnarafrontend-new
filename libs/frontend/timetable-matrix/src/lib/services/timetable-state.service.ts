import { Injectable, signal, computed } from '@angular/core';
import { TieredPeriod } from '../models/bell-schedule.model';
import { TimetableEntry } from '../models/timetable-entry.model';

type GridMap = Map<number, Map<number, TimetableEntry>>;

@Injectable({ providedIn: 'root' })
export class TimetableStateService {
  readonly entries = signal<TimetableEntry[]>([]);
  readonly activePeriods = signal<TieredPeriod[]>([]);
  readonly selectedDay = signal<number>(new Date().getDay() - 1);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  readonly gridMap = computed<GridMap>(() => {
    const map: GridMap = new Map();
    const entries = this.entries();
    for (const entry of entries) {
      const periodId = entry.tiered_period;
      const day = entry.day_of_week;
      if (!map.has(periodId)) {
        map.set(periodId, new Map());
      }
      map.get(periodId)!.set(day, entry);
    }
    return map;
  });

  readonly totalEntries = computed(() => this.entries().length);

  setEntries(entries: TimetableEntry[]): void {
    this.entries.set(entries);
    this.error.set(null);
  }

  setBellSchedule(periods: TieredPeriod[]): void {
    this.activePeriods.set(periods);
  }

  setSelectedDay(day: number): void {
    this.selectedDay.set(day);
  }

  setLoading(loading: boolean): void {
    this.isLoading.set(loading);
  }

  setError(err: string | null): void {
    this.error.set(err);
  }

  addEntry(entry: TimetableEntry): void {
    this.entries.update((current) => [...current, entry]);
  }

  removeEntry(entryId: number): void {
    this.entries.update((current) => current.filter((e) => e.id !== entryId));
  }

  updateEntry(entryId: number, updates: Partial<TimetableEntry>): void {
    this.entries.update((current) =>
      current.map((e) => (e.id === entryId ? { ...e, ...updates } : e))
    );
  }

  getEntriesForDay(day: number): TimetableEntry[] {
    return this.entries().filter((e) => e.day_of_week === day);
  }

  getEntriesForPeriod(periodId: number): TimetableEntry[] {
    return this.entries().filter((e) => e.tiered_period === periodId);
  }
}
