import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError, map } from 'rxjs';
import { getApiUrl } from '@sms/core/config';
import {
  FeeStructure, FeeCategory, StudentInvoice, InvoiceItem, PaymentTransaction, FullLedgerEntry,
  PurchaseRequisition, Expense, InventoryItem, StockMovement,
  SalaryStructure, Payslip, FinanceSummary, PrincipalDashboardData,
  StudentFinanceSummary, StudentProfileMin,
  PaginatedResponse, StaffDirectorySummary, StaffDirectoryResponse, StaffDetail,
  ParentDirectorySummary, ParentDirectoryItem, ParentDirectoryParams,
  ParentDetail, ParentPaymentsResponse,
  ChartAccount, JournalEntry,
  FamilyAccount, FamilyWallet, FamilyWalletTransaction, FamilyPaymentRequest, FamilyPaymentResponse,
  FamilySummaryResponse,
  FeeWaiver, FeeWaiverRequest, WaiverReversalRequest, WaiverStats,
  MpesaTransaction, MpesaReceiptVerification,
  Allocation, AllocationFilterParams, WalletAllocationRequest,
  TrialBalanceReport, IncomeStatementReport, CashFlowReport,
  ReconciliationDashboard, FailedTransactionItem, UnallocatedItem,
} from '../models/finance.models';

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private http = inject(HttpClient);

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  // ─── Fee Structures ────────────────────────────────────────
  getFeeStructures(): Observable<PaginatedResponse<FeeStructure>> {
    return this.http.get<PaginatedResponse<FeeStructure>>(getApiUrl('/finance/fee-structures/'));
  }

  createFeeStructure(data: Partial<FeeStructure>): Observable<FeeStructure> {
    return this.http.post<FeeStructure>(getApiUrl('/finance/fee-structures/'), data);
  }

  updateFeeStructure(id: number, data: Partial<FeeStructure>): Observable<FeeStructure> {
    return this.http.patch<FeeStructure>(getApiUrl(`/finance/fee-structures/${id}/`), data);
  }

  deleteFeeStructure(id: number): Observable<void> {
    return this.http.delete<void>(getApiUrl(`/finance/fee-structures/${id}/`));
  }

  // ─── Invoices ──────────────────────────────────────────────
  getInvoices(page = 1, pageSize = 25): Observable<PaginatedResponse<StudentInvoice>> {
    const params = new HttpParams().set('page', page.toString()).set('page_size', pageSize.toString());
    return this.http.get<PaginatedResponse<StudentInvoice>>(getApiUrl('/finance/invoices/'), { params });
  }

  // ─── Transactions / Ledger ─────────────────────────────────
  getTransactions(page = 1, pageSize = 50): Observable<PaginatedResponse<PaymentTransaction>> {
    const params = new HttpParams().set('page', page.toString()).set('page_size', pageSize.toString());
    return this.http.get<PaginatedResponse<PaymentTransaction>>(getApiUrl('/finance/transactions/'), { params });
  }

  getAccounts(): Observable<ChartAccount[]> {
    return this.http.get<ChartAccount[] | PaginatedResponse<ChartAccount>>(getApiUrl('/finance/accounts/'))
      .pipe(map(res => Array.isArray(res) ? res : res.results));
  }

  getJournalEntries(page = 1, pageSize = 50): Observable<PaginatedResponse<JournalEntry>> {
    const params = new HttpParams().set('page', page.toString()).set('page_size', pageSize.toString());
    return this.http.get<PaginatedResponse<JournalEntry>>(getApiUrl('/finance/journal-entries/'), { params });
  }

  publishJournal(id: number): Observable<JournalEntry> {
    return this.http.post<JournalEntry>(getApiUrl(`/finance/journal-entries/${id}/publish/`), {});
  }

  // ─── Fee Balances (read-only) ──────────────────────────────
  getFeeBalances(page = 1, pageSize = 25): Observable<PaginatedResponse<StudentInvoice>> {
    const params = new HttpParams().set('page', page.toString()).set('page_size', pageSize.toString());
    return this.http.get<PaginatedResponse<StudentInvoice>>(getApiUrl('/finance/fee-balances/'), { params });
  }

  // ─── Purchase Requisitions ─────────────────────────────────
  getRequisitions(): Observable<PaginatedResponse<PurchaseRequisition>> {
    return this.http.get<PaginatedResponse<PurchaseRequisition>>(getApiUrl('/finance/purchase-requisitions/'));
  }

  createRequisition(data: Partial<PurchaseRequisition>): Observable<PurchaseRequisition> {
    return this.http.post<PurchaseRequisition>(getApiUrl('/finance/purchase-requisitions/'), data);
  }

  approveRequisition(id: number): Observable<PurchaseRequisition> {
    return this.http.post<PurchaseRequisition>(getApiUrl(`/finance/purchase-requisitions/${id}/approve/`), {});
  }

  rejectRequisition(id: number): Observable<PurchaseRequisition> {
    return this.http.post<PurchaseRequisition>(getApiUrl(`/finance/purchase-requisitions/${id}/reject/`), {});
  }

  // ─── Expenses ──────────────────────────────────────────────
  getExpenses(page = 1, pageSize = 25): Observable<PaginatedResponse<Expense>> {
    const params = new HttpParams().set('page', page.toString()).set('page_size', pageSize.toString());
    return this.http.get<PaginatedResponse<Expense>>(getApiUrl('/finance/expenses/'), { params });
  }

  createExpense(data: Partial<Expense>): Observable<Expense> {
    return this.http.post<Expense>(getApiUrl('/finance/expenses/'), data);
  }

  // ─── Inventory ─────────────────────────────────────────────
  getInventory(): Observable<PaginatedResponse<InventoryItem>> {
    return this.http.get<PaginatedResponse<InventoryItem>>(getApiUrl('/finance/inventory/'));
  }

  getInventoryItem(id: number): Observable<InventoryItem> {
    return this.http.get<InventoryItem>(getApiUrl(`/finance/inventory/${id}/`));
  }

  createInventoryItem(data: Partial<InventoryItem>): Observable<InventoryItem> {
    return this.http.post<InventoryItem>(getApiUrl('/finance/inventory/'), data);
  }

  updateInventoryItem(id: number, data: Partial<InventoryItem>): Observable<InventoryItem> {
    return this.http.patch<InventoryItem>(getApiUrl(`/finance/inventory/${id}/`), data);
  }

  deleteInventoryItem(id: number): Observable<void> {
    return this.http.delete<void>(getApiUrl(`/finance/inventory/${id}/`));
  }

  getStockMovements(page = 1, pageSize = 50): Observable<PaginatedResponse<StockMovement>> {
    const params = new HttpParams().set('page', page.toString()).set('page_size', pageSize.toString());
    return this.http.get<PaginatedResponse<StockMovement>>(getApiUrl('/finance/stock-movements/'), { params });
  }

  createStockMovement(data: Partial<StockMovement>): Observable<StockMovement> {
    return this.http.post<StockMovement>(getApiUrl('/finance/stock-movements/'), data);
  }

  // ─── Payroll ───────────────────────────────────────────────
  getSalaryStructures(): Observable<PaginatedResponse<SalaryStructure>> {
    return this.http.get<PaginatedResponse<SalaryStructure>>(getApiUrl('/finance/salary-structures/'));
  }

  getPayslips(): Observable<PaginatedResponse<Payslip>> {
    return this.http.get<PaginatedResponse<Payslip>>(getApiUrl('/finance/payslips/'));
  }

  markPayslipPaid(id: number): Observable<Payslip> {
    return this.http.post<Payslip>(getApiUrl(`/finance/payslips/${id}/mark_paid/`), {});
  }

  generatePayroll(month: number, year: number): Observable<{status: string, created_count: number}> {
    return this.http.post<{status: string, created_count: number}>(getApiUrl('/finance/payroll/generate/'), { month, year });
  }

  // ─── Summary & Dashboard ───────────────────────────────────
  getFinanceSummary(): Observable<FinanceSummary> {
    return this.http.get<FinanceSummary>(getApiUrl('/finance/summary/'));
  }

  getPrincipalDashboard(months: number = 6): Observable<PrincipalDashboardData> {
    const params = new HttpParams().set('months', months.toString());
    return this.http.get<PrincipalDashboardData>(getApiUrl('/finance/principal-dashboard/'), { params });
  }

  // ─── Student Profiles & Finance Summary ────────────────────
  getStudentProfiles(page = 1, pageSize = 50): Observable<PaginatedResponse<StudentProfileMin>> {
    const params = new HttpParams().set('page', page.toString()).set('page_size', pageSize.toString());
    return this.http.get<PaginatedResponse<StudentProfileMin>>(getApiUrl('/students/profiles/'), { params });
  }

  getStudentFinanceSummary(studentId: number): Observable<StudentFinanceSummary> {
    return this.http.get<StudentFinanceSummary>(getApiUrl(`/finance/students/${studentId}/summary/`));
  }

  // ─── Staff Directory ────────────────────────────────────────
  getStaffDirectorySummary(): Observable<StaffDirectorySummary> {
    return this.http.get<StaffDirectorySummary>(getApiUrl('/staff/directory/summary/'));
  }

  getStaffDirectory(): Observable<StaffDirectoryResponse> {
    return this.http.get<StaffDirectoryResponse>(getApiUrl('/staff/directory/'));
  }

  getStaffDetail(id: number): Observable<StaffDetail> {
    return this.http.get<StaffDetail>(getApiUrl(`/staff/directory/${id}/`));
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
    return this.http.get<ParentDirectoryItem[] | PaginatedResponse<ParentDirectoryItem>>(
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

  // ─── Reminders & Manual Payments ──────────────────────────────
  sendReminders(payload: { targets: number[], method: 'SMS' | 'EMAIL', message?: string }): Observable<any> {
    return this.http.post(getApiUrl('/finance/reminders/'), payload);
  }

  recordManualPayment(payload: { invoice: number, amount: number, payment_method: string, reference_code: string }): Observable<PaymentTransaction> {
    return this.http.post<PaymentTransaction>(getApiUrl('/finance/transactions/'), payload);
  }

  // ─── Financial Reports ───────────────────────────────────────
  getTrialBalance(endDate?: string): Observable<TrialBalanceReport> {
    let params = new HttpParams();
    if (endDate) params = params.set('end_date', endDate);
    return this.http.get<TrialBalanceReport>(getApiUrl('/finance/reports/trial-balance/'), { params });
  }

  getIncomeStatement(startDate?: string, endDate?: string): Observable<IncomeStatementReport> {
    let params = new HttpParams();
    if (startDate) params = params.set('start_date', startDate);
    if (endDate) params = params.set('end_date', endDate);
    return this.http.get<IncomeStatementReport>(getApiUrl('/finance/reports/income-statement/'), { params });
  }

  getCashFlow(startDate?: string, endDate?: string): Observable<CashFlowReport> {
    let params = new HttpParams();
    if (startDate) params = params.set('start_date', startDate);
    if (endDate) params = params.set('end_date', endDate);
    return this.http.get<CashFlowReport>(getApiUrl('/finance/reports/cash-flow/'), { params });
  }

  // ─── Fee Categories ───────────────────────────────────────────
  getFeeCategories(): Observable<FeeCategory[]> {
    return this.http.get<FeeCategory[] | PaginatedResponse<FeeCategory>>(getApiUrl('/finance/fee-categories/')).pipe(
      map(res => Array.isArray(res) ? res : res.results)
    );
  }

  // ─── Invoice Items (line-item list) ───────────────────────────
  getInvoiceItems(invoiceId?: number): Observable<InvoiceItem[]> {
    let params = new HttpParams();
    if (invoiceId) params = params.set('invoice', invoiceId.toString());
    return this.http.get<InvoiceItem[] | PaginatedResponse<InvoiceItem>>(getApiUrl('/finance/invoice-items/'), { params }).pipe(
      map(res => Array.isArray(res) ? res : (res.results ?? []))
    );
  }

  // ─── Family Accounts & Wallet ─────────────────────────────────
  getFamilies(): Observable<FamilyAccount[]> {
    return this.http.get<FamilyAccount[] | PaginatedResponse<FamilyAccount>>(getApiUrl('/finance/families/')).pipe(
      map(res => Array.isArray(res) ? res : res.results)
    );
  }

  getFamily(id: number): Observable<FamilyAccount> {
    return this.http.get<FamilyAccount>(getApiUrl(`/finance/families/${id}/`));
  }

  getFamilySummary(id: number): Observable<FamilySummaryResponse> {
    return this.http.get<FamilySummaryResponse>(getApiUrl(`/finance/families/${id}/summary/`));
  }

  getFamilyWallet(id: number): Observable<FamilyWallet> {
    return this.http.get<FamilyWallet>(getApiUrl(`/finance/families/${id}/wallet/`));
  }

  getWalletTransactions(id: number): Observable<FamilyWalletTransaction[]> {
    return this.http.get<FamilyWalletTransaction[]>(getApiUrl(`/finance/wallets/${id}/transactions/`));
  }

  payFamily(familyId: number, data: FamilyPaymentRequest): Observable<FamilyPaymentResponse> {
    return this.http.post<FamilyPaymentResponse>(getApiUrl(`/finance/families/${familyId}/pay/`), data);
  }

  allocateWallet(familyId: number, data: WalletAllocationRequest): Observable<FamilyPaymentResponse> {
    return this.http.post<FamilyPaymentResponse>(getApiUrl(`/finance/families/${familyId}/allocate-wallet/`), data);
  }

  getAllocations(params: AllocationFilterParams = {}): Observable<PaginatedResponse<Allocation>> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.page_size) httpParams = httpParams.set('page_size', params.page_size.toString());
    if (params.family) httpParams = httpParams.set('family', params.family.toString());
    if (params.strategy) httpParams = httpParams.set('strategy', params.strategy);
    if (params.search) httpParams = httpParams.set('search', params.search);
    return this.http.get<PaginatedResponse<Allocation>>(getApiUrl('/finance/allocations/'), { params: httpParams });
  }

  getAllocation(id: number): Observable<Allocation> {
    return this.http.get<Allocation>(getApiUrl(`/finance/allocations/${id}/`));
  }

  // ─── Fee Waivers ──────────────────────────────────────────────
  getWaivers(): Observable<FeeWaiver[]> {
    return this.http.get<FeeWaiver[] | PaginatedResponse<FeeWaiver>>(getApiUrl('/finance/waivers/')).pipe(
      map(res => Array.isArray(res) ? res : res.results)
    );
  }

  createWaiver(data: FeeWaiverRequest): Observable<FeeWaiver> {
    return this.http.post<FeeWaiver>(getApiUrl('/finance/waivers/'), data);
  }

  reverseWaiver(id: number, data: WaiverReversalRequest): Observable<FeeWaiver> {
    return this.http.post<FeeWaiver>(getApiUrl(`/finance/waivers/${id}/reverse/`), data);
  }

  getWaiverStats(): Observable<WaiverStats> {
    return this.http.get<WaiverStats>(getApiUrl('/finance/waivers/stats/'));
  }

  // ─── M-Pesa Transactions ─────────────────────────────────────
  getMpesaTransactions(): Observable<MpesaTransaction[]> {
    return this.http.get<MpesaTransaction[] | PaginatedResponse<MpesaTransaction>>(getApiUrl('/finance/mpesa-transactions/')).pipe(
      map(res => Array.isArray(res) ? res : res.results)
    );
  }

  lookupMpesaReceipt(receipt: string): Observable<MpesaReceiptVerification> {
    const params = new HttpParams().set('receipt', receipt);
    return this.http.get<MpesaReceiptVerification>(getApiUrl('/finance/mpesa/lookup/'), { params });
  }

  // ─── Reconciliation Dashboard ─────────────────────────────────
  getReconciliationDashboard(): Observable<ReconciliationDashboard> {
    return this.http.get<ReconciliationDashboard>(getApiUrl('/finance/reconciliation/dashboard/'));
  }

  getFailedTransactions(params?: { date_from?: string; date_to?: string; phone?: string; transaction_type?: string }): Observable<PaginatedResponse<FailedTransactionItem>> {
    let httpParams = new HttpParams();
    if (params?.date_from) httpParams = httpParams.set('date_from', params.date_from);
    if (params?.date_to) httpParams = httpParams.set('date_to', params.date_to);
    if (params?.phone) httpParams = httpParams.set('phone', params.phone);
    if (params?.transaction_type) httpParams = httpParams.set('transaction_type', params.transaction_type);
    return this.http.get<PaginatedResponse<FailedTransactionItem>>(getApiUrl('/finance/reconciliation/failed/'), { params: httpParams });
  }

  getUnallocatedPayments(params?: { type?: string; date_from?: string; date_to?: string }): Observable<PaginatedResponse<UnallocatedItem>> {
    let httpParams = new HttpParams();
    if (params?.type) httpParams = httpParams.set('type', params.type);
    if (params?.date_from) httpParams = httpParams.set('date_from', params.date_from);
    if (params?.date_to) httpParams = httpParams.set('date_to', params.date_to);
    return this.http.get<PaginatedResponse<UnallocatedItem>>(getApiUrl('/finance/reconciliation/unallocated/'), { params: httpParams });
  }

  // ─── Helper: typed error handler ───────────────────────────
  private handleError(err: any, fallback: string): Observable<never> {
    const message = err.error?.message || err.error?.detail || err.message || fallback;
    this.error.set(message);
    this.isLoading.set(false);
    return throwError(() => new Error(message));
  }
}
