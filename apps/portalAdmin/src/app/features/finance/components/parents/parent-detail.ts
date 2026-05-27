import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FinanceService } from '../../services/finance.service';
import {
  ParentDetail, ParentChildDetail, ParentPaymentTransaction,
  ParentPaymentsResponse, PAYMENT_METHOD_LABEL, INVOICE_STATUS_COLOR,
} from '../../../../shared/models/finance.models';
import {
  GenerateInvoiceDialogComponent, InvoiceDialogData,
} from './generate-invoice-dialog';

@Component({
  selector: 'app-parent-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatCardModule, MatIconModule, MatButtonModule, MatTableModule,
    MatTabsModule, MatChipsModule, MatDividerModule,
    MatProgressSpinnerModule, MatPaginatorModule, MatDialogModule, MatSnackBarModule,
  ],
  template: `
    <div class="page-detail">
      <a class="back-link" routerLink="/portalAdmin/finance/parents">
        <mat-icon>arrow_back</mat-icon>
        Back to Parent Directory
      </a>

      @if (parent(); as p) {
        <mat-card class="header-card">
          <mat-card-content>
            <div class="parent-header">
              <div class="parent-avatar-large">
                {{ getInitials(p.first_name, p.last_name) }}
              </div>
              <div class="parent-info">
                <h2>{{ p.first_name }} {{ p.last_name }}</h2>
                <div class="parent-meta">
                  <span class="meta-chip">
                    <mat-icon>phone</mat-icon>
                    {{ p.phone }}
                  </span>
                  <span class="meta-chip">
                    <mat-icon>email</mat-icon>
                    {{ p.email }}
                  </span>
                  <span class="meta-chip">
                    <mat-icon>people</mat-icon>
                    {{ p.children_count }} {{ p.children_count === 1 ? 'Child' : 'Children' }}
                  </span>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="detail-card">
          <mat-tab-group dynamicHeight (selectedTabChange)="onTabChange($event.index)">
            <mat-tab label="Children ({{ p.children.length }})">
              <div class="tab-content">
                @for (child of p.children; track child.id) {
                  <mat-card class="child-card">
                    <mat-card-content>
                      <div class="child-header">
                        <div class="child-avatar-wrap">
                          <div class="child-avatar" [style.background]="avatarGrad(child.first_name, child.last_name)">
                            {{ getInitials(child.first_name, child.last_name) }}
                          </div>
                          <div class="child-status-ring active"></div>
                        </div>
                        <div class="child-info">
                          <h3>{{ child.first_name }} {{ child.last_name }}</h3>
                          <div class="child-meta">
                            <span class="child-chip">{{ child.school_id }}</span>
                            <span class="child-chip">{{ child.current_class }}</span>
                            @if (child.year_level) { <span class="child-chip">{{ child.year_level }}</span> }
                            @if (child.house) { <span class="child-chip">{{ child.house }}</span> }
                          </div>
                        </div>
                        <button mat-raised-button color="primary" class="invoice-btn"
                                (click)="openInvoiceDialog(child)">
                          <mat-icon>receipt_long</mat-icon>
                          Generate Invoice
                        </button>
                      </div>

                      <mat-divider></mat-divider>

                      <div class="fin-summary-cards">
                        <div class="fin-card">
                          <span class="fin-label">Total Invoiced</span>
                          <span class="fin-value">{{ formatCurrency(child.financial_summary.total_invoiced) }}</span>
                        </div>
                        <div class="fin-card paid">
                          <span class="fin-label">Total Paid</span>
                          <span class="fin-value">{{ formatCurrency(child.financial_summary.total_paid) }}</span>
                        </div>
                        <div class="fin-card" [class.outstanding]="child.financial_summary.outstanding_balance > 0"
                             [class.clear]="child.financial_summary.outstanding_balance === 0">
                          <span class="fin-label">Outstanding</span>
                          <span class="fin-value">{{ formatCurrency(child.financial_summary.outstanding_balance) }}</span>
                        </div>
                      </div>

                      <mat-divider></mat-divider>

                      <h4 class="section-title"><mat-icon>receipt_long</mat-icon> Invoices</h4>
                      @if (child.invoices.length > 0) {
                        <table mat-table [dataSource]="child.invoices" class="child-table">
                          <ng-container matColumnDef="title">
                            <th mat-header-cell *matHeaderCellDef>Fee Title</th>
                            <td mat-cell *matCellDef="let inv">{{ inv.fee_title }}</td>
                          </ng-container>
                          <ng-container matColumnDef="period">
                            <th mat-header-cell *matHeaderCellDef>Period</th>
                            <td mat-cell *matCellDef="let inv">{{ inv.academic_year }} {{ inv.term }}</td>
                          </ng-container>
                          <ng-container matColumnDef="due">
                            <th mat-header-cell *matHeaderCellDef class="num-col">Due</th>
                            <td mat-cell *matCellDef="let inv" class="num-col mono">{{ formatCurrency(inv.amount_due) }}</td>
                          </ng-container>
                          <ng-container matColumnDef="paid">
                            <th mat-header-cell *matHeaderCellDef class="num-col">Paid</th>
                            <td mat-cell *matCellDef="let inv" class="num-col mono paid-clr">{{ formatCurrency(inv.amount_paid) }}</td>
                          </ng-container>
                          <ng-container matColumnDef="balance">
                            <th mat-header-cell *matHeaderCellDef class="num-col">Balance</th>
                            <td mat-cell *matCellDef="let inv" class="num-col">
                              <span class="mono" [class.positive]="inv.balance > 0" [class.zero]="inv.balance === 0">
                                {{ formatCurrency(inv.balance) }}
                              </span>
                            </td>
                          </ng-container>
                          <ng-container matColumnDef="status">
                            <th mat-header-cell *matHeaderCellDef>Status</th>
                            <td mat-cell *matCellDef="let inv">
                              <span class="status-chip" [style.background]="INVOICE_STATUS_COLOR[inv.status] || '#94a3b8'">
                                {{ inv.status }}
                              </span>
                            </td>
                          </ng-container>
                          <tr mat-header-row *matHeaderRowDef="invoiceColumns"></tr>
                          <tr mat-row *matRowDef="let row; columns: invoiceColumns;"></tr>
                        </table>
                      } @else {
                        <div class="empty-section"><mat-icon>receipt_long</mat-icon> <span>No invoices</span></div>
                      }

                      <mat-divider></mat-divider>

                      <h4 class="section-title"><mat-icon>payments</mat-icon> Recent Payments</h4>
                      @if (child.recent_payments.length > 0) {
                        <table mat-table [dataSource]="child.recent_payments" class="child-table">
                          <ng-container matColumnDef="amount">
                            <th mat-header-cell *matHeaderCellDef class="num-col">Amount</th>
                            <td mat-cell *matCellDef="let pmt" class="num-col mono paid-clr">{{ formatCurrency(pmt.amount) }}</td>
                          </ng-container>
                          <ng-container matColumnDef="method">
                            <th mat-header-cell *matHeaderCellDef>Method</th>
                            <td mat-cell *matCellDef="let pmt">{{ PAYMENT_METHOD_LABEL[pmt.payment_method] || pmt.payment_method }}</td>
                          </ng-container>
                          <ng-container matColumnDef="ref">
                            <th mat-header-cell *matHeaderCellDef>Reference</th>
                            <td mat-cell *matCellDef="let pmt" class="mono">{{ pmt.reference_code }}</td>
                          </ng-container>
                          <ng-container matColumnDef="date">
                            <th mat-header-cell *matHeaderCellDef>Date</th>
                            <td mat-cell *matCellDef="let pmt">{{ pmt.transaction_date | date:'mediumDate' }}</td>
                          </ng-container>
                          <tr mat-header-row *matHeaderRowDef="paymentColumns"></tr>
                          <tr mat-row *matRowDef="let row; columns: paymentColumns;"></tr>
                        </table>
                      } @else {
                        <div class="empty-section"><mat-icon>payments</mat-icon> <span>No payments</span></div>
                      }

                      <mat-divider></mat-divider>

                      <h4 class="section-title"><mat-icon>room_service</mat-icon> Services</h4>
                      <div class="services-row">
                        <div class="service-badge" [class.active]="child.services.transport !== 'NONE'">
                          <mat-icon>directions_bus</mat-icon>
                          <span>{{ child.services.transport === 'NONE' ? 'No Transport' : child.services.transport === 'TWO-WAY' ? 'Two-Way' : 'One-Way' }}</span>
                        </div>
                        <div class="service-badge" [class.active]="child.services.lunch">
                          <mat-icon>restaurant</mat-icon>
                          <span>{{ child.services.lunch ? 'Lunch Enrolled' : 'No Lunch' }}</span>
                        </div>
                      </div>
                    </mat-card-content>
                  </mat-card>
                } @empty {
                  <div class="empty-tab">
                    <mat-icon>child_care</mat-icon>
                    <p>No children assigned to this parent</p>
                  </div>
                }
              </div>
            </mat-tab>

            <mat-tab label="Payment History">
              <div class="tab-content">
                @if (paymentsError()) {
                  <div class="empty-tab">
                    <mat-icon>error_outline</mat-icon>
                    <p>Failed to load payment history</p>
                  </div>
                } @else if (paymentsLoading() && payments().length === 0) {
                  <div class="loading-state">
                    <mat-spinner diameter="28"></mat-spinner>
                  </div>
                } @else {
                  <table mat-table [dataSource]="payments()" class="payment-table">
                    <ng-container matColumnDef="date">
                      <th mat-header-cell *matHeaderCellDef>Date</th>
                      <td mat-cell *matCellDef="let pmt">{{ pmt.transaction_date | date:'mediumDate' }}</td>
                    </ng-container>
                    <ng-container matColumnDef="student">
                      <th mat-header-cell *matHeaderCellDef>Student</th>
                      <td mat-cell *matCellDef="let pmt">{{ pmt.student_name }}</td>
                    </ng-container>
                    <ng-container matColumnDef="invoice">
                      <th mat-header-cell *matHeaderCellDef>Invoice</th>
                      <td mat-cell *matCellDef="let pmt">{{ pmt.invoice_title }}</td>
                    </ng-container>
                    <ng-container matColumnDef="amount">
                      <th mat-header-cell *matHeaderCellDef class="num-col">Amount</th>
                      <td mat-cell *matCellDef="let pmt" class="num-col mono paid-clr">{{ formatCurrency(pmt.amount) }}</td>
                    </ng-container>
                    <ng-container matColumnDef="method">
                      <th mat-header-cell *matHeaderCellDef>Method</th>
                      <td mat-cell *matCellDef="let pmt">{{ PAYMENT_METHOD_LABEL[pmt.payment_method] || pmt.payment_method }}</td>
                    </ng-container>
                    <ng-container matColumnDef="ref">
                      <th mat-header-cell *matHeaderCellDef>Reference</th>
                      <td mat-cell *matCellDef="let pmt" class="mono">{{ pmt.reference_code }}</td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="paymentHistoryColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: paymentHistoryColumns;"></tr>
                    @if (payments().length === 0) {
                      <tr class="mat-row no-data-row">
                        <td class="mat-cell" [attr.colspan]="paymentHistoryColumns.length">
                          <div class="empty-state"><mat-icon>payments</mat-icon><p>No payment history</p></div>
                        </td>
                      </tr>
                    }
                  </table>
                  @if (totalPayments() > 0) {
                    <mat-paginator
                      [length]="totalPayments()"
                      [pageSize]="pageSize"
                      [pageIndex]="currentPage() - 1"
                      (page)="onPageChange($event)"
                      [pageSizeOptions]="[20, 50, 100]"
                      showFirstLastButtons>
                    </mat-paginator>
                  }
                }
              </div>
            </mat-tab>
          </mat-tab-group>
        </mat-card>
      } @else if (loading()) {
        <div class="loading-state"><mat-spinner diameter="36"></mat-spinner></div>
      } @else {
        <div class="empty-tab"><mat-icon>error_outline</mat-icon><p>Parent not found</p></div>
      }
    </div>
  `,
  styles: [`
    .page-detail { max-width: 1100px; margin: 0 auto; padding: 24px; }

    .back-link { display: inline-flex; align-items: center; gap: 6px; font-size: 0.8125rem; font-weight: 500; color: #6b7280; text-decoration: none; margin-bottom: 20px; transition: color 0.15s; }
    .back-link:hover { color: #2563eb; }
    .back-link mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .header-card { border-radius: 12px !important; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.07); }
    .parent-header { display: flex; align-items: center; gap: 18px; }
    .parent-avatar-large { width: 56px; height: 56px; border-radius: 16px; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; font-weight: 700; flex-shrink: 0; box-shadow: 0 4px 12px rgba(37,99,235,0.2); }
    .parent-info h2 { font-size: 1.375rem; font-weight: 600; color: #1f2937; margin: 0 0 8px; }
    .parent-meta { display: flex; flex-wrap: wrap; gap: 10px; }
    .meta-chip { display: inline-flex; align-items: center; gap: 5px; font-size: 0.8125rem; color: #6b7280; padding: 4px 12px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; }
    .meta-chip mat-icon { font-size: 15px; width: 15px; height: 15px; color: #9ca3af; }

    .detail-card { border-radius: 12px !important; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.07); }
    .tab-content { padding: 16px 0; }

    .child-card { border-radius: 10px !important; margin-bottom: 16px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    .child-card:last-child { margin-bottom: 0; }

    .child-header { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; flex-wrap: wrap; }
    .child-avatar-wrap { position: relative; flex-shrink: 0; }
    .child-avatar { width: 44px; height: 44px; border-radius: 12px; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.8125rem; font-weight: 700; }
    .child-status-ring { position: absolute; bottom: -1px; right: -1px; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; background: #059669; }
    .child-info { flex: 1; min-width: 200px; }
    .child-info h3 { font-size: 1rem; font-weight: 600; color: #1f2937; margin: 0 0 6px; }
    .child-meta { display: flex; flex-wrap: wrap; gap: 6px; }
    .child-chip { font-size: 0.6875rem; padding: 3px 10px; border-radius: 6px; background: #f3f4f6; color: #6b7280; font-weight: 500; }
    .invoice-btn { flex-shrink: 0; }

    .fin-summary-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 14px 0; }
    .fin-card { padding: 12px 14px; border-radius: 8px; border: 1px solid #e5e7eb; background: #f9fafb; }
    .fin-label { display: block; font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.04em; color: #9ca3af; font-weight: 600; margin-bottom: 4px; }
    .fin-value { font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; font-size: 0.9375rem; font-weight: 700; color: #1f2937; }
    .fin-card.paid .fin-value { color: #059669; }
    .fin-card.outstanding .fin-value { color: #e11d48; }
    .fin-card.clear .fin-value { color: #059669; }

    .section-title { display: flex; align-items: center; gap: 6px; font-size: 0.8125rem; font-weight: 600; color: #1f2937; text-transform: uppercase; letter-spacing: 0.04em; margin: 14px 0 10px; }
    .section-title mat-icon { font-size: 18px; width: 18px; height: 18px; color: #2563eb; }

    .child-table { width: 100%; }
    .child-table .mat-mdc-header-cell { font-size: 0.625rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em; }
    .child-table .mat-mdc-cell { font-size: 0.8125rem; padding: 8px 12px !important; color: #374151; }
    .num-col { text-align: right; }
    .mono { font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; font-weight: 600; }
    .mono.paid-clr { color: #059669; }
    .mono.positive { color: #e11d48; }
    .mono.zero { color: #059669; }

    .status-chip { font-size: 0.5625rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; padding: 2px 8px; border-radius: 999px; display: inline-block; color: white; }

    .empty-section { display: flex; align-items: center; gap: 8px; padding: 12px 0; color: #9ca3af; font-size: 0.8125rem; }
    .empty-section mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .services-row { display: flex; gap: 12px; margin: 10px 0 4px; }
    .service-badge { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px; font-size: 0.75rem; font-weight: 500; color: #9ca3af; background: #f3f4f6; opacity: 0.6; }
    .service-badge.active { opacity: 1; color: #6b7280; background: #eff6ff; }
    .service-badge mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .service-badge.active mat-icon { color: #2563eb; }

    .payment-table { width: 100%; }
    .payment-table .mat-mdc-header-cell { font-size: 0.6875rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em; }
    .payment-table .mat-mdc-cell { font-size: 0.8125rem; padding: 10px 12px !important; color: #374151; }

    .empty-tab, .loading-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 48px 24px; color: #9ca3af; }
    .empty-tab mat-icon { font-size: 40px; width: 40px; height: 40px; opacity: 0.5; }
    .empty-tab p, .loading-state p { margin: 0; font-size: 0.875rem; }

    .no-data-row .mat-cell { padding: 32px 24px; text-align: center; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; color: #9ca3af; }
    .empty-state mat-icon { font-size: 32px; width: 32px; height: 32px; opacity: 0.5; }
    .empty-state p { margin: 0; font-size: 0.875rem; }
  `],
})
export class ParentDetailComponent implements OnInit {
  private financeService = inject(FinanceService);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  parent = signal<ParentDetail | null>(null);
  loading = signal(true);

  payments = signal<ParentPaymentTransaction[]>([]);
  paymentsLoading = signal(false);
  paymentsError = signal(false);
  totalPayments = signal(0);
  currentPage = signal(1);
  pageSize = 20;

  readonly invoiceColumns = ['title', 'period', 'due', 'paid', 'balance', 'status'];
  readonly paymentColumns = ['amount', 'method', 'ref', 'date'];
  readonly paymentHistoryColumns = ['date', 'student', 'invoice', 'amount', 'method', 'ref'];

  readonly PAYMENT_METHOD_LABEL = PAYMENT_METHOD_LABEL;
  readonly INVOICE_STATUS_COLOR = INVOICE_STATUS_COLOR;

  private readonly palettes = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#0891b2', '#e11d48'];

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.loading.set(false); return; }
    this.loadDetail(id);
  }

  private loadDetail(id: number) {
    this.loading.set(true);
    this.financeService.getParentDetail(id).subscribe({
      next: (p) => { this.parent.set(p); this.loading.set(false); },
      error: () => { this.loading.set(false); },
    });
  }

  private loadPayments(parentId: number) {
    this.paymentsLoading.set(true);
    this.paymentsError.set(false);
    this.financeService.getParentPayments(parentId, this.currentPage(), this.pageSize).subscribe({
      next: (res: ParentPaymentsResponse) => {
        this.payments.set(res.results);
        this.totalPayments.set(res.count);
        this.paymentsLoading.set(false);
      },
      error: () => { this.paymentsLoading.set(false); this.paymentsError.set(true); },
    });
  }

  onTabChange(index: number) {
    if (index === 1) {
      const p = this.parent();
      if (p && this.payments().length === 0 && !this.paymentsLoading()) {
        this.loadPayments(p.id);
      }
    }
  }

  onPageChange(event: PageEvent) {
    this.currentPage.set(event.pageIndex + 1);
    this.pageSize = event.pageSize;
    const p = this.parent();
    if (p) this.loadPayments(p.id);
  }

  openInvoiceDialog(child: ParentChildDetail) {
    const dialogRef = this.dialog.open(GenerateInvoiceDialogComponent, {
      width: '520px',
      data: { studentId: child.id, studentName: `${child.first_name} ${child.last_name}` } as InvoiceDialogData,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        if (id) this.loadDetail(id);
      }
    });
  }

  getInitials(first: string, last: string): string {
    return ((first?.[0] || '') + (last?.[0] || '')).toUpperCase() || '?';
  }

  formatCurrency(amount: number): string {
    if (isNaN(amount)) return 'KES 0';
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 2 }).format(amount);
  }

  avatarGrad(first: string, last: string): string {
    const n = ((first?.charCodeAt(0) || 0) + (last?.charCodeAt(0) || 0)) % this.palettes.length;
    return `linear-gradient(135deg, ${this.palettes[n]}, ${this.palettes[(n + 1) % this.palettes.length]})`;
  }
}
