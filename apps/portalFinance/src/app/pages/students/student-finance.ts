import { Component, OnInit, inject, signal, computed, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { FinanceService } from '../../services/finance.service';
import {
  StudentProfileMin, StudentFinanceSummary, FORMAT_CURRENCY,
} from '../../models/finance.models';

// ─── Detail Sub-Component (declared first so parent can import) ───
@Component({
  selector: 'app-student-finance-detail',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule,
    MatTableModule, MatTabsModule, MatChipsModule, MatDividerModule,
  ],
  template: `
    <div class="detail-wrapper">
      <div class="summary-cards-row">
        <mat-card class="min-card total">
          <mat-card-content>
            <div class="min-card-content">
              <mat-icon>receipt_long</mat-icon>
              <div class="min-card-text">
                <span class="min-card-value">{{ FORMAT_CURRENCY(data.financial_summary.total_invoiced) }}</span>
                <span class="min-card-label">Total Invoiced</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card class="min-card paid">
          <mat-card-content>
            <div class="min-card-content">
              <mat-icon>check_circle</mat-icon>
              <div class="min-card-text">
                <span class="min-card-value">{{ FORMAT_CURRENCY(data.financial_summary.total_paid) }}</span>
                <span class="min-card-label">Total Paid</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card class="min-card outstanding">
          <mat-card-content>
            <div class="min-card-content">
              <mat-icon>warning_amber</mat-icon>
              <div class="min-card-text">
                <span class="min-card-value">{{ FORMAT_CURRENCY(data.financial_summary.outstanding_balance) }}</span>
                <span class="min-card-label">Outstanding</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card class="min-card term">
          <mat-card-content>
            <div class="min-card-content">
              <mat-icon>calendar_today</mat-icon>
              <div class="min-card-text">
                <span class="min-card-value">{{ FORMAT_CURRENCY(data.financial_summary.current_term_balance) }}</span>
                <span class="min-card-label">Current Term</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-card class="detail-card">
        <mat-tab-group dynamicHeight>
          <mat-tab label="Invoices">
            <div class="tab-content">
              @if (data.invoices.length > 0) {
                <table mat-table [dataSource]="data.invoices" class="detail-table">
                  <ng-container matColumnDef="title">
                    <th mat-header-cell *matHeaderCellDef>Fee Title</th>
                    <td mat-cell *matCellDef="let inv">{{ inv.fee_title }}</td>
                  </ng-container>
                  <ng-container matColumnDef="year">
                    <th mat-header-cell *matHeaderCellDef>Year</th>
                    <td mat-cell *matCellDef="let inv">{{ inv.academic_year }} {{ inv.term }}</td>
                  </ng-container>
                  <ng-container matColumnDef="due">
                    <th mat-header-cell *matHeaderCellDef>Amount Due</th>
                    <td mat-cell *matCellDef="let inv" class="mono-cell">{{ FORMAT_CURRENCY(inv.amount_due) }}</td>
                  </ng-container>
                  <ng-container matColumnDef="paid">
                    <th mat-header-cell *matHeaderCellDef>Amount Paid</th>
                    <td mat-cell *matCellDef="let inv" class="mono-cell">{{ FORMAT_CURRENCY(inv.amount_paid) }}</td>
                  </ng-container>
                  <ng-container matColumnDef="balance">
                    <th mat-header-cell *matHeaderCellDef>Balance</th>
                    <td mat-cell *matCellDef="let inv">
                      <span class="mono-cell" [class.positive]="inv.balance > 0" [class.zero]="inv.balance === 0">
                        {{ FORMAT_CURRENCY(inv.balance) }}
                      </span>
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Status</th>
                    <td mat-cell *matCellDef="let inv">
                      <mat-chip-row class="custom-chip" [class]="'chip-' + (inv.status === 'PAID' ? 'paid' : inv.status === 'PARTIAL' ? 'partial' : 'pending')">
                        {{ inv.status }}
                      </mat-chip-row>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="invoiceColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: invoiceColumns;"></tr>
                </table>
              } @else {
                <div class="empty-tab">
                  <mat-icon>receipt_long</mat-icon>
                  <p>No invoices found</p>
                </div>
              }
            </div>
          </mat-tab>

          <mat-tab label="Payments">
            <div class="tab-content">
              @if (data.recent_payments.length > 0) {
                <table mat-table [dataSource]="data.recent_payments" class="detail-table">
                  <ng-container matColumnDef="amount">
                    <th mat-header-cell *matHeaderCellDef>Amount</th>
                    <td mat-cell *matCellDef="let p" class="mono-cell">{{ FORMAT_CURRENCY(p.amount) }}</td>
                  </ng-container>
                  <ng-container matColumnDef="method">
                    <th mat-header-cell *matHeaderCellDef>Method</th>
                    <td mat-cell *matCellDef="let p">{{ p.payment_method }}</td>
                  </ng-container>
                  <ng-container matColumnDef="ref">
                    <th mat-header-cell *matHeaderCellDef>Reference</th>
                    <td mat-cell *matCellDef="let p" class="mono-cell">{{ p.reference_code }}</td>
                  </ng-container>
                  <ng-container matColumnDef="family">
                    <th mat-header-cell *matHeaderCellDef>Family</th>
                    <td mat-cell *matCellDef="let p" class="mono-cell">{{ p.family_code || '—' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="date">
                    <th mat-header-cell *matHeaderCellDef>Date</th>
                    <td mat-cell *matCellDef="let p">{{ p.transaction_date | date:'mediumDate' }}</td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="paymentColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: paymentColumns;"></tr>
                </table>
              } @else {
                <div class="empty-tab">
                  <mat-icon>payments</mat-icon>
                  <p>No payments recorded</p>
                </div>
              }
            </div>
          </mat-tab>

          <mat-tab label="Parents / Guardians">
            <div class="tab-content">
              @if (data.parents.length > 0) {
                <div class="parents-grid">
                  @for (parent of data.parents; track parent.email) {
                    <mat-card class="parent-card">
                      <mat-card-content>
                        <div class="parent-header">
                          <div class="parent-avatar">
                            <mat-icon>person</mat-icon>
                          </div>
                          <div>
                            <strong>{{ parent.first_name }} {{ parent.last_name }}</strong>
                            <div class="parent-badges">
                              <span class="parent-relation">{{ parent.relationship }}</span>
                              @if (parent.carer_level) {
                                <span class="carer-badge" [class.primary]="parent.carer_level === 'PRIMARY'">
                                  {{ parent.carer_level }}
                                </span>
                              }
                            </div>
                          </div>
                        </div>
                        <mat-divider></mat-divider>
                        <div class="parent-details">
                          <div class="parent-detail-row">
                            <mat-icon>phone</mat-icon>
                            <span>{{ parent.phone }}</span>
                          </div>
                          <div class="parent-detail-row">
                            <mat-icon>email</mat-icon>
                            <span>{{ parent.email }}</span>
                          </div>
                        </div>
                      </mat-card-content>
                    </mat-card>
                  }
                </div>
              } @else {
                <div class="empty-tab">
                  <mat-icon>people</mat-icon>
                  <p>No parent/guardian information</p>
                </div>
              }
            </div>
          </mat-tab>

          <mat-tab label="Siblings">
            <div class="tab-content">
              @if (data.siblings.length > 0) {
                <div class="siblings-grid">
                  @for (sib of data.siblings; track sib.school_id) {
                    <mat-card class="sibling-card">
                      <mat-card-content>
                        <div class="sibling-header">
                          <div class="sibling-avatar">{{ getInitials(sib.first_name, sib.last_name) }}</div>
                          <div>
                            <strong>{{ sib.first_name }} {{ sib.last_name }}</strong>
                            <div class="sibling-badges">
                              <span class="sibling-relation-chip">{{ sib.relationship }}</span>
                              <span class="sibling-school-id">{{ sib.school_id }}</span>
                            </div>
                          </div>
                        </div>
                        <mat-divider></mat-divider>
                        <div class="sibling-details">
                          <div class="sibling-detail-row">
                            <mat-icon>school</mat-icon>
                            <span>{{ sib.current_class || sib.year_level || '—' }}</span>
                          </div>
                        </div>
                      </mat-card-content>
                    </mat-card>
                  }
                </div>
              } @else {
                <div class="empty-tab">
                  <mat-icon>people_outline</mat-icon>
                  <p>No siblings recorded</p>
                </div>
              }
            </div>
          </mat-tab>

          <mat-tab label="Services">
            <div class="tab-content">
              <div class="services-grid">
                <mat-card class="service-card" [class.active]="data.services.transport !== 'NONE'">
                  <mat-card-content class="service-content">
                    <div class="service-icon-wrap">
                      <mat-icon>directions_bus</mat-icon>
                    </div>
                    <span class="service-label">Transport</span>
                    <span class="service-value">{{ data.services.transport === 'NONE' ? 'Not Enrolled' : data.services.transport === 'TWO-WAY' ? 'Two-Way' : 'One-Way' }}</span>
                  </mat-card-content>
                </mat-card>
                <mat-card class="service-card" [class.active]="data.services.lunch">
                  <mat-card-content class="service-content">
                    <div class="service-icon-wrap lunch">
                      <mat-icon>restaurant</mat-icon>
                    </div>
                    <span class="service-label">Lunch Program</span>
                    <span class="service-value">{{ data.services.lunch ? 'Enrolled' : 'Not Enrolled' }}</span>
                  </mat-card-content>
                </mat-card>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </mat-card>
    </div>
  `,
  styles: [`
    .detail-wrapper { padding: 20px 24px; background: #f8fafc; }
    .summary-cards-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
    .min-card { border-radius: 10px !important; }
    .min-card-content { display: flex; align-items: center; gap: 12px; padding: 0; }
    .min-card mat-icon { font-size: 28px; width: 28px; height: 28px; }
    .min-card-text { display: flex; flex-direction: column; gap: 1px; }
    .min-card-value { font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; font-size: 1.0625rem; font-weight: 700; color: #0f172a; }
    .min-card-label { font-size: 0.6875rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
    .min-card.total mat-icon { color: #2563eb; }
    .min-card.paid mat-icon { color: #059669; }
    .min-card.outstanding mat-icon { color: #e11d48; }
    .min-card.term mat-icon { color: #d97706; }
    .detail-card { border-radius: 12px !important; overflow: hidden; }
    .tab-content { padding: 12px 0; }
    .detail-table { width: 100%; }
    .detail-table .mat-mdc-header-cell { font-size: 0.6875rem !important; }
    .detail-table .mat-mdc-cell { font-size: 0.8125rem; padding: 10px 12px; }
    .mono-cell { font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; font-weight: 600; }
    .mono-cell.positive { color: #e11d48; }
    .mono-cell.zero { color: #059669; }
    .empty-tab { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 32px; color: #94a3b8; }
    .empty-tab mat-icon { font-size: 40px; width: 40px; height: 40px; }
    .empty-tab p { margin: 0; font-size: 0.875rem; }
    .parents-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; padding: 8px 4px; }
    .parent-card { border-radius: 10px !important; }
    .parent-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .parent-header strong { font-size: 0.875rem; color: #0f172a; }
    .parent-avatar { width: 40px; height: 40px; border-radius: 50%; background: #dbeafe; display: flex; align-items: center; justify-content: center; }
    .parent-avatar mat-icon { color: #2563eb; }
    .parent-badges { display: flex; align-items: center; gap: 6px; margin-top: 2px; }
    .parent-relation { font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
    .carer-badge { font-size: 0.625rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; padding: 1px 7px; border-radius: 999px; }
    .carer-badge.primary { background: #dbeafe; color: #2563eb; }
    .carer-badge:not(.primary) { background: #f1f5f9; color: #64748b; }
    .parent-details { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
    .parent-detail-row { display: flex; align-items: center; gap: 8px; font-size: 0.8125rem; color: #475569; }
    .parent-detail-row mat-icon { font-size: 16px; width: 16px; height: 16px; color: #94a3b8; }
    .siblings-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px; padding: 8px 4px; }
    .sibling-card { border-radius: 10px !important; }
    .sibling-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .sibling-header strong { font-size: 0.875rem; color: #0f172a; }
    .sibling-avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; display: flex; align-items: center; justify-content: center; font-size: 0.8125rem; font-weight: 700; flex-shrink: 0; }
    .sibling-badges { display: flex; align-items: center; gap: 6px; margin-top: 2px; flex-wrap: wrap; }
    .sibling-relation-chip { font-size: 0.625rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; padding: 1px 7px; border-radius: 999px; background: #e0e7ff; color: #4338ca; }
    .sibling-school-id { font-size: 0.6875rem; color: #94a3b8; font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; }
    .sibling-details { margin-top: 12px; }
    .sibling-detail-row { display: flex; align-items: center; gap: 8px; font-size: 0.8125rem; color: #475569; }
    .sibling-detail-row mat-icon { font-size: 16px; width: 16px; height: 16px; color: #94a3b8; }

    .services-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 8px 4px; max-width: 500px; }
    .service-card { border-radius: 10px !important; opacity: 0.5; transition: opacity 0.15s; }
    .service-card.active { opacity: 1; }
    .service-content { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 24px 16px !important; text-align: center; }
    .service-icon-wrap { width: 48px; height: 48px; border-radius: 12px; background: #dbeafe; display: flex; align-items: center; justify-content: center; }
    .service-icon-wrap mat-icon { color: #2563eb; font-size: 24px; width: 24px; height: 24px; }
    .service-icon-wrap.lunch { background: #d1fae5; }
    .service-icon-wrap.lunch mat-icon { color: #059669; }
    .service-label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 600; }
    .service-value { font-size: 0.9375rem; font-weight: 700; color: #0f172a; }

    .custom-chip { font-family: 'Inter', sans-serif !important; border: none !important; margin: 0 !important; }
    .chip-paid { background: #d1fae5 !important; color: #059669 !important; font-weight: 700; font-size: 0.625rem; border: none; padding: 2px 8px; border-radius: 999px; }
    .chip-partial { background: #fef3c7 !important; color: #d97706 !important; font-weight: 700; font-size: 0.625rem; border: none; padding: 2px 8px; border-radius: 999px; }
    .chip-pending { background: #fee2e2 !important; color: #e11d48 !important; font-weight: 700; font-size: 0.625rem; border: none; padding: 2px 8px; border-radius: 999px; }
  `],
})
export class StudentFinanceDetailComponent {
  FORMAT_CURRENCY = FORMAT_CURRENCY;
  readonly invoiceColumns = ['title', 'year', 'due', 'paid', 'balance', 'status'];
  readonly paymentColumns = ['amount', 'method', 'ref', 'family', 'date'];

  @Input({ required: true }) data!: StudentFinanceSummary;

  getInitials(first: string, last: string): string {
    return ((first?.[0] || '') + (last?.[0] || '')).toUpperCase() || '?';
  }
}

@Component({
  selector: 'app-student-finance',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatIconModule, MatButtonModule, MatTableModule,
    MatTabsModule, MatChipsModule, MatFormFieldModule, MatInputModule,
    MatProgressSpinnerModule, MatProgressBarModule, MatDividerModule,
    StudentFinanceDetailComponent,
  ],
  animations: [
    trigger('detailExpand', [
      state('collapsed, void', style({ height: '0px', minHeight: '0', display: 'none' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
      transition('expanded <=> void', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
  template: `
    <div class="page-container page-fade-in">

      <!-- Page Header -->
      <header class="page-header">
        <div class="title-section">
          <div class="title-row">
            <div class="title-icon-wrap">
              <mat-icon>account_balance</mat-icon>
            </div>
            <div>
              <h1>Student Financial Records</h1>
              <p class="subtitle">Individual student invoicing, payments & balances</p>
            </div>
          </div>
        </div>
        <div class="header-stats">
          <div class="stat-chip total">
            <mat-icon>people</mat-icon>
            <span>{{ filteredStudents().length }} Students</span>
          </div>
          <div class="stat-chip outstanding">
            <mat-icon>warning_amber</mat-icon>
            <span>{{ studentsWithBalance() }} With Balance</span>
          </div>
        </div>
      </header>

      <!-- Loading Bar -->
      @if (loading()) {
        <mat-progress-bar mode="indeterminate" class="loading-bar"></mat-progress-bar>
      }

      <!-- Search -->
      <mat-card class="search-card">
        <mat-card-content class="search-content">
          <mat-form-field appearance="outline" class="search-field" subscriptSizing="dynamic">
            <mat-icon matPrefix>search</mat-icon>
            <input matInput [(ngModel)]="searchQuery" placeholder="Search by name, school ID or class..." (input)="onSearch()"/>
            @if (searchQuery()) {
              <button matSuffix mat-icon-button aria-label="Clear" (click)="searchQuery.set('')">
                <mat-icon>close</mat-icon>
              </button>
            }
          </mat-form-field>
        </mat-card-content>
      </mat-card>

      <!-- Student Table -->
      <mat-card class="table-card">
        <mat-card-content class="table-card-content">
          <div class="table-container">
            <table
              mat-table
              [dataSource]="filteredStudents()"
              multiTemplateDataRows
              class="student-table">

              <!-- Name Column -->
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Student</th>
                <td mat-cell *matCellDef="let s">
                  <div class="student-cell">
                    <div class="avatar">{{ getInitials(s.first_name, s.last_name) }}</div>
                    <div class="student-info">
                      <span class="student-name">{{ s.first_name }} {{ s.last_name }}</span>
                      <span class="student-id">{{ s.user_school_id }}</span>
                    </div>
                  </div>
                </td>
              </ng-container>

              <!-- Class Column -->
              <ng-container matColumnDef="class">
                <th mat-header-cell *matHeaderCellDef>Class</th>
                <td mat-cell *matCellDef="let s">{{ s.current_class_name }}</td>
              </ng-container>

              <!-- Family Code Column -->
              <ng-container matColumnDef="family_code">
                <th mat-header-cell *matHeaderCellDef>Family Code</th>
                <td mat-cell *matCellDef="let s" class="mono-cell">{{ s.family_code || '—' }}</td>
              </ng-container>

              <!-- House Column -->
              <ng-container matColumnDef="house">
                <th mat-header-cell *matHeaderCellDef>House</th>
                <td mat-cell *matCellDef="let s">
                  <span class="house-badge">{{ s.house_name || '—' }}</span>
                </td>
              </ng-container>

              <!-- Category Column -->
              <ng-container matColumnDef="category">
                <th mat-header-cell *matHeaderCellDef>Category</th>
                <td mat-cell *matCellDef="let s">
                  <mat-chip-row [class]="getCategoryClass(s.category_name)">
                    {{ s.category_name || 'Regular' }}
                  </mat-chip-row>
                </td>
              </ng-container>

              <!-- Balance Column -->
              <ng-container matColumnDef="balance">
                <th mat-header-cell *matHeaderCellDef>Outstanding</th>
                <td mat-cell *matCellDef="let s">
                  @if (summaryMap()[s.id]; as summary) {
                    <span class="balance-value" [class.positive]="summary.financial_summary.outstanding_balance > 0"
                          [class.zero]="summary.financial_summary.outstanding_balance === 0">
                      {{ FORMAT_CURRENCY(summary.financial_summary.outstanding_balance) }}
                    </span>
                  } @else {
                    <mat-spinner diameter="16" class="inline-spinner"></mat-spinner>
                  }
                </td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let s">
                  @if (summaryMap()[s.id]; as summary) {
                    <mat-chip-row class="custom-chip" [class]="+summary.financial_summary.outstanding_balance <= 0 ? 'chip-paid' : 'chip-pending'">
                      {{ +summary.financial_summary.outstanding_balance === 0 ? 'CLEAR' : (+summary.financial_summary.outstanding_balance < 0 ? 'OVERPAID' : 'OWING') }}
                    </mat-chip-row>
                  } @else {
                    <span class="text-muted">—</span>
                  }
                </td>
              </ng-container>

              <!-- Expand Column -->
              <ng-container matColumnDef="expand">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let s" class="expand-cell">
                  <button mat-icon-button (click)="$event.stopPropagation(); toggleRow(s)">
                    <mat-icon>{{ expandedStudent()?.id === s.id ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}</mat-icon>
                  </button>
                </td>
              </ng-container>

              <!-- Expanded Detail Row -->
              <ng-container matColumnDef="expandedDetail">
                <td mat-cell *matCellDef="let s" [attr.colspan]="displayedColumns.length">
                  <div class="detail-container" [@detailExpand]="expandedStudent()?.id === s.id ? 'expanded' : 'collapsed'">
                    @if (summaryMap()[s.id]; as data) {
                      <app-student-finance-detail [data]="data"/>
                    } @else {
                      <div class="detail-loading">
                        <mat-spinner diameter="28"></mat-spinner>
                        <span>Loading financial data...</span>
                      </div>
                    }
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                  class="student-row"
                  [class.expanded]="expandedStudent()?.id === row.id"
                  (click)="toggleRow(row)">
              </tr>
              <tr mat-row *matRowDef="let row; columns: ['expandedDetail']" class="detail-row"></tr>

              @if (filteredStudents().length === 0) {
                <tr class="mat-row no-data-row">
                  <td class="mat-cell" [attr.colspan]="displayedColumns.length">
                    <div class="no-data">
                      <mat-icon class="no-data-icon">search_off</mat-icon>
                      <p>No students match your search</p>
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

    .search-card { margin-bottom: 16px; border-radius: 12px !important; }
    .search-content { padding: 8px 16px !important; }
    .search-field { width: 100%; margin: 0; }

    .table-card { border-radius: 12px !important; overflow: hidden; }
    .table-card-content { padding: 0 !important; }

    .table-container { overflow-x: auto; }

    .student-table { width: 100%; }

    .mat-mdc-header-cell { font-size: 0.75rem !important; font-weight: 600 !important; color: #64748b !important; text-transform: uppercase; letter-spacing: 0.04em; }
    .mat-mdc-cell { font-size: 0.875rem; color: #334155; }

    .student-cell { display: flex; align-items: center; gap: 12px; }
    .avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; flex-shrink: 0; }
    .student-info { display: flex; flex-direction: column; gap: 1px; }
    .student-name { font-weight: 600; color: #0f172a; }
    .student-id { font-size: 0.75rem; color: #94a3b8; font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; }

    .house-badge { font-size: 0.8125rem; color: #475569; }

    .balance-value { font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; font-weight: 600; }
    .balance-value.positive { color: #e11d48; }
    .balance-value.zero { color: #059669; }

    .inline-spinner { display: inline-block; vertical-align: middle; }

    .expand-cell { width: 48px; text-align: center; }

    .student-row { cursor: pointer; transition: background 0.15s; }
    .student-row:hover { background: #f8fafc !important; }
    .student-row.expanded { background: #eff6ff !important; }

    .detail-row { background: transparent !important; }
    .detail-row > td { padding: 0 !important; border-bottom: none !important; }

    .detail-container { overflow: hidden; }
    .detail-loading { display: flex; align-items: center; gap: 12px; padding: 32px 24px; justify-content: center; color: #64748b; font-size: 0.875rem; }

    .no-data { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 48px 24px; color: #94a3b8; }
    .no-data-icon { font-size: 48px; width: 48px; height: 48px; }
    .no-data p { margin: 0; font-size: 0.9375rem; }

    .text-muted { color: #94a3b8; }

    .custom-chip { font-family: 'Inter', sans-serif !important; border: none !important; margin: 0 !important; }
    .chip-paid { background: #d1fae5 !important; color: #059669 !important; font-weight: 700; font-size: 0.6875rem; border: none; padding: 4px 10px; border-radius: 999px; }
    .chip-pending { background: #fee2e2 !important; color: #e11d48 !important; font-weight: 700; font-size: 0.6875rem; border: none; padding: 4px 10px; border-radius: 999px; }
    
    .chip-regular { background: #f1f5f9 !important; color: #475569 !important; font-weight: 600; font-size: 0.6875rem; padding: 4px 10px; border-radius: 999px; border: none !important; margin: 0 !important; }
    .chip-scholarship { background: #fef3c7 !important; color: #d97706 !important; font-weight: 600; font-size: 0.6875rem; padding: 4px 10px; border-radius: 999px; border: none !important; margin: 0 !important; }
    .chip-merit { background: #e0e7ff !important; color: #4338ca !important; font-weight: 600; font-size: 0.6875rem; padding: 4px 10px; border-radius: 999px; border: none !important; margin: 0 !important; }
    .chip-needy { background: #dbeafe !important; color: #2563eb !important; font-weight: 600; font-size: 0.6875rem; padding: 4px 10px; border-radius: 999px; border: none !important; margin: 0 !important; }
  `],
})
export class StudentFinanceComponent implements OnInit {
  private financeService = inject(FinanceService);

  loading = signal(false);
  searchQuery = signal('');
  students = signal<StudentProfileMin[]>([]);
  summaryMap = signal<Record<number, StudentFinanceSummary>>({});
  expandedStudent = signal<StudentProfileMin | null>(null);
  loadingSummaries = signal<Set<number>>(new Set());

  readonly displayedColumns = ['name', 'class', 'family_code', 'house', 'category', 'balance', 'status', 'expand'];
  readonly FORMAT_CURRENCY = FORMAT_CURRENCY;

  ngOnInit() {
    this.loadStudents();
  }

  filteredStudents = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.students();
    return this.students().filter(s =>
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
      s.user_school_id.toLowerCase().includes(q) ||
      s.current_class_name.toLowerCase().includes(q)
    );
  });

  studentsWithBalance = computed(() => {
    return this.students().filter(s => {
      const summary = this.summaryMap()[s.id];
      return summary && +summary.financial_summary.outstanding_balance > 0;
    }).length;
  });

  onSearch() {}

  private loadStudents() {
    this.loading.set(true);
    this.financeService.getStudentProfiles().subscribe({
      next: (res) => {
        this.students.set(res.results);
        this.loading.set(false);
        res.results.forEach(s => this.loadSummary(s.id));
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  private loadSummary(studentId: number) {
    this.loadingSummaries.update(s => new Set(s).add(studentId));
    this.financeService.getStudentFinanceSummary(studentId).subscribe({
      next: (res) => {
        this.summaryMap.update(m => ({ ...m, [studentId]: res }));
        this.loadingSummaries.update(s => { const next = new Set(s); next.delete(studentId); return next; });
      },
      error: () => {
        this.loadingSummaries.update(s => { const next = new Set(s); next.delete(studentId); return next; });
      },
    });
  }

  toggleRow(student: StudentProfileMin) {
    if (this.expandedStudent()?.id === student.id) {
      this.expandedStudent.set(null);
    } else {
      this.expandedStudent.set(student);
      if (!this.summaryMap()[student.id]) {
        this.loadSummary(student.id);
      }
    }
  }

  getInitials(first: string, last: string): string {
    return ((first?.[0] || '') + (last?.[0] || '')).toUpperCase() || '?';
  }

  getCategoryClass(cat?: string | null): string {
    const map: Record<string, string> = {
      Regular: 'chip-regular', Scholarship: 'chip-scholarship',
      Merit: 'chip-merit', 'Needy': 'chip-needy',
    };
    return map[cat || 'Regular'] || 'chip-regular';
  }
}


