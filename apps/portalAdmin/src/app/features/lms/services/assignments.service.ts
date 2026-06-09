import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { getApiUrl } from '@sms/core/config';

export interface SubjectBreakdown {
  subject: string;
  total: number;
  published: number;
  submissions: number;
}

export interface ClassroomBreakdown {
  classroom: string;
  total: number;
  submissions: number;
}

export interface TermBreakdown {
  term: string;
  assignments: number;
}

export interface AssignmentListItem {
  id: number;
  title: string;
  subject: string;
  classroom: string;
  due_date: string;
  submission_type: string;
  submissions: { graded: number; submitted: number; pending: number };
}

export interface AssignmentDashboardData {
  total_assignments: number;
  total_submissions: number;
  submissions_by_status: { graded: number; submitted: number; pending: number };
  published: number;
  upcoming: number;
  overdue: number;
  drafts: number;
  by_subject: SubjectBreakdown[];
  by_classroom: ClassroomBreakdown[];
  by_term: TermBreakdown[];
  due_today: AssignmentListItem[];
  due_this_week: AssignmentListItem[];
  overdue_recent: AssignmentListItem[];
  recently_created: AssignmentListItem[];
}

@Injectable({ providedIn: 'root' })
export class AssignmentsService {
  private http = inject(HttpClient);

  readonly data = signal<AssignmentDashboardData | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  fetchAll(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get<AssignmentDashboardData>(getApiUrl('/lms/assignments/summary/'))
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => this.data.set(data),
        error: () => this.error.set('Failed to load assignment summary'),
      });
  }
}
