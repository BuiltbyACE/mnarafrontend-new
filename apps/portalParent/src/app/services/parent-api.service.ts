import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@sms/core/config';
import {
  DashboardSummary,
  SiblingProfile,
  TimetableEntry,
  ExamResultEntry,
  StudentInvoice,
  Transaction,
  FeeBalance,
  BehaviourRecord,
  BehaviourStats,
  BehaviourCommitment,
  CommitmentCreateRequest,
  AppNotification,
  UnreadCount,
  Announcement,
  Trip,
  Manifest,
  AttendanceRecord,
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

  // ─── Students / Profiles ─────────────────────────────────────────
  getStudentProfiles(): Observable<{results: SiblingProfile[]}> {
    return this.http.get<{results: SiblingProfile[]}>(`${this.baseUrl}/students/profiles/`);
  }

  getStudentProfile(id: number): Observable<SiblingProfile> {
    return this.http.get<SiblingProfile>(`${this.baseUrl}/students/profiles/${id}/`);
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

  // ─── Behaviour Records ───────────────────────────────────────────
  getBehaviourRecords(params?: { student?: number; type?: string }): Observable<BehaviourRecord[]> {
    let p = new HttpParams();
    if (params?.student) p = p.set('student', params.student);
    if (params?.type) p = p.set('type', params.type);
    return this.http.get<BehaviourRecord[]>(`${this.baseUrl}/students/behaviour-records/`, { params: p });
  }

  getBehaviourRecord(id: number): Observable<BehaviourRecord> {
    return this.http.get<BehaviourRecord>(`${this.baseUrl}/students/behaviour-records/${id}/`);
  }

  getBehaviourStats(): Observable<BehaviourStats> {
    return this.http.get<BehaviourStats>(`${this.baseUrl}/students/behaviour-records/stats/`);
  }

  // ─── Behaviour Commitments ───────────────────────────────────────
  getBehaviourCommitments(): Observable<BehaviourCommitment[]> {
    return this.http.get<BehaviourCommitment[]>(`${this.baseUrl}/students/behaviour-commitments/`);
  }

  getBehaviourCommitment(id: number): Observable<BehaviourCommitment> {
    return this.http.get<BehaviourCommitment>(`${this.baseUrl}/students/behaviour-commitments/${id}/`);
  }

  createBehaviourCommitment(data: CommitmentCreateRequest): Observable<BehaviourCommitment> {
    return this.http.post<BehaviourCommitment>(`${this.baseUrl}/students/behaviour-commitments/`, data);
  }

  updateBehaviourCommitment(id: number, data: Partial<CommitmentCreateRequest>): Observable<BehaviourCommitment> {
    return this.http.put<BehaviourCommitment>(`${this.baseUrl}/students/behaviour-commitments/${id}/`, data);
  }

  deleteBehaviourCommitment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/students/behaviour-commitments/${id}/`);
  }

  // ─── Notifications ───────────────────────────────────────────────
  getNotifications(): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(`${this.baseUrl}/notifications/`);
  }

  markNotificationRead(id: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/notifications/${id}/read/`, {});
  }

  markAllNotificationsRead(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/notifications/read-all/`, {});
  }

  getUnreadCount(): Observable<UnreadCount> {
    return this.http.get<UnreadCount>(`${this.baseUrl}/notifications/unread-count/`);
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

  // ─── Attendance ──────────────────────────────────────────────────
  getAttendanceRecords(params?: { student?: number }): Observable<AttendanceRecord[]> {
    let p = new HttpParams();
    if (params?.student) p = p.set('student', params.student);
    return this.http.get<AttendanceRecord[]>(`${this.baseUrl}/students/attendance/`, { params: p });
  }
}
