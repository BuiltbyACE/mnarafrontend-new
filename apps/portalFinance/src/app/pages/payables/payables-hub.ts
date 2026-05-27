import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanceService } from '../../services/finance.service';
import { PurchaseRequisition, Expense, FORMAT_CURRENCY, SalaryStructure } from '../../models/finance.models';

@Component({
  selector: 'app-payables-hub',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container page-fade-in">
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">Payables</h1>
          <p class="page-subtitle">Expense management & payroll dispatch</p>
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
          Pending Requisitions
          @if (pendingRequisitions().length > 0) {
            <span class="tab-badge">{{ pendingRequisitions().length }}</span>
          }
        </button>
        <button class="tab" [class.active]="activeTab() === 'expenses'" (click)="activeTab.set('expenses')">
          <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
          Expense Records
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
                  <th>Amount</th>
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
                    <td><span class="mono amount">{{ FORMAT_CURRENCY(req.estimated_cost) }}</span></td>
                    <td class="text-muted">{{ req.created_at | date:'shortDate' }}</td>
                    <td>
                      <span class="status-badge" [class.PENDING]="req.status === 'PENDING'" [class.APPROVED]="req.status === 'APPROVED'" [class.REJECTED]="req.status === 'REJECTED'">
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
                      } @else {
                        <span class="text-muted">&mdash;</span>
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
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Recorded By</th>
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
                    <td><span class="mono amount">{{ FORMAT_CURRENCY(exp.amount) }}</span></td>
                    <td>{{ exp.transaction_date | date:'shortDate' }}</td>
                    <td class="text-muted">{{ exp.recorded_by_name }}</td>
                  </tr>
                }
              </tbody>
            </table>
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

    .warning-banner { display: flex; align-items: flex-start; gap: 12px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 14px 18px; margin-bottom: 20px; }
    .warning-icon { width: 20px; height: 20px; color: #d97706; flex-shrink: 0; margin-top: 1px; }
    .warning-content { display: flex; flex-direction: column; gap: 2px; font-size: 0.8125rem; color: #92400e; }
    .warning-content strong { font-size: 0.875rem; }

    .tab-bar { display: flex; gap: 4px; background: #f1f5f9; border-radius: 10px; padding: 4px; margin-bottom: 20px; }
    .tab { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 16px; border: none; background: transparent; border-radius: 8px; font-size: 0.8125rem; font-weight: 500; color: #64748b; cursor: pointer; transition: all 0.2s; }
    .tab:hover { color: #334155; }
    .tab.active { background: white; color: #0f172a; font-weight: 600; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .tab-icon { width: 16px; height: 16px; }
    .tab-badge { background: #2563eb; color: white; font-size: 0.625rem; font-weight: 700; padding: 1px 7px; border-radius: 999px; }

    .table-wrapper { background: white; border: 1px solid #e2e8f0; border-radius: 12px; overflow: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { padding: 12px 16px; text-align: left; font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-weight: 600; }
    .data-table td { padding: 12px 16px; font-size: 0.8125rem; color: #334155; border-bottom: 1px solid #f1f5f9; }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:hover td { background: #f8fafc; }
    .mono { font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; }
    .mono.amount { font-weight: 600; color: #0f172a; }
    .text-medium { font-weight: 500; }
    .text-muted { color: #94a3b8; }
    .actions-col { text-align: center; }

    .status-badge { font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.04em; padding: 2px 10px; border-radius: 999px; font-weight: 700; }
    .status-badge.PENDING { background: #fef3c7; color: #d97706; }
    .status-badge.APPROVED { background: #dbeafe; color: #2563eb; }
    .status-badge.REJECTED { background: #fee2e2; color: #e11d48; }

    .action-buttons { display: flex; gap: 4px; justify-content: center; }
    .btn-action { width: 28px; height: 28px; border-radius: 6px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.2s; }
    .btn-action svg { width: 14px; height: 14px; }
    .btn-action.approve { background: #d1fae5; color: #059669; }
    .btn-action.approve:hover { background: #a7f3d0; }
    .btn-action.reject { background: #fee2e2; color: #e11d48; }
    .btn-action.reject:hover { background: #fecaca; }

    .category-badge { font-size: 0.6875rem; font-weight: 600; padding: 3px 10px; border-radius: 999px; display: inline-block; }
  `],
})
export class PayablesHubComponent implements OnInit {
  private financeService = inject(FinanceService);

  activeTab = signal<'requisitions' | 'expenses'>('requisitions');
  requisitions = signal<PurchaseRequisition[]>([]);
  expenses = signal<Expense[]>([]);
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

  getCategoryColor(cat: string): string {
    const colors: Record<string, string> = {
      FUEL: '#f59e0b', UTILITY: '#8b5cf6', MAINTENANCE: '#10b981',
      SUPPLIES: '#ec4899', OTHER: '#64748b', PAYROLL: '#2563eb',
    };
    return colors[cat] || '#64748b';
  }
}
