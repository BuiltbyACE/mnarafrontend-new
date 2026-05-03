/**
 * Staff & HR Service
 * Manages faculty and support staff
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { getApiUrl } from '@sms/core/config';
import { Faculty, StaffProfile, StaffFormData } from '../../../shared/models/staff.models';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface PayrollSummary {
  current_month_total_kes: number;
  payrolls_pending_approval: number;
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
   * Get payroll summary
   */
  getPayrollSummary(): Observable<PayrollSummary> {
    return this.http.get<PayrollSummary>(getApiUrl('/payroll/summary/'));
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
    this.getPayrollSummary().subscribe({
      next: (summary) => this.payrollSummary.set(summary),
      error: () => this.payrollSummary.set(null),
    });
  }
}
