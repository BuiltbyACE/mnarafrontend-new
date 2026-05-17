import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { NgClass } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { GradeDistribution } from '../../shared/models/teacher.models';

interface PendingItem {
  id: number;
  title: string;
  submissionCount: number;
  dueDate: string;
  subject: string;
  class: string;
}

interface SubjectAverage {
  subject: string;
  averageScore: number;
  classRank: number;
}

@Component({
  selector: 'app-teacher-grading',
  standalone: true,
  imports: [NgClass, MatCardModule, MatIconModule, MatButtonModule, MatChipsModule, MatTableModule, MatFormFieldModule, MatSelectModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Grading & Exams</h1>
          <p class="page-subtitle">Manage assessments, grades, and exam results</p>
        </div>
      </div>

      <div class="filters-bar">
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Exam Series</mat-label>
          <mat-select [value]="selectedSeries()" (selectionChange)="selectedSeries.set($event.value)">
            <mat-option value="Term 1 2026">Term 1 2026</mat-option>
            <mat-option value="Term 2 2026">Term 2 2026</mat-option>
            <mat-option value="Term 3 2026">Term 3 2026</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Subject</mat-label>
          <mat-select [value]="selectedSubject()" (selectionChange)="selectedSubject.set($event.value)">
            <mat-option value="All">All Subjects</mat-option>
            <mat-option value="Mathematics">Mathematics</mat-option>
            <mat-option value="Physics">Physics</mat-option>
            <mat-option value="Chemistry">Chemistry</mat-option>
            <mat-option value="Biology">Biology</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div class="section">
        <h2 class="section-title">Pending Grading</h2>
        <div class="pending-grid">
          @for (item of pendingItems(); track item.id) {
          <mat-card class="pending-card">
            <div class="pending-content">
              <div class="pending-info">
                <h3 class="pending-title">{{ item.title }}</h3>
                <div class="pending-meta">
                  <span class="pending-meta-item">
                    <mat-icon>people</mat-icon>
                    {{ item.submissionCount }} submissions
                  </span>
                  <span class="pending-meta-item">
                    <mat-icon>calendar_today</mat-icon>
                    Due {{ item.dueDate }}
                  </span>
                  <span class="pending-meta-item">
                    <mat-icon>school</mat-icon>
                    {{ item.subject }} &mdash; {{ item.class }}
                  </span>
                </div>
              </div>
              <button class="btn-primary" (click)="gradeItem(item)">
                <mat-icon>rate_review</mat-icon>
                Grade Now
              </button>
            </div>
          </mat-card>
          }
        </div>
        @if (pendingItems().length === 0) {
        <div class="empty-state">
          <mat-icon class="empty-icon">check_circle</mat-icon>
          <p>All assignments graded. Great work!</p>
        </div>
        }
      </div>

      <div class="section">
        <h2 class="section-title">Grade Distribution</h2>
        <mat-card class="distribution-card">
          <div class="distribution-bars">
            @for (d of gradeDistribution(); track d.grade) {
            <div class="bar-row">
              <span class="bar-label">{{ d.grade }}</span>
              <div class="bar-track">
                <div class="bar-fill" [style.width.%]="d.percentage" [class.bar-a]="d.grade === 'A'"
                     [class.bar-b]="d.grade === 'B'" [class.bar-c]="d.grade === 'C'"
                     [class.bar-d]="d.grade === 'D'" [class.bar-f]="d.grade === 'F'"></div>
              </div>
              <div class="bar-stats">
                <span class="bar-count">{{ d.count }} students</span>
                <span class="bar-pct">{{ d.percentage }}%</span>
              </div>
            </div>
            }
          </div>
        </mat-card>
      </div>

      <div class="section">
        <h2 class="section-title">Subject Averages</h2>
        <mat-card class="table-card">
          <table mat-table [dataSource]="subjectAverages()" class="averages-table">
            <ng-container matColumnDef="subject">
              <th mat-header-cell *matHeaderCellDef>Subject</th>
              <td mat-cell *matCellDef="let s">
                <span class="subject-name">{{ s.subject }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="averageScore">
              <th mat-header-cell *matHeaderCellDef>Average Score</th>
              <td mat-cell *matCellDef="let s">
                <div class="avg-score-cell">
                  <span class="avg-score-value" [class.score-high]="s.averageScore >= 75"
                        [class.score-mid]="s.averageScore >= 50 && s.averageScore < 75"
                        [class.score-low]="s.averageScore < 50">
                    {{ s.averageScore }}%
                  </span>
                  <div class="avg-bar">
                    <div class="avg-bar-fill" [style.width.%]="s.averageScore"
                         [class.bar-a]="s.averageScore >= 75"
                         [class.bar-b]="s.averageScore >= 50 && s.averageScore < 75"
                         [class.bar-c]="s.averageScore < 50"></div>
                  </div>
                </div>
              </td>
            </ng-container>
            <ng-container matColumnDef="classRank">
              <th mat-header-cell *matHeaderCellDef>Class Rank</th>
              <td mat-cell *matCellDef="let s">
                <span class="rank-badge">#{{ s.classRank }}</span>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="['subject', 'averageScore', 'classRank']"></tr>
            <tr mat-row *matRowDef="let row; columns: ['subject', 'averageScore', 'classRank'];" class="table-row"></tr>
          </table>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --mnara-primary: #2563eb;
      --mnara-primary-light: #dbeafe;
      --mnara-primary-dark: #1d4ed8;
      --mnara-surface: #ffffff;
      --mnara-bg: #f1f5f9;
      --mnara-text: #1e293b;
      --mnara-text-secondary: #64748b;
      --mnara-border: #e2e8f0;
      --mnara-success: #10b981;
      --mnara-success-bg: #d1fae5;
      --mnara-error: #ef4444;
      --mnara-error-bg: #fee2e2;
      --mnara-warning: #f59e0b;
      --mnara-warning-bg: #fef3c7;
      --mnara-gray: #6b7280;
      --mnara-gray-bg: #f3f4f6;
      display: block;
      font-family: 'Inter', sans-serif;
      background: var(--mnara-bg);
      min-height: 100vh;
      padding: 24px;
    }
    .page { max-width: 1200px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: var(--mnara-text); margin: 0; }
    .page-subtitle { font-size: 0.875rem; color: var(--mnara-text-secondary); margin: 4px 0 0; }
    .filters-bar { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
    .filter-field { width: 220px; }
    .section { margin-bottom: 32px; }
    .section-title { font-size: 1.125rem; font-weight: 600; color: var(--mnara-text); margin: 0 0 16px; }
    .btn-primary {
      display: inline-flex; align-items: center; gap: 8px;
      background: var(--mnara-primary); color: white; border: none;
      padding: 10px 20px; border-radius: 8px; font-size: 0.875rem;
      font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif;
      transition: background 0.15s ease; white-space: nowrap;
    }
    .btn-primary:hover { background: var(--mnara-primary-dark); }
    .btn-primary mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .pending-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 16px; }
    .pending-card { border-radius: 12px; border: 1px solid var(--mnara-border); padding: 20px; }
    .pending-content { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
    .pending-info { flex: 1; min-width: 0; }
    .pending-title { font-size: 1rem; font-weight: 600; color: var(--mnara-text); margin: 0 0 12px; }
    .pending-meta { display: flex; flex-direction: column; gap: 6px; }
    .pending-meta-item { display: flex; align-items: center; gap: 6px; font-size: 0.8125rem; color: var(--mnara-text-secondary); }
    .pending-meta-item mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .distribution-card { border-radius: 12px; border: 1px solid var(--mnara-border); padding: 24px; }
    .distribution-bars { display: flex; flex-direction: column; gap: 16px; }
    .bar-row { display: flex; align-items: center; gap: 16px; }
    .bar-label { width: 24px; font-size: 0.875rem; font-weight: 700; color: var(--mnara-text); text-align: center; }
    .bar-track { flex: 1; height: 28px; background: #f1f5f9; border-radius: 6px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 6px; transition: width 0.5s ease; min-width: 4px; }
    .bar-a { background: var(--mnara-success); }
    .bar-b { background: var(--mnara-primary); }
    .bar-c { background: var(--mnara-warning); }
    .bar-d { background: #f97316; }
    .bar-f { background: var(--mnara-error); }
    .bar-stats { width: 140px; display: flex; justify-content: space-between; flex-shrink: 0; }
    .bar-count { font-size: 0.8125rem; color: var(--mnara-text-secondary); }
    .bar-pct { font-size: 0.8125rem; font-weight: 600; color: var(--mnara-text); }
    .table-card { border-radius: 12px; border: 1px solid var(--mnara-border); overflow: hidden; }
    .averages-table { width: 100%; }
    .averages-table .mat-mdc-header-cell {
      background: #f8fafc; color: var(--mnara-text-secondary); font-size: 0.75rem;
      font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
      padding: 12px 16px; border-bottom: 1px solid var(--mnara-border);
    }
    .averages-table .mat-mdc-cell {
      padding: 16px; font-size: 0.875rem; color: var(--mnara-text);
      border-bottom: 1px solid #f1f5f9;
    }
    .table-row { transition: background 0.1s ease; }
    .table-row:hover { background: #f8fafc; }
    .table-row:last-child .mat-mdc-cell { border-bottom: none; }
    .subject-name { font-weight: 500; }
    .avg-score-cell { display: flex; flex-direction: column; gap: 6px; }
    .avg-score-value { font-weight: 600; font-size: 0.9375rem; }
    .score-high { color: #065f46; }
    .score-mid { color: var(--mnara-primary-dark); }
    .score-low { color: #991b1b; }
    .avg-bar { width: 140px; height: 6px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
    .avg-bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
    .bar-a { background: var(--mnara-success); }
    .bar-b { background: var(--mnara-primary); }
    .bar-c { background: var(--mnara-error); }
    .rank-badge {
      display: inline-flex; align-items: center; padding: 2px 10px;
      background: var(--mnara-primary-light); color: var(--mnara-primary-dark);
      border-radius: 100px; font-size: 0.8125rem; font-weight: 600;
    }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 32px 24px; color: var(--mnara-text-secondary); }
    .empty-icon { font-size: 40px; width: 40px; height: 40px; margin-bottom: 8px; opacity: 0.4; }
    .empty-state p { font-size: 0.9375rem; margin: 0; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GradingComponent {

  readonly selectedSeries = signal<string>('Term 2 2026');
  readonly selectedSubject = signal<string>('All');

  readonly pendingItems = signal<PendingItem[]>([
    { id: 1, title: 'Algebra Quiz 1', submissionCount: 22, dueDate: 'Jun 15, 2026', subject: 'Mathematics', class: 'Form 2A' },
    { id: 2, title: 'Organic Chemistry Essay', submissionCount: 15, dueDate: 'Jun 28, 2026', subject: 'Chemistry', class: 'Form 4A' },
    { id: 3, title: 'Thermodynamics Lab Report', submissionCount: 18, dueDate: 'Jun 22, 2026', subject: 'Physics', class: 'Form 3B' },
    { id: 4, title: 'Genetics Research Project', submissionCount: 8, dueDate: 'Jul 10, 2026', subject: 'Biology', class: 'Form 1C' },
  ]);

  readonly gradeDistribution = signal<GradeDistribution[]>([
    { grade: 'A', count: 42, percentage: 28 },
    { grade: 'B', count: 55, percentage: 37 },
    { grade: 'C', count: 31, percentage: 21 },
    { grade: 'D', count: 14, percentage: 9 },
    { grade: 'F', count: 8, percentage: 5 },
  ]);

  readonly subjectAverages = signal<SubjectAverage[]>([
    { subject: 'Mathematics', averageScore: 72, classRank: 2 },
    { subject: 'Physics', averageScore: 68, classRank: 3 },
    { subject: 'Chemistry', averageScore: 74, classRank: 1 },
    { subject: 'Biology', averageScore: 65, classRank: 4 },
  ]);

  gradeItem(item: PendingItem) {
  }
}
