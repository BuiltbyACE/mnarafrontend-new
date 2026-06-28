import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError, of, map, tap } from 'rxjs';
import { getApiUrl } from '@sms/core/config';

import { 
  Admission, 
  AdmissionRequest, 
  AdmissionRecord,
  AdmissionCreatePayload,
  AdmissionChoices,
  CreateStudentProfilePayload,
  BehaviourCommitment,
  BehaviourCommitmentPayload,
  StudentProfile, 
  StudentCategory, 
  StudentHouse,
  StudentEnrollment,
} from '../../../shared/models/students.models';

import { YearLevel } from '../../../shared/models/academics.models'; // <-- ENSURE THIS IS HERE


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
  private baseUrl = getApiUrl('/students/');

  // --- STATE SIGNALS ---
  readonly admissions = signal<Admission[]>([]);
  readonly totalCount = signal<number>(0);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly admissionsSummary = signal<AdmissionsSummary | null>(null);

  // --- ADMISSIONS ---

  getAdmissions(page = 1, pageSize = 25, filters?: { status?: string; year_level?: number }): Observable<PaginatedResponse<Admission>> {
    this.isLoading.set(true);
    let params = new HttpParams().set('page', page.toString()).set('page_size', pageSize.toString());
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.year_level) params = params.set('year_level', filters.year_level.toString());

    return this.http.get<PaginatedResponse<Admission>>(`${this.baseUrl}admissions/`, { params }).pipe(
      tap(res => {
        this.admissions.set(res.results || []);
        this.totalCount.set(res.count || 0);
        this.isLoading.set(false);
      }),
      catchError(err => this.handleError('Failed to load admissions', err))
    );
  }

  loadAdmissionsSummary(): void {
    this.http.get<AdmissionsSummary>(`${this.baseUrl}admissions/summary/`).pipe(
      catchError(err => err.status === 404 ? of({ pending_review_count: 0, waitlisted_count: 0 }) : throwError(() => err))
    ).subscribe(summary => this.admissionsSummary.set(summary));
  }

  getAdmission(id: number): Observable<Admission> {
    return this.http.get<Admission>(`${this.baseUrl}admissions/${id}/`);
  }

  updateAdmissionStatus(id: number, status: string, notes?: string): Observable<Admission> {
    return this.http.patch<Admission>(`${this.baseUrl}admissions/${id}/`, { status, notes });
  }

  // --- STUDENT PROFILES & DETAILS ---

  getStudentDetail(studentId: number): Observable<StudentProfile> {
    return this.http.get<StudentProfile>(`${this.baseUrl}profiles/${studentId}/`);
  }

  getProfiles(page = 1, pageSize = 25, filters?: { status?: string; year_level?: number; search?: string }): Observable<PaginatedResponse<StudentProfile>> {
    let params = new HttpParams().set('page', page.toString()).set('page_size', pageSize.toString());
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.year_level) params = params.set('year_level', filters.year_level.toString());
    if (filters?.search) params = params.set('search', filters.search);
    return this.http.get<PaginatedResponse<StudentProfile>>(`${this.baseUrl}profiles/`, { params });
  }

  // --- CATEGORIES MANAGEMENT ---

  getCategories(): Observable<PaginatedResponse<StudentCategory>> {
    return this.http.get<PaginatedResponse<StudentCategory>>(`${this.baseUrl}categories/`);
  }

  createCategory(data: any): Observable<StudentCategory> {
    return this.http.post<StudentCategory>(`${this.baseUrl}categories/`, data);
  }

  updateCategory(id: number | string, data: any): Observable<StudentCategory> {
    return this.http.patch<StudentCategory>(`${this.baseUrl}categories/${id}/`, data);
  }

  deleteCategory(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}categories/${id}/`);
  }

  // --- HOUSES & ASSIGNMENTS ---

  getHouses(): Observable<PaginatedResponse<StudentHouse>> {
    return this.http.get<PaginatedResponse<StudentHouse>>(`${this.baseUrl}houses/`);
  }

  getStudentsByHouse(houseId: string): Observable<PaginatedResponse<StudentProfile>> {
    return this.http.get<PaginatedResponse<StudentProfile>>(`${this.baseUrl}houses/${houseId}/students/`);
  }

  removeStudentFromHouse(studentId: string | number): Observable<StudentProfile> {
    return this.http.patch<StudentProfile>(`${this.baseUrl}profiles/${studentId}/`, { house_id: null });
  }

  getUnassignedStudents(): Observable<PaginatedResponse<StudentProfile>> {
    return this.http.get<PaginatedResponse<StudentProfile>>(`${this.baseUrl}profiles/unassigned_house/`);
  }

  assignHouse(studentId: string, houseId: string): Observable<StudentProfile> {
    return this.http.patch<StudentProfile>(`${this.baseUrl}profiles/${studentId}/`, { house_id: houseId });
  }

  // --- PROMOTIONS ---

  getStudentsForPromotion(filters: { academicYearId: string; classId: string }): Observable<PaginatedResponse<StudentProfile>> {
    let params = new HttpParams().set('academic_year', filters.academicYearId).set('classroom', filters.classId);
    return this.http.get<PaginatedResponse<StudentProfile>>(`${this.baseUrl}profiles/`, { params });
  }

  promoteStudents(payload: any, academicYearId: string): Observable<any> {
    return this.http.post(getApiUrl('/academics/students/bulk-promote/'), { students: payload, academic_year: academicYearId });
  }

  /**
   * Fetches Academic Years for the promotion dropdowns.
   * FIX: Changed path from academic-years to year-levels (matching backend)
   */
  // getAcademicYears(): Observable<any> {
  //   return this.http.get<any>(getApiUrl('/academics/year-levels/')).pipe(
  //     catchError(err => throwError(() => new Error('Academic years endpoint mismatch')))
  //   );
  // }


  /**
   * Fetches Year Levels (KG1, Year 1, etc.)
   * Changed from /academic-years/ to /year-levels/ to match backend
   */
  getAcademicYears(): Observable<YearLevel[]> {
    return this.http.get<PaginatedResponse<YearLevel>>(getApiUrl('/academics/year-levels/')).pipe(
      // CRITICAL: Extract the 'results' array from the paginated response
      map(response => response.results || []),
      catchError(err => throwError(() => new Error('Failed to load levels')))
    );
  }

  // --- ADMISSION WIZARD ---

  /** Fetch dropdown choices from the backend */
  getAdmissionChoices(): Observable<AdmissionChoices> {
    return this.http.get<AdmissionChoices>(`${this.baseUrl}admissions/choices/`).pipe(
      catchError(() => {
        // Fallback to empty if endpoint not yet available
        return of({});
      })
    );
  }

  /** Create a student profile first (returns ID used in admission) */
  createStudentProfile(data: CreateStudentProfilePayload): Observable<StudentProfile> {
    return this.http.post<StudentProfile>(`${this.baseUrl}profiles/`, data).pipe(
      catchError(err => this.handleError('Failed to create student profile', err))
    );
  }

  createAdmission(data: AdmissionCreatePayload): Observable<AdmissionRecord> {
    return this.http.post<AdmissionRecord>(`${this.baseUrl}admissions/`, data).pipe(
      catchError(err => this.handleError('Failed to create admission', err))
    );
  }

  getAdmissionDetail(id: number): Observable<AdmissionRecord> {
    return this.http.get<AdmissionRecord>(`${this.baseUrl}admissions/${id}/`);
  }

  // --- BEHAVIOUR COMMITMENT ---

  submitBehaviourCommitment(admissionId: number, data: BehaviourCommitmentPayload): Observable<BehaviourCommitment> {
    return this.http.post<BehaviourCommitment>(`${this.baseUrl}admissions/${admissionId}/submit-commitment/`, data).pipe(
      catchError(err => this.handleError('Failed to submit behaviour commitment', err))
    );
  }

  getBehaviourCommitments(admissionId: number): Observable<BehaviourCommitment[]> {
    return this.http.get<BehaviourCommitment[]>(`${this.baseUrl}admissions/${admissionId}/commitments/`).pipe(
      catchError(err => this.handleError('Failed to load behaviour commitments', err))
    );
  }

  updateBehaviourCommitment(id: number, data: Partial<BehaviourCommitmentPayload>): Observable<BehaviourCommitment> {
    return this.http.patch<BehaviourCommitment>(`${this.baseUrl}commitments/${id}/`, data).pipe(
      catchError(err => this.handleError('Failed to update behaviour commitment', err))
    );
  }

  // --- TRANSFER ---

  transferStudent(enrollmentId: number, data: { transfer_date: string; destination_school: string; transfer_reason?: string; notes?: string }): Observable<StudentEnrollment> {
    return this.http.post<StudentEnrollment>(`${this.baseUrl}enrollments/${enrollmentId}/transfer/`, data).pipe(
      catchError(err => this.handleError('Failed to transfer student', err))
    );
  }

  // --- UTILS ---

  private handleError(message: string, err: any): Observable<never> {
    this.isLoading.set(false);
    this.error.set(message);
    return throwError(() => new Error(message));
  }

  setAdmissions(data: Admission[], total: number): void {
    this.admissions.set(data);
    this.totalCount.set(total);
    this.isLoading.set(false);
  }
}