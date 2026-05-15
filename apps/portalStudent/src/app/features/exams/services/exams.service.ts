import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { environment } from '@sms/core/config';

export interface ExamAssessmentDTO {
  subject: string;
  teacher_name: string;
  score: number;
  max_score: number;
  grade: string;
  remark: string;
}

export interface ExamSeriesData {
  series_name: string;
  assessments: ExamAssessmentDTO[];
}

export interface ExamProgressPayload {
  kpis: {
    current_average: number;
    target_grade: string;
    best_subject: string;
  };
  graph: {
    labels: string[];
    overall_trend: number[];
  };
  transcript: ExamSeriesData[];
}

@Injectable({ providedIn: 'root' })
export class ExamsService {
  private http = inject(HttpClient);

  readonly examData = signal<ExamProgressPayload | null>(null);
  readonly isLoading = signal(true);

  fetchProgress(): void {
    this.isLoading.set(true);
    this.http
      .get<ExamProgressPayload>(`${environment.apiBaseUrl}/academics/exams/my-progress/`)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => this.examData.set(data),
        error: () => this.examData.set(null),
      });
  }
}
