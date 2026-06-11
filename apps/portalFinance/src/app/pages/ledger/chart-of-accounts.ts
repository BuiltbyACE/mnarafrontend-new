import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanceService } from '../../services/finance.service';
import { ChartAccount } from '../../models/finance.models';

@Component({
  selector: 'app-chart-of-accounts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container page-fade-in">
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">Chart of Accounts</h1>
          <p class="page-subtitle">Master list of all accounting ledgers categorized by type</p>
        </div>
      </div>

      @if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading accounts...</p>
        </div>
      } @else {
        <div class="accounts-grid">
          <!-- Assets -->
          <div class="account-category-card">
            <div class="category-header bg-blue">
              <h2>Assets</h2>
              <span class="badge">{{ groupedAccounts()['ASSET']?.length || 0 }}</span>
            </div>
            <div class="category-body">
              @for (acc of groupedAccounts()['ASSET']; track acc.id) {
                <div class="account-item">
                  <span class="account-code">{{ acc.code }}</span>
                  <span class="account-name">{{ acc.name }}</span>
                  @if (!acc.is_active) { <span class="status-badge inactive">Inactive</span> }
                </div>
              }
              @if (!groupedAccounts()['ASSET']?.length) {
                <p class="empty-text">No asset accounts found.</p>
              }
            </div>
          </div>

          <!-- Liabilities -->
          <div class="account-category-card">
            <div class="category-header bg-rose">
              <h2>Liabilities</h2>
              <span class="badge">{{ groupedAccounts()['LIABILITY']?.length || 0 }}</span>
            </div>
            <div class="category-body">
              @for (acc of groupedAccounts()['LIABILITY']; track acc.id) {
                <div class="account-item">
                  <span class="account-code">{{ acc.code }}</span>
                  <span class="account-name">{{ acc.name }}</span>
                  @if (!acc.is_active) { <span class="status-badge inactive">Inactive</span> }
                </div>
              }
              @if (!groupedAccounts()['LIABILITY']?.length) {
                <p class="empty-text">No liability accounts found.</p>
              }
            </div>
          </div>

          <!-- Equity -->
          <div class="account-category-card">
            <div class="category-header bg-purple">
              <h2>Equity</h2>
              <span class="badge">{{ groupedAccounts()['EQUITY']?.length || 0 }}</span>
            </div>
            <div class="category-body">
              @for (acc of groupedAccounts()['EQUITY']; track acc.id) {
                <div class="account-item">
                  <span class="account-code">{{ acc.code }}</span>
                  <span class="account-name">{{ acc.name }}</span>
                  @if (!acc.is_active) { <span class="status-badge inactive">Inactive</span> }
                </div>
              }
              @if (!groupedAccounts()['EQUITY']?.length) {
                <p class="empty-text">No equity accounts found.</p>
              }
            </div>
          </div>

          <!-- Revenue -->
          <div class="account-category-card">
            <div class="category-header bg-emerald">
              <h2>Revenue</h2>
              <span class="badge">{{ groupedAccounts()['REVENUE']?.length || 0 }}</span>
            </div>
            <div class="category-body">
              @for (acc of groupedAccounts()['REVENUE']; track acc.id) {
                <div class="account-item">
                  <span class="account-code">{{ acc.code }}</span>
                  <span class="account-name">{{ acc.name }}</span>
                  @if (!acc.is_active) { <span class="status-badge inactive">Inactive</span> }
                </div>
              }
              @if (!groupedAccounts()['REVENUE']?.length) {
                <p class="empty-text">No revenue accounts found.</p>
              }
            </div>
          </div>

          <!-- Expenses -->
          <div class="account-category-card">
            <div class="category-header bg-amber">
              <h2>Expenses</h2>
              <span class="badge">{{ groupedAccounts()['EXPENSE']?.length || 0 }}</span>
            </div>
            <div class="category-body">
              @for (acc of groupedAccounts()['EXPENSE']; track acc.id) {
                <div class="account-item">
                  <span class="account-code">{{ acc.code }}</span>
                  <span class="account-name">{{ acc.name }}</span>
                  @if (!acc.is_active) { <span class="status-badge inactive">Inactive</span> }
                </div>
              }
              @if (!groupedAccounts()['EXPENSE']?.length) {
                <p class="empty-text">No expense accounts found.</p>
              }
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
    
    .accounts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 24px;
    }

    .account-category-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .account-category-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
    }

    .category-header {
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: white;
    }
    .category-header h2 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      letter-spacing: 0.02em;
    }
    .badge {
      background: rgba(255, 255, 255, 0.2);
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .bg-blue { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
    .bg-rose { background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%); }
    .bg-purple { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); }
    .bg-emerald { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
    .bg-amber { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }

    .category-body {
      padding: 12px 0;
      max-height: 300px;
      overflow-y: auto;
    }

    .account-item {
      display: flex;
      align-items: center;
      padding: 10px 20px;
      border-bottom: 1px solid #f1f5f9;
      transition: background 0.15s;
    }
    .account-item:last-child {
      border-bottom: none;
    }
    .account-item:hover {
      background: #f8fafc;
    }

    .account-code {
      font-family: 'SF Mono', 'Cascadia Code', monospace;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #64748b;
      width: 60px;
      flex-shrink: 0;
    }
    .account-name {
      font-size: 0.875rem;
      color: #334155;
      font-weight: 500;
      flex-grow: 1;
    }
    
    .status-badge {
      font-size: 0.6875rem;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .status-badge.inactive {
      background: #f1f5f9;
      color: #94a3b8;
    }

    .empty-text {
      padding: 20px;
      text-align: center;
      color: #94a3b8;
      font-size: 0.8125rem;
      margin: 0;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 0;
      color: #64748b;
    }
    .spinner {
      width: 24px;
      height: 24px;
      border: 3px solid #e2e8f0;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 12px;
    }
    @keyframes spin { 100% { transform: rotate(360deg); } }
  `]
})
export class ChartOfAccountsComponent implements OnInit {
  private financeService = inject(FinanceService);

  accounts = signal<ChartAccount[]>([]);
  isLoading = signal(true);

  groupedAccounts = computed(() => {
    const accs = this.accounts();
    const groups: Record<string, ChartAccount[]> = {
      ASSET: [],
      LIABILITY: [],
      EQUITY: [],
      REVENUE: [],
      EXPENSE: []
    };
    for (const acc of accs) {
      if (groups[acc.account_type]) {
        groups[acc.account_type].push(acc);
      }
    }
    return groups;
  });

  ngOnInit() {
    this.financeService.getAccounts().subscribe({
      next: (res) => {
        this.accounts.set(res);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }
}
