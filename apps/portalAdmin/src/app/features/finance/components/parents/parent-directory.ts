import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { FinanceService } from '../../services/finance.service';
import {
  ParentDirectorySummary, ParentDirectoryItem,
} from '../../../../shared/models/finance.models';

@Component({
  selector: 'app-parent-directory',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    MatCardModule, MatIconModule, MatButtonModule, MatTableModule,
    MatFormFieldModule, MatInputModule, MatProgressBarModule, MatChipsModule,
  ],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div class="title-section">
          <h1>Parents / Guardians</h1>
          <p class="subtitle">Parent directory with financial summaries</p>
        </div>
        @if (summary(); as s) {
          <div class="header-badge" [class.has-warnings]="s.parents_with_outstanding > 0">
            <mat-icon>{{ s.parents_with_outstanding > 0 ? 'warning_amber' : 'check_circle' }}</mat-icon>
            <span>{{ s.parents_with_outstanding }} parent{{ s.parents_with_outstanding === 1 ? '' : 's' }} with outstanding</span>
          </div>
        }
      </header>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate"></mat-progress-bar>
      }

      <div class="kpi-grid">
        <mat-card class="kpi-card">
          <mat-card-content class="kpi-content">
            <mat-icon class="kpi-icon blue">people</mat-icon>
            <div class="kpi-text">
              <span class="kpi-value">{{ summary()?.total_parents ?? 0 }}</span>
              <span class="kpi-label">Total Parents</span>
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card class="kpi-card">
          <mat-card-content class="kpi-content">
            <mat-icon class="kpi-icon orange">warning_amber</mat-icon>
            <div class="kpi-text">
              <span class="kpi-value">{{ summary()?.parents_with_outstanding ?? 0 }}</span>
              <span class="kpi-label">With Outstanding</span>
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card class="kpi-card">
          <mat-card-content class="kpi-content">
            <mat-icon class="kpi-icon red">money_off</mat-icon>
            <div class="kpi-text">
              <span class="kpi-value mono">{{ formatCurrency(summary()?.total_outstanding ?? 0) }}</span>
              <span class="kpi-label">Total Outstanding</span>
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card class="kpi-card">
          <mat-card-content class="kpi-content">
            <mat-icon class="kpi-icon green">receipt_long</mat-icon>
            <div class="kpi-text">
              <span class="kpi-value mono">{{ formatCurrency(summary()?.total_invoiced ?? 0) }}</span>
              <span class="kpi-label">Total Invoiced</span>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-card class="filter-card">
        <mat-card-content class="filter-content">
          <div class="filter-row">
            <mat-form-field appearance="outline" class="filter-field" subscriptSizing="dynamic">
              <mat-icon matPrefix>search</mat-icon>
              <input matInput [(ngModel)]="searchQuery" placeholder="Search by name, email or phone..." (input)="onSearch()"/>
              @if (searchQuery()) {
                <button matSuffix mat-icon-button aria-label="Clear" (click)="searchQuery.set('')">
                  <mat-icon>close</mat-icon>
                </button>
              }
            </mat-form-field>
            <mat-form-field appearance="outline" class="filter-field filter-sm" subscriptSizing="dynamic">
              <mat-icon matPrefix>person_search</mat-icon>
              <input matInput [(ngModel)]="studentNameFilter" placeholder="By child name..." (input)="onSearch()"/>
            </mat-form-field>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="content-card">
        <mat-card-content>
          <div class="table-container">
            <table mat-table [dataSource]="filteredParents()" class="parent-table">

              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef="let p">
                  <div class="name-cell">
                    <div class="avatar">{{ getInitials(p.first_name, p.last_name) }}</div>
                    <span>{{ p.first_name }} {{ p.last_name }}</span>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="phone">
                <th mat-header-cell *matHeaderCellDef>Phone</th>
                <td mat-cell *matCellDef="let p">{{ p.phone }}</td>
              </ng-container>

              <ng-container matColumnDef="email">
                <th mat-header-cell *matHeaderCellDef>Email</th>
                <td mat-cell *matCellDef="let p">{{ p.email }}</td>
              </ng-container>

              <ng-container matColumnDef="children">
                <th mat-header-cell *matHeaderCellDef>Children</th>
                <td mat-cell *matCellDef="let p">
                  <span class="children-badge">{{ p.children_count }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="invoiced">
                <th mat-header-cell *matHeaderCellDef class="num-col">Invoiced</th>
                <td mat-cell *matCellDef="let p" class="num-col mono">{{ formatCurrency(p.total_invoiced) }}</td>
              </ng-container>

              <ng-container matColumnDef="paid">
                <th mat-header-cell *matHeaderCellDef class="num-col">Paid</th>
                <td mat-cell *matCellDef="let p" class="num-col mono paid">{{ formatCurrency(p.total_paid) }}</td>
              </ng-container>

              <ng-container matColumnDef="outstanding">
                <th mat-header-cell *matHeaderCellDef class="num-col">Outstanding</th>
                <td mat-cell *matCellDef="let p" class="num-col">
                  <span class="mono" [class.positive]="p.total_outstanding > 0" [class.zero]="p.total_outstanding === 0">
                    {{ formatCurrency(p.total_outstanding) }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="nav">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let p" class="nav-cell">
                  <mat-icon>chevron_right</mat-icon>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                  class="clickable-row"
                  [routerLink]="['/portalAdmin/finance/parents', row.id]">
              </tr>

              @if (filteredParents().length === 0) {
                <tr class="mat-row no-data-row">
                  <td class="mat-cell" [attr.colspan]="displayedColumns.length">
                    <div class="empty-state">
                      <mat-icon>search_off</mat-icon>
                      <p>No parents match your search</p>
                    </div>
                  </td>
                </tr>
              }
            </table>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
    .page-header .title-section h1 { font-size: 24px; font-weight: 600; margin: 0 0 4px 0; }
    .page-header .title-section .subtitle { color: #6b7280; margin: 0; font-size: 0.875rem; }
    .header-badge { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; font-size: 0.8125rem; font-weight: 500; background: #d1fae5; color: #059669; }
    .header-badge.has-warnings { background: #fef2f2; color: #e11d48; }
    .header-badge mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
    .kpi-card { border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.07); }
    .kpi-content { display: flex; align-items: center; gap: 14px; padding: 18px !important; }
    .kpi-icon { font-size: 28px; width: 28px; height: 28px; }
    .kpi-icon.blue { color: #2563eb; }
    .kpi-icon.orange { color: #d97706; }
    .kpi-icon.red { color: #e11d48; }
    .kpi-icon.green { color: #059669; }
    .kpi-text { display: flex; flex-direction: column; gap: 2px; }
    .kpi-value { font-size: 1.375rem; font-weight: 700; color: #1f2937; line-height: 1.1; }
    .kpi-value.mono { font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; font-size: 1.125rem; }
    .kpi-label { font-size: 0.75rem; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 500; }

    .filter-card { margin-bottom: 16px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.07); }
    .filter-content { padding: 8px 16px !important; }
    .filter-row { display: flex; gap: 12px; }
    .filter-field { width: 100%; margin: 0; }
    .filter-sm { max-width: 300px; }

    .content-card { border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.07); }
    .content-card mat-card-content { padding: 0 !important; }
    .table-container { overflow-x: auto; }

    .parent-table { width: 100%; }
    .mat-mdc-header-cell { font-weight: 600; color: #374151; background: #f9fafb; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }
    .mat-mdc-cell { font-size: 0.8125rem; color: #334155; padding: 12px 16px !important; }
    .num-col { text-align: right; }

    .name-cell { display: flex; align-items: center; gap: 10px; }
    .avatar { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; display: flex; align-items: center; justify-content: center; font-size: 0.6875rem; font-weight: 700; flex-shrink: 0; }

    .children-badge { font-size: 0.8125rem; font-weight: 700; color: #2563eb; background: #eff6ff; padding: 2px 10px; border-radius: 999px; display: inline-block; }

    .mono { font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; font-weight: 600; }
    .mono.paid { color: #059669; }
    .mono.positive { color: #e11d48; }
    .mono.zero { color: #059669; }

    .nav-cell { width: 40px; text-align: center; color: #cbd5e1; }

    .clickable-row { cursor: pointer; }
    .clickable-row:hover { background: #f8fafc; }

    .no-data-row .mat-cell { padding: 48px 24px; text-align: center; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; color: #9ca3af; }
    .empty-state mat-icon { font-size: 40px; width: 40px; height: 40px; opacity: 0.5; }
    .empty-state p { margin: 0; font-size: 0.875rem; }
  `],
})
export class ParentDirectoryComponent implements OnInit {
  private financeService = inject(FinanceService);

  loading = signal(false);
  searchQuery = signal('');
  studentNameFilter = signal('');
  parents = signal<ParentDirectoryItem[]>([]);
  summary = signal<ParentDirectorySummary | null>(null);

  readonly displayedColumns = ['name', 'phone', 'email', 'children', 'invoiced', 'paid', 'outstanding', 'nav'];

  ngOnInit() {
    this.loadSummary();
    this.loadParents();
  }

  filteredParents = computed(() => {
    let list = this.parents();
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(p =>
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
        (p.email && p.email.toLowerCase().includes(q)) ||
        (p.phone && p.phone.includes(q))
      );
    }
    const sn = this.studentNameFilter().toLowerCase().trim();
    if (sn) {
      list = list.filter(p =>
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(sn)
      );
    }
    return list;
  });

  onSearch() {
    const params: any = {};
    if (this.searchQuery()) params.search = this.searchQuery();
    if (this.studentNameFilter()) params.student_name = this.studentNameFilter();
    this.loadParents(params);
  }

  private loadSummary() {
    this.financeService.getParentDirectorySummary().subscribe({
      next: (s) => this.summary.set(s),
    });
  }

  private loadParents(params?: any) {
    this.loading.set(true);
    this.financeService.getParentDirectory(params).subscribe({
      next: (items) => { this.parents.set(items); this.loading.set(false); },
      error: () => { this.loading.set(false); },
    });
  }

  getInitials(first: string, last: string): string {
    return ((first?.[0] || '') + (last?.[0] || '')).toUpperCase() || '?';
  }

  formatCurrency(amount: number): string {
    if (isNaN(amount)) return 'KES 0';
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 2 }).format(amount);
  }
}
