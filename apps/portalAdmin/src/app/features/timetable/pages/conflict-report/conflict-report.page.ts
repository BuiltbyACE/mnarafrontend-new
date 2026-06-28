import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  TimetableApiService,
  TimetableStateService,
  TimetableConflict,
} from '@sms/domain/timetable';
import { VersionStatusBadgeComponent } from '../../components/version-status-badge/version-status-badge.component';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const CONFLICT_CONFIG: Record<string, { label: string; severity: 'ERROR' | 'WARNING'; icon: string; desc: string }> = {
  TEACHER:         { label: 'Teacher Double-Booking', severity: 'ERROR',   icon: 'person',            desc: 'Same teacher assigned to multiple classes at the same time' },
  YEAR_GROUP:      { label: 'Class Conflict',          severity: 'ERROR',   icon: 'group',             desc: 'Multiple lessons scheduled for the same class simultaneously' },
  ROOM:            { label: 'Room Conflict',            severity: 'ERROR',   icon: 'meeting_room',      desc: 'Same room assigned to multiple lessons at the same time' },
  AVAILABILITY:    { label: 'Availability Warning',     severity: 'WARNING', icon: 'event_busy',        desc: 'Teacher or resource may not be available during this time' },
  CAPACITY:        { label: 'Capacity Warning',         severity: 'WARNING', icon: 'people_outline',    desc: 'Class size exceeds room capacity' },
  PROTECTED_BLOCK: { label: 'Protected Block',          severity: 'WARNING', icon: 'lock',              desc: 'Lesson conflicts with a protected time block' },
};

type DismissalKind = 'ignored' | 'resolved';

function conflictKey(c: TimetableConflict): string {
  return `${c.entry_a_id ?? 0}-${c.entry_b_id ?? 0}-${c.conflict_type}`;
}

@Component({
  selector: 'app-conflict-report',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    DatePipe,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTooltipModule,
    VersionStatusBadgeComponent,
  ],
  template: `
    <div class="min-h-screen p-6">
      <div class="max-w-[1400px] mx-auto">

        <!-- Header -->
        <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Conflict Report</h1>
              @if (visibleConflicts().length > 0 && !loading()) {
                <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold"
                      [class.bg-red-100]="errorCount() > 0"
                      [class.text-red-700]="errorCount() > 0"
                      [class.bg-amber-100]="errorCount() === 0"
                      [class.text-amber-700]="errorCount() === 0">
                  {{ visibleConflicts().length }}
                  {{ visibleConflicts().length === 1 ? 'conflict' : 'conflicts' }}
                </span>
              }
            </div>
            <p class="text-sm text-slate-500 mt-1">
              Review and manage timetable conflicts
              @if (dismissedCount() > 0) {
                <span class="text-slate-400">· {{ dismissedCount() }} dismissed</span>
              }
            </p>
          </div>
          <div class="flex items-center gap-2">
            @if (dismissedCount() > 0) {
              <button mat-stroked-button (click)="restoreAll()" class="!text-xs">
                <mat-icon class="text-sm">undo</mat-icon>
                Restore all
              </button>
            }
            <button mat-flat-button color="primary" (click)="refresh()" [disabled]="loading()">
              <mat-icon class="text-base">refresh</mat-icon>
              {{ loading() ? 'Refreshing…' : 'Refresh' }}
            </button>
          </div>
        </div>

        <!-- Version selector -->
        <div class="rounded-2xl border border-slate-200 bg-white p-4 mb-6">
          @if (loadingVersions()) {
            <div class="h-12 w-64 rounded-xl bg-slate-100 animate-pulse"></div>
          } @else {
            <mat-form-field appearance="outline" class="w-64" subscriptSizing="dynamic">
              <mat-label>Timetable Version</mat-label>
              <mat-select [ngModel]="selectedVersionId()" (ngModelChange)="onVersionChange($event)">
                @for (v of state.versions(); track v.id) {
                  <mat-option [value]="v.id">
                    <div class="flex items-center gap-2">
                      <app-version-status-badge [status]="v.status" />
                      <span class="truncate">{{ v.name }}</span>
                    </div>
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>
          }
        </div>

        <!-- Loading state -->
        @if (loading()) {
          <div class="flex flex-col items-center justify-center py-20 text-slate-400">
            <div class="h-10 w-10 rounded-full border-[3px] border-blue-500 border-t-transparent animate-spin mb-4"></div>
            <p class="text-sm font-semibold">Running conflict checks…</p>
            <p class="text-xs mt-1 text-slate-400">Analysing all timetable entries for overlaps</p>
          </div>
        } @else if (errorMessage(); as err) {
          <!-- Error -->
          <div class="flex flex-col items-center justify-center py-20">
            <mat-icon class="text-5xl text-red-300 mb-3">error_outline</mat-icon>
            <p class="text-sm font-medium text-slate-600">Failed to check conflicts</p>
            <p class="text-xs text-slate-400 mt-1">{{ err }}</p>
            <button mat-stroked-button (click)="refresh()" class="mt-4">Try Again</button>
          </div>
        } @else if (allConflicts().length === 0) {
          <!-- Empty -->
          <div class="rounded-2xl border border-slate-200 bg-white flex flex-col items-center justify-center py-20">
            <mat-icon class="text-6xl text-green-300 mb-3">check_circle_outline</mat-icon>
            <p class="text-lg font-semibold text-green-700">No conflicts found</p>
            <p class="text-sm text-slate-500 mt-1">All timetable entries are properly scheduled.</p>
            <a mat-stroked-button routerLink="/admin/timetable/editor" class="mt-4">
              <mat-icon class="text-sm">edit</mat-icon> Back to Editor
            </a>
          </div>
        } @else {
          <!-- Type summary chips -->
          <div class="flex flex-wrap gap-2 mb-5">
            @for (entry of summaryByType(); track entry.type) {
              <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold"
                   [class.bg-red-50]="entry.severity === 'ERROR'"
                   [class.text-red-700]="entry.severity === 'ERROR'"
                   [class.border-red-200]="entry.severity === 'ERROR'"
                   [class.bg-amber-50]="entry.severity === 'WARNING'"
                   [class.text-amber-700]="entry.severity === 'WARNING'"
                   [class.border-amber-200]="entry.severity === 'WARNING'">
                <mat-icon class="text-sm">{{ entry.icon }}</mat-icon>
                {{ entry.label }}
                <span class="ml-0.5 font-bold">{{ entry.count }}</span>
              </div>
            }
          </div>

          <!-- Conflict cards grouped -->
          @for (group of groupedConflicts(); track group.type) {
            <div class="mb-6">
              <div class="flex items-center gap-2.5 mb-3 px-1">
                <div class="w-7 h-7 rounded-lg flex items-center justify-center"
                     [class.bg-red-100]="group.severity === 'ERROR'"
                     [class.bg-amber-100]="group.severity === 'WARNING'">
                  <mat-icon class="text-sm"
                            [class.text-red-600]="group.severity === 'ERROR'"
                            [class.text-amber-600]="group.severity === 'WARNING'">
                    {{ group.icon }}
                  </mat-icon>
                </div>
                <span class="text-sm font-semibold text-slate-700">{{ group.label }}</span>
                <span class="text-xs font-medium text-slate-400">({{ group.items.length }})</span>
                <span class="text-[10px] text-slate-400 font-normal ml-1 hidden sm:inline">· {{ group.desc }}</span>
              </div>
              <div class="space-y-2">
                @for (c of group.items; track conflictKey(c)) {
                  @let ckey = conflictKey(c);
                  @let isExpanded = expandedCards().has(ckey);
                  <div class="rounded-2xl border transition-all duration-150"
                       [class.bg-red-50]="group.severity === 'ERROR' && !dismissals()[ckey]"
                       [class.border-red-200]="group.severity === 'ERROR' && !dismissals()[ckey]"
                       [class.bg-amber-50]="group.severity === 'WARNING' && !dismissals()[ckey]"
                       [class.border-amber-200]="group.severity === 'WARNING' && !dismissals()[ckey]"
                       [class.bg-slate-50]="dismissals()[ckey]"
                       [class.border-slate-200]="dismissals()[ckey]"
                       [class.opacity-60]="dismissals()[ckey]"
                       [class.hover:shadow-sm]="!dismissals()[ckey]">

                    <div class="p-4 flex items-start gap-3">
                      <!-- Severity icon -->
                      <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                           [class.bg-red-100]="group.severity === 'ERROR'"
                           [class.text-red-600]="group.severity === 'ERROR'"
                           [class.bg-amber-100]="group.severity === 'WARNING'"
                           [class.text-amber-600]="group.severity === 'WARNING'"
                           [class.bg-slate-100]="dismissals()[ckey]"
                           [class.text-slate-400]="dismissals()[ckey]">
                        <mat-icon class="text-lg">
                          {{ group.severity === 'ERROR' ? 'error' : 'warning_amber' }}
                        </mat-icon>
                      </div>

                      <div class="flex-1 min-w-0">
                        <!-- Header row -->
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="text-xs font-bold uppercase tracking-wide"
                                [class.text-red-700]="group.severity === 'ERROR'"
                                [class.text-amber-700]="group.severity === 'WARNING'">
                            {{ group.label }}
                          </span>
                          <span class="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                                [class.bg-red-100]="group.severity === 'ERROR'"
                                [class.text-red-700]="group.severity === 'ERROR'"
                                [class.bg-amber-100]="group.severity === 'WARNING'"
                                [class.text-amber-700]="group.severity === 'WARNING'">
                            {{ group.severity }}
                          </span>
                          @if (dismissals()[ckey]; as kind) {
                            <span class="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                              {{ kind === 'resolved' ? 'Resolved' : 'Ignored' }}
                            </span>
                          }
                        </div>

                        <!-- Description (collapsible) -->
                        <div class="mt-1.5">
                          <p class="text-sm text-slate-700"
                             [class.line-clamp-2]="!isExpanded && c.description.length > 120">
                            {{ c.description }}
                          </p>
                          @if (c.description.length > 120) {
                            <button mat-stroked-button
                                    class="!text-[10px] !h-5 !min-w-0 !px-1.5 mt-0.5 !text-slate-400 !border-transparent hover:!bg-transparent hover:!text-slate-600"
                                    (click)="toggleExpand(ckey)">
                              {{ isExpanded ? 'Show less' : 'Show more' }}
                            </button>
                          }
                        </div>

                        <!-- Metadata -->
                        <div class="flex gap-3 mt-1.5 text-xs text-slate-400 flex-wrap">
                          <span class="inline-flex items-center gap-1">
                            <mat-icon class="text-xs">calendar_today</mat-icon>
                            {{ DAY_NAMES[c.day_of_week] ?? 'Day ' + c.day_of_week }}
                          </span>
                          @if (c.start_time) {
                            <span class="inline-flex items-center gap-1">
                              <mat-icon class="text-xs">schedule</mat-icon>
                              {{ c.start_time }} – {{ c.end_time || '?' }}
                            </span>
                          }
                        </div>

                        <!-- Action buttons -->
                        <div class="flex items-center gap-1.5 mt-3 flex-wrap">
                          <a mat-stroked-button
                                  routerLink="/admin/timetable/editor"
                                  class="!text-xs !h-7 !min-w-0 !px-2.5">
                            <mat-icon class="text-xs">visibility</mat-icon> View
                          </a>
                          @if (!dismissals()[ckey]) {
                            <button mat-stroked-button
                                    class="!text-xs !h-7 !min-w-0 !px-2.5 !text-emerald-700 !border-emerald-300 hover:!bg-emerald-50"
                                    (click)="dismiss(c, 'resolved')">
                              <mat-icon class="text-xs">check</mat-icon> Resolve
                            </button>
                            <button mat-stroked-button
                                    class="!text-xs !h-7 !min-w-0 !px-2.5 !text-slate-500 !border-slate-300 hover:!bg-slate-50"
                                    (click)="dismiss(c, 'ignored')">
                              <mat-icon class="text-xs">not_interested</mat-icon> Ignore
                            </button>
                          } @else {
                            <button mat-stroked-button
                                    class="!text-xs !h-7 !min-w-0 !px-2.5"
                                    (click)="restore(c)">
                              <mat-icon class="text-xs">undo</mat-icon> Undo
                            </button>
                          }
                          <a mat-stroked-button
                                  routerLink="/admin/timetable/setup/rooms"
                                  class="!text-xs !h-7 !min-w-0 !px-2.5"
                                  matTooltip="Change the assigned room">
                            <mat-icon class="text-xs">meeting_room</mat-icon> Room
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; background: #f8fafc; min-height: 100vh; }
  `],
})
export class ConflictReportPage implements OnInit {
  private api = inject(TimetableApiService);
  protected state = inject(TimetableStateService);
  private snackbar = inject(MatSnackBar);

  protected loading = signal(false);
  protected loadingVersions = signal(false);
  protected errorMessage = signal<string | null>(null);
  protected selectedVersionId = signal<number | null>(null);

  // Dismissals: key → 'ignored' | 'resolved'
  protected dismissals = signal<Record<string, DismissalKind>>({});
  // Expanded cards: set of conflict keys for long descriptions
  protected expandedCards = signal<Set<string>>(new Set());

  readonly DAY_NAMES = DAY_NAMES;

  protected allConflicts = this.state.conflicts;

  protected visibleConflicts = computed(() => {
    const dismiss = this.dismissals();
    return this.allConflicts().filter((c) => !dismiss[conflictKey(c)]);
  });

  protected errorCount = computed(() =>
    this.visibleConflicts().filter((c) => c.severity === 'ERROR').length
  );

  protected dismissedCount = computed(() => Object.keys(this.dismissals()).length);

  protected summaryByType = computed(() => {
    const counts: Record<string, { count: number }> = {};
    for (const c of this.visibleConflicts()) {
      if (!counts[c.conflict_type]) counts[c.conflict_type] = { count: 0 };
      counts[c.conflict_type].count++;
    }
    return Object.entries(counts).map(([type, { count }]) => ({
      type,
      label: CONFLICT_CONFIG[type]?.label ?? type,
      icon: CONFLICT_CONFIG[type]?.icon ?? 'warning',
      severity: CONFLICT_CONFIG[type]?.severity ?? 'WARNING',
      count,
    }));
  });

  protected groupedConflicts = computed(() => {
    const groups: Record<string, { type: string; label: string; icon: string; desc: string; severity: 'ERROR' | 'WARNING'; items: TimetableConflict[] }> = {};
    for (const c of this.visibleConflicts()) {
      if (!groups[c.conflict_type]) {
        const config = CONFLICT_CONFIG[c.conflict_type] ?? { label: c.conflict_type, severity: 'WARNING' as const, icon: 'warning', desc: '' };
        groups[c.conflict_type] = { ...config, type: c.conflict_type, items: [] };
      }
      groups[c.conflict_type].items.push(c);
    }
    const order = ['TEACHER', 'YEAR_GROUP', 'ROOM', 'AVAILABILITY', 'CAPACITY', 'PROTECTED_BLOCK'];
    return order
      .filter((t) => groups[t])
      .map((t) => groups[t]);
  });

  ngOnInit(): void {
    this.loadVersions();
  }

  protected conflictKey = conflictKey;

  protected toggleExpand(key: string): void {
    this.expandedCards.update((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  private loadVersions(): void {
    this.loadingVersions.set(true);
    this.api.getVersions().subscribe({
      next: (list) => {
        this.state.setVersions(list);
        this.loadingVersions.set(false);
        if (list.length > 0) {
          const draft = list.find((v) => v.status === 'DRAFT') ?? list[0];
          this.selectedVersionId.set(draft.id);
          this.loadDismissals(draft.id);
          this.runConflictCheck(draft.academic_term);
        }
      },
      error: () => this.loadingVersions.set(false),
    });
  }

  protected onVersionChange(id: number | null): void {
    this.selectedVersionId.set(id);
    if (id) {
      this.loadDismissals(id);
      const v = this.state.versions().find((x) => x.id === id);
      if (v) this.runConflictCheck(v.academic_term);
    }
  }

  private runConflictCheck(termId: number): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.api.checkConflicts(termId).subscribe({
      next: (res) => {
        this.state.setConflicts(res.conflicts);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.message ?? 'Failed to check conflicts');
        this.loading.set(false);
      },
    });
  }

  protected refresh(): void {
    const id = this.selectedVersionId();
    if (id) {
      const v = this.state.versions().find((x) => x.id === id);
      if (v) this.runConflictCheck(v.academic_term);
    }
  }

  protected dismiss(c: TimetableConflict, kind: DismissalKind): void {
    this.dismissals.update((d) => ({ ...d, [conflictKey(c)]: kind }));
    this.saveDismissals();
    this.snackbar.open(
      kind === 'resolved' ? 'Marked as resolved' : 'Conflict ignored',
      'Undo',
      { duration: 4000 }
    ).onAction().subscribe(() => this.restore(c));
  }

  protected restore(c: TimetableConflict): void {
    this.dismissals.update((d) => {
      const next = { ...d };
      delete next[conflictKey(c)];
      return next;
    });
    this.saveDismissals();
  }

  protected restoreAll(): void {
    this.dismissals.set({});
    this.saveDismissals();
  }

  private storageKey(): string {
    return `timetable_dismissed_conflicts_${this.selectedVersionId() ?? 0}`;
  }

  private saveDismissals(): void {
    try {
      localStorage.setItem(this.storageKey(), JSON.stringify(this.dismissals()));
    } catch { /* localStorage may be full */ }
  }

  private loadDismissals(versionId: number): void {
    try {
      const raw = localStorage.getItem(`timetable_dismissed_conflicts_${versionId}`);
      if (raw) {
        this.dismissals.set(JSON.parse(raw) as Record<string, DismissalKind>);
        return;
      }
    } catch { /* ignore parse errors */ }
    this.dismissals.set({});
  }
}
