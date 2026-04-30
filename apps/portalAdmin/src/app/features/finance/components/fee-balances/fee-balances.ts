/**
 * Fee Balances Component
 * Finance module - fee management with data table
 */

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FinanceService } from '../../services/finance.service';
import { FeeBalance } from '../../../../shared/models/finance.models';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-fee-balances',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressBarModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    StatusBadgeComponent,
  ],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div class="title-section">
          <h1>Finance</h1>
          <p class="subtitle">Fee Balances & Payments</p>
        </div>
        <button mat-raised-button color="primary" (click)="recordPayment()">
          <mat-icon>payment</mat-icon>
          Record Payment
        </button>
      </header>

      @if (summary(); as s) {
        <div class="summary-cards">
          <mat-card class="summary-card" [class.alert]="s.total_outstanding_kes > 1000000">
            <mat-card-content>
              <div class="summary-icon outstanding">
                <mat-icon>account_balance</mat-icon>
              </div>
              <div class="summary-info">
                <span class="summary-value">{{ formatCurrency(s.total_outstanding_kes) }}</span>
                <span class="summary-label">Total Outstanding</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="summary-card">
            <mat-card-content>
              <div class="summary-icon collection">
                <mat-icon> trending_up</mat-icon>
              </div>
              <div class="summary-info">
                <span class="summary-value">{{ s.collection_rate_percent.toFixed(1) }}%</span>
                <span class="summary-label">Collection Rate</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="summary-card" [class.alert]="s.pending_expense_approvals > 0">
            <mat-card-content>
              <div class="summary-icon expenses">
                <mat-icon>receipt</mat-icon>
              </div>
              <div class="summary-info">
                <span class="summary-value">{{ s.pending_expense_approvals }}</span>
                <span class="summary-label">Pending Expenses</span>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      }

      @if (financeService.error()) {
        <div class="error-alert">
          <mat-icon>error</mat-icon>
          <span>{{ financeService.error() }}</span>
        </div>
      }

      <mat-card class="content-card">
        <mat-card-content>
          <div class="table-container">
            <table mat-table [dataSource]="feeBalances()" matSort (matSortChange)="onSort($event)">
              
              <ng-container matColumnDef="student">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Student</th>
                <td mat-cell *matCellDef="let balance">
                  <div class="student-info">
                    <span class="student-name">{{ balance.student_name }}</span>
                    <span class="student-id">{{ balance.admission_number }}</span>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="year_level">
                <th mat-header-cell *matHeaderCellDef>Year Level</th>
                <td mat-cell *matCellDef="let balance">{{ balance.year_level_name }}</td>
              </ng-container>

              <ng-container matColumnDef="balance">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Balance</th>
                <td mat-cell *matCellDef="let balance">
                  <div class="balance-info">
                    <span class="balance-amount" [class.negative]="balance.balance_kes < 0">
                      {{ formatCurrency(balance.balance_kes) }}
                    </span>
                    @if (balance.has_arrears) {
                      <app-status-badge type="warning" label="Arrears"></app-status-badge>
                    }
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="last_payment">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Last Payment</th>
                <td mat-cell *matCellDef="let balance">{{ balance.last_payment_date | date:'mediumDate' }}</td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="actions-header"></th>
                <td mat-cell *matCellDef="let balance" class="actions-cell">
                  <button mat-icon-button [matMenuTriggerFor]="menu">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #menu="matMenu">
                    <button mat-menu-item (click)="viewStatement(balance)">
                      <mat-icon>receipt_long</mat-icon>
                      <span>View Statement</span>
                    </button>
                    <button mat-menu-item (click)="recordPayment(balance)">
                      <mat-icon>payment</mat-icon>
                      <span>Record Payment</span>
                    </button>
                    @if (balance.balance_kes > 0) {
                      <button mat-menu-item (click)="createCreditNote(balance)">
                        <mat-icon>note_add</mat-icon>
                        <span>Credit Note</span>
                      </button>
                    }
                  </mat-menu>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

              <tr class="mat-row no-data-row" *matNoDataRow>
                <td class="mat-cell" [attr.colspan]="displayedColumns.length">
                  <div class="no-data-message">
                    @if (financeService.isLoading()) {
                      <mat-spinner diameter="40"></mat-spinner>
                    } @else {
                      <mat-icon>account_balance</mat-icon>
                      <p>No fee balances found</p>
                    }
                  </div>
                </td>
              </tr>
            </table>
          </div>

          <mat-paginator
            [length]="financeService.totalCount()"
            [pageSize]="pageSize"
            [pageSizeOptions]="[10, 25, 50, 100]"
            [pageIndex]="currentPage"
            (page)="onPageChange($event)">
          </mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
    .page-header .title-section h1 { font-size: 24px; font-weight: 600; margin: 0 0 4px 0; }
    .page-header .title-section .subtitle { color: #6b7280; margin: 0; }

    .summary-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .summary-card { border-radius: 12px; }
    .summary-card mat-card-content { display: flex; align-items: center; gap: 16px; padding: 20px; }
    .summary-card.alert { background: #fef3c7; border: 1px solid #f59e0b; }

    .summary-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .summary-icon.outstanding { background: #fee2e2; color: #dc2626; }
    .summary-icon.collection { background: #dcfce7; color: #16a34a; }
    .summary-icon.expenses { background: #fef3c7; color: #f59e0b; }
    .summary-icon mat-icon { font-size: 24px; width: 24px; height: 24px; }

    .summary-info { display: flex; flex-direction: column; }
    .summary-value { font-size: 24px; font-weight: 700; color: #1f2937; }
    .summary-label { font-size: 14px; color: #6b7280; }

    .error-alert { display: flex; align-items: center; gap: 8px; padding: 16px; background: #fee2e2; border-radius: 8px; color: #dc2626; margin-bottom: 24px; }
    .content-card { border-radius: 12px; }
    .table-container { overflow-x: auto; }
    table { width: 100%; }
    .mat-mdc-header-cell { font-weight: 600; color: #374151; background-color: #f9fafb; }

    .student-info { display: flex; flex-direction: column; }
    .student-info .student-name { font-weight: 500; color: #1f2937; }
    .student-info .student-id { font-size: 12px; color: #6b7280; }

    .balance-info { display: flex; align-items: center; gap: 8px; }
    .balance-info .balance-amount { font-weight: 600; }
    .balance-info .balance-amount.negative { color: #16a34a; }

    .actions-header { width: 50px; }
    .actions-cell { text-align: right; }
    .no-data-row .mat-cell { padding: 48px 24px; text-align: center; }
    .no-data-message { display: flex; flex-direction: column; align-items: center; gap: 16px; color: #9ca3af; }
    .no-data-message mat-icon { font-size: 48px; width: 48px; height: 48px; }
    mat-paginator { border-top: 1px solid #e5e7eb; }
  `],
})
export class FeeBalancesComponent implements OnInit {
  readonly financeService = inject(FinanceService);
  private snackBar = inject(MatSnackBar);

  readonly feeBalances = this.financeService.feeBalances;
  readonly summary = this.financeService.financeSummary;
  readonly displayedColumns = ['student', 'year_level', 'balance', 'last_payment', 'actions'];

  currentPage = 0;
  pageSize = 25;

  ngOnInit(): void {
    this.loadBalances();
    this.financeService.loadFinanceSummary();
  }

  loadBalances(): void {
    this.financeService.getFeeBalances(this.currentPage + 1, this.pageSize)
      .subscribe({
        next: (response) => this.financeService.setFeeBalances(response.results, response.count),
        error: () => {}
      });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadBalances();
  }

  onSort(sort: Sort): void { this.loadBalances(); }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount);
  }

  recordPayment(balance?: FeeBalance): void { 
    this.snackBar.open(balance ? `Record payment for ${balance.student_name}` : 'Record payment feature coming soon', 'Close', { duration: 3000 }); 
  }
  viewStatement(balance: FeeBalance): void { this.snackBar.open(`Viewing statement for ${balance.student_name}`, 'Close', { duration: 3000 }); }
  createCreditNote(balance: FeeBalance): void { this.snackBar.open(`Creating credit note for ${balance.student_name}`, 'Close', { duration: 3000 }); }
}
