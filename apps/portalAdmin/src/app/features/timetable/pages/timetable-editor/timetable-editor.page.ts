import { Component, ChangeDetectionStrategy, computed, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { TimetableGridComponent } from '@sms/frontend/timetable-matrix';
import {
  TimetableApiService,
  TimetableStateService,
  TimetableEntry,
  TimetableVersion,
} from '@sms/domain/timetable';
import { VersionStatusBadgeComponent } from '../../components/version-status-badge/version-status-badge.component';
import { EntryFormDialogComponent } from '../../components/entry-form-dialog/entry-form-dialog.component';

interface FilterOption { id: number; name: string; }

@Component({
  selector: 'app-timetable-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTooltipModule,
    TimetableGridComponent,
    VersionStatusBadgeComponent,
  ],
  template: `
    <div class="min-h-screen p-6">
      <div class="max-w-[1400px] mx-auto">

        <!-- Page header -->
        <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Timetable Editor</h1>
            <p class="text-sm text-slate-500 mt-1">View and edit timetable entries for each version</p>
          </div>
          <div class="flex items-center gap-2">
            <a mat-stroked-button routerLink="/admin/timetable/conflicts">
              <mat-icon class="text-base mr-1">warning_amber</mat-icon>
              View Conflicts
            </a>
            <button mat-flat-button color="primary"
                    [disabled]="!activeDraft()"
                    (click)="openNewEntryDialog()">
              <mat-icon class="text-base">add</mat-icon>
              New Entry
            </button>
          </div>
        </div>

        <!-- Filter bar -->
        <div class="rounded-2xl border border-slate-200 bg-white p-4 mb-4 flex items-center gap-3 flex-wrap shadow-sm">
          <!-- Version selector -->
          @if (loadingVersions()) {
            <div class="h-12 w-64 rounded-xl bg-slate-100 animate-pulse"></div>
          } @else {
            <mat-form-field appearance="outline" class="w-64" subscriptSizing="dynamic">
              <mat-label>Timetable Version</mat-label>
              <mat-select [(ngModel)]="selectedVersionId" (ngModelChange)="onVersionChange($event)">
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

          @if (selectedVersion(); as sv) {
            <div class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
              <app-version-status-badge [status]="sv.status" />
              <span class="text-xs text-slate-400">{{ sv.entry_count }} entries</span>
            </div>
          }

          <!-- Year group filter -->
          <mat-form-field appearance="outline" class="w-48" subscriptSizing="dynamic">
            <mat-label>Year Group</mat-label>
            <mat-select [(ngModel)]="filterYearGroupId" (ngModelChange)="onFilterChange()">
              <mat-option [value]="null">All Classes</mat-option>
              @for (yg of yearGroups(); track yg.id) {
                <mat-option [value]="yg.id">{{ yg.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <!-- Teacher filter -->
          <mat-form-field appearance="outline" class="w-48" subscriptSizing="dynamic">
            <mat-label>Teacher</mat-label>
            <mat-select [(ngModel)]="filterTeacherId" (ngModelChange)="onFilterChange()">
              <mat-option [value]="null">All Teachers</mat-option>
              @for (t of teachers(); track t.id) {
                <mat-option [value]="t.id">{{ t.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Version status banner -->
        @let sel = selectedVersion();
        @if (sel) {
          @if (sel.status === 'DRAFT') {
            <div class="flex items-center gap-3 px-5 py-3 rounded-2xl border border-slate-200 bg-white mb-4 flex-wrap shadow-sm">
              <mat-icon class="text-slate-400 shrink-0">edit_note</mat-icon>
              <span class="text-sm font-semibold text-slate-700 truncate">{{ sel.name }}</span>
              <app-version-status-badge [status]="sel.status" />
              <span class="text-xs text-slate-400">· {{ sel.academic_term_name }}</span>
              <span class="text-xs text-emerald-600 ml-auto hidden sm:inline">
                <mat-icon class="text-sm align-text-bottom">lock_open</mat-icon> Editable
              </span>
              <a routerLink="/admin/timetable/versions/{{ sel.id }}" class="text-xs text-blue-600 font-medium hover:underline shrink-0">
                View version →
              </a>
            </div>
          } @else if (sel.status === 'PUBLISHED') {
            <div class="flex items-center gap-3 px-5 py-3 rounded-2xl border border-emerald-200 bg-emerald-50 mb-4 shadow-sm">
              <mat-icon class="text-emerald-500 shrink-0">check_circle</mat-icon>
              <span class="text-sm font-semibold text-emerald-800 truncate">{{ sel.name }}</span>
              <app-version-status-badge [status]="sel.status" />
              <span class="text-xs text-emerald-600 hidden sm:inline">· Read‑only</span>
              <a routerLink="/admin/timetable/versions/{{ sel.id }}" class="ml-auto text-xs text-emerald-700 font-medium hover:underline shrink-0">
                View version →
              </a>
            </div>
          } @else {
            <div class="flex items-center gap-3 px-5 py-3 rounded-2xl border border-slate-200 bg-white mb-4 flex-wrap shadow-sm">
              <mat-icon class="text-slate-400 shrink-0">description</mat-icon>
              <span class="text-sm font-semibold text-slate-700 truncate">{{ sel.name }}</span>
              <app-version-status-badge [status]="sel.status" />
              <span class="text-xs text-slate-400">· {{ sel.academic_term_name }}</span>
            </div>
          }
        } @else {
          <div class="flex items-center gap-3 px-5 py-3 rounded-2xl border border-amber-200 bg-amber-50 mb-4">
            <mat-icon class="text-amber-500 shrink-0">lock</mat-icon>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold text-amber-800">No version selected</p>
              <p class="text-xs text-amber-600 mt-0.5">Select a timetable version above to view entries.</p>
            </div>
            <a routerLink="/admin/timetable/versions"
               class="shrink-0 text-xs font-semibold text-amber-700 border border-amber-300
                      rounded-lg px-3 py-1.5 hover:bg-amber-100 transition-colors">
              Go to Versions
            </a>
          </div>
        }

        <!-- Grid area -->
        <div class="relative rounded-2xl border border-slate-200 bg-white overflow-hidden">
          @if (!activeDraft() || selectedVersion()?.status !== 'DRAFT') {
            <div class="absolute inset-0 z-10 bg-white/70 backdrop-blur-[2px] rounded-2xl
                        flex flex-col items-center justify-center gap-3 pointer-events-none">
              <mat-icon class="text-4xl text-slate-300">lock</mat-icon>
              <p class="text-sm font-semibold text-slate-500">
                {{ selectedVersion() ? 'Only DRAFT versions can be edited' : 'Select a version first' }}
              </p>
            </div>
          }
          <div class="h-[calc(100vh-380px)] min-h-[400px] p-2">
            <app-timetable-grid
              [termId]="selectedVersion()?.academic_term"
              [yearGroupId]="filterYearGroupId()"
              [teacherId]="filterTeacherId()"
              (entryClicked)="onEntryClick($event)" />
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; background: #f8fafc; min-height: 100vh; }
  `],
})
export class TimetableEditorPage implements OnInit {
  private api = inject(TimetableApiService);
  protected state = inject(TimetableStateService);
  private dialog = inject(MatDialog);

  protected loadingVersions = signal(false);
  protected selectedVersionId = signal<number | null>(null);
  protected filterYearGroupId = signal<number | null>(null);
  protected filterTeacherId = signal<number | null>(null);

  protected yearGroups = signal<FilterOption[]>([]);
  protected teachers = signal<FilterOption[]>([]);

  protected selectedVersion = computed<TimetableVersion | null>(() => {
    const id = this.selectedVersionId();
    if (!id) return null;
    return this.state.versions().find((v) => v.id === id) ?? null;
  });

  protected activeDraft = computed<TimetableVersion | null>(() =>
    this.state.versions().find((v) => v.status === 'DRAFT') ?? null
  );

  ngOnInit(): void {
    this.loadVersions();
    this.loadFilters();
  }

  private loadVersions(): void {
    this.loadingVersions.set(true);
    this.api.getVersions().subscribe({
      next: (list) => {
        this.state.setVersions(list);
        this.loadingVersions.set(false);
        if (list.length > 0) {
          const draft = list.find((v) => v.status === 'DRAFT');
          this.selectedVersionId.set(draft?.id ?? list[0].id);
        }
      },
      error: () => this.loadingVersions.set(false),
    });
  }

  private loadFilters(): void {
    this.api.getYearGroups().subscribe({
      next: (list) => this.yearGroups.set(list.map((yg) => ({ id: yg.id, name: yg.name }))),
    });
    this.api.getTeachers().subscribe({
      next: (list) => this.teachers.set(list.map((t) => ({ id: t.id, name: t.name }))),
    });
  }

  protected onVersionChange(_: number | null): void {
    return; // Grid reloads via effect on input signal changes
  }

  protected onFilterChange(): void {
    return; // Grid reloads via effect on input signal changes
  }

  protected onEntryClick(entry: TimetableEntry): void {
    const draft = this.activeDraft();
    const sel = this.selectedVersion();
    if (!draft || sel?.status !== 'DRAFT') return;
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
}
