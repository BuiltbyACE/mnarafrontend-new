import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { getApiUrl } from '@sms/core/config';
import {
  DashboardSummary,
  TimetableEntry,
  TermReportCard,
  StudentInvoice,
  Transaction,
  FeeBalance,
  FeeStructureResponse,
  FeeStructurePdfResponse,
  SchoolInfo,
  FeeStatementResponse,
  Announcement,
  Trip,
  Manifest,
  TransportRoute,
  FleetTelemetry,
  PrintableReportCardResponse,
  StkPushRequest,
  StkPushResponse,
  WalletResponse,
  ReceiptsResponse,
  PaymentHistoryResponse,
} from '../models/parent.models';

@Injectable({ providedIn: 'root' })
export class ParentApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = getApiUrl('');

  // ─── Dashboard ───────────────────────────────────────────────────
  getDashboardSummary(studentId: number): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.baseUrl}/parents/dashboard-summary/`, {
      params: { student_id: studentId },
    });
  }

  // ─── Timetable ───────────────────────────────────────────────────
  getMyTimetable(): Observable<TimetableEntry[]> {
    return this.http.get<TimetableEntry[]>(`${this.baseUrl}/academics/my-timetable/`);
  }

  // ─── Exam Results (Report Cards) ───────────────────────────────
  getReportCards(params?: { student?: number }): Observable<TermReportCard[]> {
    let p = new HttpParams();
    if (params?.student) p = p.set('student', params.student);
    return this.http.get<any>(`${this.baseUrl}/lms/report-cards/`, { params: p }).pipe(
      map(res => res.results ? res.results : res)
    );
  }

  getPrintableReportCard(id: number): Observable<PrintableReportCardResponse> {
    return this.http.get<PrintableReportCardResponse>(`${this.baseUrl}/lms/report-cards/${id}/printable/`);
  }

  // ─── Finance: Invoices ───────────────────────────────────────────
  getInvoices(params?: { student?: number; status?: string; term_id?: number }): Observable<StudentInvoice[]> {
    let p = new HttpParams();
    if (params?.student) p = p.set('student', params.student);
    if (params?.status) p = p.set('status', params.status);
    if (params?.term_id) p = p.set('term_id', params.term_id);
    return this.http.get<StudentInvoice[]>(`${this.baseUrl}/finance/invoices/`, { params: p });
  }

  getInvoice(id: number): Observable<StudentInvoice> {
    return this.http.get<StudentInvoice>(`${this.baseUrl}/finance/invoices/${id}/`);
  }

  // ─── Finance: Transactions ───────────────────────────────────────
  getTransactions(params?: { invoice?: number }): Observable<Transaction[]> {
    let p = new HttpParams();
    if (params?.invoice) p = p.set('invoice', params.invoice);
    return this.http.get<Transaction[]>(`${this.baseUrl}/finance/transactions/`, { params: p });
  }

  getTransaction(id: number): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.baseUrl}/finance/transactions/${id}/`);
  }

  // ─── Finance: Fee Balances ───────────────────────────────────────
  getFeeBalances(): Observable<FeeBalance[]> {
    return this.http.get<FeeBalance[]>(`${this.baseUrl}/finance/fee-balances/`);
  }

  // ─── Finance: Fee Structure ─────────────────────────────────────
  getFeeStructure(): Observable<FeeStructureResponse> {
    return this.http.get<FeeStructureResponse>(`${this.baseUrl}/finance/fee-structure/`);
  }

  getSchoolInfo(): Observable<SchoolInfo> {
    return this.http.get<SchoolInfo>(`${this.baseUrl}/finance/school-info/`);
  }

  downloadFeeStructurePdf(): Observable<FeeStructurePdfResponse> {
    return this.http.get<FeeStructurePdfResponse>(`${this.baseUrl}/finance/fee-structure/generate-pdf/`);
  }

  // ─── Finance: Fee Statement (consolidated) ──────────────────────
  getFeeStatement(): Observable<FeeStatementResponse> {
    return this.http.get<FeeStatementResponse>(`${this.baseUrl}/finance/fee-statement/`);
  }

  // ─── Finance: M-Pesa STK Push ───────────────────────────────────
  initiateMpesaPayment(payload: StkPushRequest): Observable<StkPushResponse> {
    return this.http.post<StkPushResponse>(`${this.baseUrl}/finance/payments/stk-push/`, payload);
  }

  // ─── Finance: Parent Wallet ────────────────────────────────────
  getWallet(): Observable<WalletResponse> {
    return this.http.get<WalletResponse>(`${this.baseUrl}/finance/parent/wallet/`);
  }

  // ─── Finance: Parent Receipts ──────────────────────────────────
  getReceipts(): Observable<ReceiptsResponse> {
    return this.http.get<ReceiptsResponse>(`${this.baseUrl}/finance/parent/receipts/`);
  }

  // ─── Finance: Parent Payment History (paginated) ───────────────
  getPaymentHistory(url?: string): Observable<PaymentHistoryResponse> {
    if (url) return this.http.get<PaymentHistoryResponse>(url);
    return this.http.get<PaymentHistoryResponse>(`${this.baseUrl}/finance/parent/payments/`);
  }

  // ─── Announcements ───────────────────────────────────────────────
  getAnnouncements(): Observable<Announcement[]> {
    return this.http.get<any>(`${this.baseUrl}/lms/announcements/`).pipe(
      map(res => res.results ? res.results : res)
    );
  }

  // ─── Transport ───────────────────────────────────────────────────
  getDailyTrips(): Observable<Trip[]> {
    return this.http.get<any>(`${this.baseUrl}/transport/daily-trips/`).pipe(
      map(res => res.results ? res.results : res)
    );
  }

  getManifests(): Observable<Manifest[]> {
    return this.http.get<any>(`${this.baseUrl}/transport/manifests/`).pipe(
      map(res => res.results ? res.results : res)
    );
  }

  getTransportRoutes(): Observable<TransportRoute[]> {
    return this.http.get<TransportRoute[]>(`${this.baseUrl}/transport/routes/`);
  }

  getFleetTelemetry(): Observable<FleetTelemetry[]> {
    return this.http.get<FleetTelemetry[]>(`${this.baseUrl}/transport/telemetry/`);
  }

  getMyLiveTracking(): Observable<FleetTelemetry[]> {
    return this.http.get<FleetTelemetry[]>(`${this.baseUrl}/transport/daily-trips/live_tracking/`);
  }

  // Legacy method for backward compatibility
  getTrips(): Observable<Trip[]> {
    return this.getDailyTrips();
  }

}
