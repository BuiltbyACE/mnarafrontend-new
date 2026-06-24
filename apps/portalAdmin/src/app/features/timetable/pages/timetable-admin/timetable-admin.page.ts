import {
  Component,
  ChangeDetectionStrategy,
  computed,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TimetableGridComponent } from '@sms/frontend/timetable-matrix';
import {
  TimetableApiService,
  TimetableStateService,
  TimetableConflict,
  TimetableEntry,
  TimetableVersion,
} from '@sms/domain/timetable';
import { VersionStatusBadgeComponent } from '../../components/version-status-badge/version-status-badge.component';
import { EntryFormDialogComponent } from '../../components/entry-form-dialog/entry-form-dialog.component';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const CONFLICT_LABELS: Record<string, { label: string; color: string }> = {
  TEACHER:         { label: 'Teacher Double-Booking', color: 'text-red-600 bg-red-50 border-red-200' },
  YEAR_GROUP:      { label: 'Class Conflict',          color: 'text-orange-600 bg-orange-50 border-orange-200' },
  ROOM:            { label: 'Room Conflict',            color: 'text-amber-600 bg-amber-50 border-amber-200' },
  AVAILABILITY:    { label: 'Availability Warning',     color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  CAPACITY:        { label: 'Capacity Warning',         color: 'text-purple-600 bg-purple-50 border-purple-200' },
  PROTECTED_BLOCK: { label: 'Protected Block',          color: 'text-rose-600 bg-rose-50 border-rose-200' },
};

@Component({
  selector: 'app-timetable-admin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    TimetableGridComponent,
    VersionStatusBadgeComponent,
  ],
  template: `
    <div class="p-6 max-w-[1400px] mx-auto">

      <!-- Page header -->
      <div class="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Timetable Administration</h1>
          <p class="text-sm text-slate-500 mt-1">Edit timetable entries and review conflicts</p>
        </div>
        <div class="flex items-center gap-2">
          <button mat-stroked-button (click)="runConflictCheck()" [disabled]="conflictLoading()">
            <mat-icon fontSet="material-icons-outlined" class="text-base mr-1">warning_amber</mat-icon>
            {{ conflictLoading() ? 'Checking…' : 'Check Conflicts' }}
          </button>
          <button mat-flat-button color="primary"
                  [disabled]="!activeDraft()"
                  (click)="openNewEntryDialog()">
            <mat-icon class="text-base mr-1">add</mat-icon>
            New Entry
          </button>
        </div>
      </div>

      <!-- Version banner -->
      @if (loadingVersions()) {
        <div class="h-14 rounded-xl bg-slate-100 animate-pulse mb-4"></div>
      } @else if (activeDraft(); as draft) {
        <div class="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white mb-4 flex-wrap">
          <mat-icon fontSet="material-icons-outlined" class="text-slate-400 text-base shrink-0">edit</mat-icon>
          <span class="text-sm font-semibold text-slate-700 truncate">{{ draft.name }}</span>
          <app-version-status-badge [status]="draft.status" />
          <span class="text-xs text-slate-400">{{ draft.academic_term_name }}</span>
          <a routerLink="/admin/timetable/versions/{{ draft.id }}"
             class="ml-auto text-xs text-primary font-medium hover:underline">
            View version →
          </a>
        </div>
      } @else {
        <!-- No DRAFT gate -->
        <div class="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 mb-4">
          <mat-icon fontSet="material-icons-outlined" class="text-amber-500 shrink-0">lock</mat-icon>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-amber-800">No draft version available</p>
            <p class="text-xs text-amber-600 mt-0.5">
              Timetable entries can only be edited in a DRAFT version.
              Create a draft to begin editing.
            </p>
          </div>
          <a routerLink="/admin/timetable/versions"
             class="shrink-0 text-xs font-semibold text-amber-700 border border-amber-300
                    rounded-lg px-3 py-1.5 hover:bg-amber-100 transition-colors">
            Go to Versions
          </a>
        </div>
      }

      <!-- Conflict summary bar -->
      @if (summaryErrorCount() > 0 || summaryWarningCount() > 0) {
        <div class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-sm text-red-700">
          <mat-icon fontSet="material-icons-outlined" class="text-red-500 shrink-0">error_outline</mat-icon>
          <span class="font-semibold">{{ summaryErrorCount() }} error(s)</span>
          <span class="text-red-400">·</span>
          <span>{{ summaryWarningCount() }} warning(s)</span>
        </div>
      }

      <mat-tab-group animationDuration="0ms">
        <!-- Grid tab -->
        <mat-tab label="Grid View">
          <ng-template matTabContent>
            <div class="mt-4 relative">
              <!-- Edit-disabled overlay when no DRAFT -->
              @if (!activeDraft()) {
                <div class="absolute inset-0 z-10 bg-white/70 backdrop-blur-sm rounded-xl
                            flex flex-col items-center justify-center gap-3 pointer-events-none">
                  <mat-icon fontSet="material-icons-outlined" class="text-4xl text-slate-300">lock</mat-icon>
                  <p class="text-sm font-semibold text-slate-500">Create a draft first to enable editing</p>
                </div>
              }
              <div class="h-[calc(100vh-380px)] min-h-[400px]">
                <app-timetable-grid
                  (entryClicked)="onEntryClick($event)" />
              </div>
            </div>
          </ng-template>
        </mat-tab>

        <!-- Conflict report tab -->
        <mat-tab>
          <ng-template mat-tab-label>
            Conflict Report
            @if (summaryErrorCount() > 0) {
              <span class="ml-2 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold
                           rounded-full bg-red-500 text-white">
                {{ summaryErrorCount() }}
              </span>
            }
          </ng-template>
          <ng-template matTabContent>
            <div class="mt-4 pb-6">
              @if (conflictLoading()) {
                <div class="p-12 text-center text-slate-400">
                  <div class="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-3"></div>
                  <p>Running conflict checks…</p>
                </div>
              } @else if (conflicts().length === 0) {
                <div class="p-12 text-center text-slate-400">
                  <mat-icon fontSet="material-icons-outlined" class="text-5xl text-green-400">check_circle_outline</mat-icon>
                  <p class="text-lg font-medium text-green-600 mt-2">No conflicts found</p>
                  <p class="text-sm mt-1">Run a conflict check to verify the timetable is clean.</p>
                </div>
              } @else {
                <!-- Type summary chips -->
                <div class="flex flex-wrap gap-2 mb-4">
                  @for (entry of summaryByType(); track entry.type) {
                    <div class="px-3 py-1.5 rounded-lg border text-xs font-semibold {{ entry.color }}">
                      {{ entry.label }}: {{ entry.count }}
                    </div>
                  }
                </div>

                <div class="space-y-2">
                  @for (c of conflicts(); track (c.entry_a_id ?? 0).toString() + c.conflict_type + c.start_time) {
                    <div class="p-3 rounded-lg border flex items-start gap-3"
                         [class.border-red-200]="c.severity === 'ERROR'"
                         [class.bg-red-50]="c.severity === 'ERROR'"
                         [class.border-amber-200]="c.severity === 'WARNING'"
                         [class.bg-amber-50]="c.severity === 'WARNING'">
                      <mat-icon fontSet="material-icons-outlined" class="text-lg mt-0.5 shrink-0"
                                [class.text-red-500]="c.severity === 'ERROR'"
                                [class.text-amber-500]="c.severity === 'WARNING'">
                        {{ c.severity === 'ERROR' ? 'error_outline' : 'warning_amber' }}
                      </mat-icon>
                      <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="text-xs font-bold uppercase tracking-wide"
                                [class.text-red-700]="c.severity === 'ERROR'"
                                [class.text-amber-700]="c.severity === 'WARNING'">
                            {{ getConflictLabel(c) }}
                          </span>
                          <span class="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded"
                                [class.bg-red-100]="c.severity === 'ERROR'"
                                [class.text-red-700]="c.severity === 'ERROR'"
                                [class.bg-amber-100]="c.severity === 'WARNING'"
                                [class.text-amber-700]="c.severity === 'WARNING'">
                            {{ c.severity }}
                          </span>
                        </div>
                        <p class="text-sm mt-0.5 text-slate-700">{{ c.description }}</p>
                        <div class="flex gap-3 mt-1 text-xs text-slate-400">
                          <span>{{ getDayName(c.day_of_week) }}</span>
                          <span>{{ c.start_time }} – {{ c.end_time }}</span>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </ng-template>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [':host { display: block; min-height: 100vh; }'],
})
export class TimetableAdminPage implements OnInit {
  private api = inject(TimetableApiService);
  private state = inject(TimetableStateService);
  private dialog = inject(MatDialog);

  protected conflicts = this.state.conflicts;
  protected loadingVersions = signal(false);
  protected conflictLoading = signal(false);

  protected activeDraft = computed<TimetableVersion | null>(() =>
    this.state.versions().find((v) => v.status === 'DRAFT') ?? null
  );

  protected summaryErrorCount = computed(() =>
    this.conflicts().filter((c) => c.severity === 'ERROR').length
  );
  protected summaryWarningCount = computed(() =>
    this.conflicts().filter((c) => c.severity === 'WARNING').length
  );

  protected summaryByType = computed(() => {
    const counts: Record<string, number> = {};
    for (const c of this.conflicts()) {
      counts[c.conflict_type] = (counts[c.conflict_type] ?? 0) + 1;
    }
    return Object.entries(counts).map(([type, count]) => ({
      type,
      label: CONFLICT_LABELS[type]?.label ?? type,
      count,
      color: CONFLICT_LABELS[type]?.color ?? 'text-slate-600 bg-slate-50 border-slate-200',
    }));
  });

  ngOnInit(): void {
    if (this.state.versions().length === 0) {
      this.loadingVersions.set(true);
      this.api.getVersions().subscribe({
        next: (list) => {
          this.state.setVersions(list);
          this.loadingVersions.set(false);
        },
        error: () => this.loadingVersions.set(false),
      });
    }
  }

  protected onEntryClick(entry: TimetableEntry): void {
    const draft = this.activeDraft();
    if (!draft) return;
    this.openEntryDialog(entry, entry.tiered_period, entry.day_of_week, draft);
  }

  protected openNewEntryDialog(): void {
    const draft = this.activeDraft();
    if (!draft) return;
    this.openEntryDialog(null, 0, 0, draft);
  }

  private openEntryDialog(
    entry: TimetableEntry | null,
    periodId: number,
    dayOfWeek: number,
    draft: TimetableVersion,
  ): void {
    const ref = this.dialog.open(EntryFormDialogComponent, {
      width: '520px',
      panelClass: 'mnara-dialog',
      data: {
        entry,
        periodId,
        dayOfWeek,
        draftVersionId: draft.id,
        academicTermId: draft.academic_term,
      },
    });
    ref.afterClosed().subscribe((result?: { entry: TimetableEntry; deleted: boolean }) => {
      if (!result) return;
      if (result.deleted) {
        this.state.removeEntry(result.entry.id);
      } else {
        entry ? this.state.updateEntry(result.entry.id, result.entry)
              : this.state.addEntry(result.entry);
      }
    });
  }

  protected runConflictCheck(): void {
    const draft = this.activeDraft();
    if (!draft) return;
    this.conflictLoading.set(true);
    this.api.checkConflicts(draft.academic_term).subscribe({
      next: (res) => {
        this.state.setConflicts(res.conflicts);
        this.conflictLoading.set(false);
      },
      error: () => this.conflictLoading.set(false),
    });
  }

  protected getConflictLabel(c: TimetableConflict): string {
    return CONFLICT_LABELS[c.conflict_type]?.label ?? c.conflict_type;
  }

  protected getDayName(day: number): string {
    return DAY_NAMES[day] ?? `Day ${day}`;
  }
}
