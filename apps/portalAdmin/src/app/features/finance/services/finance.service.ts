import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError, map } from 'rxjs';
import { getApiUrl } from '@sms/core/config';
import {
  FeeBalance, Payment, Expense, CreditNote,
  ManualPaymentRequest, ExpenseApprovalRequest, CreditNoteRequest,
  PrincipalDashboardData, InventoryItemFull, StockMovementItem,
  FeeStructure,
  ParentDirectorySummary, ParentDirectoryItem, ParentDirectoryParams,
  ParentDetail, ParentPaymentsResponse, InvoiceCreateRequest,
  SuggestedInvoicesResponse,
} from '../../../shared/models/finance.models';

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

  readonly dashboardData = signal<PrincipalDashboardData | null>(null);
  readonly dashboardLoading = signal<boolean>(false);
  readonly dashboardError = signal<string | null>(null);

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

  getDashboardData(): Observable<PrincipalDashboardData> {
    this.dashboardLoading.set(true);
    this.dashboardError.set(null);

    return this.http
      .get<PrincipalDashboardData>(getApiUrl('/finance/principal-dashboard/'))
      .pipe(
        catchError((err) => {
          const message = err.error?.message || 'Failed to load principal dashboard';
          this.dashboardError.set(message);
          this.dashboardLoading.set(false);
          return throwError(() => new Error(message));
        })
      );
  }

  downloadReport(format: 'pdf' | 'xlsx', type: 'financial_statement' | 'aging_debt'): Observable<Blob> {
    const mimeType = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    return this.http
      .get(getApiUrl(`/finance/reports/${type}/`), {
        params: new HttpParams().set('format', format),
        responseType: 'blob',
      })
      .pipe(
        catchError((err) => {
          const message = err.error?.message || `Failed to download ${type} report`;
          return throwError(() => new Error(message));
        })
      );
  }

  getInventory(page = 1, pageSize = 50): Observable<PaginatedResponse<InventoryItemFull>> {
    let params = new HttpParams().set('page', page.toString()).set('page_size', pageSize.toString());
    return this.http.get<PaginatedResponse<InventoryItemFull>>(getApiUrl('/finance/inventory/'), { params });
  }

  getStockMovements(page = 1, pageSize = 50): Observable<PaginatedResponse<StockMovementItem>> {
    let params = new HttpParams().set('page', page.toString()).set('page_size', pageSize.toString());
    return this.http.get<PaginatedResponse<StockMovementItem>>(getApiUrl('/finance/stock-movements/'), { params });
  }

  verifyItem(id: number): Observable<{ success: boolean; last_verified: string }> {
    return this.http
      .post<{ success: boolean; last_verified: string }>(getApiUrl(`/finance/inventory/${id}/verify/`), {})
      .pipe(
        catchError((err) => {
          const message = err.error?.message || 'Failed to verify inventory item';
          return throwError(() => new Error(message));
        })
      );
  }

  // ─── Parent Directory ────────────────────────────────────────
  getParentDirectorySummary(): Observable<ParentDirectorySummary> {
    return this.http.get<ParentDirectorySummary>(getApiUrl('/finance/parents/summary/'));
  }

  getParentDirectory(params?: ParentDirectoryParams): Observable<ParentDirectoryItem[]> {
    let httpParams = new HttpParams();
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.student_name) httpParams = httpParams.set('student_name', params.student_name);
    if (params?.class_id) httpParams = httpParams.set('class_id', params.class_id.toString());
    return this.http.get<ParentDirectoryItem[] | { results: ParentDirectoryItem[] }>(
      getApiUrl('/finance/parents/'), { params: httpParams }
    ).pipe(
      map(res => Array.isArray(res) ? res : (res.results ?? []))
    );
  }

  getParentDetail(id: number): Observable<ParentDetail> {
    return this.http.get<ParentDetail>(getApiUrl(`/finance/parents/${id}/`));
  }

  getParentPayments(id: number, page = 1, pageSize = 20): Observable<ParentPaymentsResponse> {
    const params = new HttpParams().set('page', page.toString()).set('page_size', pageSize.toString());
    return this.http.get<ParentPaymentsResponse>(getApiUrl(`/finance/parents/${id}/payments/`), { params });
  }

  // ─── Fee Structures (for invoice generation) ──────────────────
  getFeeStructures(): Observable<FeeStructure[]> {
    return this.http.get<FeeStructure[] | { results: FeeStructure[] }>(
      getApiUrl('/finance/fee-structures/')
    ).pipe(
      map(res => Array.isArray(res) ? res : (res.results ?? []))
    );
  }

  // ─── Suggested Invoices ──────────────────────────────────────
  getSuggestedInvoices(studentId: number): Observable<SuggestedInvoicesResponse> {
    return this.http.get<SuggestedInvoicesResponse>(getApiUrl(`/finance/students/${studentId}/suggested-invoices/`));
  }

  // ─── Invoice Generation ───────────────────────────────────────
  createInvoice(data: InvoiceCreateRequest): Observable<any> {
    return this.http.post(getApiUrl('/finance/invoices/'), data);
  }
}
