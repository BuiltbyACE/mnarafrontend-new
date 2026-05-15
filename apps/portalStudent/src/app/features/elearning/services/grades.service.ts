import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { getApiUrl } from '@sms/core/config';

export interface AssessmentRecord {
  title: string;
  score: number;
  max_score: number;
  date: string;
}

export interface SubjectGrades {
  subject: string;
  average: number;
  assessments: AssessmentRecord[];
}

export interface TrendData {
  label: string;
  average: number;
}

export interface PerformancePayload {
  overall_average: number;
  best_subject: string;
  best_subject_score: number;
  assessments_graded: number;
  trend: TrendData[];
  subjects: SubjectGrades[];
}

@Injectable({ providedIn: 'root' })
export class GradesService {
  private http = inject(HttpClient);

  readonly performanceData = signal<PerformancePayload | null>(null);
  readonly isLoading = signal(true);

  fetchPerformance(): void {
    this.isLoading.set(true);
    this.http.get<PerformancePayload>(getApiUrl('/lms/grades/performance/'))
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => this.performanceData.set(data),
        error: () => this.performanceData.set(null),
      });
  }
}
