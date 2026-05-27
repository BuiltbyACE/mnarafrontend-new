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
  FORMAT_CURRENCY,
} from '../../models/finance.models';

@Component({
  selector: 'app-parent-directory',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    MatCardModule, MatIconModule, MatButtonModule, MatTableModule,
    MatFormFieldModule, MatInputModule, MatProgressBarModule, MatChipsModule,
  ],
  template: `
    <div class="page-container page-fade-in">

      <!-- Page Header -->
      <header class="page-header">
        <div class="title-section">
          <div class="title-row">
            <div class="title-icon-wrap">
              <mat-icon>people</mat-icon>
            </div>
            <div>
              <h1>Parents / Guardians</h1>
              <p class="subtitle">Parent directory with financial summaries</p>
            </div>
          </div>
        </div>
        @if (summary(); as s) {
          <div class="header-stats">
            <div class="stat-chip total">
              <mat-icon>people</mat-icon>
              <span>{{ s.total_parents }} Parents</span>
            </div>
            <div class="stat-chip outstanding">
              <mat-icon>warning_amber</mat-icon>
              <span>{{ s.parents_with_outstanding }} With Outstanding</span>
            </div>
          </div>
        }
      </header>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" class="loading-bar"></mat-progress-bar>
      }

      <!-- KPI Summary Cards -->
      <div class="kpi-grid">
        <mat-card class="kpi-card">
          <mat-card-content class="kpi-content">
            <div class="kpi-icon-wrap blue">
              <mat-icon>people</mat-icon>
            </div>
            <div class="kpi-text">
              <span class="kpi-value">{{ summary()?.total_parents ?? 0 }}</span>
              <span class="kpi-label">Total Parents</span>
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card class="kpi-card">
          <mat-card-content class="kpi-content">
            <div class="kpi-icon-wrap orange">
              <mat-icon>warning_amber</mat-icon>
            </div>
            <div class="kpi-text">
              <span class="kpi-value">{{ summary()?.parents_with_outstanding ?? 0 }}</span>
              <span class="kpi-label">With Outstanding</span>
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card class="kpi-card">
          <mat-card-content class="kpi-content">
            <div class="kpi-icon-wrap red">
              <mat-icon>money_off</mat-icon>
            </div>
            <div class="kpi-text">
              <span class="kpi-value mono">{{ FORMAT_CURRENCY(summary()?.total_outstanding ?? 0) }}</span>
              <span class="kpi-label">Total Outstanding</span>
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card class="kpi-card">
          <mat-card-content class="kpi-content">
            <div class="kpi-icon-wrap green">
              <mat-icon>receipt_long</mat-icon>
            </div>
            <div class="kpi-text">
              <span class="kpi-value mono">{{ FORMAT_CURRENCY(summary()?.total_invoiced ?? 0) }}</span>
              <span class="kpi-label">Total Invoiced</span>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Filters -->
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

      <!-- Parent Table -->
      <mat-card class="table-card">
        <mat-card-content class="table-card-content">
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
                <th mat-header-cell *matHeaderCellDef>Total Invoiced</th>
                <td mat-cell *matCellDef="let p" class="mono-cell">{{ FORMAT_CURRENCY(p.total_invoiced) }}</td>
              </ng-container>

              <ng-container matColumnDef="paid">
                <th mat-header-cell *matHeaderCellDef>Total Paid</th>
                <td mat-cell *matCellDef="let p" class="mono-cell paid">{{ FORMAT_CURRENCY(p.total_paid) }}</td>
              </ng-container>

              <ng-container matColumnDef="outstanding">
                <th mat-header-cell *matHeaderCellDef>Outstanding</th>
                <td mat-cell *matCellDef="let p">
                  <span class="mono-cell" [class.positive]="p.total_outstanding > 0" [class.zero]="p.total_outstanding === 0">
                    {{ FORMAT_CURRENCY(p.total_outstanding) }}
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
                  class="parent-row"
                  [routerLink]="['/portalFinance/parents', row.id]">
              </tr>

              @if (filteredParents().length === 0) {
                <tr class="mat-row no-data-row">
                  <td class="mat-cell" [attr.colspan]="displayedColumns.length">
                    <div class="no-data">
                      <mat-icon class="no-data-icon">search_off</mat-icon>
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

    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
    .title-row { display: flex; align-items: center; gap: 14px; }
    .title-icon-wrap { width: 44px; height: 44px; border-radius: 12px; background: #dbeafe; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .title-icon-wrap mat-icon { color: #2563eb; font-size: 24px; width: 24px; height: 24px; }
    .title-section h1 { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0 0 2px; }
    .subtitle { font-size: 0.875rem; color: #64748b; margin: 0; }
    .header-stats { display: flex; gap: 10px; }
    .stat-chip { display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 999px; font-size: 0.8125rem; font-weight: 600; }
    .stat-chip.total { background: #eff6ff; color: #2563eb; }
    .stat-chip.total mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .stat-chip.outstanding { background: #fef3c7; color: #d97706; }
    .stat-chip.outstanding mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .loading-bar { margin-bottom: 0; border-radius: 0; }

    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
    .kpi-card { border-radius: 12px !important; }
    .kpi-content { display: flex; align-items: center; gap: 14px; padding: 18px !important; }
    .kpi-icon-wrap { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .kpi-icon-wrap mat-icon { font-size: 22px; width: 22px; height: 22px; }
    .kpi-icon-wrap.blue { background: #dbeafe; color: #2563eb; }
    .kpi-icon-wrap.orange { background: #fef3c7; color: #d97706; }
    .kpi-icon-wrap.red { background: #fee2e2; color: #e11d48; }
    .kpi-icon-wrap.green { background: #d1fae5; color: #059669; }
    .kpi-text { display: flex; flex-direction: column; gap: 2px; }
    .kpi-value { font-size: 1.375rem; font-weight: 700; color: #0f172a; line-height: 1.1; }
    .kpi-value.mono { font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; font-size: 1.125rem; }
    .kpi-label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 500; }

    .filter-card { margin-bottom: 16px; border-radius: 12px !important; }
    .filter-content { padding: 8px 16px !important; }
    .filter-row { display: flex; gap: 12px; }
    .filter-field { width: 100%; margin: 0; }
    .filter-sm { max-width: 300px; }

    .table-card { border-radius: 12px !important; overflow: hidden; }
    .table-card-content { padding: 0 !important; }
    .table-container { overflow-x: auto; }

    .parent-table { width: 100%; }

    .mat-mdc-header-cell { font-size: 0.75rem !important; font-weight: 600 !important; color: #64748b !important; text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; }
    .mat-mdc-cell { font-size: 0.875rem; color: #334155; padding: 12px 16px !important; }

    .name-cell { display: flex; align-items: center; gap: 10px; }
    .avatar { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; display: flex; align-items: center; justify-content: center; font-size: 0.6875rem; font-weight: 700; flex-shrink: 0; }

    .children-badge { font-size: 0.8125rem; font-weight: 700; color: #2563eb; background: #eff6ff; padding: 2px 10px; border-radius: 999px; display: inline-block; }

    .mono-cell { font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; font-weight: 600; }
    .mono-cell.paid { color: #059669; }
    .mono-cell.positive { color: #e11d48; }
    .mono-cell.zero { color: #059669; }

    .nav-cell { width: 40px; text-align: center; color: #cbd5e1; }

    .parent-row { cursor: pointer; transition: background 0.15s; }
    .parent-row:hover { background: #f8fafc !important; }

    .no-data { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 48px 24px; color: #94a3b8; }
    .no-data-icon { font-size: 48px; width: 48px; height: 48px; }
    .no-data p { margin: 0; font-size: 0.9375rem; }
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
  readonly FORMAT_CURRENCY = FORMAT_CURRENCY;

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
      next: (s) => { console.log('Parent summary:', s); this.summary.set(s); },
      error: (err) => console.warn('Parent summary unavailable:', err),
    });
  }

  private loadParents(params?: any) {
    this.loading.set(true);
    this.financeService.getParentDirectory(params).subscribe({
      next: (items) => {
        console.log('Parent directory items:', items);
        this.parents.set(items);
        this.loading.set(false);
      },
      error: (err) => {
        console.warn('Parent directory error:', err);
        this.loading.set(false);
      },
    });
  }

  getInitials(first: string, last: string): string {
    return ((first?.[0] || '') + (last?.[0] || '')).toUpperCase() || '?';
  }
}
