import { Component, Inject, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { ParentApiService } from '../../../services/parent-api.service';

export interface PaymentDialogData {
  studentName: string;
  totalAmount: number;
  invoiceIds: number[];
}

@Component({
  selector: 'app-payment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon>phone_iphone</mat-icon> M-Pesa STK Push
    </h2>
    <mat-dialog-content class="dialog-content">
      <p class="summary-text">
        You are about to pay <strong>KES {{ data.totalAmount | number }}</strong> for <strong>{{ data.studentName }}</strong>'s outstanding invoices.
      </p>

      @if (errorMessage()) {
        <div class="error-box">
          <mat-icon>error</mat-icon>
          <span>{{ errorMessage() }}</span>
        </div>
      }

      @if (successMessage()) {
        <div class="success-box">
          <mat-icon>check_circle</mat-icon>
          <span>{{ successMessage() }}</span>
        </div>
        <p class="instruction">
          Please check your phone and enter your M-Pesa PIN to complete the transaction.
        </p>
      } @else {
        <mat-form-field appearance="outline" class="phone-input">
          <mat-label>Safaricom Phone Number</mat-label>
          <input matInput [(ngModel)]="phone" placeholder="e.g. 254712345678" [disabled]="loading()">
          <mat-hint>Format: 2547XXXXXXXX</mat-hint>
        </mat-form-field>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      @if (successMessage()) {
        <button mat-button (click)="closeDialog(true)">Close</button>
      } @else {
        <button mat-button (click)="closeDialog(false)" [disabled]="loading()">Cancel</button>
        <button mat-flat-button color="primary" (click)="pay()" [disabled]="!isValidPhone() || loading()">
          @if (loading()) {
            <mat-spinner diameter="20"></mat-spinner>
            <span class="ml-2">Processing...</span>
          } @else {
            Pay KES {{ data.totalAmount | number }}
          }
        </button>
      }
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-title {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #047857; /* Emerald green for M-Pesa feel */
    }
    .dialog-content {
      padding-top: 16px;
      min-width: 320px;
    }
    .summary-text {
      margin-bottom: 24px;
      color: #334155;
      line-height: 1.5;
    }
    .phone-input {
      width: 100%;
    }
    .error-box {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #fef2f2;
      color: #dc2626;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 14px;
    }
    .success-box {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #ecfdf5;
      color: #059669;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 14px;
      font-weight: 500;
    }
    .instruction {
      font-size: 14px;
      color: #475569;
      font-style: italic;
    }
    .ml-2 {
      margin-left: 8px;
    }
  `]
})
export class PaymentDialogComponent {
  phone = '254';
  loading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  private apiService = inject(ParentApiService);
  public dialogRef = inject(MatDialogRef<PaymentDialogComponent>);
  public data: PaymentDialogData = inject(MAT_DIALOG_DATA);

  isValidPhone(): boolean {
    return /^254\d{9}$/.test(this.phone.trim());
  }

  pay(): void {
    if (!this.isValidPhone()) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    this.apiService.initiateMpesaPayment({
      phone: this.phone.trim(),
      invoice_ids: this.data.invoiceIds
    }).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        this.successMessage.set('Payment initiated successfully!');
      },
      error: (err: any) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.error || 'Failed to initiate M-Pesa payment. Please try again.');
      }
    });
  }

  closeDialog(success: boolean): void {
    this.dialogRef.close(success);
  }
}
