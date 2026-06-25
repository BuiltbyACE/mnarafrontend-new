import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, finalize } from 'rxjs';
import { getApiUrl } from '@sms/core/config';

export interface ExamSeries {
  id: number;
  term: number;
  term_name: string;
  name: string;
  start_date: string;
  end_date: string;
  term_weighting_percentage: number;
  is_published: boolean;
}

export interface ExamComponent {
  id: number;
  series: number;
  course: number;
  course_name: string;
  name: string;
  max_score: number;
}

export interface StudentExamResult {
  id: number;
  student: number;
  student_name: string;
  component: number;
  component_name: string;
  raw_score: number | null;
  computed_grade: string | null;
  teacher_comment: string;
}

export interface GradeBoundary {
  id: number;
  component: number;
  grade_label: string;
  minimum_score: number;
  remarks: string;
}

export interface GradeDistribution {
  distribution: { grade: string; count: number; percentage: number }[];
  subject_averages: { subject: string; average_score: number; class_rank: number }[];
}

@Injectable({ providedIn: 'root' })
export class ExamService {
  private http = inject(HttpClient);

  readonly examSeries = signal<ExamSeries[]>([]);
  readonly examComponents = signal<ExamComponent[]>([]);
  readonly examResults = signal<StudentExamResult[]>([]);
  readonly gradeBoundaries = signal<GradeBoundary[]>([]);
  readonly gradeDistribution = signal<GradeDistribution | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  fetchExamSeries(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get<ExamSeries[]>(getApiUrl('/lms/exam-series/'))
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => this.examSeries.set(data),
        error: () => this.error.set('Failed to load exam series'),
      });
  }

  createExamSeries(payload: Partial<ExamSeries>): Observable<ExamSeries> {
    return this.http.post<ExamSeries>(getApiUrl('/lms/exam-series/'), payload);
  }

  updateExamSeries(id: number, payload: Partial<ExamSeries>): Observable<ExamSeries> {
    return this.http.put<ExamSeries>(getApiUrl(`/lms/exam-series/${id}/`), payload);
  }

  deleteExamSeries(id: number): Observable<void> {
    return this.http.delete<void>(getApiUrl(`/lms/exam-series/${id}/`));
  }

  fetchComponents(seriesId?: number): void {
    this.isLoading.set(true);
    this.error.set(null);
    let url = getApiUrl('/lms/exam-components/');
    if (seriesId) url += `?series=${seriesId}`;
    this.http.get<ExamComponent[]>(url)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => this.examComponents.set(data),
        error: () => this.error.set('Failed to load exam components'),
      });
  }

  createComponent(payload: Partial<ExamComponent>): Observable<ExamComponent> {
    return this.http.post<ExamComponent>(getApiUrl('/lms/exam-components/'), payload);
  }

  updateComponent(id: number, payload: Partial<ExamComponent>): Observable<ExamComponent> {
    return this.http.put<ExamComponent>(getApiUrl(`/lms/exam-components/${id}/`), payload);
  }

  deleteComponent(id: number): Observable<void> {
    return this.http.delete<void>(getApiUrl(`/lms/exam-components/${id}/`));
  }

  fetchResults(componentId?: number): void {
    this.isLoading.set(true);
    this.error.set(null);
    let url = getApiUrl('/lms/exam-results/');
    if (componentId) url += `?component=${componentId}`;
    this.http.get<StudentExamResult[]>(url)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => this.examResults.set(data),
        error: () => this.error.set('Failed to load exam results'),
      });
  }

  createResult(payload: Partial<StudentExamResult>): Observable<StudentExamResult> {
    return this.http.post<StudentExamResult>(getApiUrl('/lms/exam-results/'), payload);
  }

  updateResult(id: number, payload: Partial<StudentExamResult>): Observable<StudentExamResult> {
    return this.http.put<StudentExamResult>(getApiUrl(`/lms/exam-results/${id}/`), payload);
  }

  deleteResult(id: number): Observable<void> {
    return this.http.delete<void>(getApiUrl(`/lms/exam-results/${id}/`));
  }

  fetchGradeDistribution(examSeries?: string, subject?: string): void {
    const params = new URLSearchParams();
    if (examSeries) params.set('exam_series', examSeries);
    if (subject) params.set('subject', subject);
    const qs = params.toString();
    this.http.get<GradeDistribution>(getApiUrl(`/lms/grade-distribution/${qs ? '?' + qs : ''}`))
      .subscribe({
        next: (data) => this.gradeDistribution.set(data),
      });
  }

  fetchGradeBoundaries(): void {
    this.http.get<GradeBoundary[]>(getApiUrl('/lms/grade-boundaries/'))
      .subscribe({
        next: (data) => this.gradeBoundaries.set(data),
      });
  }
}
