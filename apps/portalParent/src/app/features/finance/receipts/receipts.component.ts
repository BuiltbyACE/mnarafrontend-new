import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ParentApiService } from '../../../services/parent-api.service';
import { ParentReceipt, PAYMENT_METHOD_LABEL } from '../../../models/parent.models';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import { PdfStylingService } from '../../../services/pdf-styling.service';

(pdfMake as any).vfs = (pdfFonts as any).vfs;

@Component({
  selector: 'app-receipts',
  imports: [DatePipe, MatIconModule, MatCardModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="receipts-page">
      <header class="page-header">
        <mat-icon class="header-icon">receipt</mat-icon>
        <div class="header-text">
          <h1>Receipts</h1>
          <p>View and download payment receipts</p>
        </div>
      </header>

      @if (loading()) {
        <div class="loading-state">
          <mat-spinner diameter="36" />
          <span>Loading receipts...</span>
        </div>
      } @else if (error()) {
        <div class="error-msg">{{ error() }}</div>
      } @else if (receipts().length === 0) {
        <div class="empty-state">
          <mat-icon class="empty-icon">receipt_long</mat-icon>
          <h3>No Receipts Yet</h3>
          <p>Receipts will appear here once payments are processed and allocated.</p>
        </div>
      } @else {
        <section class="receipts-list">
          @for (receipt of receipts(); track receipt.id) {
            <mat-card class="receipt-card" appearance="outlined">
              <mat-card-content>
                <div class="receipt-row">
                  <div class="receipt-info">
                    <span class="receipt-number">{{ receipt.receipt_number }}</span>
                    <span class="receipt-date">{{ formatDate(receipt.issued_at) }}</span>
                  </div>
                  <div class="receipt-amount">{{ formatCurrency(receipt.amount) }}</div>
                  <div class="receipt-method">{{ PAYMENT_METHOD_LABEL[receipt.payment_method ?? ''] || receipt.payment_method || '—' }}</div>
                  <button mat-stroked-button (click)="downloadReceipt(receipt)" [disabled]="pdfLoading()">
                    <mat-icon>download</mat-icon>
                    Download
                  </button>
                </div>
              </mat-card-content>
            </mat-card>
          }
        </section>

        @if (pdfError()) {
          <div class="error-msg pdf-error">{{ pdfError() }}</div>
        }
      }
    </div>
  `,
  styles: [`
    .receipts-page { padding: 24px; max-width: 900px; margin: 0 auto; }
    .page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .page-header h1 { margin: 0; font-size: 24px; font-weight: 600; color: #1e293b; }
    .page-header p { margin: 2px 0 0; color: #64748b; font-size: 14px; }
    .header-icon { font-size: 32px; width: 32px; height: 32px; color: #059669; }
    .loading-state { display: flex; align-items: center; gap: 12px; justify-content: center; padding: 48px; color: #64748b; }
    .error-msg { padding: 16px; background: #fef2f2; color: #dc2626; border-radius: 8px; margin-bottom: 16px; }
    .pdf-error { margin-top: 16px; }
    .empty-state { text-align: center; padding: 64px 24px; color: #94a3b8; }
    .empty-state h3 { margin: 12px 0 4px; color: #64748b; }
    .empty-icon { font-size: 64px; width: 64px; height: 64px; color: #cbd5e1; }
    .receipts-list { display: flex; flex-direction: column; gap: 8px; }
    .receipt-card { border-radius: 8px; }
    .receipt-row { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .receipt-info { display: flex; flex-direction: column; min-width: 180px; }
    .receipt-number { font-weight: 600; font-size: 15px; color: #1e293b; font-family: monospace; }
    .receipt-date { font-size: 12px; color: #94a3b8; }
    .receipt-amount { font-size: 18px; font-weight: 700; color: #059669; margin-left: auto; min-width: 120px; text-align: right; }
    .receipt-method { font-size: 13px; color: #64748b; min-width: 80px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReceiptsComponent implements OnInit {
  private readonly api = inject(ParentApiService);
  private readonly pdfStyling = inject(PdfStylingService);
  private readonly snackBar = inject(MatSnackBar);

  readonly receipts = signal<ParentReceipt[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly pdfLoading = signal(false);
  readonly pdfError = signal<string | null>(null);

  readonly PAYMENT_METHOD_LABEL = PAYMENT_METHOD_LABEL;

  ngOnInit(): void {
    this.api.getReceipts().subscribe({
      next: (data) => {
        this.receipts.set(data.receipts);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Failed to load receipts.');
      },
    });
  }

  downloadReceipt(receipt: ParentReceipt): void {
    this.pdfLoading.set(true);
    this.pdfError.set(null);
    try {
      const docDef = this.buildReceiptPdf(receipt);
      pdfMake.createPdf(docDef).download(`receipt-${receipt.receipt_number}.pdf`);
      this.snackBar.open('Receipt downloaded!', 'Close', { duration: 3000 });
    } catch {
      this.pdfError.set('Failed to generate receipt PDF.');
    }
    this.pdfLoading.set(false);
  }

  private buildReceiptPdf(receipt: ParentReceipt): TDocumentDefinitions {
    const C = this.pdfStyling.colors;
    const content: any[] = [
      { text: 'PAYMENT RECEIPT', fontSize: 18, bold: true, color: C.primary, margin: [0, 0, 0, 16] },
      {
        table: {
          widths: ['*', 'auto'],
          body: [
            ['Receipt Number:', { text: receipt.receipt_number, bold: true }],
            ['Date Issued:', new Date(receipt.issued_at).toLocaleDateString('en-KE')],
            ['Amount:', { text: this.formatCurrency(receipt.amount), bold: true, color: C.success }],
            ['Payment:', PAYMENT_METHOD_LABEL[receipt.payment_method ?? ''] || receipt.payment_method || '—'],
          ],
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 16],
      },
      { text: 'Thank you for your payment.', fontSize: 10, color: C.slate600, italics: true },
    ];

    return this.pdfStyling.buildDocumentDefinition(content, {
      title: `Receipt ${receipt.receipt_number}`,
      subject: 'Payment Receipt',
      keywords: ['receipt', 'payment', 'school'],
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount);
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
