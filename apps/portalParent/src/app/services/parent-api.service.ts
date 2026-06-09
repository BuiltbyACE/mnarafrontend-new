import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@sms/core/config';
import {
  DashboardSummary,
  TimetableEntry,
  ExamResultEntry,
  StudentInvoice,
  Transaction,
  FeeBalance,
  FeeStructureResponse,
  SchoolInfo,
  Announcement,
  Trip,
  Manifest,
  TransportRoute,
  FleetTelemetry,
} from '../models/parent.models';

@Injectable({ providedIn: 'root' })
export class ParentApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

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

  // ─── Exam Results ────────────────────────────────────────────────
  getExamResults(params?: { student?: number }): Observable<ExamResultEntry[]> {
    let p = new HttpParams();
    if (params?.student) p = p.set('student', params.student);
    return this.http.get<ExamResultEntry[]>(`${this.baseUrl}/lms/exam-results/`, { params: p });
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

  downloadFeeStructurePdf(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/finance/fee-structure/generate-pdf/`, { responseType: 'blob' });
  }

  // ─── Announcements ───────────────────────────────────────────────
  getAnnouncements(): Observable<Announcement[]> {
    return this.http.get<Announcement[]>(`${this.baseUrl}/lms/announcements/`);
  }

  // ─── Transport ───────────────────────────────────────────────────
  getTrips(): Observable<Trip[]> {
    return this.http.get<Trip[]>(`${this.baseUrl}/transport/trips/`);
  }

  getManifests(): Observable<Manifest[]> {
    return this.http.get<Manifest[]>(`${this.baseUrl}/transport/manifests/`);
  }

  getTransportRoutes(): Observable<TransportRoute[]> {
    return this.http.get<TransportRoute[]>(`${this.baseUrl}/transport/routes/`);
  }

  getFleetTelemetry(): Observable<FleetTelemetry[]> {
    return this.http.get<FleetTelemetry[]>(`${this.baseUrl}/transport/telemetry/`);
  }

}
