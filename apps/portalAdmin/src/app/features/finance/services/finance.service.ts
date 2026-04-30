/**
 * Finance Service
 * Manages fee balances, payments, and expenses
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { getApiUrl } from '@sms/core/config';
import { FeeBalance, Payment, Expense, CreditNote, ManualPaymentRequest, ExpenseApprovalRequest, CreditNoteRequest } from '../../../shared/models/finance.models';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface FinanceSummary {
  total_outstanding_kes: number;
  collection_rate_percent: number;
  pending_expense_approvals: number;
}

@Injectable({
  providedIn: 'root',
})
export class FinanceService {
  private http = inject(HttpClient);

  readonly feeBalances = signal<FeeBalance[]>([]);
  readonly totalCount = signal<number>(0);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly financeSummary = signal<FinanceSummary | null>(null);

  getFeeBalances(
    page: number = 1,
    pageSize: number = 25,
    filters?: { year_level?: number; has_arrears?: boolean }
  ): Observable<PaginatedResponse<FeeBalance>> {
    this.isLoading.set(true);
    this.error.set(null);

    let params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());

    if (filters?.year_level) {
      params = params.set('year_level', filters.year_level.toString());
    }
    if (filters?.has_arrears !== undefined) {
      params = params.set('has_arrears', filters.has_arrears.toString());
    }

    return this.http
      .get<PaginatedResponse<FeeBalance>>(getApiUrl('/finance/fee-balances/'), { params })
      .pipe(
        catchError((err) => {
          const message = err.error?.message || 'Failed to load fee balances';
          this.error.set(message);
          this.isLoading.set(false);
          return throwError(() => new Error(message));
        })
      );
  }

  recordPayment(data: ManualPaymentRequest): Observable<Payment> {
    return this.http.post<Payment>(getApiUrl('/finance/payments/'), data);
  }

  getExpenses(page: number = 1, pageSize: number = 25): Observable<PaginatedResponse<Expense>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());
    return this.http.get<PaginatedResponse<Expense>>(getApiUrl('/finance/expenses/'), { params });
  }

  approveExpense(id: number, data: ExpenseApprovalRequest): Observable<Expense> {
    return this.http.post<Expense>(getApiUrl(`/finance/expenses/${id}/approve/`), data);
  }

  createCreditNote(data: CreditNoteRequest): Observable<CreditNote> {
    return this.http.post<CreditNote>(getApiUrl('/finance/credit-notes/'), data);
  }

  getFinanceSummary(): Observable<FinanceSummary> {
    return this.http.get<FinanceSummary>(getApiUrl('/finance/summary/'));
  }

  setFeeBalances(data: FeeBalance[], total: number): void {
    this.feeBalances.set(data);
    this.totalCount.set(total);
    this.isLoading.set(false);
  }

  loadFinanceSummary(): void {
    this.getFinanceSummary().subscribe({
      next: (summary) => this.financeSummary.set(summary),
      error: () => this.financeSummary.set(null),
    });
  }
}
