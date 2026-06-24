import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../services/finance.service';
import { FeeCategory, FORMAT_CURRENCY } from '../../models/finance.models';

@Component({
  selector: 'app-fee-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container page-fade-in">
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">Fee Categories</h1>
          <p class="page-subtitle">Configure fee categories and payment priority</p>
        </div>
      </div>

      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-label">Total Categories</span>
          <span class="stat-value">{{ categories().length }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Active</span>
          <span class="stat-value text-blue">{{ activeCount() }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Inactive</span>
          <span class="stat-value text-faint">{{ inactiveCount() }}</span>
        </div>
      </div>

      <div class="panel main-panel">
        <div class="panel-header">
          <h3>All Categories</h3>
          <div class="panel-actions">
            <p class="panel-hint">Lower priority number = cleared first during payment allocation</p>
          </div>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Revenue Account</th>
              </tr>
            </thead>
            <tbody>
              @for (c of sortedCategories(); track c.id) {
                <tr>
                  <td><span class="mono-badge">{{ c.id }}</span></td>
                  <td class="font-bold">{{ c.name }}</td>
                  <td>
                    <span class="priority-badge" [style.background]="priorityColor(c.priority)">
                      {{ c.priority }}
                    </span>
                  </td>
                  <td>
                    <span class="status-badge" [style.background]="c.is_active ? '#059669' : '#94a3b8'">
                      {{ c.is_active ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="text-faint">{{ c.revenue_account || '—' }}</td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="empty-state">No fee categories configured</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: contents; }
    .page-container { padding: 24px 32px; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .header-left { display: flex; flex-direction: column; gap: 4px; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0; }
    .page-subtitle { font-size: 0.875rem; color: #64748b; margin: 0; }
    .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06); }
    .stat-label { display: block; font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: #0f172a; }
    .text-blue { color: #2563eb; }
    .text-faint { color: #94a3b8; }
    .font-bold { font-weight: 600; }
    .panel { background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06); overflow: hidden; }
    .main-panel { margin-bottom: 24px; }
    .panel-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #e2e8f0; }
    .panel-header h3 { margin: 0; font-size: 1rem; font-weight: 600; color: #0f172a; }
    .panel-actions { display: flex; gap: 8px; }
    .panel-hint { margin: 0; font-size: 0.75rem; color: #94a3b8; font-style: italic; }
    .table-container { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; padding: 10px 16px; font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; background: #f8fafc; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
    .data-table td { padding: 12px 16px; font-size: 0.8125rem; color: #334155; border-bottom: 1px solid #f1f5f9; }
    .data-table tbody tr:hover td { background: #f8fafc; }
    .mono-badge { font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; color: #64748b; }
    .priority-badge { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%; font-size: 0.75rem; font-weight: 700; color: white; }
    .status-badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 0.6875rem; font-weight: 600; color: white; text-transform: uppercase; }
    .empty-state { text-align: center; padding: 40px; color: #94a3b8; font-size: 0.875rem; }
  `],
})
export class FeeCategoriesComponent implements OnInit {
  private financeService = inject(FinanceService);

  readonly categories = signal<FeeCategory[]>([]);
  readonly FORMAT_CURRENCY = FORMAT_CURRENCY;

  readonly activeCount = computed(() => this.categories().filter(c => c.is_active).length);
  readonly inactiveCount = computed(() => this.categories().filter(c => !c.is_active).length);
  readonly sortedCategories = computed(() =>
    [...this.categories()].sort((a, b) => a.priority - b.priority)
  );

  priorityColor(priority: number): string {
    if (priority <= 2) return '#059669';
    if (priority <= 5) return '#2563eb';
    if (priority <= 10) return '#d97706';
    return '#94a3b8';
  }

  ngOnInit() {
    this.financeService.getFeeCategories().subscribe({
      next: (res) => this.categories.set(res),
    });
  }
}
