import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { getApiUrl } from '@sms/core/config';
import { Assignment, CreateAssignmentPayload } from '../../shared/models/teacher.models';

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

  fetchAssignments(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get<RawAssignment[]>(getApiUrl('/lms/assignments/'))
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => this.assignments.set(data.map(mapRaw)),
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
}
