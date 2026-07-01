import { Component, inject, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { toSignal } from '@angular/core/rxjs-interop';
import { DragDropModule } from '@angular/cdk/drag-drop';
import {
  SchedulingFacade,
  TimetableVersion,
  TimetableEntry,
  BellSchedulePeriod,
  TeachingRequirement,
  BellSchedule,
  EntryDraft,
  ConflictError,
  validateEntryOptimistic,
} from '@sms/domain/scheduling';
import { TimetableGridComponent } from '../timetable-grid/timetable-grid.component';
import { OccurrenceTrayComponent } from '../occurrence-tray/occurrence-tray.component';
import { InspectorPanelComponent } from '../inspector-panel/inspector-panel.component';
import { ConflictPanelComponent } from '../conflict-panel/conflict-panel.component';
import { FilterBarComponent, FilterState } from '../filter-bar/filter-bar.component';
import { PublishDialogComponent } from '../publish-dialog/publish-dialog.component';
import { firstValueFrom } from 'rxjs';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

@Component({
  selector: 'sched-scheduling-workspace',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    TimetableGridComponent,
    OccurrenceTrayComponent,
    InspectorPanelComponent,
    ConflictPanelComponent,
    FilterBarComponent,
  ],
  template: `
    <div class="workspace" [class.loading]="loading()">
      <!-- Toolbar -->
      <div class="toolbar">
        <div class="toolbar-left">
          <div class="brand-mark">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="2" width="16" height="16" rx="4" stroke="currentColor" stroke-width="1.5"/>
              <path d="M6 7h8M6 10h6M6 13h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
            </svg>
          </div>
          <h1 class="toolbar-title">Timetable Builder</h1>
          <div class="toolbar-divider"></div>
          <div class="version-selector">
            <button class="version-btn" (click)="toggleVersionMenu()">
              <span class="version-label">{{ activeVersion()?.status || 'No Version' }}</span>
              <span class="version-name">{{ activeVersion()?.notes || 'Select a version' }}</span>
              <svg width="10" height="6" viewBox="0 0 10 6"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            @if (showVersionMenu()) {
              <div class="version-dropdown">
                @for (v of versions(); track v.id) {
                  <button
                    class="version-option"
                    [class.active]="v.id === activeVersion()?.id"
                    (click)="selectVersion(v)">
                    <span class="vo-status" [class]="v.status.toLowerCase()">{{ v.status }}</span>
                    <span class="vo-name">{{ v.notes || 'Version ' + v.id }}</span>
                    <span class="vo-count">{{ v.entry_count }} lessons</span>
                  </button>
                }
                @if (versions().length === 0) {
                  <div class="version-empty">No versions available</div>
                }
              </div>
            }
          </div>
        </div>
        <div class="toolbar-actions">
          <button class="action-btn primary" (click)="publishVersion()" [disabled]="!canPublish()">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v7m0 0l-2-2m2 2l2-2M2 9v2a1 1 0 001 1h8a1 1 0 001-1V9" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Publish
          </button>
          <button class="action-btn secondary" (click)="validateEntries()">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v7m0 0l-2-2m2 2l2-2M2 9v2a1 1 0 001 1h8a1 1 0 001-1V9" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Validate
          </button>
          <button class="action-btn ghost" (click)="refreshData()" [disabled]="loading()">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7a6 6 0 0111.5-2.5M13 7a6 6 0 01-11.5 2.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M9 4.5h3.5V1M5 9.5H1.5V13" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Refresh
          </button>
        </div>
      </div>

      <!-- Filter Bar -->
      <sched-filter-bar
        [teacherOptions]="teacherOptions()"
        [yearLevelOptions]="yearLevelOptions()"
        (filterChange)="onFilterChange($event)">
      </sched-filter-bar>

      <!-- Main Content: Three-panel layout -->
      <div class="workspace-body">
        <!-- Left Panel: Occurrence Tray -->
        <div class="panel panel-left">
          <sched-occurrence-tray
            [requirements]="requirements()">
          </sched-occurrence-tray>
        </div>

        <!-- Center Panel: Timetable Grid -->
        <div class="panel panel-center">
          @if (bellSchedules().length > 1) {
            <div class="schedule-tabs">
              @for (sched of bellSchedules(); track sched.id) {
                <button
                  class="schedule-tab"
                  [class.active]="sched.id === activeScheduleId()"
                  (click)="selectSchedule(sched.id)">
                  {{ sched.name }}
                </button>
              }
            </div>
          }
          <div class="timetable-container">
            <sched-timetable-grid
              [mode]="activeVersion()?.status === 'PUBLISHED' ? 'published' : 'draft'"
              [entries]="filteredEntries()"
              [periods]="activeBellPeriods()"
              [viewDate]="viewDate"
              [conflicts]="currentConflicts()"
              [showNonTeachingBlocks]="showBlocks()"
              (slotClicked)="onSlotClicked($event)"
              (entryMoved)="onEntryMoved($event)"
              (entryClicked)="onEntryClicked($event)">
            </sched-timetable-grid>
          </div>
        </div>

        <!-- Right Panel: Inspector + Conflicts -->
        <div class="panel panel-right">
          <div class="right-panel-sections">
            <div class="right-section inspector-section">
              <sched-inspector-panel
                [selectedEntry]="selectedEntry()"
                [periods]="bellPeriods()"
                [requirements]="requirements()"
                (deleteEntry)="onDeleteEntry($event)">
              </sched-inspector-panel>
            </div>
            <div class="right-section">
              <sched-conflict-panel
                [errors]="currentConflicts()"
                (focusEntryId)="focusEntry($event)">
              </sched-conflict-panel>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading Overlay -->
      @if (loading()) {
        <div class="loading-overlay">
          <div class="loading-spinner"></div>
        </div>
      }

      <!-- Deerflow Signature -->
      <a href="https://deerflow.tech" target="_blank" class="deerflow-badge" title="Created By Deerflow">✦ Deerflow</a>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .workspace { display: flex; flex-direction: column; height: 100%; background: var(--tt-bg, #f1f4f9); position: relative; }

    /* Toolbar */
    .toolbar { display: flex; align-items: center; justify-content: space-between; padding: 0 20px; height: 56px; background: var(--tt-surface, #ffffff); border-bottom: 1px solid var(--tt-border, #e9eef4); }
    .toolbar-left { display: flex; align-items: center; gap: 12px; }
    .brand-mark { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 10px; background: var(--tt-primary, #1a2a6c); color: white; }
    .toolbar-title { font-size: 1rem; font-weight: 700; color: var(--tt-text, #0b1a2e); letter-spacing: -0.02em; }
    .toolbar-divider { width: 1px; height: 24px; background: var(--tt-border, #e9eef4); }
    .version-selector { position: relative; }
    .version-btn { display: flex; align-items: center; gap: 8px; padding: 6px 12px; background: var(--tt-surface-alt, #f8faff); border: 1px solid var(--tt-border, #e9eef4); border-radius: 10px; cursor: pointer; transition: all 0.15s ease; }
    .version-btn:hover { border-color: var(--tt-primary-light, #2d4373); }
    .version-label { font-size: 0.625rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--tt-primary, #1a2a6c); background: var(--tt-primary-bg, #e8edfb); padding: 1px 6px; border-radius: 4px; }
    .version-name { font-size: 0.8125rem; font-weight: 500; color: var(--tt-text, #0b1a2e); }
    .version-dropdown { position: absolute; top: calc(100% + 4px); left: 0; min-width: 280px; background: var(--tt-surface, #ffffff); border: 1px solid var(--tt-border, #e9eef4); border-radius: 12px; box-shadow: var(--tt-shadow-elevated, 0 4px 6px rgba(0,0,0,0.04), 0 10px 30px rgba(0,0,0,0.08)); z-index: 100; padding: 4px; }
    .version-option { display: flex; align-items: center; gap: 8px; width: 100%; padding: 8px 12px; border: none; background: transparent; border-radius: 8px; cursor: pointer; transition: background 0.1s ease; text-align: left; }
    .version-option:hover { background: var(--tt-surface-alt, #f8faff); }
    .version-option.active { background: var(--tt-primary-bg, #e8edfb); }
    .vo-status { font-size: 0.625rem; font-weight: 700; padding: 1px 6px; border-radius: 4px; text-transform: uppercase; }
    .vo-status.draft { background: #fef3c7; color: #b45309; }
    .vo-status.published { background: #dcfce7; color: #15803d; }
    .vo-status.archived { background: #f1f5f9; color: #64748b; }
    .vo-name { flex: 1; font-size: 0.8125rem; font-weight: 500; color: var(--tt-text, #0b1a2e); }
    .vo-count { font-size: 0.6875rem; color: var(--tt-text-muted, #5e6f8d); }
    .version-empty { padding: 16px; text-align: center; color: var(--tt-text-faint, #64748b); font-size: 0.75rem; }
    .toolbar-actions { display: flex; align-items: center; gap: 6px; }
    .action-btn { display: flex; align-items: center; gap: 5px; padding: 7px 14px; font-size: 0.75rem; font-weight: 600; border: none; border-radius: 10px; cursor: pointer; transition: all 0.15s ease; }
    .action-btn.primary { background: var(--tt-primary, #1a2a6c); color: white; }
    .action-btn.primary:hover:not(:disabled) { background: var(--tt-primary-dark, #14225a); box-shadow: var(--tt-shadow-primary-hover); }
    .action-btn.secondary { background: var(--tt-surface-alt, #f8faff); color: var(--tt-text, #0b1a2e); border: 1px solid var(--tt-border, #e9eef4); }
    .action-btn.secondary:hover:not(:disabled) { border-color: var(--tt-primary-light, #2d4373); }
    .action-btn.ghost { background: transparent; color: var(--tt-text-muted, #5e6f8d); }
    .action-btn.ghost:hover:not(:disabled) { background: var(--tt-surface-alt, #f8faff); color: var(--tt-text, #0b1a2e); }
    .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Body */
    .workspace-body { flex: 1; display: flex; overflow: hidden; gap: 0; }
    .panel { display: flex; flex-direction: column; }
    .panel-left { width: 280px; min-width: 280px; background: var(--tt-surface, #ffffff); border-right: 1px solid var(--tt-border, #e9eef4); }
    .panel-center { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: var(--tt-surface, #ffffff); margin: 0; }

    /* Schedule Tabs */
    .schedule-tabs { display: flex; gap: 4px; padding: 8px 16px 0; border-bottom: 1px solid var(--tt-border, #e9eef4); overflow-x: auto; }
    .schedule-tab { font-size: 0.75rem; font-weight: 600; padding: 6px 14px; border: 1px solid transparent; border-bottom: none; border-radius: 8px 8px 0 0; background: transparent; color: var(--tt-text-muted, #5e6f8d); cursor: pointer; transition: all 0.15s ease; white-space: nowrap; }
    .schedule-tab:hover { color: var(--tt-text, #0b1a2e); background: var(--tt-surface-alt, #f8faff); }
    .schedule-tab.active { color: var(--tt-primary, #1a2a6c); background: var(--tt-surface, #ffffff); border-color: var(--tt-border, #e9eef4); margin-bottom: -1px; }

    /* Day Headers */
    .day-headers { display: none; }
    .timetable-container { flex: 1; overflow: auto; padding: 8px; }

    /* Right Panel */
    .panel-right { width: 320px; min-width: 320px; border-left: 1px solid var(--tt-border, #e9eef4); background: var(--tt-surface, #ffffff); }
    .right-panel-sections { display: flex; flex-direction: column; height: 100%; }
    .right-section { flex: 1; overflow: hidden; border-bottom: 1px solid var(--tt-border, #e9eef4); }
    .right-section:last-child { border-bottom: none; }
    .inspector-section { flex: 0 0 auto; max-height: 50%; }

    /* Loading */
    .loading-overlay { position: absolute; inset: 0; background: rgba(255,255,255,0.6); display: flex; align-items: center; justify-content: center; z-index: 50; backdrop-filter: blur(2px); }
    .loading-spinner { width: 28px; height: 28px; border: 3px solid var(--tt-border, #e9eef4); border-top-color: var(--tt-primary, #1a2a6c); border-radius: 50%; animation: spin 0.6s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Deerflow */
    .deerflow-badge { position: fixed; bottom: 12px; right: 12px; font-size: 0.625rem; color: var(--tt-text-faint, #64748b); text-decoration: none; opacity: 0.5; transition: all 0.2s ease; letter-spacing: 0.03em; z-index: 100; padding: 4px 8px; border-radius: 6px; background: rgba(255,255,255,0.8); backdrop-filter: blur(4px); }
    .deerflow-badge:hover { opacity: 1; color: var(--tt-primary, #1a2a6c); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchedulingWorkspaceComponent implements OnInit {
  private facade = inject(SchedulingFacade);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  readonly viewDate = new Date();

  // Signals from facade
  readonly versions = toSignal(this.facade.versions$, { initialValue: [] });
  readonly entries = toSignal(this.facade.entries$, { initialValue: [] });
  readonly requirements = toSignal(this.facade.requirements$, { initialValue: [] });
  readonly bellSchedules = toSignal(this.facade.bellSchedules$, { initialValue: [] });
  readonly loading = toSignal(this.facade.loading$, { initialValue: false });

  readonly showVersionMenu = signal(false);
  readonly selectedEntry = signal<TimetableEntry | null>(null);
  readonly currentConflicts = signal<ConflictError[]>([]);
  readonly showBlocks = signal(true);
  readonly activeScheduleId = signal<number | null>(null);

  readonly activeVersion = computed(() => {
    const versions = this.versions();
    // In real app, get from activeVersionId selector
    return versions.length > 0 ? versions[0] : null;
  });

  readonly weekDays = computed(() => {
    const monday = this.getMonday(this.viewDate);
    return Array.from({ length: 5 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(date.getDate() + i);
      return {
        name: DAY_NAMES[i],
        dateStr: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        isToday: date.toDateString() === new Date().toDateString(),
      };
    });
  });

  readonly bellPeriods = computed(() => {
    const schedules = this.bellSchedules();
    if (schedules.length === 0) return [];
    const activeId = this.activeScheduleId();
    const schedule = activeId
      ? schedules.find(s => s.id === activeId)
      : schedules[0];
    return schedule?.periods ?? [];
  });

  readonly activeBellPeriods = this.bellPeriods;

  readonly filteredEntries = computed(() => {
    return this.entries();
  });

  readonly teacherOptions = computed(() => {
    const entries = this.entries();
    const teacherIds = [...new Set(entries.map(e => e.teacher_id))];
    return teacherIds.map(id => ({ id, name: `Teacher #${id}` }));
  });

  readonly yearLevelOptions = computed(() => {
    const entries = this.entries();
    const levelIds = [...new Set(entries.map(e => e.year_level))];
    return levelIds.map(id => ({ id, name: `Year ${id}` }));
  });

  readonly canPublish = computed(() => {
    const version = this.activeVersion();
    return version?.status === 'DRAFT';
  });

  ngOnInit(): void {
    this.loadInitialData();
  }

  private loadInitialData(): void {
    this.facade.loadVersions(1);
    this.facade.loadBellSchedules();
    this.facade.loadRequirements(1);
  }

  selectSchedule(id: number): void {
    this.activeScheduleId.set(id);
  }

  private getMonday(d: Date): Date {
    const date = new Date(d);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diff);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  toggleVersionMenu(): void {
    this.showVersionMenu.update(v => !v);
  }

  selectVersion(v: TimetableVersion): void {
    this.facade.setActiveVersion(v.id);
    this.facade.loadEntries(v.id);
    this.facade.loadRequirements(v.term, v.id);
    this.showVersionMenu.set(false);
    this.selectedEntry.set(null);
    this.currentConflicts.set([]);
  }

  onSlotClicked(event: { period: BellSchedulePeriod; day: number }): void {
    // Slot clicked - create entry flow
    this.selectedEntry.set(null);
  }

  onEntryMoved(draft: EntryDraft): void {
    if (!this.activeVersion()) return;

    const updatedDraft: EntryDraft = {
      ...draft,
      timetable_version_id: this.activeVersion()!.id,
    };

    const validation = validateEntryOptimistic(
      updatedDraft,
      this.entries(),
      this.bellPeriods(),
    );

    if (!validation.valid) {
      this.currentConflicts.set(validation.errors);
      this.snackBar.open('Cannot place lesson here due to conflicts', 'Dismiss', {
        duration: 3000,
        panelClass: 'error-snackbar',
      });
      return;
    }

    this.currentConflicts.set([]);
    this.facade.addEntry(updatedDraft);
  }

  onEntryClicked(entry: TimetableEntry): void {
    this.selectedEntry.set(entry);
  }

  onDeleteEntry(id: number): void {
    this.facade.deleteEntry(id);
    this.selectedEntry.set(null);
    this.snackBar.open('Lesson removed', 'Dismiss', {
      duration: 2000,
      panelClass: 'success-snackbar',
    });
  }

  onFilterChange(filters: FilterState): void {
    const f = filters.teacherId || filters.yearLevelId
      ? { teacherId: filters.teacherId ?? undefined, yearLevelId: filters.yearLevelId ?? undefined }
      : null;
    this.facade.setFilters(f);
  }

  async publishVersion(): Promise<void> {
    const version = this.activeVersion();
    if (!version) return;

    const dialogRef = this.dialog.open(PublishDialogComponent, {
      data: {
        version,
        requirements: this.requirements(),
        entryCount: this.entries().length,
      },
      width: '480px',
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result) {
      this.facade.publishVersion(version.id);
      this.snackBar.open('Timetable published!', 'OK', {
        duration: 3000,
        panelClass: 'success-snackbar',
      });
    }
  }

  validateEntries(): void {
    const entries = this.entries();
    const allConflicts: ConflictError[] = [];

    for (const entry of entries) {
      const draft: EntryDraft = {
        course_workspace_id: entry.course_workspace,
        bell_schedule_period_id: entry.bell_schedule_period,
        day_of_week: entry.day_of_week,
        year_level_id: entry.year_level,
        timetable_version_id: entry.timetable_version,
        teacher_id: entry.teacher_id,
      };

      const validation = validateEntryOptimistic(draft, entries, this.bellPeriods());
      allConflicts.push(...validation.errors);
    }

    this.currentConflicts.set(allConflicts);

    if (allConflicts.length === 0) {
      this.snackBar.open('No conflicts detected', 'OK', {
        duration: 2000,
        panelClass: 'success-snackbar',
      });
    } else {
      this.snackBar.open(`${allConflicts.length} conflict(s) found`, 'View', {
        duration: 4000,
        panelClass: 'error-snackbar',
      });
    }
  }

  refreshData(): void {
    const version = this.activeVersion();
    if (version) {
      this.facade.loadEntries(version.id);
      this.facade.loadRequirements(version.term, version.id);
    }
    this.facade.loadBellSchedules();
  }

  focusEntry(entryId: number): void {
    const entry = this.entries().find(e => e.id === entryId);
    if (entry) {
      this.selectedEntry.set(entry);
    }
  }
}
