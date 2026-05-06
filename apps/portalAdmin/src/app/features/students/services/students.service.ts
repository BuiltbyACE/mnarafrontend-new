/**
 * Students & Admissions Service
 * Manages student admissions and records
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError, of, map } from 'rxjs';
import { getApiUrl } from '@sms/core/config';
import { Admission, StudentDetail, AdmissionRequest, StudentProfile, StudentCategory, StudentHouse } from '../../../shared/models/students.models';

export interface PaginatedResponse<T> {
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
    page = 1,
    pageSize = 25,
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

  getProfiles(
    page = 1,
    pageSize = 25,
    filters?: { status?: string; year_level?: number; search?: string }
  ): Observable<PaginatedResponse<StudentProfile>> {
    this.isLoading.set(true);
    this.error.set(null);

    let params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());

    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.year_level) params = params.set('year_level', filters.year_level.toString());
    if (filters?.search) params = params.set('search', filters.search);

    return this.http
      .get<PaginatedResponse<StudentProfile>>(getApiUrl('/students/profiles/'), { params })
      .pipe(
        catchError((err) => {
          const message = err.error?.message || 'Failed to load student profiles';
          this.error.set(message);
          this.isLoading.set(false);
          return throwError(() => new Error(message));
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

  getStudentsForPromotion(filters: { academicYearId: string; classId: string }): Observable<PaginatedResponse<StudentProfile>> {
    let params = new HttpParams()
      .set('academic_year', filters.academicYearId)
      .set('classroom', filters.classId);
    return this.http
      .get<PaginatedResponse<StudentProfile>>(getApiUrl('/students/profiles/'), { params })
      .pipe(
        catchError((err) => {
          const message = err.error?.message || 'Failed to load students for promotion';
          this.error.set(message);
          return throwError(() => new Error(message));
        })
      );
  }

  promoteStudents(payload: { student_id: number; next_class_id: string; course_stream_id: string }[], academicYearId: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      getApiUrl('/academics/students/bulk-promote/'),
      { students: payload, academic_year: academicYearId }
    ).pipe(
      catchError((err) => {
        return throwError(() => new Error(err.error?.message || 'Failed to promote students'));
      })
    );
  }

  getCategories(): Observable<PaginatedResponse<StudentCategory>> {
    return this.http.get<PaginatedResponse<StudentCategory>>(getApiUrl('/students/categories/')).pipe(
      catchError((err) => throwError(() => new Error(err.error?.message || 'Failed to load categories')))
    );
  }

  createCategory(data: Omit<StudentCategory, 'id' | 'student_count'>): Observable<StudentCategory> {
    return this.http.post<StudentCategory>(getApiUrl('/students/categories/'), data).pipe(
      catchError((err) => throwError(() => new Error(err.error?.message || 'Failed to create category')))
    );
  }

  updateCategory(id: string, data: Partial<Omit<StudentCategory, 'id' | 'student_count'>>): Observable<StudentCategory> {
    return this.http.patch<StudentCategory>(getApiUrl(`/students/categories/${id}/`), data).pipe(
      catchError((err) => throwError(() => new Error(err.error?.message || 'Failed to update category')))
    );
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(getApiUrl(`/students/categories/${id}/`)).pipe(
      catchError((err) => throwError(() => new Error(err.error?.message || 'Failed to delete category')))
    );
  }

  getStudentsByHouse(houseId: string): Observable<PaginatedResponse<StudentProfile>> {
    return this.http.get<PaginatedResponse<StudentProfile>>(getApiUrl(`/students/houses/${houseId}/students/`)).pipe(
      catchError((err) => throwError(() => new Error(err.error?.message || 'Failed to load students')))
    );
  }

  removeStudentFromHouse(studentId: string): Observable<StudentProfile> {
    return this.http.patch<StudentProfile>(getApiUrl(`/students/profiles/${studentId}/`), { house_id: null }).pipe(
      catchError((err) => throwError(() => new Error(err.error?.message || 'Failed to remove student from house')))
    );
  }

  getHouses(): Observable<PaginatedResponse<StudentHouse>> {
    return this.http.get<PaginatedResponse<StudentHouse>>(getApiUrl('/students/houses/')).pipe(
      catchError((err) => throwError(() => new Error(err.error?.message || 'Failed to load houses')))
    );
  }

  createHouse(data: Omit<StudentHouse, 'id' | 'student_count'>): Observable<StudentHouse> {
    return this.http.post<StudentHouse>(getApiUrl('/students/houses/'), data).pipe(
      catchError((err) => throwError(() => new Error(err.error?.message || 'Failed to create house')))
    );
  }

  updateHouse(id: string, data: Partial<Omit<StudentHouse, 'id' | 'student_count'>>): Observable<StudentHouse> {
    return this.http.patch<StudentHouse>(getApiUrl(`/students/houses/${id}/`), data).pipe(
      catchError((err) => throwError(() => new Error(err.error?.message || 'Failed to update house')))
    );
  }

  deleteHouse(id: string): Observable<void> {
    return this.http.delete<void>(getApiUrl(`/students/houses/${id}/`)).pipe(
      catchError((err) => throwError(() => new Error(err.error?.message || 'Failed to delete house')))
    );
  }

  getUnassignedStudents(): Observable<PaginatedResponse<StudentProfile>> {
    return this.http.get<PaginatedResponse<StudentProfile>>(getApiUrl('/students/profiles/unassigned_house/')).pipe(
      catchError((err) => throwError(() => new Error(err.error?.message || 'Failed to load unassigned students')))
    );
  }

  assignHouse(studentId: string, houseId: string): Observable<StudentProfile> {
    return this.http.patch<StudentProfile>(getApiUrl(`/students/profiles/${studentId}/`), { house_id: houseId }).pipe(
      catchError((err) => throwError(() => new Error(err.error?.message || 'Failed to assign student to house')))
    );
  }
}
