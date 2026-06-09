import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { AssignmentsService } from '../../services/assignments.service';

@Component({
  selector: 'app-assignments-list',
  standalone: true,
  imports: [DatePipe, MatCardModule, MatIconModule, MatChipsModule],
  template: `
    <div class="page">
      <header class="page-header">
        <h1>Assignments Dashboard</h1>
        <p class="subtitle">Overview of all assignments across subjects and classrooms</p>
      </header>

      @if (service.isLoading()) {
        <div class="loading">Loading assignment summary...</div>
      } @else if (service.error(); as err) {
        <div class="error">{{ err }}</div>
      } @else if (service.data(); as d) {
        <div class="summary-bar">
          <div class="stat">
            <span class="stat-value">{{ d.total_assignments }}</span>
            <span class="stat-label">Total Assignments</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ d.total_submissions }}</span>
            <span class="stat-label">Total Submissions</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ d.published }}</span>
            <span class="stat-label">Published</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ d.submissions_by_status.graded }}</span>
            <span class="stat-label">Graded</span>
          </div>
        </div>

        <div class="sections">
          <mat-card class="section-card">
            <mat-card-content>
              <h3>Submissions Breakdown</h3>
              <div class="breakdown-rows">
                <div class="breakdown-item">
                  <span class="breakdown-label">Graded</span>
                  <span class="breakdown-value">{{ d.submissions_by_status.graded }}</span>
                  <div class="bar"><div class="fill graded" [style.width.%]="d.total_submissions ? (d.submissions_by_status.graded / d.total_submissions * 100) : 0"></div></div>
                </div>
                <div class="breakdown-item">
                  <span class="breakdown-label">Submitted</span>
                  <span class="breakdown-value">{{ d.submissions_by_status.submitted }}</span>
                  <div class="bar"><div class="fill submitted" [style.width.%]="d.total_submissions ? (d.submissions_by_status.submitted / d.total_submissions * 100) : 0"></div></div>
                </div>
                <div class="breakdown-item">
                  <span class="breakdown-label">Pending</span>
                  <span class="breakdown-value">{{ d.submissions_by_status.pending }}</span>
                  <div class="bar"><div class="fill pending" [style.width.%]="d.total_submissions ? (d.submissions_by_status.pending / d.total_submissions * 100) : 0"></div></div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="section-card">
            <mat-card-content>
              <h3>By Subject</h3>
              <div class="table-wrap">
                <table>
                  <thead><tr><th>Subject</th><th>Total</th><th>Published</th><th>Submissions</th></tr></thead>
                  <tbody>
                    @for (s of d.by_subject; track s.subject) {
                      <tr><td>{{ s.subject }}</td><td>{{ s.total }}</td><td>{{ s.published }}</td><td>{{ s.submissions }}</td></tr>
                    }
                  </tbody>
                </table>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="section-card">
            <mat-card-content>
              <h3>By Classroom</h3>
              <div class="table-wrap">
                <table>
                  <thead><tr><th>Classroom</th><th>Assignments</th><th>Submissions</th></tr></thead>
                  <tbody>
                    @for (c of d.by_classroom; track c.classroom) {
                      <tr><td>{{ c.classroom }}</td><td>{{ c.total }}</td><td>{{ c.submissions }}</td></tr>
                    }
                  </tbody>
                </table>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="section-card">
            <mat-card-content>
              <h3>By Term</h3>
              <div class="term-chips">
                @for (t of d.by_term; track t.term) {
                  <span class="term-chip">{{ t.term }} <strong>{{ t.assignments }}</strong></span>
                }
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <div class="recent-sections">
          <mat-card class="section-card">
            <mat-card-content>
              <h3>Due Today</h3>
              @if (d.due_today.length === 0) {
                <p class="empty-state">No assignments due today</p>
              } @else {
                <div class="recent-grid">
                  @for (a of d.due_today; track a.id) {
                    <div class="recent-item">
                      <div class="recent-header">
                        <span class="recent-title">{{ a.title }}</span>
                        <span class="type-badge" [class]="a.submission_type.toLowerCase()">{{ a.submission_type }}</span>
                      </div>
                      <div class="recent-meta">
                        <span>{{ a.subject }}</span>
                        <span>{{ a.classroom }}</span>
                        <span class="urgent">Due {{ a.due_date | date:'h:mm a' }}</span>
                        <span>G:{{ a.submissions.graded }} S:{{ a.submissions.submitted }} P:{{ a.submissions.pending }}</span>
                      </div>
                    </div>
                  }
                </div>
              }
            </mat-card-content>
          </mat-card>

          <mat-card class="section-card">
            <mat-card-content>
              <h3>Due This Week</h3>
              @if (d.due_this_week.length === 0) {
                <p class="empty-state">No assignments due this week</p>
              } @else {
                <div class="recent-grid">
                  @for (a of d.due_this_week; track a.id) {
                    <div class="recent-item">
                      <div class="recent-header">
                        <span class="recent-title">{{ a.title }}</span>
                        <span class="type-badge" [class]="a.submission_type.toLowerCase()">{{ a.submission_type }}</span>
                      </div>
                      <div class="recent-meta">
                        <span>{{ a.subject }}</span>
                        <span>{{ a.classroom }}</span>
                        <span>Due {{ a.due_date | date:'EEE d MMM' }}</span>
                        <span>G:{{ a.submissions.graded }} S:{{ a.submissions.submitted }} P:{{ a.submissions.pending }}</span>
                      </div>
                    </div>
                  }
                </div>
              }
            </mat-card-content>
          </mat-card>

          <mat-card class="section-card">
            <mat-card-content>
              <h3>Overdue (Recent)</h3>
              @if (d.overdue_recent.length === 0) {
                <p class="empty-state">No overdue assignments</p>
              } @else {
                <div class="recent-grid">
                  @for (a of d.overdue_recent; track a.id) {
                    <div class="recent-item overdue">
                      <div class="recent-header">
                        <span class="recent-title">{{ a.title }}</span>
                        <span class="type-badge" [class]="a.submission_type.toLowerCase()">{{ a.submission_type }}</span>
                      </div>
                      <div class="recent-meta">
                        <span>{{ a.subject }}</span>
                        <span>{{ a.classroom }}</span>
                        <span class="overdue-label">Overdue {{ a.due_date | date:'d MMM' }}</span>
                        <span>G:{{ a.submissions.graded }} S:{{ a.submissions.submitted }} P:{{ a.submissions.pending }}</span>
                      </div>
                    </div>
                  }
                </div>
              }
            </mat-card-content>
          </mat-card>

          <mat-card class="section-card">
            <mat-card-content>
              <h3>Recently Created</h3>
              @if (d.recently_created.length === 0) {
                <p class="empty-state">No recently created assignments</p>
              } @else {
                <div class="recent-grid">
                  @for (a of d.recently_created; track a.id) {
                    <div class="recent-item">
                      <div class="recent-header">
                        <span class="recent-title">{{ a.title }}</span>
                        <span class="type-badge" [class]="a.submission_type.toLowerCase()">{{ a.submission_type }}</span>
                      </div>
                      <div class="recent-meta">
                        <span>{{ a.subject }}</span>
                        <span>{{ a.classroom }}</span>
                        <span>Due {{ a.due_date | date:'d MMM yyyy' }}</span>
                        <span>G:{{ a.submissions.graded }} S:{{ a.submissions.submitted }} P:{{ a.submissions.pending }}</span>
                      </div>
                    </div>
                  }
                </div>
              }
            </mat-card-content>
          </mat-card>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      --m-primary: #2563eb;
      --m-bg: #f1f5f9;
      --m-surface: #ffffff;
      --m-text: #1e293b;
      --m-text-secondary: #64748b;
      --m-border: #e2e8f0;
      display: block; min-height: 100vh; background: var(--m-bg); font-family: 'Segoe UI', system-ui, sans-serif;
    }
    .page { padding: 32px; max-width: 1280px; margin: 0 auto; }
    .page-header { margin-bottom: 28px; }
    .page-header h1 { font-size: 28px; font-weight: 600; color: var(--m-text); margin: 0; }
    .subtitle { color: var(--m-text-secondary); margin: 4px 0 0; font-size: 14px; }
    .loading, .error { padding: 40px; text-align: center; color: var(--m-text-secondary); }
    .error { color: #dc2626; }

    .summary-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
    .stat { background: var(--m-surface); border: 1px solid var(--m-border); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 4px; }
    .stat-value { font-size: 28px; font-weight: 700; color: var(--m-primary); line-height: 1.1; }
    .stat-label { font-size: 13px; color: var(--m-text-secondary); }

    .sections { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 28px; }

    .section-card { border-radius: 12px; border: 1px solid var(--m-border); }
    .section-card mat-card-content { padding: 20px; }
    .section-card h3 { font-size: 15px; font-weight: 600; color: var(--m-text); margin: 0 0 16px; }

    .breakdown-rows { display: flex; flex-direction: column; gap: 12px; }
    .breakdown-item { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
    .breakdown-label { font-size: 13px; color: var(--m-text-secondary); width: 80px; }
    .breakdown-value { font-weight: 600; color: var(--m-text); font-size: 15px; width: 40px; }
    .breakdown-item .bar { flex: 1; height: 6px; background: var(--m-border); border-radius: 100px; overflow: hidden; min-width: 60px; }
    .fill { height: 100%; border-radius: 100px; transition: width .5s ease; }
    .fill.graded { background: #16a34a; }
    .fill.submitted { background: var(--m-primary); }
    .fill.pending { background: #d97706; }

    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; padding: 8px 12px; color: var(--m-text-secondary); font-weight: 600; border-bottom: 2px solid var(--m-border); font-size: 12px; text-transform: uppercase; letter-spacing: .5px; }
    td { padding: 8px 12px; border-bottom: 1px solid var(--m-border); color: var(--m-text); }
    tr:last-child td { border-bottom: none; }

    .term-chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .term-chip { padding: 6px 14px; border-radius: 100px; background: #dbeafe; color: #1e40af; font-size: 13px; }
    .term-chip strong { margin-left: 6px; }

    .recent-sections { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 28px; }
    .recent-grid { display: grid; gap: 12px; }
    .recent-item { display: flex; flex-direction: column; gap: 6px; padding: 12px 16px; border: 1px solid var(--m-border); border-radius: 8px; background: #fafbfc; }
    .recent-item.overdue { border-left: 3px solid #dc2626; }
    .recent-header { display: flex; justify-content: space-between; align-items: center; }
    .recent-title { font-size: 14px; font-weight: 600; color: var(--m-text); }
    .type-badge { padding: 2px 10px; border-radius: 100px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; }
    .type-badge.physical { background: #fef3c7; color: #92400e; }
    .type-badge.online_text { background: #dbeafe; color: #1e40af; }
    .type-badge.file_upload { background: #dcfce7; color: #166534; }
    .type-badge.quiz { background: #e0e7ff; color: #3730a3; }
    .recent-meta { display: flex; gap: 16px; flex-wrap: wrap; font-size: 12px; color: var(--m-text-secondary); }
    .urgent { color: #dc2626; font-weight: 600; }
    .overdue-label { color: #dc2626; }
    .empty-state { color: var(--m-text-secondary); font-size: 13px; padding: 8px 0; margin: 0; }

    @media (max-width: 768px) {
      .summary-bar { grid-template-columns: repeat(2, 1fr); }
      .sections { grid-template-columns: 1fr; }
      .recent-sections { grid-template-columns: 1fr; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignmentsListComponent {
  readonly service = inject(AssignmentsService);
  constructor() { this.service.fetchAll(); }
}
