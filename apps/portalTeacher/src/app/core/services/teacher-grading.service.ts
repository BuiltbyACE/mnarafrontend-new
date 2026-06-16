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

interface RawDashboard {
  pending_grading: {
    id: number;
    title: string;
    subject: string;
    classroom: string;
    submitted_count: number;
    total_students: number;
    due_date: string;
  }[];
  subject_averages: Record<string, number>;
  grade_distribution: Record<string, number>;
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

  /** Loads the full teacher grading dashboard (pending grading, subject averages, grade distribution). */
  fetchDashboard(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get<RawDashboard>(getApiUrl('/lms/grading/dashboard/'))
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => {
          this.pendingItems.set((data.pending_grading ?? []).map(p => ({
            id: p.id,
            title: p.title,
            submission_count: p.submitted_count,
            due_date: p.due_date,
            subject: p.subject,
            class_name: p.classroom,
          })));

          const averages = Object.entries(data.subject_averages ?? {})
            .sort((a, b) => b[1] - a[1])
            .map(([subject, average_score], idx) => ({
              subject,
              average_score,
              class_rank: idx + 1,
            }));
          this.subjectAverages.set(averages);

          const dist = data.grade_distribution ?? {};
          const total = Object.values(dist).reduce((sum, n) => sum + (n ?? 0), 0);
          this.gradeDistribution.set(Object.entries(dist).map(([grade, count]) => ({
            grade,
            count,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0,
          })));
        },
        error: () => this.error.set('Failed to load grading dashboard'),
      });
  }

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
