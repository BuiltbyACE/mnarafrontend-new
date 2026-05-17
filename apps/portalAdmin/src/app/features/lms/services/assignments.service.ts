import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { getApiUrl } from '@sms/core/config';

export interface AssignmentSummary {
  id: number;
  title: string;
  course: string;
  submission_type: string;
  due_date: string;
  max_score: number;
  is_published: boolean;
  total_students: number;
  submitted_count: number;
  graded_count: number;
  avg_score: number | null;
}

@Injectable({ providedIn: 'root' })
export class AssignmentsService {
  private http = inject(HttpClient);

  readonly assignments = signal<AssignmentSummary[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  fetchAll(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get<AssignmentSummary[]>(getApiUrl('/lms/assignments/'))
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => this.assignments.set(data),
        error: () => this.error.set('Failed to load assignments'),
      });
  }
}
