import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError, map } from 'rxjs';
import { getApiUrl } from '@sms/core/config';
import {
  FeeStructure, StudentInvoice, PaymentTransaction, FullLedgerEntry,
  PurchaseRequisition, Expense, InventoryItem, StockMovement,
  SalaryStructure, Payslip, FinanceSummary, PrincipalDashboardData,
  StudentFinanceSummary, StudentProfileMin,
  PaginatedResponse, StaffDirectorySummary, StaffDirectoryResponse, StaffDetail,
  ParentDirectorySummary, ParentDirectoryItem, ParentDirectoryParams,
  ParentDetail, ParentPaymentsResponse,
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

  // ─── Summary & Dashboard ───────────────────────────────────
  getFinanceSummary(): Observable<FinanceSummary> {
    return this.http.get<FinanceSummary>(getApiUrl('/finance/summary/'));
  }

  getPrincipalDashboard(): Observable<PrincipalDashboardData> {
    return this.http.get<PrincipalDashboardData>(getApiUrl('/finance/principal-dashboard/'));
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

  // ─── Helper: typed error handler ───────────────────────────
  private handleError(err: any, fallback: string): Observable<never> {
    const message = err.error?.message || err.error?.detail || err.message || fallback;
    this.error.set(message);
    this.isLoading.set(false);
    return throwError(() => new Error(message));
  }
}
