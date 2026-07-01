import { Component, Inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TimetableVersion, TeachingRequirement } from '@sms/domain/scheduling';

export interface PublishDialogData {
  version: TimetableVersion;
  requirements: TeachingRequirement[];
  entryCount: number;
}

@Component({
  selector: 'sched-publish-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="publish-dialog">
      <div class="dialog-header">
        <h2 mat-dialog-title>Publish Timetable</h2>
        <div class="version-badge">{{ data.version.status }} v{{ data.version.id }}</div>
      </div>

      <mat-dialog-content>
        <p class="dialog-intro">
          This will publish the current timetable, making it visible to teachers and students.
          Published timetables are read-only.
        </p>

        <div class="summary-cards">
          <div class="summary-card">
            <span class="summary-value">{{ data.entryCount }}</span>
            <span class="summary-label">Total Lessons</span>
          </div>
          <div class="summary-card">
            <span class="summary-value">{{ completedCount }}</span>
            <span class="summary-label">Fulfilled Requirements</span>
          </div>
          <div class="summary-card">
            <span class="summary-value">{{ totalRequired }}</span>
            <span class="summary-label">Required Periods</span>
          </div>
        </div>

        @if (unfulfilledCount > 0) {
          <div class="warning-box">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="#d97706" stroke-width="1.3"/>
              <path d="M8 5v3M8 11h.01" stroke="#d97706" stroke-width="1.3" stroke-linecap="round"/>
            </svg>
            <span>{{ unfulfilledCount }} requirement(s) are not fully scheduled</span>
          </div>
        }

        @if (publishing()) {
          <div class="publishing-state">
            <mat-spinner diameter="24"></mat-spinner>
            <span>Publishing timetable...</span>
          </div>
        }
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button [disabled]="publishing()" mat-dialog-close>Cancel</button>
        <button
          mat-raised-button
          color="primary"
          [disabled]="publishing()"
          (click)="confirm()">
          {{ publishing() ? 'Publishing...' : 'Publish Timetable' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .publish-dialog { min-width: 420px; }
    .dialog-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 0; }
    .dialog-header h2 { margin: 0; font-size: 1.125rem; font-weight: 700; color: var(--tt-text, #0b1a2e); }
    .version-badge { font-size: 0.6875rem; font-weight: 600; color: var(--tt-primary, #1a2a6c); background: var(--tt-primary-bg, #e8edfb); padding: 3px 10px; border-radius: 20px; }
    .dialog-intro { font-size: 0.8125rem; color: var(--tt-text-body, #5e6f8d); line-height: 1.5; margin: 16px 0 20px; }
    .summary-cards { display: flex; gap: 12px; margin-bottom: 16px; }
    .summary-card { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 12px 8px; background: var(--tt-surface-alt, #f8faff); border: 1px solid var(--tt-border, #e9eef4); border-radius: 12px; }
    .summary-value { font-size: 1.25rem; font-weight: 700; color: var(--tt-text, #0b1a2e); }
    .summary-label { font-size: 0.625rem; color: var(--tt-text-muted, #5e6f8d); text-transform: uppercase; letter-spacing: 0.04em; margin-top: 2px; }
    .warning-box { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; margin-bottom: 12px; font-size: 0.75rem; color: #92400e; }
    .publishing-state { display: flex; align-items: center; gap: 10px; padding: 12px 0; font-size: 0.8125rem; color: var(--tt-text-muted, #5e6f8d); }
    mat-dialog-actions { padding: 16px 24px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublishDialogComponent {
  readonly publishing = signal(false);
  readonly completedCount = this.data.requirements.filter(
    r => r.scheduled_count >= r.required_periods_per_week,
  ).length;
  readonly totalRequired = this.data.requirements.reduce(
    (sum, r) => sum + r.required_periods_per_week, 0,
  );
  readonly unfulfilledCount = this.data.requirements.filter(
    r => r.scheduled_count < r.required_periods_per_week,
  ).length;

  constructor(
    public dialogRef: MatDialogRef<PublishDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PublishDialogData,
  ) {}

  confirm(): void {
    this.publishing.set(true);
    this.dialogRef.close(true);
  }
}
