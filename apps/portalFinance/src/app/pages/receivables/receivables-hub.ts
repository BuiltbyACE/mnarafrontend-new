import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanceService } from '../../services/finance.service';
import { FeeStructure, StudentInvoice, FORMAT_CURRENCY } from '../../models/finance.models';

@Component({
  selector: 'app-receivables-hub',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container page-fade-in">
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">Receivables</h1>
          <p class="page-subtitle">Fee collection, invoicing & payment tracking</p>
          @if (liveMode()) {
            <span class="badge-live">Live</span>
          }
        </div>
        <button class="btn-primary" (click)="createInvoice()">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Generate Invoices
        </button>
      </div>

      <div class="hub-grid">
        <div class="panel left-panel">
          <div class="panel-header">
            <h3>Active Fee Structures</h3>
            <span class="panel-count">{{ feeStructures().length }} structures</span>
          </div>
          <div class="fee-list">
            @for (fee of feeStructures(); track fee.id) {
              <div class="fee-card">
                <div class="fee-top">
                  <span class="fee-year">{{ fee.year_level_name || 'Fee Structure' }}</span>
                  <span class="fee-badge active">Active</span>
                </div>
                <p class="fee-curriculum">{{ fee.title }}</p>
                <div class="fee-details">
                  <div class="fee-detail">
                    <span class="detail-label">Amount</span>
                    <span class="detail-value">{{ FORMAT_CURRENCY(fee.amount) }}</span>
                  </div>
                  <div class="fee-detail">
                    <span class="detail-label">Acad Year</span>
                    <span class="detail-value">{{ fee.academic_year_name }}</span>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        <div class="panel right-panel">
          <div class="panel-header">
            <h3>Recent Invoices & Payments</h3>
            <span class="panel-count">{{ invoices().length }} invoices</span>
          </div>
          <div class="invoice-list">
            @for (inv of invoices(); track inv.id) {
              <div class="invoice-item">
                <div class="invoice-top">
                  <span class="invoice-id">#{{ inv.id }}</span>
                  <span class="invoice-status" [class.PAID]="inv.status === 'PAID'" [class.PENDING]="inv.status === 'PENDING'" [class.PARTIAL]="inv.status === 'PARTIAL'">
                    {{ inv.status }}
                  </span>
                </div>
                <span class="invoice-student">{{ inv.student_name }} — {{ inv.student_school_id }}</span>
                <div class="invoice-bottom">
                  <span class="invoice-amount">{{ FORMAT_CURRENCY(inv.amount_due) }}</span>
                  <span class="invoice-meta">
                    <span class="payment-method">
                      Paid: {{ FORMAT_CURRENCY(inv.amount_paid) }}
                    </span>
                  </span>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 0; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28px; gap: 20px; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #0f172a; letter-spacing: -0.02em; }
    .page-subtitle { font-size: 0.875rem; color: #64748b; margin-top: 4px; }
    .badge-live { font-size: 0.6875rem; background: #d1fae5; color: #059669; padding: 2px 8px; border-radius: 999px; font-weight: 600; margin-top: 4px; display: inline-block; }

    .btn-primary {
      display: flex; align-items: center; gap: 8px;
      background: #059669; color: white; border: none;
      padding: 10px 20px; border-radius: 8px; font-weight: 600;
      font-size: 0.875rem; cursor: pointer; flex-shrink: 0;
      transition: background 0.2s;
    }
    .btn-primary:hover { background: #047857; }
    .btn-icon { width: 18px; height: 18px; }

    .hub-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

    .panel { background: white; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
    .panel-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; }
    .panel-header h3 { font-size: 0.9375rem; font-weight: 600; color: #0f172a; }
    .panel-count { font-size: 0.75rem; color: #64748b; background: #f1f5f9; padding: 2px 10px; border-radius: 999px; }

    .fee-list { padding: 12px; display: flex; flex-direction: column; gap: 8px; max-height: 600px; overflow-y: auto; }
    .fee-card { padding: 14px; border: 1px solid #f1f5f9; border-radius: 8px; transition: border-color 0.2s, box-shadow 0.2s; }
    .fee-card:hover { border-color: #dbeafe; box-shadow: 0 2px 8px rgba(37,99,235,0.06); }
    .fee-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
    .fee-year { font-size: 0.9375rem; font-weight: 700; color: #0f172a; }
    .fee-badge { font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 2px 8px; border-radius: 999px; font-weight: 600; }
    .fee-badge.active { background: #d1fae5; color: #059669; }
    .fee-curriculum { font-size: 0.75rem; color: #64748b; margin-bottom: 10px; }
    .fee-details { display: flex; gap: 24px; }
    .fee-detail { display: flex; flex-direction: column; gap: 1px; }
    .detail-label { font-size: 0.6875rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.03em; }
    .detail-value { font-size: 0.8125rem; font-weight: 600; color: #0f172a; }

    .invoice-list { padding: 12px; display: flex; flex-direction: column; gap: 8px; max-height: 600px; overflow-y: auto; }
    .invoice-item { padding: 14px; border: 1px solid #f1f5f9; border-radius: 8px; display: flex; flex-direction: column; gap: 6px; }
    .invoice-item:hover { border-color: #dbeafe; }
    .invoice-top { display: flex; align-items: center; justify-content: space-between; }
    .invoice-id { font-size: 0.75rem; font-weight: 600; color: #2563eb; font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; }
    .invoice-status { font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 2px 8px; border-radius: 999px; font-weight: 700; }
    .invoice-status.PAID { background: #d1fae5; color: #059669; }
    .invoice-status.PENDING { background: #fef3c7; color: #d97706; }
    .invoice-status.PARTIAL { background: #dbeafe; color: #2563eb; }
    .invoice-student { font-size: 0.8125rem; color: #334155; }
    .invoice-bottom { display: flex; align-items: center; justify-content: space-between; }
    .invoice-amount { font-size: 0.9375rem; font-weight: 700; color: #0f172a; font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; }
    .invoice-meta { display: flex; align-items: center; gap: 12px; font-size: 0.6875rem; color: #94a3b8; }
    .payment-method { display: flex; align-items: center; gap: 4px; color: #059669; font-weight: 500; }

    @media (max-width: 1000px) { .hub-grid { grid-template-columns: 1fr; } }
  `],
})
export class ReceivablesHubComponent implements OnInit {
  private financeService = inject(FinanceService);

  feeStructures = signal<FeeStructure[]>([]);
  invoices = signal<StudentInvoice[]>([]);
  liveMode = signal(false);
  FORMAT_CURRENCY = FORMAT_CURRENCY;

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    this.financeService.getFeeStructures().subscribe({
      next: (res) => {
        this.feeStructures.set(res.results);
        this.liveMode.set(true);
      },
      error: () => this.feeStructures.set([]),
    });

    this.financeService.getInvoices().subscribe({
      next: (res) => this.invoices.set(res.results),
      error: () => this.invoices.set([]),
    });
  }

  createInvoice() {
    alert('Invoice generation will be available in the next release.');
  }
}
