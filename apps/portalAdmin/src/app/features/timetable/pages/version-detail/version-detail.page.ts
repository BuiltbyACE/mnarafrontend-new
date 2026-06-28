import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DatePipe } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import {
  TimetableApiService,
  TimetableStateService,
  TimetableVersion,
} from '@sms/domain/timetable';
import { TimetableGridComponent } from '@sms/frontend/timetable-matrix';
import { VersionStatusBadgeComponent } from '../../components/version-status-badge/version-status-badge.component';
import { VersionActionDialogComponent } from '../../components/version-action-dialog/version-action-dialog.component';

@Component({
  selector: 'app-version-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    DatePipe,
    TimetableGridComponent,
    VersionStatusBadgeComponent,
  ],
  template: `
    <div class="p-6 max-w-[1400px] mx-auto">

      <!-- Breadcrumb -->
      <nav class="flex items-center gap-1.5 text-sm text-slate-400 mb-5">
        <a routerLink="/admin/timetable/versions" class="hover:text-slate-700 transition-colors font-medium">
          Versions
        </a>
        <mat-icon class="text-base">chevron_right</mat-icon>
        <span class="text-slate-700 font-semibold truncate max-w-xs">
          {{ version()?.name ?? 'Loading...' }}
        </span>
      </nav>

      <!-- Loading skeleton -->
      @if (loading()) {
        <div class="space-y-4">
          <div class="h-24 rounded-2xl bg-slate-100 animate-pulse"></div>
          <div class="h-[600px] rounded-2xl bg-slate-100 animate-pulse"></div>
        </div>
      }

      <!-- Error -->
      @if (errorMsg()) {
        <div class="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-sm text-red-700">
          <mat-icon fontSet="material-icons-outlined" class="text-red-500 shrink-0">error_outline</mat-icon>
          {{ errorMsg() }}
        </div>
      }

      @if (!loading() && version(); as v) {
        <!-- Status banner -->
        <div class="rounded-2xl border p-6 mb-6 transition-all duration-150 hover:shadow-md"
             [class.bg-emerald-50]="v.status === 'PUBLISHED'"
             [class.border-emerald-200]="v.status === 'PUBLISHED'"
             [class.bg-amber-50]="v.status === 'UNDER_REVIEW'"
             [class.border-amber-200]="v.status === 'UNDER_REVIEW'"
             [class.bg-white]="v.status === 'DRAFT' || v.status === 'ARCHIVED'"
             [class.border-slate-200]="v.status === 'DRAFT' || v.status === 'ARCHIVED'">

          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-2xl"
                 [class.bg-emerald-100]="v.status === 'PUBLISHED'"
                 [class.text-emerald-600]="v.status === 'PUBLISHED'"
                 [class.bg-amber-100]="v.status === 'UNDER_REVIEW'"
                 [class.text-amber-600]="v.status === 'UNDER_REVIEW'"
                 [class.bg-slate-100]="v.status === 'DRAFT' || v.status === 'ARCHIVED'"
                 [class.text-slate-500]="v.status === 'DRAFT' || v.status === 'ARCHIVED'">
              <mat-icon>
                {{ v.status === 'PUBLISHED' ? 'check_circle' : v.status === 'UNDER_REVIEW' ? 'rate_review' : v.status === 'ARCHIVED' ? 'archive' : 'edit_note' }}
              </mat-icon>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-3 flex-wrap">
                <h1 class="text-xl font-bold text-slate-900">{{ v.name }}</h1>
                <app-version-status-badge [status]="v.status" />
              </div>
              <div class="flex items-center gap-4 mt-2 text-xs text-slate-400 flex-wrap">
                <span class="inline-flex items-center gap-1">
                  <mat-icon fontSet="material-icons-outlined" class="text-[13px]">calendar_today</mat-icon>
                  {{ v.academic_term_name }}
                </span>
                <span class="inline-flex items-center gap-1">
                  <mat-icon fontSet="material-icons-outlined" class="text-[13px]">table_rows</mat-icon>
                  {{ v.entry_count }} entries
                </span>
                <span class="inline-flex items-center gap-1">
                  <mat-icon fontSet="material-icons-outlined" class="text-[13px]">person_outline</mat-icon>
                  {{ v.created_by_name }}
                </span>
                <span class="inline-flex items-center gap-1">
                  <mat-icon fontSet="material-icons-outlined" class="text-[13px]">schedule</mat-icon>
                  {{ v.created_at | date:'d MMM y' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Action buttons -->
          <div class="flex items-center gap-2 flex-wrap mt-4 pt-4 border-t border-slate-200/60">
            <button mat-stroked-button
                    [routerLink]="['/admin/timetable/versions', v.id, 'compare']"
                    class="!text-xs !h-8">
              <mat-icon fontSet="material-icons-outlined" class="text-sm">compare</mat-icon>
              Compare
            </button>

            @if (v.status === 'DRAFT') {
              <button mat-flat-button color="primary"
                      (click)="openAction(v, 'publish')"
                      class="!text-xs !h-8 !bg-emerald-600 hover:!bg-emerald-700">
                <mat-icon class="text-sm">publish</mat-icon>
                Publish
              </button>
              <button mat-stroked-button
                      (click)="openAction(v, 'archive')"
                      class="!text-xs !h-8">
                <mat-icon fontSet="material-icons-outlined" class="text-sm">archive</mat-icon>
                Archive
              </button>
            }
            @if (v.status === 'PUBLISHED') {
              <button mat-stroked-button
                      (click)="openAction(v, 'archive')"
                      class="!text-xs !h-8">
                <mat-icon fontSet="material-icons-outlined" class="text-sm">archive</mat-icon>
                Archive
              </button>
            }
            @if (v.status === 'ARCHIVED') {
              <button mat-flat-button color="accent"
                      (click)="openAction(v, 'rollback')"
                      class="!text-xs !h-8 !bg-amber-500 hover:!bg-amber-600">
                <mat-icon fontSet="material-icons-outlined" class="text-sm">restore</mat-icon>
                Rollback
              </button>
            }

            <div class="ml-auto">
              <button mat-stroked-button
                      (click)="runConflictCheck()"
                      [disabled]="conflictLoading()"
                      class="!text-xs !h-8"
                      [class.!text-red-600]="(conflictCount() ?? 0) > 0"
                      [class.!border-red-300]="(conflictCount() ?? 0) > 0">
                <mat-icon fontSet="material-icons-outlined" class="text-sm">
                  {{ (conflictCount() ?? 0) > 0 ? 'warning_amber' : 'check_circle_outline' }}
                </mat-icon>
                @if (conflictLoading()) {
                  Checking...
                } @else if (conflictCount() === null) {
                  Check Conflicts
                } @else if (conflictCount() === 0) {
                  No Conflicts
                } @else {
                  {{ conflictCount() }} Conflict{{ conflictCount()! > 1 ? 's' : '' }}
                }
              </button>
            </div>
          </div>
        </div>

        <!-- Timetable grid -->
        <div class="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div class="h-[calc(100vh-400px)] min-h-[450px] p-2">
            <app-timetable-grid [termId]="v.academic_term" />
          </div>
        </div>
      }
    </div>
  `,
})
export class VersionDetailPage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private api = inject(TimetableApiService);
  private state = inject(TimetableStateService);
  private destroy$ = new Subject<void>();

  protected version = this.state.activeVersion;
  protected loading = signal(false);
  protected errorMsg = signal<string | null>(null);
  protected conflictLoading = signal(false);
  protected conflictCount = signal<number | null>(null);

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const id = Number(params.get('id'));
      if (id) this.loadVersion(id);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadVersion(id: number): void {
    this.loading.set(true);
    this.errorMsg.set(null);
    this.api.getVersion(id).subscribe({
      next: (v) => {
        this.state.setActiveVersion(v);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMsg.set(`Failed to load version (${err.status})`);
        this.loading.set(false);
      },
    });
  }

  protected openAction(version: TimetableVersion, action: 'publish' | 'archive' | 'rollback'): void {
    const ref = this.dialog.open(VersionActionDialogComponent, {
      width: '480px',
      panelClass: 'mnara-dialog',
      data: { version, action },
    });
    ref.afterClosed().subscribe((updated: TimetableVersion | undefined) => {
      if (updated) {
        this.state.updateVersion(updated);
        if (action === 'rollback') {
          this.router.navigate(['/admin/timetable/versions', updated.id]);
        }
      }
    });
  }

  protected runConflictCheck(): void {
    const v = this.version();
    if (!v) return;
    this.conflictLoading.set(true);
    this.api.checkConflicts(v.academic_term).subscribe({
      next: (res) => {
        this.conflictCount.set(res.count);
        this.state.setConflicts(res.conflicts);
        this.conflictLoading.set(false);
      },
      error: () => this.conflictLoading.set(false),
    });
  }
}
