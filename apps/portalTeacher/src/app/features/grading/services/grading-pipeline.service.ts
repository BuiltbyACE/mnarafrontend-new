import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { getApiUrl } from '@sms/core/config';

export type GradingStatus = 'SUBMITTED' | 'IN_REVIEW' | 'GRADED';

export interface PipelineSubmission {
  id: number;
  studentName: string;
  assignmentTitle: string;
  courseName: string;
  submittedAt: string | null;
  isLate: boolean;
  scoreAwarded: number;
  maxScore: number;
  gradingStatus: GradingStatus;
}

interface RawSubmission {
  id: number;
  student_name: string;
  assignment_title: string;
  course_name: string;
  submitted_at: string | null;
  is_late: boolean;
  score_awarded: number;
  max_score: number;
  grading_status: GradingStatus;
}

@Injectable({ providedIn: 'root' })
export class GradingPipelineService {
  private http = inject(HttpClient);

  readonly submissions = signal<PipelineSubmission[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly patchError = signal<string | null>(null);

  readonly submitted = computed(() =>
    this.submissions().filter(s => s.gradingStatus === 'SUBMITTED'),
  );
  readonly inReview = computed(() =>
    this.submissions().filter(s => s.gradingStatus === 'IN_REVIEW'),
  );
  readonly graded = computed(() =>
    this.submissions().filter(s => s.gradingStatus === 'GRADED'),
  );

  fetchPipeline(assignmentId: number): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http
      .get<{ submissions: RawSubmission[] }>(
        getApiUrl(`/lms/assignments/${assignmentId}/pipeline/`),
      )
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ submissions }) =>
          this.submissions.set(submissions.map(this.normalize)),
        error: () => this.error.set('Failed to load the grading pipeline.'),
      });
  }

  /**
   * Optimistically moves a submission to a new Kanban column, then syncs
   * the backend via PATCH. On failure, the state is rolled back to the
   * snapshot captured before the update and patchError is set.
   */
  updateGradingStatus(submissionId: number, newStatus: GradingStatus): void {
    const snapshot = this.submissions();

    this.submissions.update(all =>
      all.map(s =>
        s.id === submissionId ? { ...s, gradingStatus: newStatus } : s,
      ),
    );
    this.patchError.set(null);

    this.http
      .patch<{ id: number; grading_status: GradingStatus }>(
        getApiUrl(`/submissions/${submissionId}/grading-status/`),
        { grading_status: newStatus },
      )
      .subscribe({
        error: () => {
          this.submissions.set(snapshot);
          this.patchError.set('Move failed — card reverted. Please try again.');
        },
      });
  }

  private normalize(raw: RawSubmission): PipelineSubmission {
    return {
      id: raw.id,
      studentName: raw.student_name,
      assignmentTitle: raw.assignment_title,
      courseName: raw.course_name,
      submittedAt: raw.submitted_at,
      isLate: raw.is_late,
      scoreAwarded: raw.score_awarded,
      maxScore: raw.max_score,
      gradingStatus: raw.grading_status,
    };
  }
}
