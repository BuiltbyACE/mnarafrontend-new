/**
 * Staff & HR Service
 * Manages faculty and support staff
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError, finalize } from 'rxjs';
import { getApiUrl } from '@sms/core/config';
import { Faculty, StaffProfile, StaffFormData, LeaveRequest, LeaveBalance } from '../../../shared/models/staff.models';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface DepartmentBreakdown {
  name: string;
  count: number;
  payroll: number;
}

interface PayrollSummary {
  total_staff: number;
  total_payroll: number;
  departments: number;
  on_leave: number;
  department_breakdown: DepartmentBreakdown[];
  employees: any[];
}

@Injectable({
  providedIn: 'root',
})
export class StaffService {
  private http = inject(HttpClient);

  // Signals for state management
  readonly staff = signal<Faculty[]>([]);
  readonly totalCount = signal<number>(0);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly payrollSummary = signal<PayrollSummary | null>(null);
  readonly payrollError = signal<string | null>(null);

  // Leave management state
  readonly leaveRequests = signal<LeaveRequest[]>([]);
  readonly leaveBalances = signal<LeaveBalance[]>([]);
  readonly isLeaveLoading = signal<boolean>(false);
  readonly leaveError = signal<string | null>(null);

  /**
   * Fetch faculty list with pagination
   */
  getFaculty(
    page: number = 1,
    pageSize: number = 25,
    filters?: { employment_type?: string; is_active?: boolean }
  ): Observable<PaginatedResponse<Faculty>> {
    this.isLoading.set(true);
    this.error.set(null);

    let params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());

    if (filters?.employment_type) {
      params = params.set('employment_type', filters.employment_type);
    }
    if (filters?.is_active !== undefined) {
      params = params.set('is_active', filters.is_active.toString());
    }

    return this.http
      .get<PaginatedResponse<Faculty>>(getApiUrl('/staff/faculty/'), { params })
      .pipe(
        catchError((err) => {
          const message = err.error?.message || 'Failed to load faculty';
          this.error.set(message);
          this.isLoading.set(false);
          return throwError(() => new Error(message));
        })
      );
  }

  /**
   * Get single faculty member
   */
  getFacultyById(id: number): Observable<Faculty> {
    return this.http.get<Faculty>(getApiUrl(`/staff/faculty/${id}/`));
  }

  /**
   * Create new faculty member
   */
  createFaculty(data: StaffFormData): Observable<Faculty> {
    return this.http.post<Faculty>(getApiUrl('/staff/faculty/'), data);
  }

  /**
   * Update faculty member
   */
  updateFaculty(id: number, data: Partial<StaffFormData>): Observable<Faculty> {
    return this.http.patch<Faculty>(getApiUrl(`/staff/faculty/${id}/`), data);
  }

  /**
   * Deactivate faculty member
   */
  deactivateFaculty(id: number): Observable<Faculty> {
    return this.http.patch<Faculty>(getApiUrl(`/staff/faculty/${id}/`), {
      is_active: false,
    });
  }

  /**
   * Get staff profile (detailed)
   */
  getStaffProfile(staffId: number): Observable<StaffProfile> {
    return this.http.get<StaffProfile>(getApiUrl(`/staff/${staffId}/`));
  }

  /**
   * Get payroll summary (with 403 defensive guard)
   */
  getPayrollSummary(): Observable<PayrollSummary> {
    return this.http
      .get<PayrollSummary>(getApiUrl('/payroll/summary/'))
      .pipe(
        catchError((err: HttpErrorResponse) => {
          const msg = err.status === 403
            ? 'Access denied: you do not have permission to view payroll data'
            : (err.error?.message || 'Failed to load payroll summary');
          this.payrollError.set(msg);
          return throwError(() => new Error(msg));
        })
      );
  }

  /**
   * Set staff data in signal
   */
  setStaff(data: Faculty[], total: number): void {
    this.staff.set(data);
    this.totalCount.set(total);
    this.isLoading.set(false);
  }

  /**
   * Load payroll summary
   */
  loadPayrollSummary(): void {
    this.payrollError.set(null);
    this.getPayrollSummary().subscribe({
      next: (summary) => this.payrollSummary.set(summary),
      error: () => this.payrollSummary.set(null),
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // HR RECORDS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Fetch all HR records (teaching + non-teaching staff) with pagination
   */
  getAllHrRecords(
    page: number = 1,
    pageSize: number = 25
  ): Observable<PaginatedResponse<Faculty>> {
    this.isLoading.set(true);
    this.error.set(null);

    const params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());

    return this.http
      .get<PaginatedResponse<Faculty>>(getApiUrl('/staff/hr-records/'), { params })
      .pipe(
        catchError((err) => {
          const message = err.error?.message || 'Failed to load staff records';
          this.error.set(message);
          this.isLoading.set(false);
          return throwError(() => new Error(message));
        })
      );
  }

  // ═══════════════════════════════════════════════════════════════
  // LEAVE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  /**
   * Fetch all leave requests (paginated)
   */
  getLeaveRequests(): Observable<PaginatedResponse<LeaveRequest>> {
    this.isLeaveLoading.set(true);
    this.leaveError.set(null);

    return this.http
      .get<PaginatedResponse<LeaveRequest>>(getApiUrl('/staff/leave-requests/'))
      .pipe(
        finalize(() => this.isLeaveLoading.set(false)),
        catchError((err) => {
          const message = err.error?.message || 'Failed to load leave requests';
          this.leaveError.set(message);
          return throwError(() => new Error(message));
        })
      );
  }

  /**
   * Fetch leave balances for all staff (paginated)
   */
  getLeaveBalances(): Observable<PaginatedResponse<LeaveBalance>> {
    this.isLeaveLoading.set(true);
    this.leaveError.set(null);

    return this.http
      .get<PaginatedResponse<LeaveBalance>>(getApiUrl('/staff/leave-balances/'))
      .pipe(
        finalize(() => this.isLeaveLoading.set(false)),
        catchError((err) => {
          const message = err.error?.message || 'Failed to load leave balances';
          this.leaveError.set(message);
          return throwError(() => new Error(message));
        })
      );
  }

  /**
   * Approve a leave request
   */
  approveLeave(id: number): Observable<LeaveRequest> {
    return this.http
      .patch<LeaveRequest>(getApiUrl(`/staff/leave-requests/${id}/approve/`), {})
      .pipe(
        catchError((err) => {
          const message = err.error?.message || 'Failed to approve leave request';
          return throwError(() => new Error(message));
        })
      );
  }

  /**
   * Reject a leave request
   */
  rejectLeave(id: number): Observable<LeaveRequest> {
    return this.http
      .patch<LeaveRequest>(getApiUrl(`/staff/leave-requests/${id}/reject/`), {})
      .pipe(
        catchError((err) => {
          const message = err.error?.message || 'Failed to reject leave request';
          return throwError(() => new Error(message));
        })
      );
  }
}
