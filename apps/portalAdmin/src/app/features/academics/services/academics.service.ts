/**
 * Academics Service
 * Manages classrooms, year levels, and student promotion
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { getApiUrl } from '@sms/core/config';
import { Classroom, ClassroomWritePayload, BulkPromotionRequest, YearLevel } from '../../../shared/models/academics.models';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

@Injectable({
  providedIn: 'root',
})
export class AcademicsService {
  private http = inject(HttpClient);

  // Signals for state management
  readonly classrooms = signal<Classroom[]>([]);
  readonly totalCount = signal<number>(0);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  /**
   * Fetch classrooms with pagination and filtering
   */
  getClassrooms(
    page: number = 1,
    pageSize: number = 25,
    filters?: { year_level?: number; is_active?: boolean }
  ): Observable<PaginatedResponse<Classroom>> {
    this.isLoading.set(true);
    this.error.set(null);

    let params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());

    if (filters?.year_level) {
      params = params.set('year_level', filters.year_level.toString());
    }
    if (filters?.is_active !== undefined) {
      params = params.set('is_active', filters.is_active.toString());
    }

    return this.http
      .get<PaginatedResponse<Classroom>>(getApiUrl('/academics/classrooms/'), { params })
      .pipe(
        catchError((err) => {
          const message = err.error?.message || 'Failed to load classrooms';
          this.error.set(message);
          this.isLoading.set(false);
          return throwError(() => new Error(message));
        })
      );
  }

  /**
   * Get single classroom by ID
   */
  getClassroom(id: number): Observable<Classroom> {
    return this.http.get<Classroom>(getApiUrl(`/academics/classrooms/${id}/`));
  }

  /**
   * Create new classroom
   */
  createClassroom(data: ClassroomWritePayload): Observable<Classroom> {
    return this.http.post<Classroom>(getApiUrl('/academics/classrooms/'), data);
  }

  /**
   * Update classroom
   */
  updateClassroom(id: number, data: ClassroomWritePayload): Observable<Classroom> {
    return this.http.patch<Classroom>(getApiUrl(`/academics/classrooms/${id}/`), data);
  }

  /**
   * Archive classroom — PATCH {is_active: false} per immutability protocol
   */
  archiveClassroom(id: number): Observable<Classroom> {
    return this.http.patch<Classroom>(getApiUrl(`/academics/classrooms/${id}/`), {
      is_active: false,
    });
  }

  /**
   * Get year levels
   */
  getYearLevels(): Observable<YearLevel[]> {
    return this.http.get<YearLevel[]>(getApiUrl('/academics/year-levels/'));
  }

  /**
   * Bulk promote students
   */
  bulkPromote(request: BulkPromotionRequest): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      getApiUrl('/academics/students/bulk-promote/'),
      request
    );
  }

  /**
   * Set classrooms data in signal
   */
  setClassrooms(data: Classroom[], total: number): void {
    this.classrooms.set(data);
    this.totalCount.set(total);
    this.isLoading.set(false);
  }
}
