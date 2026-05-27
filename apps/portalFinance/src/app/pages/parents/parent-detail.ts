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
import { FinanceService } from '../../services/finance.service';
import {
  ParentDetail, ParentChildDetail, ParentPaymentTransaction,
  ParentPaymentsResponse,
  FORMAT_CURRENCY, PAYMENT_METHOD_LABEL, INVOICE_STATUS_COLOR,
} from '../../models/finance.models';

@Component({
  selector: 'app-parent-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatCardModule, MatIconModule, MatButtonModule, MatTableModule,
    MatTabsModule, MatChipsModule, MatDividerModule,
    MatProgressSpinnerModule, MatPaginatorModule,
  ],
  template: `
    <div class="page-detail page-fade-in">

      <a class="back-link" routerLink="/portalFinance/parents">
        <mat-icon>arrow_back</mat-icon>
        Back to Parent Directory
      </a>

      @if (parent(); as p) {
        <!-- Parent Header Card -->
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
          <mat-tab-group dynamicHeight (selectedTabChange)="onTabChange($event)">
            <!-- Children Tab -->
            <mat-tab label="Children">
              <div class="tab-content">
                @for (child of p.children; track child.id) {
                  <mat-card class="child-card">
                    <mat-card-content>
                      <div class="child-header">
                        <div class="child-avatar-wrap">
                          <div class="child-avatar" [style.background]="avatarGrad(child.first_name, child.last_name)">
                            {{ getInitials(child.first_name, child.last_name) }}
                          </div>
                          <div class="child-status-ring" [class.active]="true"></div>
                        </div>
                        <div class="child-info">
                          <h3>{{ child.first_name }} {{ child.last_name }}</h3>
                          <div class="child-meta">
                            <span class="child-chip">{{ child.school_id }}</span>
                            <span class="child-chip">{{ child.current_class }}</span>
                            @if (child.year_level) {
                              <span class="child-chip">{{ child.year_level }}</span>
                            }
                            @if (child.house) {
                              <span class="child-chip">{{ child.house }}</span>
                            }
                          </div>
                        </div>
                      </div>

                      <mat-divider></mat-divider>

                      <div class="fin-summary-cards">
                        <div class="fin-card invoiced">
                          <span class="fin-label">Total Invoiced</span>
                          <span class="fin-value">{{ FORMAT_CURRENCY(child.financial_summary.total_invoiced) }}</span>
                        </div>
                        <div class="fin-card paid">
                          <span class="fin-label">Total Paid</span>
                          <span class="fin-value">{{ FORMAT_CURRENCY(child.financial_summary.total_paid) }}</span>
                        </div>
                        <div class="fin-card outstanding" [class.clear]="child.financial_summary.outstanding_balance === 0">
                          <span class="fin-label">Outstanding</span>
                          <span class="fin-value">{{ FORMAT_CURRENCY(child.financial_summary.outstanding_balance) }}</span>
                        </div>
                      </div>

                      <mat-divider></mat-divider>

                      <!-- Invoices -->
                      <h4 class="section-title">
                        <mat-icon>receipt_long</mat-icon>
                        Invoices
                      </h4>
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
                            <th mat-header-cell *matHeaderCellDef>Due</th>
                            <td mat-cell *matCellDef="let inv" class="mono-cell">{{ FORMAT_CURRENCY(inv.amount_due) }}</td>
                          </ng-container>
                          <ng-container matColumnDef="paid">
                            <th mat-header-cell *matHeaderCellDef>Paid</th>
                            <td mat-cell *matCellDef="let inv" class="mono-cell paid">{{ FORMAT_CURRENCY(inv.amount_paid) }}</td>
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
                              <span class="status-chip" [style.background]="invStatusBg(inv.status)" [style.color]="invStatusText(inv.status)">
                                {{ inv.status }}
                              </span>
                            </td>
                          </ng-container>
                          <tr mat-header-row *matHeaderRowDef="invoiceColumns"></tr>
                          <tr mat-row *matRowDef="let row; columns: invoiceColumns;"></tr>
                        </table>
                      } @else {
                        <div class="empty-section">
                          <mat-icon>receipt_long</mat-icon>
                          <span>No invoices</span>
                        </div>
                      }

                      <mat-divider></mat-divider>

                      <!-- Recent Payments -->
                      <h4 class="section-title">
                        <mat-icon>payments</mat-icon>
                        Recent Payments
                      </h4>
                      @if (child.recent_payments.length > 0) {
                        <table mat-table [dataSource]="child.recent_payments" class="child-table">
                          <ng-container matColumnDef="amount">
                            <th mat-header-cell *matHeaderCellDef>Amount</th>
                            <td mat-cell *matCellDef="let pmt" class="mono-cell paid">{{ FORMAT_CURRENCY(pmt.amount) }}</td>
                          </ng-container>
                          <ng-container matColumnDef="method">
                            <th mat-header-cell *matHeaderCellDef>Method</th>
                            <td mat-cell *matCellDef="let pmt">{{ PAYMENT_METHOD_LABEL[pmt.payment_method] || pmt.payment_method }}</td>
                          </ng-container>
                          <ng-container matColumnDef="ref">
                            <th mat-header-cell *matHeaderCellDef>Reference</th>
                            <td mat-cell *matCellDef="let pmt" class="mono-cell">{{ pmt.reference_code }}</td>
                          </ng-container>
                          <ng-container matColumnDef="date">
                            <th mat-header-cell *matHeaderCellDef>Date</th>
                            <td mat-cell *matCellDef="let pmt">{{ pmt.transaction_date | date:'mediumDate' }}</td>
                          </ng-container>
                          <tr mat-header-row *matHeaderRowDef="paymentColumns"></tr>
                          <tr mat-row *matRowDef="let row; columns: paymentColumns;"></tr>
                        </table>
                      } @else {
                        <div class="empty-section">
                          <mat-icon>payments</mat-icon>
                          <span>No payments recorded</span>
                        </div>
                      }

                      <mat-divider></mat-divider>

                      <!-- Services -->
                      <h4 class="section-title">
                        <mat-icon>room_service</mat-icon>
                        Services
                      </h4>
                      <div class="services-row">
                        <div class="service-badge" [class.active]="child.services.transport !== 'NONE'">
                          <mat-icon>directions_bus</mat-icon>
                          <span>{{ child.services.transport === 'NONE' ? 'No Transport' : child.services.transport === 'TWO-WAY' ? 'Two-Way Transport' : 'One-Way Transport' }}</span>
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

            <!-- Payment History Tab -->
            <mat-tab label="Payment History" [disabled]="paymentsLoading()">
              <div class="tab-content">
                @if (paymentsError()) {
                  <div class="error-state">
                    <mat-icon>error_outline</mat-icon>
                    <p>Failed to load payment history</p>
                  </div>
                } @else if (paymentsLoading() && payments().length === 0) {
                  <div class="loading-state">
                    <mat-spinner diameter="28"></mat-spinner>
                    <span>Loading payment history...</span>
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
                      <th mat-header-cell *matHeaderCellDef>Amount</th>
                      <td mat-cell *matCellDef="let pmt" class="mono-cell paid">{{ FORMAT_CURRENCY(pmt.amount) }}</td>
                    </ng-container>
                    <ng-container matColumnDef="method">
                      <th mat-header-cell *matHeaderCellDef>Method</th>
                      <td mat-cell *matCellDef="let pmt">{{ PAYMENT_METHOD_LABEL[pmt.payment_method] || pmt.payment_method }}</td>
                    </ng-container>
                    <ng-container matColumnDef="ref">
                      <th mat-header-cell *matHeaderCellDef>Reference</th>
                      <td mat-cell *matCellDef="let pmt" class="mono-cell">{{ pmt.reference_code }}</td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="paymentHistoryColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: paymentHistoryColumns;"></tr>
                    @if (payments().length === 0) {
                      <tr class="mat-row no-data-row">
                        <td class="mat-cell" [attr.colspan]="paymentHistoryColumns.length">
                          <div class="no-data">
                            <mat-icon>payments</mat-icon>
                            <p>No payment history</p>
                          </div>
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
                      showFirstLastButtons
                      class="payment-paginator">
                    </mat-paginator>
                  }
                }
              </div>
            </mat-tab>
          </mat-tab-group>
        </mat-card>
      } @else if (loading()) {
        <div class="loading-state">
          <mat-spinner diameter="36"></mat-spinner>
          <span>Loading parent details...</span>
        </div>
      } @else {
        <div class="error-state">
          <mat-icon>error_outline</mat-icon>
          <p>Parent not found</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-detail { max-width: 1000px; margin: 0 auto; font-family: 'Inter', system-ui, sans-serif; padding: 24px; }

    .back-link {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 0.8125rem; font-weight: 500; color: #64748b;
      text-decoration: none; margin-bottom: 20px; cursor: pointer;
      transition: color 0.15s ease;
    }
    .back-link:hover { color: #2563eb; }
    .back-link mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .header-card { border-radius: 14px !important; margin-bottom: 20px; }
    .parent-header { display: flex; align-items: center; gap: 18px; }
    .parent-avatar-large {
      width: 56px; height: 56px; border-radius: 16px;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: white; display: flex; align-items: center; justify-content: center;
      font-size: 1.25rem; font-weight: 700; flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(37,99,235,0.2);
    }
    .parent-info h2 { font-size: 1.375rem; font-weight: 700; color: #0f172a; margin: 0 0 8px; }
    .parent-meta { display: flex; flex-wrap: wrap; gap: 10px; }
    .meta-chip { display: inline-flex; align-items: center; gap: 5px; font-size: 0.8125rem; color: #64748b; padding: 4px 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
    .meta-chip mat-icon { font-size: 15px; width: 15px; height: 15px; color: #94a3b8; }

    .detail-card { border-radius: 14px !important; overflow: hidden; }
    .tab-content { padding: 16px 0; }

    .child-card { border-radius: 12px !important; margin-bottom: 16px; }
    .child-card:last-child { margin-bottom: 0; }

    .child-header { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; }
    .child-avatar-wrap { position: relative; flex-shrink: 0; }
    .child-avatar { width: 44px; height: 44px; border-radius: 12px; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.8125rem; font-weight: 700; box-shadow: 0 2px 6px rgba(0,0,0,0.1); }
    .child-status-ring { position: absolute; bottom: -1px; right: -1px; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; }
    .child-status-ring.active { background: #059669; }
    .child-info h3 { font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0 0 6px; }
    .child-meta { display: flex; flex-wrap: wrap; gap: 6px; }
    .child-chip { font-size: 0.6875rem; padding: 3px 10px; border-radius: 6px; background: #f1f5f9; color: #475569; font-weight: 500; }

    .fin-summary-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 14px 0; }
    .fin-card { padding: 12px 14px; border-radius: 10px; display: flex; flex-direction: column; gap: 4px; border: 1px solid #e2e8f0; }
    .fin-label { font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.04em; color: #94a3b8; font-weight: 600; }
    .fin-value { font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; font-size: 0.9375rem; font-weight: 700; color: #0f172a; }
    .fin-card.paid .fin-value { color: #059669; }
    .fin-card.outstanding .fin-value { color: #e11d48; }
    .fin-card.outstanding.clear .fin-value { color: #059669; }

    .section-title { display: flex; align-items: center; gap: 6px; font-size: 0.8125rem; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.04em; margin: 14px 0 10px; }
    .section-title mat-icon { font-size: 18px; width: 18px; height: 18px; color: #2563eb; }

    .child-table { width: 100%; }
    .child-table .mat-mdc-header-cell { font-size: 0.625rem !important; font-weight: 600 !important; color: #64748b !important; text-transform: uppercase; letter-spacing: 0.04em; }
    .child-table .mat-mdc-cell { font-size: 0.8125rem; padding: 8px 12px !important; color: #334155; }
    .mono-cell { font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; font-weight: 600; }
    .mono-cell.paid { color: #059669; }
    .mono-cell.positive { color: #e11d48; }
    .mono-cell.zero { color: #059669; }

    .status-chip { font-size: 0.5625rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; padding: 2px 8px; border-radius: 999px; display: inline-block; }

    .empty-section { display: flex; align-items: center; gap: 8px; padding: 12px 0; color: #94a3b8; font-size: 0.8125rem; }
    .empty-section mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .services-row { display: flex; gap: 12px; margin: 10px 0 4px; }
    .service-badge { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px; font-size: 0.75rem; font-weight: 500; color: #94a3b8; background: #f1f5f9; opacity: 0.6; }
    .service-badge.active { opacity: 1; color: #475569; background: #eff6ff; }
    .service-badge mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .service-badge.active mat-icon { color: #2563eb; }

    .payment-table { width: 100%; }
    .payment-table .mat-mdc-header-cell { font-size: 0.6875rem !important; font-weight: 600 !important; color: #64748b !important; text-transform: uppercase; letter-spacing: 0.04em; }
    .payment-table .mat-mdc-cell { font-size: 0.8125rem; padding: 10px 12px !important; color: #334155; }

    .payment-paginator { border-top: 1px solid #e2e8f0; }

    .empty-tab, .loading-state, .error-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 48px 24px; color: #94a3b8; }
    .empty-tab mat-icon, .error-state mat-icon { font-size: 40px; width: 40px; height: 40px; }
    .empty-tab p, .loading-state span, .error-state p { margin: 0; font-size: 0.875rem; }

    .no-data { display: flex; align-items: center; gap: 10px; padding: 24px; color: #94a3b8; justify-content: center; }
    .no-data mat-icon { font-size: 24px; width: 24px; height: 24px; }
    .no-data p { margin: 0; font-size: 0.875rem; }
  `],
})
export class ParentDetailComponent implements OnInit {
  private financeService = inject(FinanceService);
  private route = inject(ActivatedRoute);

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

  readonly FORMAT_CURRENCY = FORMAT_CURRENCY;
  readonly PAYMENT_METHOD_LABEL = PAYMENT_METHOD_LABEL;

  private readonly palettes = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#0891b2', '#e11d48'];

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.loading.set(false); return; }
    this.loadDetail(id);
  }

  private loadDetail(id: number) {
    this.loading.set(true);
    this.financeService.getParentDetail(id).subscribe({
      next: (p) => {
        this.parent.set(p);
        this.loading.set(false);
      },
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
      error: () => {
        this.paymentsLoading.set(false);
        this.paymentsError.set(true);
      },
    });
  }

  onTabChange(event: any) {
    if (event.index === 1) {
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

  getInitials(first: string, last: string): string {
    return ((first?.[0] || '') + (last?.[0] || '')).toUpperCase() || '?';
  }

  invStatusBg(status: string): string {
    return INVOICE_STATUS_COLOR[status] || '#94a3b8';
  }

  invStatusText(status: string): string {
    return 'white';
  }

  avatarGrad(first: string, last: string): string {
    const n = ((first?.charCodeAt(0) || 0) + (last?.charCodeAt(0) || 0)) % this.palettes.length;
    return `linear-gradient(135deg, ${this.palettes[n]}, ${this.palettes[(n + 1) % this.palettes.length]})`;
  }
}
