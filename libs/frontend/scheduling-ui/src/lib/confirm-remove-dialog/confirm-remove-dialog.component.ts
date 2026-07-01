import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmRemoveData {
  subjectName: string;
  periodLabel: string;
  dayName: string;
  teacherName: string;
  yearLevelName: string;
}

@Component({
  selector: 'sched-confirm-remove-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <div class="confirm-dialog">
      <div class="dialog-header">
        <div class="icon-warn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#dc2626" stroke-width="1.5"/>
            <path d="M12 8v4M12 16h.01" stroke="#dc2626" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <h2 mat-dialog-title>Remove Lesson?</h2>
      </div>

      <mat-dialog-content>
        <p class="dialog-desc">
          This will remove <strong>{{ data.subjectName }}</strong>
          @if (data.teacherName) {
            with <strong>{{ data.teacherName }}</strong>
          }
          from <strong>{{ data.periodLabel }}</strong> on <strong>{{ data.dayName }}</strong>
          @if (data.yearLevelName) {
            for <strong>{{ data.yearLevelName }}</strong>
          }.
        </p>
        <p class="dialog-hint">This action cannot be undone.</p>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Cancel</button>
        <button mat-raised-button color="warn" (click)="confirm()">Remove</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-dialog { min-width: 380px; }
    .dialog-header { display: flex; align-items: center; gap: 12px; padding: 20px 24px 0; }
    .icon-warn { flex-shrink: 0; }
    .dialog-header h2 { margin: 0; font-size: 1.125rem; font-weight: 700; color: var(--tt-text, #0b1a2e); }
    .dialog-desc { font-size: 0.8125rem; color: var(--tt-text-body, #5e6f8d); line-height: 1.6; margin: 16px 0 8px; }
    .dialog-hint { font-size: 0.75rem; color: #991b1b; margin: 0 0 8px; }
    mat-dialog-actions { padding: 16px 24px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmRemoveDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmRemoveDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmRemoveData,
  ) {}

  confirm(): void {
    this.dialogRef.close(true);
  }
}
