import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { TeacherAssignmentService } from '../../../core/services/teacher-assignment.service';

type SubTab = 'submitted' | 'not_submitted';

@Component({
  selector: 'app-submissions-list',
  standalone: true,
  imports: [
    DatePipe, RouterLink,
    MatCardModule, MatIconModule, MatButtonModule, MatTabsModule,
    MatProgressSpinnerModule, MatDividerModule, MatInputModule,
    MatFormFieldModule, MatChipsModule,
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">{{ assignmentTitle() }}</h1>
          <p class="page-subtitle">Review and grade student submissions</p>
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn-secondary" [routerLink]="['/teacher/assignments', assignmentId(), 'pipeline']">
            <mat-icon>view_kanban</mat-icon>
            Grading Pipeline
          </button>
          <button class="btn-secondary" routerLink="/teacher/workspace/{{ assignmentId() }}">
            <mat-icon>arrow_back</mat-icon>
            Back to Workspace
          </button>
        </div>
      </div>

      @if (submissionsLoading()) {
        <div class="loading-center">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else if (resp(); as r) {
        <mat-card class="summary-card">
          <div class="summary-grid">
            <div class="summary-item">
              <span class="summary-label">Type</span>
              <span class="summary-value">{{ r.assignment.submission_type }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Max Score</span>
              <span class="summary-value">{{ r.assignment.max_score }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Deadline</span>
              <span class="summary-value">{{ r.assignment.deadline | date:'medium' }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Status</span>
              <span class="summary-value status-badge" [class]="r.assignment.status.toLowerCase()">{{ r.assignment.status }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Submitted</span>
              <span class="summary-value">{{ r.assignment.submitted_count }}/{{ r.assignment.enrolled_count }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Graded</span>
              <span class="summary-value">{{ r.assignment.graded_count }}/{{ r.assignment.submitted_count }}</span>
            </div>
          </div>
        </mat-card>

        <mat-card class="submissions-card">
          <mat-tab-group [selectedIndex]="activeTab() === 'submitted' ? 0 : 1"
                         (selectedIndexChange)="activeTab.set($event === 0 ? 'submitted' : 'not_submitted')">
            <mat-tab label="Submitted ({{ r.assignment.submitted_count }})">
              <div class="submissions-table-wrapper">
                <table class="submissions-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Submitted</th>
                      <th>Status</th>
                      <th>Late</th>
                      <th>Score</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (sub of r.submissions; track sub.id) {
                      <tr [class.graded-row]="sub.is_graded">
                        <td class="student-name">{{ sub.student_name }}</td>
                        <td>{{ sub.submitted_at | date:'d MMM, h:mm a' }}</td>
                        <td>
                          <span class="status-dot" [class.graded]="sub.is_graded" [class.ungraded]="!sub.is_graded">
                            {{ sub.is_graded ? 'Graded' : 'Ungraded' }}
                          </span>
                        </td>
                        <td>
                          @if (sub.is_late) {
                            <span class="late-badge">LATE</span>
                          } @else {
                            <span class="on-time">—</span>
                          }
                        </td>
                        <td class="score-cell">
                          @if (sub.is_graded) {
                            <span class="score-value">{{ sub.score_awarded }}/{{ r.assignment.max_score }}</span>
                          } @else {
                            <span class="score-pending">—</span>
                          }
                        </td>
                        <td>
                          <button class="btn-sm" [class.btn-primary]="!sub.is_graded" [class.btn-secondary]="sub.is_graded"
                                  (click)="openGrading(sub)">
                            <mat-icon>{{ sub.is_graded ? 'visibility' : 'rate_review' }}</mat-icon>
                            {{ sub.is_graded ? 'View' : 'Grade' }}
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </mat-tab>

            <mat-tab label="Not Submitted ({{ r.not_submitted.length }})">
              <div class="not-submitted-list">
                @for (ns of r.not_submitted; track ns.id) {
                  <div class="not-submitted-item">
                    <mat-icon class="ns-icon">person_off</mat-icon>
                    <span class="ns-name">{{ ns.full_name }}</span>
                  </div>
                }
                @if (r.not_submitted.length === 0) {
                  <div class="empty-state">
                    <mat-icon class="empty-icon">check_circle</mat-icon>
                    <span>All students have submitted!</span>
                  </div>
                }
              </div>
            </mat-tab>
          </mat-tab-group>
        </mat-card>
      }
    </div>

    @if (gradingSub(); as gs) {
      <div class="grading-overlay" (click)="closeGrading()"></div>
      <div class="grading-drawer">
        <div class="drawer-header">
          <div>
            <h2>{{ gs.student_name }}</h2>
            <p class="drawer-subtitle">{{ resp()?.assignment?.title }}</p>
          </div>
          <button class="icon-btn" (click)="closeGrading()">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <mat-divider></mat-divider>

        <div class="drawer-body">
          @if (gs.submitted_at) {
            <div class="info-row">
              <span class="info-label">Submitted:</span>
              <span>{{ gs.submitted_at | date:'medium' }}</span>
            </div>
          }
          <div class="info-row">
            <span class="info-label">Status:</span>
            <span [class]="gs.is_late ? 'late-badge' : ''">{{ gs.is_late ? 'Late' : 'On time' }}</span>
          </div>

          @if (gs.auto_grade_score > 0 || resp()?.assignment?.submission_type === 'QUIZ') {
            <div class="info-row">
              <span class="info-label">Auto-grade score:</span>
              <span>{{ gs.auto_grade_score }}/{{ resp()?.assignment?.max_score }}</span>
            </div>
          }

          @if (gs.submission_text) {
            <div class="section">
              <span class="section-label">Submission Text</span>
              <div class="text-preview">{{ gs.submission_text }}</div>
            </div>
          }

          @if (gs.uploaded_document) {
            <div class="section">
              <span class="section-label">Submitted File</span>
              <a [href]="gs.uploaded_document" target="_blank" class="file-link">
                <mat-icon>download</mat-icon>
                View Document
              </a>
            </div>
          }

          <mat-divider></mat-divider>

          <div class="section">
            <span class="section-label">Manual Score Adjustment</span>
            <mat-form-field appearance="outline" class="score-field">
              <mat-label>Additional points</mat-label>
              <input matInput type="number" min="0" [max]="maxManualScore()" [value]="manualScoreValue()"
                     (input)="manualScoreValue.set(parseNumber($any($event.target).value))">
              <mat-hint>Max: {{ maxManualScore() }}</mat-hint>
            </mat-form-field>
          </div>

          <div class="section">
            <span class="section-label">Feedback</span>
            <mat-form-field appearance="outline" class="feedback-field">
              <mat-label>Write feedback for the student</mat-label>
              <textarea matInput rows="4" [value]="feedbackValue()"
                        (input)="feedbackValue.set($any($event.target).value)"></textarea>
            </mat-form-field>
          </div>

          <div class="total-row">
            <span class="total-label">Total Score:</span>
            <span class="total-value">{{ (gs.auto_grade_score ?? 0) + manualScoreValue() }}/{{ resp()?.assignment?.max_score }}</span>
          </div>
        </div>

        <mat-divider></mat-divider>

        <div class="drawer-footer">
          <button class="btn-secondary" (click)="closeGrading()">Cancel</button>
          <button class="btn-primary" (click)="saveGrade(gs.id)" [disabled]="isGrading()">
            <mat-icon>check</mat-icon>
            {{ isGrading() ? 'Saving...' : 'Save Grade' }}
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .page { padding: 24px; max-width: 1200px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0 0 4px; }
    .page-subtitle { font-size: 0.875rem; color: #64748b; margin: 0; }
    .loading-center { display: flex; justify-content: center; padding: 60px 0; }

    .summary-card { margin-bottom: 20px; }
    .summary-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 16px; padding: 16px; }
    .summary-item { display: flex; flex-direction: column; gap: 4px; }
    .summary-label { font-size: 0.6875rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    .summary-value { font-size: 0.9375rem; font-weight: 600; color: #0f172a; }
    .status-badge { padding: 2px 10px; border-radius: 4px; font-size: 0.75rem; width: fit-content; }
    .status-badge.published { background: #dcfce7; color: #166534; }
    .status-badge.closed { background: #fef2f2; color: #991b1b; }
    .status-badge.draft { background: #f1f5f9; color: #475569; }

    .submissions-card { border-radius: 12px; }
    .submissions-table-wrapper { overflow-x: auto; }
    .submissions-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .submissions-table th { text-align: left; padding: 12px 16px; font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e2e8f0; }
    .submissions-table td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; }
    .submissions-table tr:hover { background: #f8fafc; }
    .graded-row { opacity: 0.85; }
    .student-name { font-weight: 500; color: #0f172a; }
    .status-dot { font-size: 0.75rem; padding: 2px 10px; border-radius: 4px; }
    .status-dot.graded { background: #dcfce7; color: #166534; }
    .status-dot.ungraded { background: #fef3c7; color: #92400e; }
    .late-badge { font-size: 0.6875rem; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: #fee2e2; color: #991b1b; }
    .on-time { color: #94a3b8; }
    .score-cell { font-weight: 600; }
    .score-value { color: #0f172a; }
    .score-pending { color: #94a3b8; }
    .btn-sm { display: inline-flex; align-items: center; gap: 4px; padding: 6px 14px; border: none; border-radius: 6px; font-size: 0.75rem; font-weight: 600; cursor: pointer; }
    .btn-sm mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .btn-sm.btn-primary { background: #2563eb; color: white; }
    .btn-sm.btn-secondary { background: #f1f5f9; color: #475569; }

    .not-submitted-list { padding: 16px; }
    .not-submitted-item { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
    .ns-icon { color: #94a3b8; font-size: 20px; }
    .ns-name { font-weight: 500; color: #0f172a; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 40px; color: #64748b; }
    .empty-icon { font-size: 40px; width: 40px; height: 40px; color: #10b981; }

    .grading-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 999; }
    .grading-drawer { position: fixed; top: 0; right: 0; bottom: 0; width: 480px; background: white; z-index: 1000; display: flex; flex-direction: column; box-shadow: -4px 0 20px rgba(0,0,0,0.15); }
    .drawer-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 20px 24px; }
    .drawer-header h2 { margin: 0; font-size: 1.125rem; font-weight: 700; color: #0f172a; }
    .drawer-subtitle { margin: 4px 0 0; font-size: 0.8125rem; color: #64748b; }
    .drawer-body { flex: 1; overflow-y: auto; padding: 16px 24px; }
    .drawer-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 16px 24px; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 0.875rem; }
    .info-label { color: #64748b; }
    .section { margin: 16px 0; }
    .section-label { display: block; font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
    .text-preview { background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 0.8125rem; color: #0f172a; max-height: 200px; overflow-y: auto; white-space: pre-wrap; }
    .file-link { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: #eff6ff; color: #2563eb; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 0.8125rem; }
    .score-field, .feedback-field { width: 100%; }
    .total-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-top: 1px solid #e2e8f0; margin-top: 8px; }
    .total-label { font-weight: 600; color: #0f172a; }
    .total-value { font-size: 1.125rem; font-weight: 700; color: #2563eb; }
    .btn-primary, .btn-secondary { display: inline-flex; align-items: center; gap: 6px; padding: 8px 20px; border: none; border-radius: 8px; font-size: 0.8125rem; font-weight: 600; cursor: pointer; }
    .btn-primary { background: #2563eb; color: white; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-secondary { background: #f1f5f9; color: #475569; }
    .icon-btn { background: none; border: none; cursor: pointer; color: #64748b; padding: 4px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubmissionsListComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private assignmentService = inject(TeacherAssignmentService);

  readonly activeTab = signal<SubTab>('submitted');
  readonly assignmentId = signal(0);
  readonly gradingSub = signal<import('../../../shared/models/teacher.models').SubmissionRecord | null>(null);
  readonly manualScoreValue = signal(0);
  readonly feedbackValue = signal('');

  readonly resp = this.assignmentService.submissionsResponse;
  readonly submissionsLoading = this.assignmentService.submissionsLoading;
  readonly isGrading = this.assignmentService.isGrading;

  readonly assignmentTitle = computed(() => this.resp()?.assignment?.title ?? 'Submissions');

  readonly maxManualScore = computed(() => {
    const r = this.resp();
    if (!r) return 0;
    return r.assignment.max_score - (this.gradingSub()?.auto_grade_score ?? 0);
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.assignmentId.set(id);
    this.assignmentService.fetchSubmissions(id);
  }

  openGrading(sub: import('../../../shared/models/teacher.models').SubmissionRecord): void {
    this.gradingSub.set(sub);
    this.manualScoreValue.set(sub.manual_grade_score ?? 0);
    this.feedbackValue.set(sub.teacher_feedback ?? '');
  }

  closeGrading(): void {
    this.gradingSub.set(null);
  }

  /** Used in template to parse number input values */
  parseNumber(v: string): number {
    const n = Number(v);
    return Number.isNaN(n) ? 0 : n;
  }

  saveGrade(submissionId: number): void {
    this.assignmentService.gradeSubmission(submissionId, this.manualScoreValue(), this.feedbackValue());
    this.closeGrading();
  }
}
