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
        <h1>Assignments</h1>
        <p class="subtitle">Read-only summary across all courses</p>
      </header>

      @if (service.isLoading()) {
        <div class="loading">Loading assignments...</div>
      } @else if (service.error(); as err) {
        <div class="error">{{ err }}</div>
      } @else {
        <div class="summary-bar">
          <div class="stat">
            <span class="stat-value">{{ service.assignments().length }}</span>
            <span class="stat-label">Total Assignments</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ service.assignments().filter(a => a.is_published).length }}</span>
            <span class="stat-label">Published</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ service.assignments().reduce((s,a) => s + a.submitted_count, 0) }}</span>
            <span class="stat-label">Total Submissions</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ service.assignments().reduce((s,a) => s + a.graded_count, 0) }}</span>
            <span class="stat-label">Graded</span>
          </div>
        </div>

        <div class="assignment-grid">
          @for (a of service.assignments(); track a.id) {
            <mat-card class="assignment-card">
              <mat-card-content>
                <div class="card-header">
                  <span class="card-title">{{ a.title }}</span>
                  <span class="card-course">{{ a.course }}</span>
                </div>
                <div class="card-meta">
                  <span class="meta-item">
                    <mat-icon>event</mat-icon> Due {{ a.due_date | date:'d MMM yyyy' }}
                  </span>
                  <span class="meta-item">
                    <mat-icon>score</mat-icon> Max {{ a.max_score }}
                  </span>
                  <span class="meta-item">
                    <mat-icon [class]="a.is_published ? 'published' : 'draft'">flag</mat-icon>
                    {{ a.is_published ? 'Published' : 'Draft' }}
                  </span>
                </div>
                <div class="type-badge" [class]="a.submission_type.toLowerCase()">{{ a.submission_type }}</div>
                <div class="progress-section">
                  <div class="progress-row">
                    <span>Submitted</span>
                    <span class="progress-value">{{ a.submitted_count }}/{{ a.total_students }}</span>
                  </div>
                  <div class="bar"><div class="fill submitted" [style.width.%]="a.total_students ? (a.submitted_count / a.total_students * 100) : 0"></div></div>
                  <div class="progress-row">
                    <span>Graded</span>
                    <span class="progress-value">{{ a.graded_count }}/{{ a.submitted_count }}</span>
                  </div>
                  <div class="bar"><div class="fill graded" [style.width.%]="a.submitted_count ? (a.graded_count / a.submitted_count * 100) : 0"></div></div>
                  @if (a.avg_score !== null) {
                    <div class="avg-score">Avg score: <strong>{{ a.avg_score }}</strong></div>
                  }
                </div>
              </mat-card-content>
            </mat-card>
          }
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

    .assignment-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
    .assignment-card { border-radius: 12px; border: 1px solid var(--m-border); }
    .assignment-card mat-card-content { padding: 20px; display: flex; flex-direction: column; gap: 12px; }
    .card-header { display: flex; flex-direction: column; gap: 2px; }
    .card-title { font-size: 16px; font-weight: 600; color: var(--m-text); }
    .card-course { font-size: 13px; color: var(--m-primary); font-weight: 500; }
    .card-meta { display: flex; gap: 16px; flex-wrap: wrap; font-size: 12px; color: var(--m-text-secondary); }
    .meta-item { display: flex; align-items: center; gap: 4px; }
    .meta-item mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .meta-item .published { color: #16a34a; }
    .meta-item .draft { color: #d97706; }
    .type-badge { align-self: flex-start; padding: 2px 10px; border-radius: 100px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; }
    .type-badge.physical { background: #fef3c7; color: #92400e; }
    .type-badge.online_text { background: #dbeafe; color: #1e40af; }
    .type-badge.file_upload { background: #dcfce7; color: #166534; }
    .type-badge.quiz { background: #e0e7ff; color: #3730a3; }
    .progress-section { display: flex; flex-direction: column; gap: 6px; }
    .progress-row { display: flex; justify-content: space-between; font-size: 12px; color: var(--m-text-secondary); }
    .progress-value { font-weight: 600; color: var(--m-text); }
    .bar { height: 5px; background: var(--m-border); border-radius: 100px; overflow: hidden; }
    .fill { height: 100%; border-radius: 100px; transition: width .5s ease; }
    .fill.submitted { background: var(--m-primary); }
    .fill.graded { background: #16a34a; }
    .avg-score { font-size: 12px; color: var(--m-text-secondary); }
    .avg-score strong { color: var(--m-text); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignmentsListComponent {
  readonly service = inject(AssignmentsService);
  constructor() { this.service.fetchAll(); }
}
