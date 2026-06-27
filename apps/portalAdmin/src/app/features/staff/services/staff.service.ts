import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError, finalize, map } from 'rxjs';
import { getApiUrl } from '@sms/core/config';
import {
  Faculty, StaffProfile, StaffFormData, LeaveRequest, LeaveBalance,
  StaffProfileMe, StaffDetailResponse, DirectoryResponse, DirectorySummary,
  PayrollSummary, MyRolesResponse, StaffSettings
} from '../../../shared/models/staff.models';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

@Injectable({ providedIn: 'root' })
export class StaffService {
  private http = inject(HttpClient);

  // Signals for state management
  readonly staff = signal<Faculty[]>([]);
  readonly totalCount = signal<number>(0);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly payrollSummary = signal<PayrollSummary | null>(null);
  readonly payrollError = signal<string | null>(null);

  // Directory state
  readonly directory = signal<DirectoryResponse | null>(null);
  readonly directorySummary = signal<DirectorySummary | null>(null);

  // Leave management state
  readonly leaveRequests = signal<LeaveRequest[]>([]);
  readonly leaveBalances = signal<LeaveBalance[]>([]);
  readonly isLeaveLoading = signal<boolean>(false);
  readonly leaveError = signal<string | null>(null);

  // ═══════════════════════════════════════════════════════════════
  // DIRECTORY
  // ═══════════════════════════════════════════════════════════════

  getDirectory(): Observable<DirectoryResponse> {
    return this.http.get<DirectoryResponse>(getApiUrl('/staff/directory/'));
  }

  getDirectoryById(id: number): Observable<StaffDetailResponse> {
    return this.http.get<StaffDetailResponse>(getApiUrl(`/staff/directory/${id}/`));
  }

  getDirectorySummary(): Observable<DirectorySummary> {
    return this.http.get<DirectorySummary>(getApiUrl('/staff/directory/summary/'));
  }

  loadDirectory(): void {
    this.getDirectory().subscribe({
      next: (data) => this.directory.set(data),
    });
  }

  loadDirectorySummary(): void {
    this.getDirectorySummary().subscribe({
      next: (data) => this.directorySummary.set(data),
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // FACULTY
  // ═══════════════════════════════════════════════════════════════

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

  getFacultyById(id: number): Observable<Faculty> {
    return this.http.get<Faculty>(getApiUrl(`/staff/faculty/${id}/`));
  }

  createFaculty(data: StaffFormData): Observable<Faculty> {
    return this.http.post<Faculty>(getApiUrl('/staff/faculty/'), data);
  }

  updateFaculty(id: number, data: Partial<StaffFormData>): Observable<Faculty> {
    return this.http.patch<Faculty>(getApiUrl(`/staff/faculty/${id}/`), data);
  }

  deactivateFaculty(id: number): Observable<Faculty> {
    return this.http.patch<Faculty>(getApiUrl(`/staff/faculty/${id}/`), {
      is_active: false,
    });
  }

  getStaffProfile(staffId: number): Observable<StaffProfile> {
    return this.http.get<StaffProfile>(getApiUrl(`/staff/${staffId}/`));
  }

  getProfilesSelect(subjectId?: number): Observable<{ id: number; full_name: string }[]> {
    let url = getApiUrl('/staff/profiles/select/');
    if (subjectId) {
      url += `?subject_id=${subjectId}`;
    }
    return this.http.get<{ id: number; full_name: string }[]>(url);
  }

  getProfileMe(): Observable<StaffProfileMe> {
    return this.http.get<StaffProfileMe>(getApiUrl('/staff/profiles/me/'));
  }

  setStaff(data: Faculty[], total: number): void {
    this.staff.set(data);
    this.totalCount.set(total);
    this.isLoading.set(false);
  }

  // ═══════════════════════════════════════════════════════════════
  // PAYROLL
  // ═══════════════════════════════════════════════════════════════

  getPayrollSummary(): Observable<PayrollSummary> {
    return this.http
      .get<PayrollSummary>(getApiUrl('/staff/summary/'))
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

  // ═══════════════════════════════════════════════════════════════
  // MY DATA (current user)
  // ═══════════════════════════════════════════════════════════════

  getMyAssignments(): Observable<any[]> {
    return this.http.get<any[]>(getApiUrl('/staff/my-assignments/'));
  }

  getMyRoles(): Observable<MyRolesResponse> {
    return this.http.get<MyRolesResponse>(getApiUrl('/staff/my-roles/'));
  }

  // ═══════════════════════════════════════════════════════════════
  // ACADEMICS LOOKUPS (for Add Staff form)
  // ═══════════════════════════════════════════════════════════════

  getDepartments(): Observable<any[]> {
    return this.http.get<any[]>(getApiUrl('/academics/departments/'));
  }

  getSubjects(): Observable<any[]> {
    return this.http.get<any[]>(getApiUrl('/academics/subjects/'));
  }

  // ═══════════════════════════════════════════════════════════════
  // SETTINGS
  // ═══════════════════════════════════════════════════════════════

  getSettings(): Observable<StaffSettings> {
    return this.http.get<StaffSettings>(getApiUrl('/staff/settings/'));
  }

  updateSettings(data: Partial<StaffSettings>): Observable<StaffSettings> {
    return this.http.patch<StaffSettings>(getApiUrl('/staff/settings/'), data);
  }
}
