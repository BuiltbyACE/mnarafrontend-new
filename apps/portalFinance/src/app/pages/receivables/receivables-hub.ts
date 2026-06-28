import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../services/finance.service';
import { FeeStructure, StudentInvoice, FORMAT_CURRENCY } from '../../models/finance.models';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import type { TDocumentDefinitions, TableCell } from 'pdfmake/interfaces';

(pdfMake as any).vfs = (pdfFonts as any).vfs;

@Component({
  selector: 'app-receivables-hub',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
        <div class="header-actions">
          <button class="btn-secondary" (click)="openManualPaymentModal()" [disabled]="!selectedInvoices().length">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="5" width="20" height="14" rx="2" ry="2"/>
              <line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
            Record Payment ({{ selectedInvoices().length }})
          </button>
          <button class="btn-primary" (click)="openReminderModal()" [disabled]="!selectedInvoices().length">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
            Send Reminders
          </button>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-label">Total Arrears</span>
          <span class="stat-value text-rose">{{ FORMAT_CURRENCY(totalArrears()) }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Outstanding Invoices</span>
          <span class="stat-value">{{ outstandingInvoices().length }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Active Fee Structures</span>
          <span class="stat-value text-blue">{{ feeStructures().length }}</span>
        </div>
      </div>

      <div class="hub-grid">
        <!-- Outstanding Balances Table -->
        <div class="panel main-panel">
          <div class="panel-header">
            <h3>Outstanding Balances</h3>
            <div class="panel-actions">
              <div class="search-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" [(ngModel)]="searchQuery" placeholder="Search student or ID..." class="search-input">
              </div>
            </div>
          </div>
          
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="col-check">
                    <input type="checkbox" 
                           [checked]="selectedInvoices().length === filteredInvoices().length && filteredInvoices().length > 0"
                           (change)="toggleAll($event)">
                  </th>
                  <th>Student</th>
                  <th>Invoice Ref</th>
                  <th>Status</th>
                  <th class="text-right">Amount Due</th>
                  <th class="text-right">Balance</th>
                  <th class="actions-col">Action</th>
                </tr>
              </thead>
              <tbody>
                @for (inv of filteredInvoices(); track inv.id) {
                  <tr [class.selected]="isSelected(inv.id)">
                    <td class="col-check">
                      <input type="checkbox" [checked]="isSelected(inv.id)" (change)="toggleSelection(inv.id)">
                    </td>
                    <td>
                      <div class="student-info">
                        <span class="student-name">{{ inv.student_name }}</span>
                        <span class="student-id">{{ inv.student_school_id }}</span>
                      </div>
                    </td>
                    <td><span class="mono-badge">#{{ inv.id }}</span></td>
                    <td>
                      <span class="status-badge" [class]="inv.status">{{ inv.status }}</span>
                    </td>
                    <td class="text-right">{{ FORMAT_CURRENCY(inv.amount_due) }}</td>
                    <td class="text-right font-bold text-rose">{{ FORMAT_CURRENCY(+inv.amount_due - +inv.amount_paid) }}</td>
                    <td class="actions-col">
                      <button class="btn-action download" (click)="generateInvoicePdf(inv)" title="Download Invoice">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                      </button>
                    </td>
                  </tr>
                }
                @if (filteredInvoices().length === 0) {
                  <tr>
                    <td colspan="7" class="empty-state">
                      No outstanding balances found.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Reminder Modal -->
      @if (showReminderModal()) {
        <div class="modal-overlay">
          <div class="modal-content">
            <div class="modal-header">
              <h2>Send Bulk Reminders</h2>
              <button class="close-btn" (click)="showReminderModal.set(false)">&times;</button>
            </div>
            <div class="modal-body">
              <p class="modal-desc">You are about to send reminders to the parents of <strong>{{ selectedInvoices().length }}</strong> students.</p>
              
              <div class="form-group">
                <label>Method</label>
                <div class="radio-group">
                  <label class="radio-label">
                    <input type="radio" [(ngModel)]="reminderMethod" value="SMS"> SMS (Africa's Talking)
                  </label>
                  <label class="radio-label">
                    <input type="radio" [(ngModel)]="reminderMethod" value="EMAIL"> Email
                  </label>
                </div>
              </div>

              <div class="form-group">
                <label>Custom Message (Optional)</label>
                <textarea [(ngModel)]="reminderMessage" rows="3" placeholder="Leave blank to use the default automated message with exact balances..."></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-ghost" (click)="showReminderModal.set(false)" [disabled]="isProcessing()">Cancel</button>
              <button class="btn-primary" (click)="dispatchReminders()" [disabled]="isProcessing()">
                {{ isProcessing() ? 'Sending...' : 'Dispatch Reminders' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Record Payment Modal -->
      @if (showPaymentModal()) {
        <div class="modal-overlay">
          <div class="modal-content">
            <div class="modal-header">
              <h2>Record Offline Payment</h2>
              <button class="close-btn" (click)="showPaymentModal.set(false)">&times;</button>
            </div>
            <div class="modal-body">
              <div class="payment-summary">
                Applying payment to <strong>{{ selectedInvoices().length }}</strong> selected invoice(s).
              </div>
              
              <div class="form-group">
                <label>Total Amount Received (KES)</label>
                <input type="number" [(ngModel)]="paymentAmount" class="form-control" placeholder="e.g. 50000">
              </div>

              <div class="form-group">
                <label>Payment Method</label>
                <select [(ngModel)]="paymentMethod" (ngModelChange)="onPaymentMethodChange()" class="form-control">
                  <option value="MPESA">M-Pesa</option>
                  <option value="BANK">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="CASH">Cash</option>
                </select>
              </div>

              @if (paymentMethod !== 'CASH') {
                <div class="form-group">
                  <label>Reference Code</label>
                  <input type="text" [(ngModel)]="paymentReference" class="form-control" placeholder="e.g. Bank Slip Number or Cheque No">
                </div>
              }
              
              <p class="ledger-note">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                This will automatically generate an immutable Journal Entry in the Master Ledger.
              </p>
            </div>
            <div class="modal-footer">
              <button class="btn-ghost" (click)="showPaymentModal.set(false)" [disabled]="isProcessing()">Cancel</button>
              <button class="btn-primary" (click)="recordPayment()" [disabled]="isProcessing() || !paymentAmount || (paymentMethod !== 'CASH' && !paymentReference)">
                {{ isProcessing() ? 'Processing...' : 'Post to Ledger' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 0; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #0f172a; letter-spacing: -0.02em; }
    .page-subtitle { font-size: 0.875rem; color: #64748b; margin-top: 4px; }
    .badge-live { font-size: 0.6875rem; background: #d1fae5; color: #059669; padding: 2px 8px; border-radius: 999px; font-weight: 600; margin-top: 4px; display: inline-block; }
    
    .header-actions { display: flex; gap: 12px; }
    .btn-primary, .btn-secondary {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 18px; border-radius: 8px; font-weight: 600;
      font-size: 0.875rem; cursor: pointer; transition: all 0.2s;
      border: none;
    }
    .btn-primary { background: #059669; color: white; }
    .btn-primary:hover:not(:disabled) { background: #047857; }
    .btn-secondary { background: white; color: #334155; border: 1px solid #cbd5e1; }
    .btn-secondary:hover:not(:disabled) { background: #f8fafc; border-color: #94a3b8; }
    .btn-primary:disabled, .btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-icon { width: 18px; height: 18px; }

    .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 24px; }
    .stat-card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
    .stat-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 600; }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: #0f172a; font-family: 'SF Mono', 'Cascadia Code', monospace; }
    .text-rose { color: #e11d48; }
    .text-blue { color: #2563eb; }

    .hub-grid { display: flex; flex-direction: column; gap: 24px; }
    .panel { background: white; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
    .panel-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; }
    .panel-header h3 { font-size: 1rem; font-weight: 600; color: #0f172a; margin: 0; }
    
    .search-box { position: relative; width: 250px; }
    .search-box svg { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: #94a3b8; }
    .search-input { width: 100%; padding: 8px 12px 8px 34px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.8125rem; outline: none; }
    .search-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.1); }

    .table-container { overflow-x: auto; max-height: 500px; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table thead { position: sticky; top: 0; background: #f8fafc; z-index: 10; }
    .data-table th { padding: 12px 16px; text-align: left; font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0; }
    .data-table td { padding: 12px 16px; font-size: 0.875rem; color: #334155; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    .data-table tr:hover td { background: #f8fafc; }
    .data-table tr.selected td { background: #eff6ff; }
    
    .col-check { width: 40px; text-align: center; }
    .text-right { text-align: right !important; }
    .font-bold { font-weight: 600; }
    .actions-col { text-align: center; width: 60px; }
    
    .btn-action { width: 28px; height: 28px; border-radius: 6px; border: none; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.2s; }
    .btn-action svg { width: 14px; height: 14px; }
    .btn-action.download { background: #eff6ff; color: #2563eb; }
    .btn-action.download:hover { background: #dbeafe; }
    
    .student-info { display: flex; flex-direction: column; gap: 2px; }
    .student-name { font-weight: 500; color: #0f172a; }
    .student-id { font-size: 0.75rem; color: #64748b; }
    
    .mono-badge { font-family: 'SF Mono', monospace; font-size: 0.75rem; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; color: #475569; }
    
    .status-badge { font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 3px 8px; border-radius: 999px; font-weight: 700; }
    .status-badge.PENDING { background: #fef3c7; color: #d97706; }
    .status-badge.PARTIAL { background: #dbeafe; color: #2563eb; }
    .status-badge.OVERDUE { background: #ffe4e6; color: #e11d48; }

    .empty-state { text-align: center; padding: 40px; color: #94a3b8; font-style: italic; }

    /* Modals */
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15,23,42,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.2s; }
    .modal-content { background: white; border-radius: 12px; width: 450px; max-width: 90vw; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); overflow: hidden; animation: slideUp 0.2s; }
    .modal-header { padding: 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .modal-header h2 { margin: 0; font-size: 1.125rem; font-weight: 600; color: #0f172a; }
    .close-btn { background: none; border: none; font-size: 1.5rem; color: #94a3b8; cursor: pointer; }
    .modal-body { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
    .modal-desc, .payment-summary { font-size: 0.875rem; color: #475569; margin: 0; }
    .payment-summary { padding: 12px; background: #eff6ff; border-radius: 8px; color: #1d4ed8; }
    
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 0.75rem; font-weight: 600; color: #334155; }
    .form-control, textarea { width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.875rem; outline: none; font-family: inherit; }
    .form-control:focus, textarea:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.1); }
    textarea { resize: vertical; }
    
    .radio-group { display: flex; gap: 16px; }
    .radio-label { display: flex; align-items: center; gap: 6px; font-size: 0.875rem; cursor: pointer; }
    
    .ledger-note { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; color: #059669; background: #ecfdf5; padding: 10px; border-radius: 6px; margin: 0; }
    .ledger-note svg { width: 14px; height: 14px; flex-shrink: 0; }

    .modal-footer { padding: 16px 20px; border-top: 1px solid #e2e8f0; background: #f8fafc; display: flex; justify-content: flex-end; gap: 12px; }
    .btn-ghost { background: transparent; border: none; color: #64748b; font-weight: 500; padding: 8px 16px; cursor: pointer; }
    .btn-ghost:hover { color: #0f172a; }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  `],
})
export class ReceivablesHubComponent implements OnInit {
  private financeService = inject(FinanceService);

  feeStructures = signal<FeeStructure[]>([]);
  outstandingInvoices = signal<StudentInvoice[]>([]);
  liveMode = signal(false);
  
  searchQuery = '';
  selectedIds = signal<Set<number>>(new Set());

  // Modals
  showReminderModal = signal(false);
  showPaymentModal = signal(false);
  isProcessing = signal(false);

  // Reminder State
  reminderMethod: 'SMS' | 'EMAIL' = 'SMS';
  reminderMessage = '';

  // Payment State
  paymentAmount: number | null = null;
  paymentMethod = 'BANK';
  paymentReference = '';

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

    // Fetch fee balances (outstanding invoices)
    this.financeService.getFeeBalances().subscribe({
      next: (res) => this.outstandingInvoices.set(res.results),
      error: () => this.outstandingInvoices.set([]),
    });
  }

  filteredInvoices = computed(() => {
    const q = this.searchQuery.toLowerCase();
    if (!q) return this.outstandingInvoices();
    return this.outstandingInvoices().filter(inv => 
      inv.student_name.toLowerCase().includes(q) || 
      inv.student_school_id?.toLowerCase().includes(q) ||
      inv.id.toString() === q
    );
  });

  totalArrears = computed(() => {
    return this.outstandingInvoices().reduce((sum, inv) => sum + (Number(inv.amount_due) - Number(inv.amount_paid)), 0);
  });

  selectedInvoices = computed(() => Array.from(this.selectedIds()));

  // Selection Logic
  isSelected(id: number): boolean {
    return this.selectedIds().has(id);
  }

  toggleSelection(id: number) {
    const current = new Set(this.selectedIds());
    if (current.has(id)) current.delete(id);
    else current.add(id);
    this.selectedIds.set(current);
  }

  toggleAll(event: any) {
    if (event.target.checked) {
      const allIds = this.filteredInvoices().map(i => i.id);
      this.selectedIds.set(new Set(allIds));
    } else {
      this.selectedIds.set(new Set());
    }
  }

  // Actions
  openReminderModal() {
    this.reminderMessage = '';
    this.showReminderModal.set(true);
  }

  dispatchReminders() {
    this.isProcessing.set(true);
    // Convert invoice IDs to student IDs for the backend reminder endpoint
    const selectedInvIds = this.selectedInvoices();
    const studentIds = this.outstandingInvoices()
      .filter(inv => selectedInvIds.includes(inv.id))
      .map(inv => inv.student);

    // Deduplicate student IDs
    const uniqueStudentIds = [...new Set(studentIds)];

    this.financeService.sendReminders({
      targets: uniqueStudentIds,
      method: this.reminderMethod,
      message: this.reminderMessage
    }).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.showReminderModal.set(false);
        this.selectedIds.set(new Set());
        alert('Reminders dispatched successfully!');
      },
      error: () => {
        this.isProcessing.set(false);
        alert('Failed to dispatch reminders.');
      }
    });
  }

  onPaymentMethodChange() {
    if (this.paymentMethod === 'CASH') {
      this.paymentReference = '';
    }
  }

  openManualPaymentModal() {
    this.paymentAmount = null;
    this.paymentReference = '';
    this.paymentMethod = 'BANK';
    this.showPaymentModal.set(true);
  }

  recordPayment() {
    if (!this.paymentAmount || (this.paymentMethod !== 'CASH' && !this.paymentReference)) return;
    
    // For simplicity, we apply the payment to the first selected invoice
    // A robust system might split the payment across multiple selected invoices
    const targetInvoiceId = this.selectedInvoices()[0];

    this.isProcessing.set(true);
    this.financeService.recordManualPayment({
      invoice: targetInvoiceId,
      amount: this.paymentAmount,
      payment_method: this.paymentMethod,
      reference_code: this.paymentMethod === 'CASH' ? '' : this.paymentReference
    }).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.showPaymentModal.set(false);
        this.selectedIds.set(new Set());
        this.loadData(); // Refresh balances
        alert('Payment recorded and Journal Entry created successfully!');
      },
      error: () => {
        this.isProcessing.set(false);
        alert('Failed to record payment.');
      }
    });
  }

  generateInvoicePdf(inv: StudentInvoice) {
    const lineItemsBody: any[][] = [
      [
        { text: 'DESCRIPTION', bold: true, fontSize: 10, color: '#ffffff', fillColor: '#2563eb', margin: [10, 8, 10, 8] },
        { text: 'AMOUNT', bold: true, fontSize: 10, color: '#ffffff', fillColor: '#2563eb', alignment: 'right', margin: [10, 8, 10, 8] }
      ],
      ...inv.items.map(item => ([
        { text: item.fee_category_name || item.description, fontSize: 11, color: '#1e293b', margin: [10, 15, 10, 15], border: [false, false, false, true] },
        { text: FORMAT_CURRENCY(item.amount_due), fontSize: 11, color: '#1e293b', alignment: 'right', margin: [10, 15, 10, 15], border: [false, false, false, true] }
      ]))
    ];
    const docDef: TDocumentDefinitions = {
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 60],
      content: [
        // --- Header Section (Colored Box) ---
        {
          table: {
            widths: ['*', 'auto'],
            body: [
              [
                {
                  stack: [
                    { text: 'MNARA SCHOOL', fontSize: 24, bold: true, color: '#ffffff', margin: [0, 0, 0, 4] },
                    { text: 'P.O. Box 12345 - 00100, Nairobi, Kenya', fontSize: 10, color: '#94a3b8' },
                    { text: 'Phone: +254 700 123 456 | Email: finance@mnaraschool.com', fontSize: 10, color: '#94a3b8' }
                  ],
                  fillColor: '#0f172a',
                  margin: [20, 20, 0, 20],
                  border: [false, false, false, false]
                },
                {
                  stack: [
                    { text: 'INVOICE', fontSize: 24, bold: true, color: '#ffffff', alignment: 'right', characterSpacing: 2 },
                    { text: `INV-${inv.id.toString().padStart(5, '0')}`, fontSize: 12, color: '#38bdf8', alignment: 'right', margin: [0, 4, 0, 0] }
                  ],
                  fillColor: '#0f172a',
                  margin: [0, 20, 20, 20],
                  border: [false, false, false, false]
                }
              ]
            ]
          },
          layout: 'noBorders',
          margin: [0, 0, 0, 30]
        },

        // --- Bill To & Details Section ---
        {
          columns: [
            {
              width: '50%',
              stack: [
                { text: 'BILLED TO:', fontSize: 10, bold: true, color: '#64748b', margin: [0, 0, 0, 4] },
                { text: inv.student_name, fontSize: 14, bold: true, color: '#0f172a', margin: [0, 0, 0, 2] },
                { text: `Admission No: ${inv.student_school_id}`, fontSize: 11, color: '#334155', margin: [0, 0, 0, 2] },
                { text: `Academic Year: ${inv.academic_year_name || 'Current'}`, fontSize: 11, color: '#334155' }
              ]
            },
            {
              width: '50%',
              stack: [
                {
                  table: {
                    widths: ['*', 'auto'],
                    body: [
                      [
                        { text: 'Invoice Date:', fontSize: 10, color: '#64748b', border: [false, false, false, false], alignment: 'right', margin: [0, 2, 8, 2] },
                        { text: new Date().toLocaleDateString(), fontSize: 10, bold: true, color: '#0f172a', border: [false, false, false, false], margin: [0, 2, 0, 2] }
                      ],
                      [
                        { text: 'Payment Status:', fontSize: 10, color: '#64748b', border: [false, false, false, false], alignment: 'right', margin: [0, 2, 8, 2] },
                        { text: inv.status, fontSize: 10, bold: true, color: (inv.status === 'PAID' ? '#059669' : inv.status === 'PARTIAL' ? '#2563eb' : '#e11d48'), border: [false, false, false, false], margin: [0, 2, 0, 2] }
                      ]
                    ]
                  },
                  layout: 'noBorders',
                  alignment: 'right'
                }
              ]
            }
          ],
          margin: [0, 0, 0, 30]
        },

        // --- Line Items Table ---
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto'],
            body: lineItemsBody
          },
          layout: {
            hLineWidth: function (i: number, node: any) { return (i === 0 || i === node.table.body.length) ? 0 : 1; },
            vLineWidth: function () { return 0; },
            hLineColor: function () { return '#e2e8f0'; },
          },
          margin: [0, 0, 0, 20]
        },

        // --- Summary Section ---
        {
          columns: [
            { width: '*', text: '' }, // Spacer
            {
              width: '40%',
              table: {
                widths: ['*', 'auto'],
                body: [
                  [
                    { text: 'Subtotal:', fontSize: 10, color: '#64748b', alignment: 'right', margin: [0, 4, 10, 4] },
                    { text: FORMAT_CURRENCY(inv.amount_due), fontSize: 10, color: '#1e293b', alignment: 'right', margin: [0, 4, 0, 4] }
                  ],
                  [
                    { text: 'Amount Paid:', fontSize: 10, color: '#059669', alignment: 'right', margin: [0, 4, 10, 4] },
                    { text: `-${FORMAT_CURRENCY(inv.amount_paid)}`, fontSize: 10, color: '#059669', alignment: 'right', margin: [0, 4, 0, 4] }
                  ],
                  [
                    { text: 'OUTSTANDING BALANCE', bold: true, fontSize: 11, color: '#0f172a', alignment: 'right', margin: [0, 10, 10, 10] },
                    { text: FORMAT_CURRENCY(+inv.amount_due - +inv.amount_paid), bold: true, fontSize: 12, color: '#e11d48', alignment: 'right', margin: [0, 10, 0, 10], fillColor: '#fff1f2' }
                  ]
                ]
              },
              layout: 'noBorders'
            }
          ],
          margin: [0, 0, 0, 40]
        },

        // --- Payment Instructions ---
        {
          stack: [
            { text: 'Payment Instructions:', fontSize: 12, bold: true, color: '#0f172a', margin: [0, 0, 0, 8] },
            { text: '1. M-PESA Paybill: 123456 | Account No: ' + inv.student_school_id, fontSize: 10, color: '#475569', margin: [0, 0, 0, 4] },
            { text: '2. Bank Transfer: Equity Bank, Acc No: 0123456789 (Mnara School)', fontSize: 10, color: '#475569', margin: [0, 0, 0, 4] },
            { text: 'Please ensure you quote the student Admission Number when making payments to ensure prompt updating of the ledger.', fontSize: 10, italics: true, color: '#64748b', margin: [0, 8, 0, 0] }
          ],
          margin: [15, 15, 15, 15]
        }
      ],
      defaultStyle: { font: 'Roboto' }
    };

    pdfMake.createPdf(docDef).open();
  }
}

