import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TimetableApiService, TimetableStateService, TimetableVersion } from '@sms/domain/timetable';

type VersionAction = 'publish' | 'archive' | 'rollback' | 'clone';

interface DialogData {
  version: TimetableVersion;
  action: VersionAction;
}

const ACTION_CONFIG: Record<VersionAction, {
  title: string;
  icon: string;
  iconColor: string;
  warning: string;
  confirmLabel: string;
  confirmColor: string;
}> = {
  publish: {
    title: 'Publish Version',
    icon: 'publish',
    iconColor: 'text-emerald-600',
    warning: 'Publishing this version will automatically archive the currently published timetable. All staff and students will immediately see the new timetable.',
    confirmLabel: 'Publish',
    confirmColor: 'primary',
  },
  archive: {
    title: 'Archive Version',
    icon: 'archive',
    iconColor: 'text-slate-500',
    warning: 'Archiving this version is reversible via rollback, but it will no longer be visible to staff or students if it is currently published.',
    confirmLabel: 'Archive',
    confirmColor: 'warn',
  },
  rollback: {
    title: 'Rollback to This Version',
    icon: 'restore',
    iconColor: 'text-amber-600',
    warning: 'This will archive the currently published version and re-publish this one. The currently live timetable will be replaced immediately.',
    confirmLabel: 'Rollback',
    confirmColor: 'warn',
  },
  clone: {
    title: 'Clone Version',
    icon: 'content_copy',
    iconColor: 'text-slate-600',
    warning: 'A new DRAFT version will be created as a copy of this one, including all timetable entries.',
    confirmLabel: 'Clone',
    confirmColor: 'primary',
  },
};

@Component({
  selector: 'app-version-action-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="p-6 w-full">
      <!-- Icon + title -->
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
          <mat-icon fontSet="material-icons-outlined" class="text-xl {{ cfg().iconColor }}">
            {{ cfg().icon }}
          </mat-icon>
        </div>
        <div>
          <h2 class="text-base font-bold text-slate-900">{{ cfg().title }}</h2>
          <p class="text-xs text-slate-500 mt-0.5">{{ data.version.name }}</p>
        </div>
      </div>

      <!-- Warning text -->
      <div class="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800 mb-5">
        {{ cfg().warning }}
      </div>

      <!-- Error -->
      @if (errorMsg()) {
        <div class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <mat-icon fontSet="material-icons-outlined" class="text-red-500 shrink-0 text-base">error_outline</mat-icon>
          {{ errorMsg() }}
        </div>
      }

      <!-- Actions -->
      <div class="flex justify-end gap-2">
        <button mat-stroked-button [mat-dialog-close]="undefined" [disabled]="loading()">
          Cancel
        </button>
        <button mat-flat-button
                [color]="cfg().confirmColor"
                (click)="confirm()"
                [disabled]="loading()">
          @if (loading()) {
            <span class="inline-flex items-center gap-1.5">
              <span class="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
              Working...
            </span>
          } @else {
            {{ cfg().confirmLabel }}
          }
        </button>
      </div>
    </div>
  `,
})
export class VersionActionDialogComponent {
  readonly data = inject<DialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<VersionActionDialogComponent>);
  private api = inject(TimetableApiService);
  private state = inject(TimetableStateService);

  protected loading = signal(false);
  protected errorMsg = signal<string | null>(null);
  protected cfg = computed(() => ACTION_CONFIG[this.data.action]);

  protected confirm(): void {
    this.loading.set(true);
    this.errorMsg.set(null);

    const id = this.data.version.id;
    const action$ =
      this.data.action === 'publish'  ? this.api.publishVersion(id)  :
      this.data.action === 'archive'  ? this.api.archiveVersion(id)  :
      this.data.action === 'rollback' ? this.api.rollbackVersion(id) :
                                        this.api.cloneVersion(id, { name: `${this.data.version.name} (Copy)`, copy_entries: true });

    action$.subscribe({
      next: (updated) => {
        this.loading.set(false);
        this.dialogRef.close(updated);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.detail || err.error?.message || err.message || `Request failed (${err.status})`;
        this.errorMsg.set(msg);
      },
    });
  }
}
