import { Component, inject } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

export interface ApprovalItem {
  id: number;
  type: string;
  requester: string;
  description: string;
  submittedAt: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ReviewApprovalResult {
  action: 'approve' | 'reject';
  reason?: string;
}

@Component({
  selector: 'app-review-approval-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, FormsModule, DatePipe, UpperCasePipe],
  template: `
    <h2 mat-dialog-title>Review Approval</h2>
    <mat-dialog-content>
      <div class="detail-row">
        <span class="detail-label">Type</span>
        <span class="detail-value">{{ data.type }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Requester</span>
        <span class="detail-value">{{ data.requester }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Description</span>
        <span class="detail-value">{{ data.description }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Submitted</span>
        <span class="detail-value">{{ data.submittedAt | date:'medium' }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Priority</span>
        <span class="detail-value priority-{{ data.priority }}">{{ data.priority | uppercase }}</span>
      </div>
      <mat-form-field appearance="outline" class="reason-field">
        <mat-label>Rejection reason (required for reject)</mat-label>
        <textarea matInput [(ngModel)]="reason" rows="3" placeholder="Why is this being rejected?"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-stroked-button color="warn" [disabled]="isRejectDisabled()" (click)="reject()">
        <mat-icon>close</mat-icon> Reject
      </button>
      <button mat-flat-button color="primary" (click)="approve()">
        <mat-icon>check</mat-icon> Approve
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .detail-row { display: flex; gap: 12px; margin-bottom: 12px; font-size: 0.875rem; }
    .detail-label { flex: 0 0 100px; color: #64748b; font-weight: 600; }
    .detail-value { color: #1e293b; }
    .priority-high { color: #e11d48; font-weight: 700; }
    .priority-medium { color: #d97706; font-weight: 600; }
    .priority-low { color: #059669; font-weight: 600; }
    .reason-field { width: 100%; margin-top: 8px; }
  `],
})
export class ReviewApprovalDialogComponent {
  readonly dialogRef = inject(MatDialogRef<ReviewApprovalDialogComponent, ReviewApprovalResult>);
  readonly data: ApprovalItem = inject(MAT_DIALOG_DATA);

  reason = '';

  isRejectDisabled(): boolean {
    return this.reason.trim().length === 0;
  }

  approve(): void {
    this.dialogRef.close({ action: 'approve' });
  }

  reject(): void {
    this.dialogRef.close({ action: 'reject', reason: this.reason.trim() });
  }
}
