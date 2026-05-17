import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { Payslip } from '../../shared/models/teacher.models';
import { TeacherPayslipService } from '../../core/services/teacher-payslip.service';

@Component({
  selector: 'app-teacher-payslips',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    NgClass,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTableModule,
    MatDividerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="payslips-container">
      <header class="page-header">
        <h1>Payslips</h1>
        <p class="subtitle">View and download your salary statements</p>
      </header>

      <div class="filter-bar">
        <label class="filter-label">Filter by year</label>
        <select
          class="year-select"
          [value]="selectedYear()"
          (change)="selectedYear.set(+$any($event.target).value)"
        >
          <option [value]="2026">2026</option>
          <option [value]="2025">2025</option>
        </select>
      </div>

      @if (latestPayslip(); as slip) {
        <mat-card class="latest-card" appearance="outlined">
          <mat-card-header>
            <mat-chip-row class="latest-chip" selected>
              <mat-icon>star</mat-icon>
              Latest Payslip
            </mat-chip-row>
          </mat-card-header>
          <mat-card-content>
            <div class="latest-top">
              <div class="latest-period">
                <span class="latest-month">{{ slip.month }}</span>
                <span class="latest-year">{{ slip.year }}</span>
              </div>
              <div class="latest-amounts">
                <div class="amount-block">
                  <span class="amount-label">Gross</span>
                  <span class="amount-value">KSh {{ slip.gross | number }}</span>
                </div>
                <mat-icon class="amount-arrow">arrow_forward</mat-icon>
                <div class="amount-block">
                  <span class="amount-label">Net</span>
                  <span class="amount-value net">KSh {{ slip.net | number }}</span>
                </div>
              </div>
            </div>
            <mat-divider />
            <div class="latest-details">
              <div class="detail-item">
                <span class="detail-label">Total Deductions</span>
                <span class="detail-value">KSh {{ slip.deductions | number }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Status</span>
                <span class="detail-value status-paid">Paid</span>
              </div>
            </div>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary" (click)="downloadPayslip(slip)">
              <mat-icon>download</mat-icon>
              Download PDF
            </button>
          </mat-card-actions>
        </mat-card>
      }

      <mat-card class="history-card" appearance="outlined">
        <mat-card-header>
          <mat-card-title>Payslip History</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="filteredPayslips()">
            <ng-container matColumnDef="month">
              <th mat-header-cell *matHeaderCellDef>Month</th>
              <td mat-cell *matCellDef="let row">{{ row.month }}</td>
            </ng-container>

            <ng-container matColumnDef="year">
              <th mat-header-cell *matHeaderCellDef>Year</th>
              <td mat-cell *matCellDef="let row">{{ row.year }}</td>
            </ng-container>

            <ng-container matColumnDef="gross">
              <th mat-header-cell *matHeaderCellDef>Gross</th>
              <td mat-cell *matCellDef="let row">KSh {{ row.gross | number }}</td>
            </ng-container>

            <ng-container matColumnDef="net">
              <th mat-header-cell *matHeaderCellDef>Net</th>
              <td mat-cell *matCellDef="let row">KSh {{ row.net | number }}</td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let row">
                <span class="status-badge paid">Paid</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="action">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let row">
                <button mat-stroked-button color="primary" (click)="downloadPayslip(row)">
                  <mat-icon>download</mat-icon>
                  PDF
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: `
    :host {
      --mnara-primary: #2563eb;
      --mnara-primary-dark: #1d4ed8;
      --mnara-primary-light: #dbeafe;
      --mnara-surface: #ffffff;
      --mnara-surface-hover: #f1f5f9;
      --mnara-background: #f0f4ff;
      --mnara-text: #1e293b;
      --mnara-text-secondary: #64748b;
      --mnara-border: #e2e8f0;
      --mnara-success: #16a34a;
      display: block;
      min-height: 100vh;
      background: var(--mnara-background);
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      color: var(--mnara-text);
    }
    .payslips-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 24px;
    }
    .page-header { margin-bottom: 24px; }
    .page-header h1 { font-size: 28px; font-weight: 600; margin: 0 0 4px; }
    .subtitle { color: var(--mnara-text-secondary); font-size: 14px; margin: 0; }
    .filter-bar {
      display: flex; align-items: center; gap: 12px;
      margin-bottom: 24px; padding: 12px 16px;
      background: var(--mnara-surface);
      border: 1px solid var(--mnara-border);
      border-radius: 10px;
    }
    .filter-label { font-size: 14px; font-weight: 500; color: var(--mnara-text-secondary); }
    .year-select {
      padding: 6px 12px; border: 1px solid var(--mnara-border);
      border-radius: 6px; font-size: 14px; background: var(--mnara-surface);
      color: var(--mnara-text); font-family: inherit; cursor: pointer;
    }
    .year-select:focus { outline: 2px solid var(--mnara-primary); outline-offset: 2px; }
    .latest-card {
      background: var(--mnara-surface);
      border: 2px solid var(--mnara-primary-light) !important;
      margin-bottom: 24px;
    }
    .latest-chip {
      background: #fef3c7 !important; color: #92400e !important;
      font-weight: 500 !important;
    }
    .latest-chip mat-icon { font-size: 16px; width: 16px; height: 16px; margin-right: 4px; }
    .latest-top { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; }
    .latest-period { display: flex; flex-direction: column; }
    .latest-month { font-size: 24px; font-weight: 700; color: var(--mnara-text); }
    .latest-year { font-size: 14px; color: var(--mnara-text-secondary); }
    .latest-amounts { display: flex; align-items: center; gap: 20px; }
    .amount-block { text-align: center; }
    .amount-label { font-size: 12px; color: var(--mnara-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
    .amount-value { display: block; font-size: 20px; font-weight: 700; color: var(--mnara-text); margin-top: 2px; }
    .amount-value.net { color: var(--mnara-primary); }
    .amount-arrow { color: var(--mnara-text-secondary); }
    .latest-details { display: flex; gap: 40px; padding: 12px 0; }
    .detail-item { display: flex; flex-direction: column; gap: 2px; }
    .detail-label { font-size: 12px; color: var(--mnara-text-secondary); }
    .detail-value { font-size: 16px; font-weight: 600; color: var(--mnara-text); }
    .detail-value.status-paid { color: var(--mnara-success); }
    .history-card { background: var(--mnara-surface); }
    .history-card mat-card-title { font-size: 18px; font-weight: 600; }
    table { width: 100%; }
    .mat-column-action { width: 80px; text-align: right; }
    .mat-column-gross, .mat-column-net { text-align: right; }
    .status-badge {
      display: inline-flex; align-items: center;
      padding: 3px 10px; border-radius: 100px;
      font-size: 0.75rem; font-weight: 500;
      font-family: 'Inter', sans-serif;
    }
    .status-badge.paid { background: #dcfce7; color: #166534; }
  `,
})
export class PayslipsComponent {
  private payslipService = inject(TeacherPayslipService);

  displayedColumns = ['month', 'year', 'gross', 'net', 'status', 'action'];

  selectedYear = this.payslipService.selectedYear;
  filteredPayslips = this.payslipService.filteredPayslips;
  latestPayslip = this.payslipService.latestPayslip;

  downloadPayslip(slip: Payslip): void {
    console.log('Download payslip:', slip.id, slip.month, slip.year);
  }
}
