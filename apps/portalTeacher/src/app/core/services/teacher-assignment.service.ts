import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { getApiUrl } from '@sms/core/config';
import { Assignment, CreateAssignmentPayload, SubmissionsResponse, UnreadCountResponse } from '../../shared/models/teacher.models';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface RawAssignment {
  id: number;
  title: string;
  submission_type: string;
  course: string;
  subject?: string;
  due_date: string;
  max_score: number;
  is_published: boolean;
  total_students: number;
  submitted_count: number;
  graded_count: number;
  avg_score: number | null;
}

function mapRaw(a: RawAssignment): Assignment {
  const now = new Date();
  const due = new Date(a.due_date);
  let status: Assignment['status'] = 'OPEN';
  if (!a.is_published) status = 'DRAFT';
  else if (due < now) status = 'CLOSED';

  return {
    id: a.id,
    title: a.title,
    type: a.submission_type as Assignment['type'],
    class: a.course,
    subject: a.subject ?? '',
    dueDate: a.due_date,
    submissions: a.submitted_count,
    totalStudents: a.total_students,
    status,
    max_score: a.max_score,
  };
}

@Injectable({ providedIn: 'root' })
export class TeacherAssignmentService {
  private http = inject(HttpClient);

  readonly assignments = signal<Assignment[]>([]);
  readonly isLoading = signal(false);
  readonly isCreating = signal(false);
  readonly error = signal<string | null>(null);

  readonly submissionsResponse = signal<SubmissionsResponse | null>(null);
  readonly submissionsLoading = signal(false);
  readonly isGrading = signal(false);

  readonly unreadCount = signal(0);

  fetchAssignments(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get<PaginatedResponse<RawAssignment>>(getApiUrl('/lms/assignments/'))
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => this.assignments.set(data.results.map(mapRaw)),
        error: () => this.error.set('Failed to load assignments'),
      });
  }

  createAssignment(payload: CreateAssignmentPayload): void {
    this.isCreating.set(true);
    this.error.set(null);
    this.http.post<RawAssignment>(getApiUrl('/lms/assignments/'), payload)
      .pipe(finalize(() => this.isCreating.set(false)))
      .subscribe({
        next: () => this.fetchAssignments(),
        error: () => this.error.set('Failed to create assignment'),
      });
  }

  fetchSubmissions(assignmentId: number): void {
    this.submissionsLoading.set(true);
    this.http.get<SubmissionsResponse>(
      getApiUrl(`/lms/assignments/assignments/${assignmentId}/submissions/`)
    ).pipe(finalize(() => this.submissionsLoading.set(false)))
      .subscribe({
        next: (data) => this.submissionsResponse.set(data),
        error: () => this.error.set('Failed to load submissions'),
      });
  }

  gradeSubmission(submissionId: number, manualScore: number, feedback: string): void {
    this.isGrading.set(true);
    this.http.post<{ message: string; score_awarded: number }>(
      getApiUrl(`/lms/assignments/submissions/${submissionId}/grade/`),
      { manual_grade_score: manualScore, teacher_feedback: feedback },
    ).pipe(finalize(() => this.isGrading.set(false)))
      .subscribe({
        next: () => {
          const resp = this.submissionsResponse();
          if (resp) {
            const sub = resp.submissions.find(s => s.id === submissionId);
            if (sub) {
              sub.is_graded = true;
              sub.manual_grade_score = manualScore;
              sub.score_awarded = (sub.auto_grade_score ?? 0) + manualScore;
              sub.teacher_feedback = feedback;
            }
            this.submissionsResponse.set({ ...resp });
          }
        },
        error: () => this.error.set('Failed to grade submission'),
      });
  }

  fetchUnreadCount(): void {
    this.http.get<UnreadCountResponse>(getApiUrl('/notifications/unread-count/'))
      .subscribe({
        next: (data) => this.unreadCount.set(data.count),
        error: () => {},
      });
  }
}
