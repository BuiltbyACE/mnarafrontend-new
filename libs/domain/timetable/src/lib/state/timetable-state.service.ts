import { Injectable, signal, computed } from '@angular/core';
import { TimetableEntry } from '../models/timetable-entry.model';
import { TieredPeriod } from '../models/timetable-slot.model';
import { TimetableFilter } from '../models/timetable-filter.model';
import { TimetableConflict } from '../models/timetable-conflict.model';
import { TimetableEvent } from '../models/timetable-event.model';
import { TimetableVersion, VersionCompareResult, AuditLogEntry } from '../models/timetable-version.model';

type GridMap = Map<number, Map<number, TimetableEntry>>;

@Injectable({ providedIn: 'root' })
export class TimetableStateService {
  readonly entries = signal<TimetableEntry[]>([]);
  readonly events = signal<TimetableEvent[]>([]);
  readonly activePeriods = signal<TieredPeriod[]>([]);
  readonly selectedDay = signal<number>(new Date().getDay() - 1);
  readonly activeFilter = signal<TimetableFilter>({});
  readonly conflicts = signal<TimetableConflict[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  readonly versions = signal<TimetableVersion[]>([]);
  readonly activeVersion = signal<TimetableVersion | null>(null);
  readonly compareResult = signal<VersionCompareResult | null>(null);
  readonly auditLog = signal<AuditLogEntry[]>([]);

  readonly gridMap = computed<GridMap>(() => {
    const map: GridMap = new Map();
    for (const entry of this.entries()) {
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

  setEvents(events: TimetableEvent[]): void {
    this.events.set(events);
  }

  setBellSchedule(periods: TieredPeriod[]): void {
    this.activePeriods.set(periods);
  }

  setSelectedDay(day: number): void {
    this.selectedDay.set(day);
  }

  setFilter(filter: TimetableFilter): void {
    this.activeFilter.set(filter);
  }

  setConflicts(conflicts: TimetableConflict[]): void {
    this.conflicts.set(conflicts);
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

  setVersions(versions: TimetableVersion[]): void {
    this.versions.set(versions);
  }

  setActiveVersion(version: TimetableVersion | null): void {
    this.activeVersion.set(version);
  }

  updateVersion(updated: TimetableVersion): void {
    this.versions.update((list) =>
      list.map((v) => (v.id === updated.id ? updated : v))
    );
    if (this.activeVersion()?.id === updated.id) {
      this.activeVersion.set(updated);
    }
  }

  setCompareResult(result: VersionCompareResult | null): void {
    this.compareResult.set(result);
  }

  setAuditLog(entries: AuditLogEntry[]): void {
    this.auditLog.set(entries);
  }

  reset(): void {
    this.entries.set([]);
    this.events.set([]);
    this.activePeriods.set([]);
    this.conflicts.set([]);
    this.error.set(null);
    this.isLoading.set(false);
    this.versions.set([]);
    this.activeVersion.set(null);
    this.compareResult.set(null);
    this.auditLog.set([]);
  }
}
