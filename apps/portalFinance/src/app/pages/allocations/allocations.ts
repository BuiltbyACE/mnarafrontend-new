import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { FinanceService } from '../../services/finance.service';
import {
  Allocation,
  AllocationStrategy,
  AllocationFilterParams,
  ALLOCATION_STRATEGY_LABELS,
  FORMAT_CURRENCY,
} from '../../models/finance.models';

interface AllocationViewModel extends Allocation {
  created_at_local: string;
}

@Component({
  selector: 'app-allocations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container page-fade-in">
      <header class="page-header">
        <div class="header-left">
          <h1 class="page-title">Allocations</h1>
          <p class="page-subtitle">Granular view of every payment allocation and wallet offset</p>
        </div>
        <div class="header-actions">
          <button class="btn-ghost" (click)="refresh()" [disabled]="isLoading()">
            <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" fill="none">
              <polyline points="4 4 4 10 10 10"/>
              <polyline points="20 20 20 14 14 14"/>
              <path d="M10 4h10v10"/>
              <path d="M14 20H4V10"/>
            </svg>
            Refresh
          </button>
        </div>
      </header>

      <section class="stats-row" *ngIf="stats().count > 0; else emptyState">
        <article class="stat-card">
          <span class="stat-label">Total Allocated</span>
          <span class="stat-value">{{ FORMAT_CURRENCY(stats().total_allocated) }}</span>
        </article>
        <article class="stat-card">
          <span class="stat-label">Wallet Credits</span>
          <span class="stat-value text-sunset">{{ FORMAT_CURRENCY(stats().wallet_credit) }}</span>
        </article>
        <article class="stat-card">
          <span class="stat-label">Manual Allocations</span>
          <span class="stat-value">{{ stats().manual_count }}</span>
        </article>
        <article class="stat-card">
          <span class="stat-label">Wallet Offsets</span>
          <span class="stat-value">{{ stats().wallet_offset_count }}</span>
        </article>
        <article class="stat-card">
          <span class="stat-label">Average Size</span>
          <span class="stat-value">{{ FORMAT_CURRENCY(stats().average_allocation) }}</span>
        </article>
      </section>

      <section class="filters-panel">
        <div class="search-box">
          <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" fill="none"><circle cx="11" cy="11" r="7"/><line x1="20" y1="20" x2="16.65" y2="16.65"/></svg>
          <input type="text" [(ngModel)]="searchTerm" (ngModelChange)="handleFilterChange()" placeholder="Search reference or family..." />
        </div>
        <div class="select-group">
          <label>Strategy</label>
          <select [(ngModel)]="strategyFilter" (ngModelChange)="handleFilterChange()">
            <option value="ALL">All Strategies</option>
            <option *ngFor="let option of strategyOptions" [value]="option.key">{{ option.label }}</option>
          </select>
        </div>
      </section>

      <section class="panel">
        <div class="panel-header">
          <h3>Allocation History</h3>
          <div class="panel-meta" *ngIf="filteredAllocations().length">
            {{ filteredAllocations().length }} allocations
          </div>
        </div>

        <div class="table-container" [class.loading]="isLoading()">
          <table class="data-table" *ngIf="filteredAllocations().length; else noResults">
            <thead>
              <tr>
                <th>#</th>
                <th>Reference</th>
                <th>Family</th>
                <th>Strategy</th>
                <th>Allocated</th>
                <th>Wallet Credit</th>
                <th>Lines</th>
                <th>By</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (allocation of filteredAllocations(); track allocation.id) {
                <tr>
                  <td><span class="mono">#{{ allocation.id }}</span></td>
                  <td>{{ allocation.payment_reference }}</td>
                  <td><span class="mono">{{ allocation.family_account_number }}</span></td>
                  <td><span class="strategy-tag" [class.wallet]="allocation.strategy === 'WALLET_OFFSET'">{{ strategyLabel(allocation.strategy) }}</span></td>
                  <td class="mono highlight">{{ FORMAT_CURRENCY(allocation.total_allocated) }}</td>
                  <td class="mono" [class.text-sunset]="allocation.wallet_credit > 0">{{ FORMAT_CURRENCY(allocation.wallet_credit) }}</td>
                  <td>{{ allocation.lines?.length || 0 }}</td>
                  <td>{{ allocation.created_by_name || 'System' }}</td>
                  <td>{{ allocation.created_at_local }}</td>
                  <td><button class="btn-link" (click)="openDetail(allocation)">View</button></td>
                </tr>
              } @empty {
                <tr><td colspan="10" class="empty-state">No allocations match the current filters.</td></tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <ng-template #emptyState>
        <div class="stat-placeholder">
          <p>No allocation data yet. Once payments are recorded, their allocation ledger will appear here.</p>
        </div>
      </ng-template>

      <ng-template #noResults>
        <div class="empty-state">No allocations found.</div>
      </ng-template>

      @if (error()) {
        <div class="error-banner">{{ error() }}</div>
      }

      @if (selectedAllocation()) {
        <div class="drawer-backdrop" (click)="closeDetail()"></div>
        <aside class="drawer" (click)="$event.stopPropagation()">
          <div class="drawer-header">
            <div>
              <h2>Allocation #{{ selectedAllocation()?.id }}</h2>
              <p>{{ selectedAllocation()?.payment_reference }} · {{ strategyLabel(selectedAllocation()!.strategy) }}</p>
            </div>
            <button class="close-btn" (click)="closeDetail()">&times;</button>
          </div>
          <div class="drawer-content">
            <section class="drawer-meta">
              <div>
                <span class="meta-label">Family</span>
                <span class="meta-value">{{ selectedAllocation()?.family_account_number }}</span>
              </div>
              <div>
                <span class="meta-label">Allocated</span>
                <span class="meta-value">{{ FORMAT_CURRENCY(selectedAllocation()?.total_allocated || 0) }}</span>
              </div>
              <div>
                <span class="meta-label">Wallet Credit</span>
                <span class="meta-value text-sunset">{{ FORMAT_CURRENCY(selectedAllocation()?.wallet_credit || 0) }}</span>
              </div>
              <div>
                <span class="meta-label">Lines</span>
                <span class="meta-value">{{ selectedAllocation()?.lines?.length || 0 }}</span>
              </div>
            </section>

            <section class="drawer-section">
              <h3>Line Items</h3>
              <table class="detail-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Fee Category</th>
                    <th>Student</th>
                    <th class="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  @for (line of selectedAllocation()?.lines || []; track line.id) {
                    <tr>
                      <td class="mono">#{{ line.invoice_id }}</td>
                      <td>{{ line.invoice_item_details.fee_category_name }}</td>
                      <td>{{ line.student_name || '—' }}</td>
                      <td class="text-right mono">{{ FORMAT_CURRENCY(line.amount) }}</td>
                    </tr>
                  } @empty {
                    <tr><td colspan="4" class="empty-state">No allocation lines recorded.</td></tr>
                  }
                </tbody>
              </table>
            </section>

            <section class="drawer-footer">
              <div>
                <span class="meta-label">Recorded</span>
                <span class="meta-value">{{ selectedAllocation()?.created_at_local }}</span>
              </div>
              <div>
                <span class="meta-label">Created By</span>
                <span class="meta-value">{{ selectedAllocation()?.created_by_name || 'System' }}</span>
              </div>
              <div *ngIf="selectedAllocation()?.notes">
                <span class="meta-label">Notes</span>
                <span class="meta-value">{{ selectedAllocation()?.notes }}</span>
              </div>
            </section>
          </div>
        </aside>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      background: radial-gradient(circle at top left, #1a237e, #0f172a);
      color: #f8fafc;
      font-family: 'Inter', sans-serif;
    }
    .page-container {
      padding: 32px;
      min-height: 100%;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .page-title {
      margin: 0;
      font-size: 1.875rem;
      font-weight: 700;
    }
    .page-subtitle {
      margin: 4px 0 0;
      color: rgba(226, 232, 240, 0.75);
      font-size: 0.95rem;
    }
    .header-actions {
      display: flex;
      gap: 12px;
    }
    .btn-ghost {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #f8fafc;
      cursor: pointer;
      transition: background 0.2s ease;
    }
    .btn-ghost svg {
      width: 16px;
      height: 16px;
    }
    .btn-ghost:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    .btn-ghost:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      padding: 18px;
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(99, 102, 241, 0.25);
      border-radius: 16px;
      backdrop-filter: blur(16px);
      box-shadow: 0 20px 45px rgba(15, 23, 42, 0.35);
    }
    .stat-label {
      display: block;
      color: rgba(226, 232, 240, 0.75);
      font-size: 0.8rem;
    }
    .stat-value {
      display: block;
      margin-top: 8px;
      font-size: 1.1rem;
      font-weight: 600;
      color: #f8fafc;
    }
    .text-sunset {
      color: #fbbf24;
    }
    .filters-panel {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }
    .search-box {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(15, 23, 42, 0.75);
      border-radius: 999px;
      padding: 8px 16px;
      border: 1px solid rgba(99, 102, 241, 0.3);
    }
    .search-box input {
      flex: 1;
      background: transparent;
      border: none;
      color: #f8fafc;
      font-size: 0.95rem;
      outline: none;
    }
    .search-box svg {
      width: 18px;
      height: 18px;
      color: rgba(226, 232, 240, 0.6);
    }
    .select-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .select-group label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(226, 232, 240, 0.6);
    }
    .select-group select {
      padding: 8px 14px;
      border-radius: 999px;
      border: 1px solid rgba(148, 163, 184, 0.4);
      background: rgba(15, 23, 42, 0.8);
      color: #f8fafc;
      font-size: 0.9rem;
      outline: none;
    }
    .panel {
      background: rgba(15, 23, 42, 0.78);
      border-radius: 18px;
      border: 1px solid rgba(99, 102, 241, 0.2);
      box-shadow: 0 24px 40px rgba(2, 6, 23, 0.35);
      overflow: hidden;
      position: relative;
    }
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px 12px;
    }
    .panel-header h3 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
    }
    .panel-meta {
      font-size: 0.85rem;
      color: rgba(226, 232, 240, 0.6);
    }
    .table-container {
      position: relative;
      max-height: calc(100vh - 340px);
      overflow: auto;
    }
    .table-container.loading::after {
      content: 'Loading allocations...';
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(15, 23, 42, 0.8);
      backdrop-filter: blur(6px);
      color: rgba(226, 232, 240, 0.85);
      font-size: 0.95rem;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 880px;
    }
    table thead {
      background: rgba(79, 70, 229, 0.16);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-size: 0.7rem;
      color: rgba(226, 232, 240, 0.7);
    }
    table th, table td {
      padding: 14px 18px;
      text-align: left;
      border-bottom: 1px solid rgba(148, 163, 184, 0.12);
    }
    table tbody tr:hover {
      background: rgba(79, 70, 229, 0.08);
    }
    .mono {
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 0.82rem;
    }
    .highlight {
      font-weight: 600;
    }
    .strategy-tag {
      padding: 4px 10px;
      border-radius: 999px;
      background: rgba(79, 70, 229, 0.2);
      border: 1px solid rgba(99, 102, 241, 0.4);
      font-size: 0.75rem;
    }
    .strategy-tag.wallet {
      background: rgba(251, 146, 60, 0.15);
      border-color: rgba(251, 146, 60, 0.35);
    }
    .btn-link {
      border: none;
      background: none;
      color: #818cf8;
      cursor: pointer;
      font-weight: 600;
      text-decoration: underline;
    }
    .btn-link:hover {
      color: #c7d2fe;
    }
    .empty-state {
      padding: 44px 16px;
      text-align: center;
      color: rgba(226, 232, 240, 0.6);
      font-size: 0.92rem;
    }
    .stat-placeholder {
      padding: 24px 18px;
      background: rgba(15, 23, 42, 0.6);
      border-radius: 16px;
      border: 1px dashed rgba(99, 102, 241, 0.3);
      margin-bottom: 24px;
      text-align: center;
      color: rgba(226, 232, 240, 0.6);
    }
    .error-banner {
      margin-top: 20px;
      padding: 12px 16px;
      border-radius: 12px;
      border: 1px solid rgba(248, 113, 113, 0.4);
      background: rgba(248, 113, 113, 0.12);
      color: #fecaca;
    }
    .drawer-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.55);
      backdrop-filter: blur(3px);
      z-index: 40;
    }
    .drawer {
      position: fixed;
      top: 0;
      right: 0;
      height: 100vh;
      width: min(480px, 100%);
      background: linear-gradient(170deg, rgba(30, 41, 59, 0.96), rgba(15, 23, 42, 0.95));
      box-shadow: -24px 0 40px rgba(2, 6, 23, 0.45);
      display: flex;
      flex-direction: column;
      z-index: 50;
    }
    .drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.2);
    }
    .drawer-header h2 {
      margin: 0;
      font-size: 1.3rem;
    }
    .drawer-header p {
      margin: 4px 0 0;
      color: rgba(226, 232, 240, 0.6);
    }
    .close-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: none;
      background: rgba(79, 70, 229, 0.2);
      color: #c7d2fe;
      font-size: 1.4rem;
      cursor: pointer;
    }
    .drawer-content {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .drawer-meta {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
      background: rgba(79, 70, 229, 0.12);
      border-radius: 14px;
      padding: 16px;
    }
    .meta-label {
      display: block;
      color: rgba(226, 232, 240, 0.55);
      font-size: 0.75rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .meta-value {
      display: block;
      margin-top: 6px;
      font-weight: 600;
      color: #f8fafc;
    }
    .drawer-section h3 {
      margin: 0 0 12px;
      font-size: 1rem;
    }
    .detail-table {
      width: 100%;
      border-collapse: collapse;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid rgba(148, 163, 184, 0.18);
    }
    .detail-table th, .detail-table td {
      padding: 12px 16px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.1);
    }
    .detail-table th {
      background: rgba(79, 70, 229, 0.18);
      text-transform: uppercase;
      font-size: 0.7rem;
      letter-spacing: 0.05em;
      color: rgba(226, 232, 240, 0.7);
    }
    .detail-table td {
      color: rgba(226, 232, 240, 0.92);
    }
    .detail-table .text-right {
      text-align: right;
    }
    .drawer-footer {
      display: grid;
      gap: 12px;
      padding: 16px;
      border-radius: 14px;
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(99, 102, 241, 0.28);
    }
    @media (max-width: 900px) {
      .page-container { padding: 20px; }
      .stats-row { grid-template-columns: 1fr 1fr; }
      .filters-panel { flex-direction: column; align-items: stretch; }
      table.data-table { min-width: 720px; }
    }
  `],
})
export class AllocationsComponent implements OnInit {
  private readonly financeService = inject(FinanceService);

  readonly FORMAT_CURRENCY = FORMAT_CURRENCY;

  readonly allocations = signal<AllocationViewModel[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly selectedAllocation = signal<AllocationViewModel | null>(null);

  searchTerm = '';
  strategyFilter: AllocationStrategy | 'ALL' = 'ALL';

  readonly strategyOptions = Object.entries(ALLOCATION_STRATEGY_LABELS).map(([key, label]) => ({ key: key as AllocationStrategy, label }));

  readonly filteredAllocations = computed(() => {
    const list = this.allocations();
    if (!list.length) {
      return [] as AllocationViewModel[];
    }

    const term = this.searchTerm.trim().toLowerCase();
    const strategy = this.strategyFilter;

    return list
      .filter(item => {
        const matchesStrategy = strategy === 'ALL' || item.strategy === strategy;
        const matchesTerm = !term ||
          item.payment_reference.toLowerCase().includes(term) ||
          item.family_account_number.toLowerCase().includes(term) ||
          (item.created_by_name ? item.created_by_name.toLowerCase().includes(term) : false);
        return matchesStrategy && matchesTerm;
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  });

  readonly stats = computed(() => {
    const list = this.allocations();
    if (!list.length) {
      return {
        total_allocated: 0,
        wallet_credit: 0,
        manual_count: 0,
        wallet_offset_count: 0,
        average_allocation: 0,
        count: 0,
      };
    }

    const totalAllocated = list.reduce((sum, item) => sum + Number(item.total_allocated || 0), 0);
    const walletCredit = list.reduce((sum, item) => sum + Number(item.wallet_credit || 0), 0);
    const manualCount = list.filter(item => item.strategy === 'MANUAL').length;
    const walletOffsetCount = list.filter(item => item.strategy === 'WALLET_OFFSET').length;
    const avg = totalAllocated / list.length;

    return {
      total_allocated: totalAllocated,
      wallet_credit: walletCredit,
      manual_count: manualCount,
      wallet_offset_count: walletOffsetCount,
      average_allocation: Number.isFinite(avg) ? avg : 0,
      count: list.length,
    };
  });

  ngOnInit(): void {
    this.loadAllocations();
  }

  refresh(): void {
    this.loadAllocations();
  }

  handleFilterChange(): void {
    // the computed signals react automatically
  }

  openDetail(allocation: AllocationViewModel): void {
    this.selectedAllocation.set(allocation);
  }

  closeDetail(): void {
    this.selectedAllocation.set(null);
  }

  strategyLabel(strategy: AllocationStrategy): string {
    return ALLOCATION_STRATEGY_LABELS[strategy] ?? strategy;
  }

  private loadAllocations(params: AllocationFilterParams = {}): void {
    this.isLoading.set(true);
    this.error.set(null);

    const request = this.financeService.getAllocations({ page_size: 100, ...params });
    request
      .pipe(
        takeUntilDestroyed(),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: response => {
          const results = response.results ?? [];
          const transformed = results.map(item => ({
            ...item,
            created_at_local: new Date(item.created_at).toLocaleString('en-KE', {
              year: 'numeric', month: 'short', day: 'numeric',
              hour: '2-digit', minute: '2-digit',
            }),
          }));
          this.allocations.set(transformed);
        },
        error: err => {
          const message = err?.error?.detail || err?.message || 'Failed to load allocations';
          this.error.set(message);
          this.allocations.set([]);
        },
      });
  }
}
