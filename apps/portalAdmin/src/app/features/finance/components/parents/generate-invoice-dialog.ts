import { Component, Inject, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { FinanceService } from '../../services/finance.service';
import {
  SuggestedInvoicesResponse, SuggestedInvoice, AlreadyGeneratedInvoice,
  INVOICE_STATUS_COLOR,
} from '../../../../shared/models/finance.models';

export interface InvoiceDialogData {
  studentId: number;
  studentName: string;
}

interface CheckableSuggested extends SuggestedInvoice {
  checked: boolean;
  editedAmount: number;
}

@Component({
  selector: 'app-generate-invoice-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatDialogModule, MatButtonModule, MatCheckboxModule, MatInputModule,
    MatIconModule, MatProgressSpinnerModule, MatSnackBarModule, MatDividerModule,
  ],
  template: `
    <h2 mat-dialog-title>Generate Invoice</h2>
    <mat-dialog-content>
      <p class="dialog-student">Student: <strong>{{ data.studentName }}</strong></p>

      @if (loading()) {
        <div class="loading-wrap">
          <mat-spinner diameter="24"></mat-spinner>
          <span>Checking available fee items...</span>
        </div>
      } @else if (error()) {
        <div class="error-msg">{{ error() }}</div>
      } @else if (response(); as res) {
        <div class="period-banner">
          <mat-icon>calendar_today</mat-icon>
          {{ res.academic_year }} — {{ res.term }}
        </div>

        <!-- Suggested -->
        <h3 class="section-title">
          <mat-icon>add_circle</mat-icon>
          Suggested Invoices
        </h3>
        @if (suggestedItems().length > 0) {
          <div class="item-list">
            @for (item of suggestedItems(); track item.fee_structure_id) {
              <div class="item-row" [class.checked]="item.checked">
                <mat-checkbox [(ngModel)]="item.checked" (ngModelChange)="onCheckChange()"></mat-checkbox>
                <div class="item-info">
                  <span class="item-title">{{ item.title }}</span>
                  <span class="item-amount-warn" *ngIf="item.editedAmount !== item.amount">
                    <mat-icon>edit</mat-icon>
                    Edited from {{ formatCurrency(item.amount) }}
                  </span>
                </div>
                <div class="item-amount-col">
                  <input class="amount-input" type="number" min="0" step="0.01"
                         [(ngModel)]="item.editedAmount"
                         [class.edited]="item.editedAmount !== item.amount"/>
                </div>
              </div>
            }
          </div>
          <div class="suggested-summary">
            <span>{{ checkedCount() }} of {{ suggestedItems().length }} selected</span>
            <span class="total-amount">Total: {{ formatCurrency(checkedTotal()) }}</span>
          </div>
        } @else {
          <div class="empty-section">
            <mat-icon>check_circle</mat-icon>
            <span>All fee items for this term have already been generated</span>
          </div>
        }

        <mat-divider class="section-divider"></mat-divider>

        <!-- Already Generated -->
        <h3 class="section-title already-title">
          <mat-icon>receipt_long</mat-icon>
          Already Generated
        </h3>
        @if (res.already_generated.length > 0) {
          <div class="item-list already">
            @for (inv of res.already_generated; track inv.invoice_id) {
              <div class="item-row already-row">
                <div class="already-indicator"></div>
                <div class="item-info">
                  <span class="item-title">{{ getSuggestedTitle(inv.fee_structure_id) || 'Invoice #' + inv.invoice_id }}</span>
                  <span class="item-subtitle">
                    <span class="status-dot" [style.background]="INVOICE_STATUS_COLOR[inv.status] || '#94a3b8'"></span>
                    {{ inv.status }} — Balance: {{ formatCurrency(inv.balance) }}
                  </span>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="empty-section">
            <mat-icon>info</mat-icon>
            <span>No invoices have been generated for this term yet</span>
          </div>
        }
      }

      @if (submitError()) {
        <div class="error-msg">{{ submitError() }}</div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
      @if (suggestedItems().length > 0) {
        <button mat-raised-button color="primary" (click)="generate()"
                [disabled]="checkedCount() === 0 || submitting()">
          @if (submitting()) {
            <mat-spinner diameter="18" class="btn-spinner"></mat-spinner>
            {{ progressText() }}
          } @else {
            Generate {{ checkedCount() }} Invoice{{ checkedCount() === 1 ? '' : 's' }}
          }
        </button>
      }
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-student { font-size: 0.875rem; color: #6b7280; margin: 0 0 16px; }
    .loading-wrap { display: flex; align-items: center; gap: 12px; padding: 32px 0; color: #9ca3af; font-size: 0.875rem; justify-content: center; }

    .period-banner { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; font-size: 0.8125rem; font-weight: 600; color: #1e40af; margin-bottom: 16px; }
    .period-banner mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .section-title { display: flex; align-items: center; gap: 6px; font-size: 0.8125rem; font-weight: 600; color: #1f2937; margin: 0 0 10px; }
    .section-title mat-icon { font-size: 18px; width: 18px; height: 18px; color: #059669; }
    .section-title.already-title mat-icon { color: #9ca3af; }
    .section-divider { margin: 16px 0; }

    .item-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; }
    .item-row { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f9fafb; transition: background 0.15s; }
    .item-row.checked { background: #f0fdf4; border-color: #bbf7d0; }
    .item-row.already-row { background: #f3f4f6; border-color: #e5e7eb; opacity: 0.85; }
    .already-indicator { width: 4px; height: 28px; border-radius: 2px; background: #9ca3af; flex-shrink: 0; }

    .item-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .item-title { font-size: 0.8125rem; font-weight: 500; color: #1f2937; }
    .item-subtitle { display: flex; align-items: center; gap: 6px; font-size: 0.6875rem; color: #6b7280; margin-top: 2px; }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
    .item-amount-warn { display: inline-flex; align-items: center; gap: 3px; font-size: 0.625rem; color: #d97706; margin-top: 1px; }
    .item-amount-warn mat-icon { font-size: 12px; width: 12px; height: 12px; }

    .item-amount-col { flex-shrink: 0; }
    .amount-input { width: 120px; padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; font-size: 0.8125rem; font-weight: 600; text-align: right; outline: none; transition: border-color 0.15s; }
    .amount-input:focus { border-color: #2563eb; }
    .amount-input.edited { background: #fef3c7; border-color: #f59e0b; }

    .suggested-summary { display: flex; justify-content: space-between; align-items: center; padding: 6px 4px; font-size: 0.75rem; color: #6b7280; }
    .total-amount { font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; font-weight: 700; color: #059669; font-size: 0.8125rem; }

    .empty-section { display: flex; align-items: center; gap: 8px; padding: 16px 0; color: #9ca3af; font-size: 0.8125rem; }
    .empty-section mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .error-msg { font-size: 0.75rem; color: #e11d48; background: #fef2f2; padding: 8px 12px; border-radius: 6px; border: 1px solid #fecaca; margin-top: 8px; }
    .btn-spinner { display: inline-block; vertical-align: middle; margin-right: 6px; }
  `],
})
export class GenerateInvoiceDialogComponent implements OnInit {
  private financeService = inject(FinanceService);
  private dialogRef = inject(MatDialogRef<GenerateInvoiceDialogComponent>);
  private snackBar = inject(MatSnackBar);

  response = signal<SuggestedInvoicesResponse | null>(null);
  suggestedItems = signal<CheckableSuggested[]>([]);
  loading = signal(true);
  error = signal('');
  submitting = signal(false);
  submitError = signal('');
  progress = signal({ current: 0, total: 0 });

  readonly INVOICE_STATUS_COLOR = INVOICE_STATUS_COLOR;

  checkedCount = computed(() => this.suggestedItems().filter(i => i.checked).length);
  checkedTotal = computed(() => this.suggestedItems().filter(i => i.checked).reduce((sum, i) => sum + i.editedAmount, 0));
  progressText = computed(() => {
    const p = this.progress();
    return `Generating ${p.current} of ${p.total}...`;
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: InvoiceDialogData) {}

  ngOnInit() {
    this.financeService.getSuggestedInvoices(this.data.studentId).subscribe({
      next: (res) => {
        this.response.set(res);
        this.suggestedItems.set(
          res.suggested.map(s => ({ ...s, checked: true, editedAmount: s.amount }))
        );
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Failed to load suggested invoices. Please ensure the backend is running.');
      },
    });
  }

  onCheckChange() {
    // reactivity for computed signals
  }

  getSuggestedTitle(feeStructureId: number): string {
    return this.suggestedItems().find(i => i.fee_structure_id === feeStructureId)?.title || '';
  }

  generate() {
    const items = this.suggestedItems().filter(i => i.checked);
    if (items.length === 0) return;

    this.submitting.set(true);
    this.submitError.set('');
    this.progress.set({ current: 0, total: items.length });

    const parentId = this.data.studentId;
    let index = 0;

    const postNext = () => {
      if (index >= items.length) {
        this.submitting.set(false);
        this.snackBar.open(
          `${items.length} invoice${items.length === 1 ? '' : 's'} generated for ${this.data.studentName}`,
          'Close', { duration: 4000 }
        );
        this.dialogRef.close(true);
        return;
      }

      const item = items[index];
      this.progress.set({ current: index + 1, total: items.length });

      this.financeService.createInvoice({
        student: parentId,
        fee_structure: item.fee_structure_id,
        amount_due: item.editedAmount,
      }).subscribe({
        next: () => {
          index++;
          postNext();
        },
        error: (err) => {
          this.submitting.set(false);
          this.submitError.set(
            `Failed on "${item.title}": ${err.error?.message || err.error?.detail || 'Unknown error'}`
          );
        },
      });
    };

    postNext();
  }

  formatCurrency(amount: number): string {
    if (isNaN(amount)) return 'KES 0';
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 2 }).format(amount);
  }
}
