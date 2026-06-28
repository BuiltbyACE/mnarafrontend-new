import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DatePipe } from '@angular/common';
import {
  TimetableApiService,
  TimetableStateService,
  TimetableVersion,
} from '@sms/domain/timetable';
import { VersionStatusBadgeComponent } from '../../components/version-status-badge/version-status-badge.component';
import { VersionActionDialogComponent } from '../../components/version-action-dialog/version-action-dialog.component';
import { CreateVersionDialogComponent } from '../../components/create-version-dialog/create-version-dialog.component';

@Component({
  selector: 'app-timetable-versions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    DatePipe,
    VersionStatusBadgeComponent,
  ],
  template: `
    <div class="p-6 max-w-[1200px] mx-auto">
      <!-- Page Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Timetable Versions</h1>
          <p class="text-sm text-slate-500 mt-1">
            Manage draft, review, published and archived versions of the school timetable
          </p>
        </div>
        <div class="flex items-center gap-2">
          <a routerLink="/admin/timetable/audit"
             class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600
                    hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
            <mat-icon fontSet="material-icons-outlined" class="text-base">history</mat-icon>
            Audit Log
          </a>
          <button mat-flat-button color="primary"
                  (click)="openCreateDialog()"
                  class="flex items-center gap-1.5">
            <mat-icon class="text-base">add</mat-icon>
            Create Draft
          </button>
        </div>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="grid grid-cols-1 gap-3">
          @for (i of [1,2,3]; track i) {
            <div class="h-28 rounded-2xl bg-slate-100 animate-pulse"></div>
          }
        </div>
      }

      <!-- Error -->
      @if (errorMsg()) {
        <div class="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-sm text-red-700">
          <mat-icon fontSet="material-icons-outlined" class="text-red-500 shrink-0">error_outline</mat-icon>
          {{ errorMsg() }}
        </div>
      }

      <!-- Version List -->
      @if (!loading() && versions().length > 0) {
        <div class="space-y-3">
          @for (v of versions(); track v.id) {
            <div class="bg-white rounded-2xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                 [class.border-emerald-300]="v.status === 'PUBLISHED'"
                 [class.ring-1]="v.status === 'PUBLISHED'"
                 [class.ring-emerald-200/50]="v.status === 'PUBLISHED'"
                 [class.border-slate-100]="v.status !== 'PUBLISHED'"
                 [class.opacity-60]="v.status === 'ARCHIVED'">
              <div class="p-5 flex items-center gap-4">
                <!-- Status indicator stripe -->
                <div class="w-1 self-stretch rounded-full shrink-0"
                     [class.bg-emerald-500]="v.status === 'PUBLISHED'"
                     [class.bg-amber-400]="v.status === 'UNDER_REVIEW'"
                     [class.bg-slate-400]="v.status === 'DRAFT'"
                     [class.bg-slate-200]="v.status === 'ARCHIVED'">
                </div>

                <!-- Version icon -->
                <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl"
                     [class.bg-emerald-50]="v.status === 'PUBLISHED'"
                     [class.text-emerald-600]="v.status === 'PUBLISHED'"
                     [class.bg-amber-50]="v.status === 'UNDER_REVIEW'"
                     [class.text-amber-600]="v.status === 'UNDER_REVIEW'"
                     [class.bg-slate-100]="v.status === 'DRAFT' || v.status === 'ARCHIVED'"
                     [class.text-slate-500]="v.status === 'DRAFT' || v.status === 'ARCHIVED'">
                  <mat-icon>
                    {{ v.status === 'PUBLISHED' ? 'check_circle' : v.status === 'UNDER_REVIEW' ? 'rate_review' : v.status === 'ARCHIVED' ? 'archive' : 'edit_note' }}
                  </mat-icon>
                </div>

                <!-- Main info -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2.5 flex-wrap">
                    <a [routerLink]="['/admin/timetable/versions', v.id]"
                       class="text-base font-semibold text-slate-900 hover:text-blue-600 transition-colors truncate">
                      {{ v.name }}
                    </a>
                    <app-version-status-badge [status]="v.status" />
                    @if (v.status === 'PUBLISHED') {
                      <span class="inline-flex items-center gap-1 text-[10px] font-bold
                                   text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <mat-icon class="text-[10px]">check_circle</mat-icon>
                        LIVE
                      </span>
                    }
                  </div>
                  <div class="flex items-center gap-4 mt-2 text-xs text-slate-400 flex-wrap">
                    <span class="inline-flex items-center gap-1">
                      <mat-icon fontSet="material-icons-outlined" class="text-[13px]">calendar_today</mat-icon>
                      {{ v.academic_term_name }}
                    </span>
                    <span class="inline-flex items-center gap-1">
                      <mat-icon fontSet="material-icons-outlined" class="text-[13px]">table_rows</mat-icon>
                      {{ v.entry_count }} entry{{ v.entry_count !== 1 ? 'ies' : 'y' }}
                    </span>
                    <span class="inline-flex items-center gap-1">
                      <mat-icon fontSet="material-icons-outlined" class="text-[13px]">person_outline</mat-icon>
                      {{ v.created_by_name }}
                    </span>
                    <span class="inline-flex items-center gap-1">
                      <mat-icon fontSet="material-icons-outlined" class="text-[13px]">schedule</mat-icon>
                      {{ v.created_at | date:'d MMM y, HH:mm' }}
                    </span>
                    @if (v.published_at) {
                      <span class="inline-flex items-center gap-1 text-emerald-600">
                        <mat-icon fontSet="material-icons-outlined" class="text-[13px]">publish</mat-icon>
                        Published {{ v.published_at | date:'d MMM y' }}
                      </span>
                    }
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-1 shrink-0">
                  <button mat-icon-button
                          [routerLink]="['/admin/timetable/versions', v.id]"
                          matTooltip="View details">
                    <mat-icon fontSet="material-icons-outlined">open_in_new</mat-icon>
                  </button>
                  @if (v.status === 'DRAFT' || v.status === 'UNDER_REVIEW') {
                    <button mat-icon-button
                            (click)="openAction(v, 'clone')"
                            matTooltip="Clone this version">
                      <mat-icon fontSet="material-icons-outlined">content_copy</mat-icon>
                    </button>
                  }
                  @if (v.status === 'DRAFT') {
                    <button mat-flat-button color="primary"
                            (click)="openAction(v, 'publish')"
                            matTooltip="Publish this version"
                            class="!min-w-0 !px-3 !h-8 !text-xs font-semibold !rounded-lg !bg-emerald-600 hover:!bg-emerald-700">
                      <mat-icon fontSet="material-icons-outlined" class="text-sm !mr-1">publish</mat-icon>
                      Publish
                    </button>
                    <button mat-icon-button
                            (click)="openAction(v, 'archive')"
                            matTooltip="Archive">
                      <mat-icon fontSet="material-icons-outlined" class="text-slate-400">archive</mat-icon>
                    </button>
                  }
                  @if (v.status === 'PUBLISHED') {
                    <button mat-icon-button
                            (click)="openAction(v, 'archive')"
                            matTooltip="Archive published version">
                      <mat-icon fontSet="material-icons-outlined" class="text-slate-400">archive</mat-icon>
                    </button>
                  }
                  @if (v.status === 'ARCHIVED') {
                    <button mat-flat-button
                            (click)="openAction(v, 'rollback')"
                            matTooltip="Rollback to this version"
                            class="!min-w-0 !px-3 !h-8 !text-xs font-semibold !rounded-lg !bg-amber-500 hover:!bg-amber-600 !text-white">
                      <mat-icon fontSet="material-icons-outlined" class="text-sm !mr-1">restore</mat-icon>
                      Rollback
                    </button>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Empty state -->
      @if (!loading() && !errorMsg() && versions().length === 0) {
        <div class="flex flex-col items-center justify-center py-20 text-center">
          <div class="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <mat-icon fontSet="material-icons-outlined" class="text-3xl text-slate-400">layers</mat-icon>
          </div>
          <h3 class="text-base font-semibold text-slate-700">No timetable versions yet</h3>
          <p class="text-sm text-slate-400 mt-1 max-w-xs">
            Create a draft version to start building and editing the school timetable.
          </p>
          <button mat-flat-button color="primary" class="mt-6" (click)="openCreateDialog()">
            <mat-icon class="text-base mr-1">add</mat-icon>
            Create First Draft
          </button>
        </div>
      }
    </div>
  `,
})
export class TimetableVersionsPage implements OnInit {
  private api = inject(TimetableApiService);
  private state = inject(TimetableStateService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  protected versions = this.state.versions;
  protected loading = signal(false);
  protected errorMsg = signal<string | null>(null);

  ngOnInit(): void {
    this.loadVersions();
  }

  private loadVersions(): void {
    this.loading.set(true);
    this.errorMsg.set(null);
    this.api.getVersions().subscribe({
      next: (list) => {
        this.state.setVersions(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMsg.set(err.status === 0
          ? 'Cannot reach the server. Check your connection.'
          : `Failed to load versions (${err.status})`);
        this.loading.set(false);
      },
    });
  }

  protected openCreateDialog(): void {
    const ref = this.dialog.open(CreateVersionDialogComponent, {
      width: '480px',
      panelClass: 'mnara-dialog',
    });
    ref.afterClosed().subscribe((created: TimetableVersion | undefined) => {
      if (created) {
        this.state.setVersions([created, ...this.state.versions()]);
        this.router.navigate(['/admin/timetable/versions', created.id]);
      }
    });
  }

  protected openAction(version: TimetableVersion, action: 'publish' | 'archive' | 'rollback' | 'clone'): void {
    const ref = this.dialog.open(VersionActionDialogComponent, {
      width: '480px',
      panelClass: 'mnara-dialog',
      data: { version, action },
    });
    ref.afterClosed().subscribe((updated: TimetableVersion | undefined) => {
      if (updated) {
        this.state.updateVersion(updated);
      }
    });
  }
}
