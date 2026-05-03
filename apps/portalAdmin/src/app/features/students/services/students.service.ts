/**
 * Students & Admissions Service
 * Manages student admissions and records
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError, of } from 'rxjs';
import { getApiUrl } from '@sms/core/config';
import { Admission, StudentDetail, AdmissionRequest } from '../../../shared/models/students.models';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface AdmissionsSummary {
  pending_review_count: number;
  waitlisted_count: number;
}

@Injectable({
  providedIn: 'root',
})
export class StudentsService {
  private http = inject(HttpClient);

  readonly admissions = signal<Admission[]>([]);
  readonly totalCount = signal<number>(0);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly admissionsSummary = signal<AdmissionsSummary | null>(null);

  getAdmissions(
    page: number = 1,
    pageSize: number = 25,
    filters?: { status?: string; year_level?: number }
  ): Observable<PaginatedResponse<Admission>> {
    this.isLoading.set(true);
    this.error.set(null);

    let params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());

    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.year_level) {
      params = params.set('year_level', filters.year_level.toString());
    }

    return this.http
      .get<PaginatedResponse<Admission>>(getApiUrl('/students/admissions/'), { params })
      .pipe(
        catchError((err) => {
          const message = err.error?.message || 'Failed to load admissions';
          this.error.set(message);
          this.isLoading.set(false);
          return throwError(() => new Error(message));
        })
      );
  }

  getAdmission(id: number): Observable<Admission> {
    return this.http.get<Admission>(getApiUrl(`/students/admissions/${id}/`));
  }

  createAdmission(data: AdmissionRequest): Observable<Admission> {
    return this.http.post<Admission>(getApiUrl('/students/admissions/'), data);
  }

  updateAdmissionStatus(id: number, status: string, notes?: string): Observable<Admission> {
    return this.http.patch<Admission>(getApiUrl(`/students/admissions/${id}/`), { status, notes });
  }

  getStudentDetail(studentId: number): Observable<StudentDetail> {
    return this.http.get<StudentDetail>(getApiUrl(`/students/${studentId}/`));
  }

  getAdmissionsSummary(): Observable<AdmissionsSummary> {
    return this.http.get<AdmissionsSummary>(getApiUrl('/students/admissions/summary/')).pipe(
      catchError((err) => {
        // Safe stub - return empty data while backend implements endpoint
        if (err.status === 404) {
          console.warn('Admissions summary endpoint not implemented yet, returning empty data');
          return of({
            pending_review_count: 0,
            waitlisted_count: 0
          });
        }
        return throwError(() => new Error('Failed to load admissions summary'));
      })
    );
  }

  setAdmissions(data: Admission[], total: number): void {
    this.admissions.set(data);
    this.totalCount.set(total);
    this.isLoading.set(false);
  }

  loadAdmissionsSummary(): void {
    this.getAdmissionsSummary().subscribe({
      next: (summary) => this.admissionsSummary.set(summary),
      error: () => this.admissionsSummary.set(null),
    });
  }
}
