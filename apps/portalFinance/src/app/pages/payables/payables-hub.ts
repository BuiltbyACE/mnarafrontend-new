import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../services/finance.service';
import { PurchaseRequisition, Expense, FORMAT_CURRENCY } from '../../models/finance.models';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';

(pdfMake as any).vfs = (pdfFonts as any).vfs;

@Component({
  selector: 'app-payables-hub',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container page-fade-in">
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">Payables</h1>
          <p class="page-subtitle">Expense management & payroll dispatch</p>
        </div>
        <div class="header-actions">
          <button class="btn-primary" (click)="openExpenseModal()">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Log Expense
          </button>
        </div>
      </div>

      <div class="warning-banner">
        <svg class="warning-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/>
        </svg>
        <div class="warning-content">
          <strong>{{ pendingRequisitions().length }} Expense Requisitions require Principal Approval</strong>
          <span>Review and approve to avoid delays in procurement</span>
        </div>
      </div>

      <div class="tab-bar">
        <button class="tab" [class.active]="activeTab() === 'requisitions'" (click)="activeTab.set('requisitions')">
          <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          Requisitions
          @if (pendingRequisitions().length > 0) {
            <span class="tab-badge">{{ pendingRequisitions().length }}</span>
          }
        </button>
        <button class="tab" [class.active]="activeTab() === 'expenses'" (click)="activeTab.set('expenses')">
          <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
          Expense Ledger
        </button>
      </div>

      @if (activeTab() === 'requisitions') {
        <div class="requisitions-panel">
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Requested By</th>
                  <th class="text-right">Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th class="actions-col">Action</th>
                </tr>
              </thead>
              <tbody>
                @for (req of requisitions(); track req.id) {
                  <tr>
                    <td><span class="mono">#{{ req.id }}</span></td>
                    <td class="text-medium">{{ req.title }}</td>
                    <td>{{ req.requested_by_name }}</td>
                    <td class="text-right"><span class="mono amount">{{ FORMAT_CURRENCY(req.estimated_cost) }}</span></td>
                    <td class="text-muted">{{ req.created_at | date:'shortDate' }}</td>
                    <td>
                      <span class="status-badge" [class]="req.status">
                        {{ req.status }}
                      </span>
                    </td>
                    <td class="actions-col">
                      @if (req.status === 'PENDING') {
                        <div class="action-buttons">
                          <button class="btn-action approve" (click)="approveReq(req.id)" title="Approve">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg>
                          </button>
                          <button class="btn-action reject" (click)="rejectReq(req.id)" title="Reject">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
                          </button>
                        </div>
                      } @else if (req.status === 'APPROVED') {
                        <div class="action-buttons">
                          <button class="btn-action download" (click)="generatePOPdf(req)" title="Download PO">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                          </button>
                          <button class="btn-disburse" (click)="openExpenseModal(req)">
                            Disburse
                          </button>
                        </div>
                      } @else {
                        <button class="btn-action download" (click)="generatePOPdf(req)" title="Download PO">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                        </button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      @if (activeTab() === 'expenses') {
        <div class="expenses-panel">
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th class="text-right">Amount</th>
                  <th>Date</th>
                  <th>Recorded By</th>
                  <th class="actions-col">Action</th>
                </tr>
              </thead>
              <tbody>
                @for (exp of expenses(); track exp.id) {
                  <tr>
                    <td class="text-medium">{{ exp.title }}</td>
                    <td>
                      <span class="category-badge" [style.background]="getCategoryColor(exp.category) + '18'" [style.color]="getCategoryColor(exp.category)">
                        {{ exp.category }}
                      </span>
                    </td>
                    <td class="text-right"><span class="mono amount text-rose">-{{ FORMAT_CURRENCY(exp.amount) }}</span></td>
                    <td>{{ exp.transaction_date | date:'shortDate' }}</td>
                    <td class="text-muted">{{ exp.recorded_by_name }}</td>
                    <td class="actions-col">
                      <button class="btn-action download" (click)="generateVoucherPdf(exp)" title="Download Voucher">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                      </button>
                    </td>
                  </tr>
                }
                @if (expenses().length === 0) {
                  <tr>
                    <td colspan="6" class="empty-state">No expense records found.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Record Expense Modal -->
      @if (showExpenseModal()) {
        <div class="modal-overlay">
          <div class="modal-content">
            <div class="modal-header">
              <h2>{{ currentRequisition() ? 'Disburse Requisition' : 'Log Expense' }}</h2>
              <button class="close-btn" (click)="showExpenseModal.set(false)">&times;</button>
            </div>
            <div class="modal-body">
              @if (currentRequisition()) {
                <div class="payment-summary">
                  Disbursing approved requisition <strong>#{{ currentRequisition()!.id }}</strong> ({{ currentRequisition()!.title }})
                </div>
              }
              
              <div class="form-group">
                <label>Title / Description</label>
                <input type="text" [(ngModel)]="expenseForm.title" class="form-control" placeholder="Brief description of the expense">
              </div>

              <div class="form-group-row">
                <div class="form-group flex-1">
                  <label>Amount (KES)</label>
                  <input type="number" [(ngModel)]="expenseForm.amount" class="form-control" placeholder="0.00">
                </div>
                <div class="form-group flex-1">
                  <label>Category</label>
                  <select [(ngModel)]="expenseForm.category" class="form-control">
                    <option value="SUPPLIES">Supplies & Materials</option>
                    <option value="MAINTENANCE">Maintenance & Repairs</option>
                    <option value="UTILITY">Utility (Water/Electricity)</option>
                    <option value="FUEL">Fuel & Transport</option>
                    <option value="OTHER">Other Expenses</option>
                  </select>
                </div>
              </div>

              <div class="form-group-row">
                <div class="form-group flex-1">
                  <label>Transaction Date</label>
                  <input type="date" [(ngModel)]="expenseForm.transaction_date" class="form-control">
                </div>
                <div class="form-group flex-1">
                  <label>Disburse From</label>
                  <select [(ngModel)]="expenseForm.payment_method" class="form-control">
                    <option value="BANK">Main Bank Account</option>
                    <option value="CASH">Petty Cash</option>
                  </select>
                </div>
              </div>

              <p class="ledger-note">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                This will automatically generate a Journal Entry crediting the selected asset account.
              </p>
            </div>
            <div class="modal-footer">
              <button class="btn-ghost" (click)="showExpenseModal.set(false)" [disabled]="isProcessing()">Cancel</button>
              <button class="btn-primary" (click)="recordExpense()" [disabled]="isProcessing() || !expenseForm.title || !expenseForm.amount">
                {{ isProcessing() ? 'Processing...' : 'Post Expense' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 0; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #0f172a; letter-spacing: -0.02em; }
    .page-subtitle { font-size: 0.875rem; color: #64748b; margin-top: 4px; }
    .header-actions { display: flex; gap: 12px; }

    .btn-primary { display: flex; align-items: center; gap: 8px; background: #059669; color: white; padding: 10px 18px; border-radius: 8px; font-weight: 600; font-size: 0.875rem; cursor: pointer; border: none; transition: background 0.2s; }
    .btn-primary:hover:not(:disabled) { background: #047857; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-icon { width: 18px; height: 18px; }

    .warning-banner { display: flex; align-items: flex-start; gap: 12px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 14px 18px; margin-bottom: 20px; }
    .warning-icon { width: 20px; height: 20px; color: #d97706; flex-shrink: 0; margin-top: 1px; }
    .warning-content { display: flex; flex-direction: column; gap: 2px; font-size: 0.8125rem; color: #92400e; }
    .warning-content strong { font-size: 0.875rem; }

    .tab-bar { display: flex; gap: 4px; background: #f1f5f9; border-radius: 10px; padding: 4px; margin-bottom: 20px; width: fit-content; }
    .tab { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 20px; border: none; background: transparent; border-radius: 8px; font-size: 0.8125rem; font-weight: 500; color: #64748b; cursor: pointer; transition: all 0.2s; }
    .tab:hover { color: #334155; }
    .tab.active { background: white; color: #0f172a; font-weight: 600; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .tab-icon { width: 16px; height: 16px; }
    .tab-badge { background: #e11d48; color: white; font-size: 0.625rem; font-weight: 700; padding: 1px 7px; border-radius: 999px; }

    .table-wrapper { background: white; border: 1px solid #e2e8f0; border-radius: 12px; overflow: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { padding: 12px 16px; text-align: left; font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-weight: 600; }
    .data-table td { padding: 12px 16px; font-size: 0.8125rem; color: #334155; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    .data-table tr:hover td { background: #f8fafc; }
    
    .text-right { text-align: right !important; }
    .text-rose { color: #e11d48 !important; }
    .mono { font-family: 'SF Mono', 'Cascadia Code', monospace; }
    .mono.amount { font-weight: 600; color: #0f172a; }
    .text-medium { font-weight: 500; }
    .text-muted { color: #94a3b8; }
    .actions-col { text-align: center; width: 120px; }

    .status-badge { font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.04em; padding: 3px 10px; border-radius: 999px; font-weight: 700; }
    .status-badge.PENDING { background: #fef3c7; color: #d97706; }
    .status-badge.APPROVED { background: #dbeafe; color: #2563eb; }
    .status-badge.DISBURSED { background: #d1fae5; color: #059669; }
    .status-badge.REJECTED { background: #fee2e2; color: #e11d48; }

    .action-buttons { display: flex; gap: 8px; justify-content: center; }
    .btn-action { width: 28px; height: 28px; border-radius: 6px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.2s; }
    .btn-action svg { width: 14px; height: 14px; }
    .btn-action.approve { background: #d1fae5; color: #059669; }
    .btn-action.approve:hover { background: #a7f3d0; }
    .btn-action.reject { background: #fee2e2; color: #e11d48; }
    .btn-action.reject:hover { background: #fecaca; }
    .btn-action.download { background: #eff6ff; color: #2563eb; }
    .btn-action.download:hover { background: #dbeafe; }

    .btn-disburse { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; font-size: 0.6875rem; font-weight: 600; padding: 6px 12px; border-radius: 6px; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
    .btn-disburse:hover { background: #dbeafe; border-color: #93c5fd; }

    .category-badge { font-size: 0.6875rem; font-weight: 600; padding: 3px 10px; border-radius: 999px; display: inline-block; }
    .empty-state { text-align: center; padding: 40px; color: #94a3b8; font-style: italic; }

    /* Modals */
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15,23,42,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.2s; }
    .modal-content { background: white; border-radius: 12px; width: 500px; max-width: 90vw; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); overflow: hidden; animation: slideUp 0.2s; }
    .modal-header { padding: 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .modal-header h2 { margin: 0; font-size: 1.125rem; font-weight: 600; color: #0f172a; }
    .close-btn { background: none; border: none; font-size: 1.5rem; color: #94a3b8; cursor: pointer; }
    .modal-body { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
    
    .payment-summary { padding: 12px; background: #eff6ff; border-radius: 8px; color: #1d4ed8; font-size: 0.875rem; }
    
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group-row { display: flex; gap: 16px; }
    .flex-1 { flex: 1; }
    .form-group label { font-size: 0.75rem; font-weight: 600; color: #334155; }
    .form-control { width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.875rem; outline: none; font-family: inherit; }
    .form-control:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.1); }
    
    .ledger-note { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; color: #059669; background: #ecfdf5; padding: 10px; border-radius: 6px; margin: 0; }
    .ledger-note svg { width: 14px; height: 14px; flex-shrink: 0; }

    .modal-footer { padding: 16px 20px; border-top: 1px solid #e2e8f0; background: #f8fafc; display: flex; justify-content: flex-end; gap: 12px; }
    .btn-ghost { background: transparent; border: none; color: #64748b; font-weight: 500; padding: 8px 16px; cursor: pointer; }
    .btn-ghost:hover { color: #0f172a; }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  `],
})
export class PayablesHubComponent implements OnInit {
  private financeService = inject(FinanceService);

  activeTab = signal<'requisitions' | 'expenses'>('requisitions');
  requisitions = signal<PurchaseRequisition[]>([]);
  expenses = signal<Expense[]>([]);
  
  showExpenseModal = signal(false);
  isProcessing = signal(false);
  currentRequisition = signal<PurchaseRequisition | null>(null);

  expenseForm = {
    title: '',
    amount: null as number | null,
    category: 'SUPPLIES',
    transaction_date: new Date().toISOString().split('T')[0],
    payment_method: 'BANK'
  };

  FORMAT_CURRENCY = FORMAT_CURRENCY;

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    this.financeService.getRequisitions().subscribe({
      next: (res) => this.requisitions.set(res.results),
      error: () => this.requisitions.set([]),
    });

    this.financeService.getExpenses().subscribe({
      next: (res) => this.expenses.set(res.results),
      error: () => this.expenses.set([]),
    });
  }

  pendingRequisitions = () => this.requisitions().filter(r => r.status === 'PENDING');

  approveReq(id: number) {
    this.financeService.approveRequisition(id).subscribe({
      next: (req) => {
        this.requisitions.update(list => list.map(r => r.id === id ? req : r));
      },
      error: () => alert('Failed to approve requisition.'),
    });
  }

  rejectReq(id: number) {
    this.financeService.rejectRequisition(id).subscribe({
      next: (req) => {
        this.requisitions.update(list => list.map(r => r.id === id ? req : r));
      },
      error: () => alert('Failed to reject requisition.'),
    });
  }

  openExpenseModal(req?: PurchaseRequisition) {
    if (req) {
      this.currentRequisition.set(req);
      this.expenseForm = {
        title: `Disbursement: ${req.title}`,
        amount: Number(req.estimated_cost),
        category: 'SUPPLIES',
        transaction_date: new Date().toISOString().split('T')[0],
        payment_method: 'BANK'
      };
    } else {
      this.currentRequisition.set(null);
      this.expenseForm = {
        title: '',
        amount: null,
        category: 'SUPPLIES',
        transaction_date: new Date().toISOString().split('T')[0],
        payment_method: 'BANK'
      };
    }
    this.showExpenseModal.set(true);
  }

  recordExpense() {
    if (!this.expenseForm.title || !this.expenseForm.amount) return;

    this.isProcessing.set(true);
    const payload: Partial<Expense> & { payment_method?: string, requisition_id?: number } = {
      title: this.expenseForm.title,
      amount: this.expenseForm.amount.toString(),
      category: this.expenseForm.category as any,
      transaction_date: this.expenseForm.transaction_date,
      payment_method: this.expenseForm.payment_method
    };

    if (this.currentRequisition()) {
      payload.requisition_id = this.currentRequisition()!.id;
    }

    this.financeService.createExpense(payload).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.showExpenseModal.set(false);
        this.loadData();
        alert('Expense recorded and Journal Entry generated successfully!');
      },
      error: () => {
        this.isProcessing.set(false);
        alert('Failed to record expense.');
      }
    });
  }

  getCategoryColor(cat: string): string {
    const colors: Record<string, string> = {
      FUEL: '#f59e0b', UTILITY: '#8b5cf6', MAINTENANCE: '#10b981',
      SUPPLIES: '#ec4899', OTHER: '#64748b', PAYROLL: '#2563eb',
    };
    return colors[cat] || '#64748b';
  }

  generatePOPdf(req: PurchaseRequisition) {
    const docDef: TDocumentDefinitions = {
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      header: {
        margin: [40, 20, 40, 0],
        columns: [
          { text: 'MNARA SCHOOL', fontSize: 16, bold: true, color: '#0f172a' },
          { text: 'PURCHASE ORDER', fontSize: 16, bold: true, color: '#0f172a', alignment: 'right' }
        ]
      },
      content: [
        {
          columns: [
            {
              stack: [
                { text: 'Requested By:', fontSize: 10, color: '#64748b', margin: [0, 0, 0, 4] },
                { text: req.requested_by_name, fontSize: 12, bold: true, color: '#0f172a' },
                { text: `Date: ${new Date(req.created_at).toLocaleDateString()}`, fontSize: 10, color: '#334155' }
              ]
            },
            {
              stack: [
                { text: `PO #: REQ-${req.id.toString().padStart(5, '0')}`, fontSize: 10, color: '#334155', alignment: 'right' },
                { text: `Status: ${req.status}`, fontSize: 10, color: '#334155', alignment: 'right' }
              ]
            }
          ],
          margin: [0, 20, 0, 40]
        },
        { text: 'Order Details', fontSize: 12, bold: true, color: '#0f172a', margin: [0, 0, 0, 10] },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto'],
            body: [
              [
                { text: 'DESCRIPTION', bold: true, fontSize: 10, color: '#334155', fillColor: '#f1f5f9', margin: [0, 5, 0, 5] },
                { text: 'ESTIMATED COST', bold: true, fontSize: 10, color: '#334155', fillColor: '#f1f5f9', alignment: 'right', margin: [0, 5, 0, 5] }
              ],
              [
                { text: req.title, fontSize: 10, color: '#0f172a', margin: [0, 10, 0, 10] },
                { text: FORMAT_CURRENCY(req.estimated_cost).replace('KES ', ''), fontSize: 10, color: '#0f172a', alignment: 'right', margin: [0, 10, 0, 10] }
              ],
              [
                { text: 'TOTAL', bold: true, fontSize: 11, color: '#0f172a', margin: [0, 8, 0, 8], alignment: 'right' },
                { text: FORMAT_CURRENCY(req.estimated_cost), bold: true, fontSize: 11, color: '#059669', alignment: 'right', margin: [0, 8, 0, 8], fillColor: '#ecfdf5' }
              ]
            ]
          },
          layout: 'lightHorizontalLines'
        }
      ],
      defaultStyle: { font: 'Roboto' }
    };
    pdfMake.createPdf(docDef).open();
  }

  generateVoucherPdf(exp: Expense) {
    const docDef: TDocumentDefinitions = {
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      header: {
        margin: [40, 20, 40, 0],
        columns: [
          { text: 'MNARA SCHOOL', fontSize: 16, bold: true, color: '#0f172a' },
          { text: 'PAYMENT VOUCHER', fontSize: 16, bold: true, color: '#0f172a', alignment: 'right' }
        ]
      },
      content: [
        {
          columns: [
            {
              stack: [
                { text: 'Recorded By:', fontSize: 10, color: '#64748b', margin: [0, 0, 0, 4] },
                { text: exp.recorded_by_name, fontSize: 12, bold: true, color: '#0f172a' },
                { text: `Transaction Date: ${new Date(exp.transaction_date).toLocaleDateString()}`, fontSize: 10, color: '#334155' }
              ]
            },
            {
              stack: [
                { text: `Voucher #: PV-${exp.id.toString().padStart(5, '0')}`, fontSize: 10, color: '#334155', alignment: 'right' },
                { text: `Category: ${exp.category}`, fontSize: 10, color: '#334155', alignment: 'right' }
              ]
            }
          ],
          margin: [0, 20, 0, 40]
        },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto'],
            body: [
              [
                { text: 'PARTICULARS', bold: true, fontSize: 10, color: '#334155', fillColor: '#f1f5f9', margin: [0, 5, 0, 5] },
                { text: 'AMOUNT', bold: true, fontSize: 10, color: '#334155', fillColor: '#f1f5f9', alignment: 'right', margin: [0, 5, 0, 5] }
              ],
              [
                { text: exp.title, fontSize: 10, color: '#0f172a', margin: [0, 10, 0, 10] },
                { text: FORMAT_CURRENCY(exp.amount).replace('KES ', ''), fontSize: 10, color: '#0f172a', alignment: 'right', margin: [0, 10, 0, 10] }
              ],
              [
                { text: 'TOTAL PAID', bold: true, fontSize: 11, color: '#0f172a', margin: [0, 8, 0, 8], alignment: 'right' },
                { text: FORMAT_CURRENCY(exp.amount), bold: true, fontSize: 11, color: '#e11d48', alignment: 'right', margin: [0, 8, 0, 8], fillColor: '#fff1f2' }
              ]
            ]
          },
          layout: 'lightHorizontalLines'
        },
        { text: 'Signatures:', fontSize: 12, bold: true, color: '#0f172a', margin: [0, 40, 0, 20] },
        {
          columns: [
            { stack: [{ text: '_______________________', margin: [0, 0, 0, 5] }, { text: 'Prepared By', fontSize: 10, color: '#64748b' }] },
            { stack: [{ text: '_______________________', margin: [0, 0, 0, 5] }, { text: 'Authorized By', fontSize: 10, color: '#64748b' }] }
          ]
        }
      ],
      defaultStyle: { font: 'Roboto' }
    };
    pdfMake.createPdf(docDef).open();
  }
}
