import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { getApiUrl } from '@sms/core/config';
import { GradeDistribution } from '../../shared/models/teacher.models';

export interface PendingGradingItemData {
  id: number;
  title: string;
  submission_count: number;
  due_date: string;
  subject: string;
  class_name: string;
}

export interface SubjectAverageData {
  subject: string;
  average_score: number;
  class_rank: number;
}

export interface GradeSubmissionPayload {
  score: number;
  feedback?: string;
}

@Injectable({ providedIn: 'root' })
export class TeacherGradingService {
  private http = inject(HttpClient);
  readonly pendingItems = signal<PendingGradingItemData[]>([]);
  readonly gradeDistribution = signal<GradeDistribution[]>([]);
  readonly subjectAverages = signal<SubjectAverageData[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly gradeSuccess = signal(false);

  fetchGradeDistribution(subject?: string, examSeries?: string): void {
    let endpoint = '/lms/grade-distribution/';
    const params: string[] = [];
    if (subject) params.push(`subject=${subject}`);
    if (examSeries) params.push(`exam_series=${examSeries}`);
    if (params.length) endpoint += '?' + params.join('&');

    this.http.get<GradeDistribution[]>(getApiUrl(endpoint))
      .subscribe({
        next: (data) => this.gradeDistribution.set(data),
        error: () => this.error.set('Failed to load grade distribution'),
      });
  }

  gradeSubmission(submissionId: number, payload: GradeSubmissionPayload): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.gradeSuccess.set(false);
    this.http.post(getApiUrl(`/lms/submissions/${submissionId}/grade/`), payload)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => this.gradeSuccess.set(true),
        error: () => this.error.set('Failed to grade submission'),
      });
  }
}
