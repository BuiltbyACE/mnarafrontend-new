import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, finalize, map } from 'rxjs';
import { getApiUrl } from '@sms/core/config';

export interface AssignmentDTO {
  id: string;
  title: string;
  subject: string;
  description: string;
  submission_type: 'QUIZ' | 'FILE_UPLOAD' | 'ONLINE_TEXT';
  due_date: string;
  status: 'pending' | 'submitted' | 'graded';
  score_awarded: number | null;
  max_score: number | null;
  submission_id?: string;
}

export interface QuizOption {
  id: string;
  option_text: string;
}

export interface QuizQuestion {
  id: string;
  question_text: string;
  options: QuizOption[];
  marks: number;
  selectedAnswer?: string;
}

export interface ReviewQuizOption {
  id: string;
  option_text: string;
  is_correct: boolean;
}

export interface ReviewQuizQuestion {
  id: string;
  question_text: string;
  marks: number;
  selectedAnswer?: string;
  options: ReviewQuizOption[];
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AssignmentDTO[];
}

@Injectable({ providedIn: 'root' })
export class AssignmentsService {
  private http = inject(HttpClient);

  readonly assignments = signal<AssignmentDTO[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  loadAssignments(workspaceId?: number): void {
    this.isLoading.set(true);
    this.error.set(null);
    let url = '/lms/my-assignments/';
    if (workspaceId) {
      url += `?workspace_id=${workspaceId}`;
    }
    this.http.get<PaginatedResponse>(getApiUrl(url))
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => this.assignments.set(res.results),
        error: (err) => {
          console.error('[AssignmentsService] fetch error:', err.status, err.message);
          this.assignments.set([]);
          if (err.status === 403) {
            this.error.set('Access denied to assignments.');
          } else {
            this.error.set('Failed to load assignments.');
          }
        },
      });
  }

  fetchQuizQuestions(assignmentId: string): Observable<QuizQuestion[]> {
    return this.http.get<{ results: QuizQuestion[] }>(getApiUrl(`/lms/assignments/${assignmentId}/questions/`))
      .pipe(map((res) => res.results));
  }

  fetchQuizReview(submissionId: string): Observable<ReviewQuizQuestion[]> {
    return this.http.get<ReviewQuizQuestion[]>(getApiUrl(`/lms/submissions/${submissionId}/review-quiz/`));
  }

  submitQuiz(assignmentId: string, answers: { questionId: string; selectedAnswer: string }[]): Observable<void> {
    return this.http.post<void>(getApiUrl(`/lms/assignments/${assignmentId}/submit-quiz/`), { answers });
  }

  submitFile(assignmentId: string, file: File): Observable<void> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<void>(getApiUrl(`/lms/assignments/${assignmentId}/submit-file/`), formData);
  }

  submitText(assignmentId: string, text: string): Observable<void> {
    return this.http.post<void>(getApiUrl(`/lms/assignments/${assignmentId}/submit-text/`), { text });
  }
}
