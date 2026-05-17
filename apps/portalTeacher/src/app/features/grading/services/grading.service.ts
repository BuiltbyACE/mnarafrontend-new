import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { getApiUrl } from '@sms/core/config';

export interface PendingTask {
  id: number;
  title: string;
  class_name: string;
  subject: string;
  submitted_count: number;
  total_count: number;
  due_date: string;
}

export interface GradeDistEntry {
  grade: string;
  count: number;
  percentage: number;
}

export interface SubjectAvgEntry {
  subject: string;
  average_score: number;
}

export interface GradingPayload {
  pending_grading: PendingTask[];
  grade_distribution: GradeDistEntry[];
  subject_averages: SubjectAvgEntry[];
}

@Injectable({ providedIn: 'root' })
export class GradingService {
  private http = inject(HttpClient);

  readonly data = signal<GradingPayload | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  fetchDashboard(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get<GradingPayload>(getApiUrl('/lms/grading/dashboard/'))
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => this.data.set(res),
        error: () => this.error.set('Failed to load grading dashboard'),
      });
  }
}
