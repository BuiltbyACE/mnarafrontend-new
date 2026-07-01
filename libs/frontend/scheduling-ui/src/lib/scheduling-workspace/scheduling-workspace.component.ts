import { Component, inject, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  SchedulingFacade,
  SchedulingApiService,
  TimetableVersion,
  TimetableEntry,
  BellSchedulePeriod,
  TeachingRequirement,
  BellSchedule,
  EntryDraft,
  ConflictError,
  DateVersionResponse,
  Teacher,
  YearLevel,
  validateEntryOptimistic,
} from '@sms/domain/scheduling';
import { TimetableGridComponent } from '../timetable-grid/timetable-grid.component';
import { OccurrenceTrayComponent } from '../occurrence-tray/occurrence-tray.component';
import { InspectorPanelComponent } from '../inspector-panel/inspector-panel.component';
import { ConflictPanelComponent } from '../conflict-panel/conflict-panel.component';
import { FilterBarComponent, FilterState } from '../filter-bar/filter-bar.component';
import { PublishDialogComponent } from '../publish-dialog/publish-dialog.component';
import { ConfirmRemoveDialogComponent, ConfirmRemoveData } from '../confirm-remove-dialog/confirm-remove-dialog.component';
import { firstValueFrom } from 'rxjs';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

@Component({
  selector: 'sched-scheduling-workspace',
  standalone: true,
  imports: [
    CommonModule,
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

      <!-- Date Navigation Bar -->
      <div class="date-bar">
        <div class="date-nav">
          <button class="nav-btn" (click)="previousWeek()" title="Previous week">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7l4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <label class="date-label">
            <input
              type="date"
              class="date-picker"
              [value]="viewDateInput()"
              (change)="onDatePicked($event)"
              title="Jump to date"
            />
          </label>
          <span class="date-label-text">{{ weekLabel() }}</span>
          <button class="nav-btn" (click)="nextWeek()" title="Next week">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <button class="today-btn" (click)="goToToday()">Today</button>
        </div>
        <div class="date-version">
          @if (resolvedVersion(); as v) {
            <span class="version-chip">{{ v.name }}</span>
          }
          @if (resolvedTerm(); as t) {
            <span class="term-label">{{ t.name }} &middot; {{ t.academic_year }}</span>
          }
        </div>
      </div>

      <!-- Period Type Legend -->
      <div class="period-legend">
        <span class="legend-label">Period Types:</span>
        <span class="legend-item legend-teaching">Teaching Block</span>
        <span class="legend-item legend-break">Break</span>
        <span class="legend-item legend-institutional">Institutional</span>
        <span class="legend-item legend-transition">Transition</span>
        <button class="legend-toggle" (click)="showBlocks.set(!showBlocks())">
          {{ showBlocks() ? 'Hide' : 'Show' }} Non-Teaching
        </button>
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
              [viewDate]="viewDate()"
              [conflicts]="currentConflicts()"
              [showNonTeachingBlocks]="showBlocks()"
              (slotClicked)="onSlotClicked($event)"
              (entryMoved)="onEntryMoved($event)"
              (entryRemoved)="onEntryRemoved($event)"
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

    /* Period Type Legend */
    .period-legend { display: flex; align-items: center; gap: 8px; padding: 4px 20px; background: var(--tt-surface, #ffffff); border-bottom: 1px solid var(--tt-border, #e9eef4); flex-wrap: wrap; }
    .legend-label { font-size: 0.6875rem; font-weight: 600; color: var(--tt-text-muted, #5e6f8d); margin-right: 4px; }
    .legend-item { font-size: 0.625rem; font-weight: 500; padding: 2px 8px; border-radius: 4px; }
    .legend-teaching { background: #e8edfb; color: #1a2a6c; }
    .legend-break { background: #fef3c7; color: #92400e; }
    .legend-institutional { background: #ede9fe; color: #5b21b6; }
    .legend-transition { background: #f1f5f9; color: #475569; }
    .legend-toggle { font-size: 0.625rem; font-weight: 600; padding: 2px 8px; border: 1px solid var(--tt-border, #e9eef4); border-radius: 4px; background: transparent; color: var(--tt-text-muted, #5e6f8d); cursor: pointer; margin-left: auto; transition: all 0.15s; }
    .legend-toggle:hover { border-color: var(--tt-primary-light, #2d4373); color: var(--tt-text, #0b1a2e); }

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

    .timetable-container { flex: 1; overflow: auto; padding: 8px; }

    /* Right Panel */
    .panel-right { width: 320px; min-width: 320px; border-left: 1px solid var(--tt-border, #e9eef4); background: var(--tt-surface, #ffffff); }
    .right-panel-sections { display: flex; flex-direction: column; height: 100%; }
    .right-section { flex: 1; overflow: hidden; border-bottom: 1px solid var(--tt-border, #e9eef4); }
    .right-section:last-child { border-bottom: none; }
    .inspector-section { flex: 0 0 auto; max-height: 50%; }

    /* Date Bar */
    .date-bar { display: flex; align-items: center; justify-content: space-between; padding: 8px 20px; background: var(--tt-surface, #ffffff); border-bottom: 1px solid var(--tt-border, #e9eef4); flex: 0 0 auto; }
    .date-nav { display: flex; align-items: center; gap: 6px; }
    .nav-btn { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border: 1px solid var(--tt-border, #e9eef4); border-radius: 8px; background: transparent; color: var(--tt-text, #0b1a2e); cursor: pointer; transition: all 0.15s ease; }
    .nav-btn:hover { border-color: var(--tt-primary-light, #2d4373); background: var(--tt-surface-alt, #f8faff); }
    .date-label { display: flex; align-items: center; }
    .date-picker { font-family: inherit; font-size: 0.75rem; padding: 3px 6px; border: 1px solid var(--tt-border, #e9eef4); border-radius: 6px; background: transparent; color: var(--tt-text, #0b1a2e); width: 130px; cursor: pointer; }
    .date-picker:hover, .date-picker:focus { border-color: var(--tt-primary-light, #2d4373); outline: none; }
    .date-picker::-webkit-calendar-picker-indicator { cursor: pointer; opacity: 0.6; }
    .date-label-text { font-size: 0.8125rem; font-weight: 600; color: var(--tt-text, #0b1a2e); min-width: 140px; text-align: center; user-select: none; }
    .today-btn { font-size: 0.6875rem; font-weight: 600; color: var(--tt-primary, #1a2a6c); background: var(--tt-primary-bg, #e8edfb); border: none; border-radius: 6px; padding: 4px 10px; cursor: pointer; transition: all 0.15s ease; white-space: nowrap; }
    .today-btn:hover { background: var(--tt-primary, #1a2a6c); color: white; }
    .date-version { display: flex; align-items: center; gap: 8px; }
    .version-chip { font-size: 0.6875rem; font-weight: 600; padding: 2px 8px; border-radius: 4px; background: var(--tt-primary-bg, #e8edfb); color: var(--tt-primary, #1a2a6c); }
    .term-label { font-size: 0.6875rem; color: var(--tt-text-muted, #5e6f8d); }

    /* Loading */
    .loading-overlay { position: absolute; inset: 0; background: rgba(255,255,255,0.6); display: flex; align-items: center; justify-content: center; z-index: 50; backdrop-filter: blur(2px); }
    .loading-spinner { width: 28px; height: 28px; border: 3px solid var(--tt-border, #e9eef4); border-top-color: var(--tt-primary, #1a2a6c); border-radius: 50%; animation: spin 0.6s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchedulingWorkspaceComponent implements OnInit {
  private facade = inject(SchedulingFacade);
  private api = inject(SchedulingApiService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  readonly viewDate = signal(this.getMonday(new Date()));
  readonly resolvedVersion = signal<TimetableVersion | null>(null);
  readonly resolvedTerm = signal<DateVersionResponse['term']>(null);

  readonly versions = toSignal(this.facade.versions$, { initialValue: [] });
  readonly entries = toSignal(this.facade.entries$, { initialValue: [] });
  readonly requirements = toSignal(this.facade.requirements$, { initialValue: [] });
  readonly bellSchedules = toSignal(this.facade.bellSchedules$, { initialValue: [] });
  readonly loading = toSignal(this.facade.loading$, { initialValue: false });

  readonly teachers = signal<Teacher[]>([]);
  readonly yearLevels = signal<YearLevel[]>([]);

  readonly showVersionMenu = signal(false);
  readonly selectedEntry = signal<TimetableEntry | null>(null);
  readonly currentConflicts = signal<ConflictError[]>([]);
  readonly showBlocks = signal(true);
  readonly activeScheduleId = signal<number | null>(null);

  readonly viewDateInput = computed(() => {
    const d = this.viewDate();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });

  readonly weekLabel = computed(() => {
    const d = this.viewDate();
    const end = new Date(d);
    end.setDate(end.getDate() + 4);
    const fmt = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fmt(d)} – ${fmt(end)}`;
  });

  readonly activeVersion = computed(() => {
    const versions = this.versions();
    return versions.length > 0 ? versions[0] : null;
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
    const teachers = this.teachers();
    if (teachers.length > 0) {
      return teachers.map(t => ({ id: t.id, name: t.name }));
    }
    const entries = this.entries();
    const teacherIds = [...new Set(entries.map(e => e.teacher_id))];
    return teacherIds.map(id => ({ id, name: `Teacher #${id}` }));
  });

  readonly yearLevelOptions = computed(() => {
    const yls = this.yearLevels();
    if (yls.length > 0) {
      return yls.map(yl => ({ id: yl.id, name: yl.name }));
    }
    const entries = this.entries();
    const levelIds = [...new Set(entries.map(e => e.year_level))];
    return levelIds.map(id => ({ id, name: `Year ${id}` }));
  });

  readonly canPublish = computed(() => {
    const version = this.activeVersion();
    return version?.status === 'DRAFT';
  });

  ngOnInit(): void {
    this.resolveAndLoad();
    this.facade.loadBellSchedules();
    this.loadDropdowns();
  }

  private loadDropdowns(): void {
    this.api.getTeachers().subscribe({
      next: (teachers) => this.teachers.set(teachers),
      error: () => {/* fallback to entries-based extraction */},
    });
    this.api.getYearLevels().subscribe({
      next: (yls) => this.yearLevels.set(yls),
      error: () => {/* fallback to entries-based extraction */},
    });
  }

  previousWeek(): void {
    const d = new Date(this.viewDate());
    d.setDate(d.getDate() - 7);
    this.viewDate.set(d);
    this.resolveAndLoad();
  }

  nextWeek(): void {
    const d = new Date(this.viewDate());
    d.setDate(d.getDate() + 7);
    this.viewDate.set(d);
    this.resolveAndLoad();
  }

  goToToday(): void {
    this.viewDate.set(this.getMonday(new Date()));
    this.resolveAndLoad();
  }

  onDatePicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.value) return;
    const picked = new Date(input.value + 'T00:00:00');
    this.viewDate.set(this.getMonday(picked));
    this.resolveAndLoad();
  }

  private resolveAndLoad(): void {
    const dateStr = this.viewDateInput();
    this.api.getVersionForDate(dateStr).subscribe({
      next: (response) => {
        this.resolvedVersion.set(response.version);
        this.resolvedTerm.set(response.term);

        if (response.version) {
          const termId = response.term?.id;
          if (termId) {
            this.facade.loadVersions(termId);
            this.facade.loadRequirements(termId, response.version.id);
          }
          this.facade.setActiveVersion(response.version.id);
          this.facade.loadEntries(response.version.id);
        } else {
          // Fallback: no published version for this date — try loading DRAFT versions
          const termId = response.term?.id;
          if (termId) {
            this.facade.loadVersions(termId);
            this.facade.loadRequirements(termId);
          } else {
            // No term at all — try loading all versions
            this.facade.loadVersions();
          }
        }
      },
      error: () => {
        this.resolvedVersion.set(null);
        this.resolvedTerm.set(null);
        // Fallback: try loading versions anyway
        this.facade.loadVersions();
      },
    });
  }

  selectSchedule(id: number): void {
    this.activeScheduleId.set(id);
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
    this.selectedEntry.set(null);
  }

  async onEntryRemoved(event: { entry: TimetableEntry; revert: () => void }): Promise<void> {
    const entry = event.entry;
    const period = this.bellPeriods().find(p => p.id === entry.bell_schedule_period);
    const teacher = this.teachers().find(t => t.id === entry.teacher_id);
    const yearLevel = this.yearLevels().find(yl => yl.id === entry.year_level);
    const dayName = DAY_NAMES[entry.day_of_week] ?? `Day ${entry.day_of_week}`;

    const data: ConfirmRemoveData = {
      subjectName: entry.subject_name || 'Lesson',
      periodLabel: period?.label ?? `Period #${entry.bell_schedule_period}`,
      dayName,
      teacherName: teacher?.name ?? '',
      yearLevelName: yearLevel?.name ?? '',
    };

    const dialogRef = this.dialog.open(ConfirmRemoveDialogComponent, { data, width: '420px' });
    const result = await firstValueFrom(dialogRef.afterClosed());

    if (result) {
      this.facade.deleteEntry(entry.id);
      this.selectedEntry.set(null);
      this.snackBar.open('Lesson removed', 'Dismiss', {
        duration: 2000,
        panelClass: 'success-snackbar',
      });
    } else {
      event.revert();
    }
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

  private getMonday(d: Date): Date {
    const date = new Date(d);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diff);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  focusEntry(entryId: number): void {
    const entry = this.entries().find(e => e.id === entryId);
    if (entry) {
      this.selectedEntry.set(entry);
    }
  }
}
