import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map, catchError, throwError } from 'rxjs';
import { getApiUrl } from '@sms/core/config';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ExamSeries {
  id: number;
  name: string;
  academic_term: { id: number; name: string };
  exam_type: string;
  start_date: string;
  end_date: string;
  status?: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'LOCKED';
  is_published?: boolean;
  is_locked?: boolean;
  grading_scale: string;
}

export interface ExamComponent {
  id: number;
  name: string;
  exam_series: { id: number; name: string };
  max_score: number;
  weight: number;
  component_type: string;
}

export interface ExamResult {
  id: number;
  exam_component: { id: number; name: string };
  student: { id: number; first_name: string; last_name: string };
  score: number;
  grade: string;
  remarks: string;
}

export interface ReportCard {
  id: number;
  student: { id: number; first_name: string; last_name: string };
  academic_term: { id: number; name: string };
  total_score: number;
  average: number;
  grade: string;
  rank: number;
  status: 'DRAFT' | 'PUBLISHED' | 'WITHHELD';
}

@Injectable({ providedIn: 'root' })
export class ExaminationsService {
  private http = inject(HttpClient);
  private baseUrl = getApiUrl('/lms/');

  isLoading = signal(false);
  error = signal<string | null>(null);

  examSeries = signal<ExamSeries[]>([]);
  examComponents = signal<ExamComponent[]>([]);
  examResults = signal<ExamResult[]>([]);
  reportCards = signal<ReportCard[]>([]);

  // Exam Series CRUD
  getExamSeries(): Observable<ExamSeries[]> {
    this.isLoading.set(true);
    return this.http.get<PaginatedResponse<ExamSeries>>(`${this.baseUrl}exam-series/`).pipe(
      map(res => res.results || []),
      tap(data => {
        this.examSeries.set(data);
        this.isLoading.set(false);
        this.error.set(null);
      }),
      catchError(err => this.handleError('Failed to load exam series', err))
    );
  }

  createExamSeries(data: Omit<ExamSeries, 'id'>): Observable<ExamSeries> {
    return this.http.post<ExamSeries>(`${this.baseUrl}exam-series/`, data).pipe(
      tap(newItem => this.examSeries.update(items => [...items, newItem])),
      catchError(err => this.handleError('Failed to create exam series', err))
    );
  }

  updateExamSeries(id: number, data: Partial<ExamSeries>): Observable<ExamSeries> {
    return this.http.put<ExamSeries>(`${this.baseUrl}exam-series/${id}/`, data).pipe(
      tap(updated => this.examSeries.update(items =>
        items.map(item => item.id === id ? updated : item)
      )),
      catchError(err => this.handleError('Failed to update exam series', err))
    );
  }

  deleteExamSeries(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}exam-series/${id}/`).pipe(
      tap(() => this.examSeries.update(items => items.filter(item => item.id !== id))),
      catchError(err => this.handleError('Failed to delete exam series', err))
    );
  }

  // Exam Components CRUD
  getExamComponents(): Observable<ExamComponent[]> {
    this.isLoading.set(true);
    return this.http.get<PaginatedResponse<ExamComponent>>(`${this.baseUrl}exam-components/`).pipe(
      map(res => res.results || []),
      tap(data => {
        this.examComponents.set(data);
        this.isLoading.set(false);
        this.error.set(null);
      }),
      catchError(err => this.handleError('Failed to load exam components', err))
    );
  }

  createExamComponent(data: Omit<ExamComponent, 'id'>): Observable<ExamComponent> {
    return this.http.post<ExamComponent>(`${this.baseUrl}exam-components/`, data).pipe(
      tap(newItem => this.examComponents.update(items => [...items, newItem])),
      catchError(err => this.handleError('Failed to create exam component', err))
    );
  }

  updateExamComponent(id: number, data: Partial<ExamComponent>): Observable<ExamComponent> {
    return this.http.put<ExamComponent>(`${this.baseUrl}exam-components/${id}/`, data).pipe(
      tap(updated => this.examComponents.update(items =>
        items.map(item => item.id === id ? updated : item)
      )),
      catchError(err => this.handleError('Failed to update exam component', err))
    );
  }

  deleteExamComponent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}exam-components/${id}/`).pipe(
      tap(() => this.examComponents.update(items => items.filter(item => item.id !== id))),
      catchError(err => this.handleError('Failed to delete exam component', err))
    );
  }

  // Exam Results CRUD
  getExamResults(): Observable<ExamResult[]> {
    this.isLoading.set(true);
    return this.http.get<PaginatedResponse<ExamResult>>(`${this.baseUrl}exam-results/`).pipe(
      map(res => res.results || []),
      tap(data => {
        this.examResults.set(data);
        this.isLoading.set(false);
        this.error.set(null);
      }),
      catchError(err => this.handleError('Failed to load exam results', err))
    );
  }

  createExamResult(data: Omit<ExamResult, 'id'>): Observable<ExamResult> {
    return this.http.post<ExamResult>(`${this.baseUrl}exam-results/`, data).pipe(
      tap(newItem => this.examResults.update(items => [...items, newItem])),
      catchError(err => this.handleError('Failed to create exam result', err))
    );
  }

  updateExamResult(id: number, data: Partial<ExamResult>): Observable<ExamResult> {
    return this.http.put<ExamResult>(`${this.baseUrl}exam-results/${id}/`, data).pipe(
      tap(updated => this.examResults.update(items =>
        items.map(item => item.id === id ? updated : item)
      )),
      catchError(err => this.handleError('Failed to update exam result', err))
    );
  }

  deleteExamResult(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}exam-results/${id}/`).pipe(
      tap(() => this.examResults.update(items => items.filter(item => item.id !== id))),
      catchError(err => this.handleError('Failed to delete exam result', err))
    );
  }

  // Report Cards CRUD
  getReportCards(): Observable<ReportCard[]> {
    this.isLoading.set(true);
    return this.http.get<PaginatedResponse<ReportCard>>(`${this.baseUrl}report-cards/`).pipe(
      map(res => res.results || []),
      tap(data => {
        this.reportCards.set(data);
        this.isLoading.set(false);
        this.error.set(null);
      }),
      catchError(err => this.handleError('Failed to load report cards', err))
    );
  }

  createReportCard(data: Omit<ReportCard, 'id'>): Observable<ReportCard> {
    return this.http.post<ReportCard>(`${this.baseUrl}report-cards/`, data).pipe(
      tap(newItem => this.reportCards.update(items => [...items, newItem])),
      catchError(err => this.handleError('Failed to create report card', err))
    );
  }

  updateReportCard(id: number, data: Partial<ReportCard>): Observable<ReportCard> {
    return this.http.put<ReportCard>(`${this.baseUrl}report-cards/${id}/`, data).pipe(
      tap(updated => this.reportCards.update(items =>
        items.map(item => item.id === id ? updated : item)
      )),
      catchError(err => this.handleError('Failed to update report card', err))
    );
  }

  deleteReportCard(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}report-cards/${id}/`).pipe(
      tap(() => this.reportCards.update(items => items.filter(item => item.id !== id))),
      catchError(err => this.handleError('Failed to delete report card', err))
    );
  }

  private handleError(message: string, err: any): Observable<never> {
    this.isLoading.set(false);
    this.error.set(message);
    return throwError(() => err);
  }
}
