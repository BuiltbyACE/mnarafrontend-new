import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { getApiUrl } from '@sms/core/config';
import { ExamService, ExamSeries, ExamComponent, StudentExamResult } from '../../core/services/exam.service';

@Component({
  selector: 'app-exam-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, FormsModule, MatTableModule, MatIconModule, MatButtonModule, MatCardModule, MatChipsModule, MatMenuModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <div class="page">
      <a class="back-link" routerLink="/teacher/exams"><mat-icon>arrow_back</mat-icon> Back to Exam Series</a>

      @if (series(); as s) {
        <header class="series-header">
          <div>
            <h1 class="series-title">{{ s.name }}</h1>
            <p class="series-meta">{{ s.term_name }} · {{ s.start_date | date:'MMM d' }} – {{ s.end_date | date:'MMM d, y' }} · Weighting: {{ s.term_weighting_percentage }}%</p>
          </div>
          <div class="header-actions">
            <span class="status-chip" [class.published]="s.is_published">{{ s.is_published ? 'Published' : 'Draft' }}</span>
            <button class="btn-primary" (click)="showComponentForm.set(true)"><mat-icon>add</mat-icon> Add Component</button>
          </div>
        </header>

        @if (showComponentForm()) {
          <mat-card class="form-card">
            <h3>Add Component</h3>
            <div class="form-row">
              <input class="form-input" placeholder="Component name (e.g. Paper 1)" [(ngModel)]="newCompName" />
              <input class="form-input" type="number" placeholder="Max score" [(ngModel)]="newCompMaxScore" />
            </div>
            <div class="form-actions">
              <button class="btn-cancel" (click)="showComponentForm.set(false)">Cancel</button>
              <button class="btn-primary" (click)="addComponent()" [disabled]="!newCompName()">Add</button>
            </div>
          </mat-card>
        }

        @if (components().length > 0) {
          <mat-card class="table-card">
            <div class="table-header">
              <h2>Components</h2>
            </div>
            <table mat-table [dataSource]="components()" class="comp-table">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Component</th>
                <td mat-cell *matCellDef="let c">{{ c.name }}</td>
              </ng-container>
              <ng-container matColumnDef="course">
                <th mat-header-cell *matHeaderCellDef>Course</th>
                <td mat-cell *matCellDef="let c">{{ c.course_name }}</td>
              </ng-container>
              <ng-container matColumnDef="maxScore">
                <th mat-header-cell *matHeaderCellDef>Max Score</th>
                <td mat-cell *matCellDef="let c">{{ c.max_score }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let c">
                  <button mat-icon-button [matMenuTriggerFor]="compMenu"><mat-icon>more_vert</mat-icon></button>
                  <mat-menu #compMenu="matMenu">
                    <button mat-menu-item (click)="selectComponent(c)"><mat-icon>grade</mat-icon> Enter Scores</button>
                    <button mat-menu-item (click)="deleteComponent(c)"><mat-icon>delete</mat-icon> Delete</button>
                  </mat-menu>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="['name', 'course', 'maxScore', 'actions']"></tr>
              <tr mat-row *matRowDef="let row; columns: ['name', 'course', 'maxScore', 'actions'];"></tr>
            </table>
          </mat-card>
        }

        @if (selectedComponent(); as comp) {
          <mat-card class="table-card results-card">
            <div class="table-header">
              <h2>Scores: {{ comp.name }}</h2>
              <span class="result-count">{{ results().length }} students</span>
            </div>
            <table mat-table [dataSource]="results()" class="results-table">
              <ng-container matColumnDef="student">
                <th mat-header-cell *matHeaderCellDef>Student</th>
                <td mat-cell *matCellDef="let r">{{ r.student_name }}</td>
              </ng-container>
              <ng-container matColumnDef="score">
                <th mat-header-cell *matHeaderCellDef>Score / {{ comp.max_score }}</th>
                <td mat-cell *matCellDef="let r">
                  <input class="score-input" type="number" [value]="r.raw_score" (change)="updateScore(r, $any($event.target).value)" [max]="comp.max_score" min="0" />
                </td>
              </ng-container>
              <ng-container matColumnDef="grade">
                <th mat-header-cell *matHeaderCellDef>Grade</th>
                <td mat-cell *matCellDef="let r">
                  <span class="grade-badge">{{ r.computed_grade || '—' }}</span>
                </td>
              </ng-container>
              <ng-container matColumnDef="comment">
                <th mat-header-cell *matHeaderCellDef>Comment</th>
                <td mat-cell *matCellDef="let r">
                  <input class="comment-input" [value]="r.teacher_comment" (change)="updateComment(r, $any($event.target).value)" placeholder="Optional comment" />
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="['student', 'score', 'grade', 'comment']"></tr>
              <tr mat-row *matRowDef="let row; columns: ['student', 'score', 'grade', 'comment'];"></tr>
            </table>
            @if (results().length === 0) {
              <div class="empty-state"><p>No scores yet. Select a component and enter scores above.</p></div>
            }
          </mat-card>
        }

        @if (gradeDist(); as gd) {
          <mat-card class="table-card">
            <h2 style="padding: 20px 24px 0; margin: 0; font-size: 1rem;">Grade Distribution</h2>
            <div class="dist-chart">
              @for (g of gd.distribution; track g.grade) {
                <div class="dist-bar-row">
                  <span class="dist-label">{{ g.grade }}</span>
                  <div class="dist-track">
                    <div class="dist-fill" [style.width.%]="g.percentage" [style.background]="gradeColor(g.grade)"></div>
                  </div>
                  <span class="dist-count">{{ g.count }} ({{ g.percentage }}%)</span>
                </div>
              }
            </div>
          </mat-card>
        }
      } @else {
        <div class="loading-state"><p>Loading exam series...</p></div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; font-family: 'Inter', sans-serif; }
    .page { padding: 24px 32px; max-width: 1200px; }
    .back-link { display: inline-flex; align-items: center; gap: 4px; color: #2563eb; text-decoration: none; font-size: 13px; font-weight: 500; margin-bottom: 16px; }
    .back-link mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .series-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
    .series-title { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0 0 4px; }
    .series-meta { font-size: 0.875rem; color: #64748b; }
    .header-actions { display: flex; align-items: center; gap: 12px; }
    .status-chip { padding: 3px 10px; border-radius: 100px; font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; background: #f1f5f9; color: #64748b; }
    .status-chip.published { background: #dcfce7; color: #16a34a; }
    .btn-primary { display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px; border: none; border-radius: 8px; background: #2563eb; color: #fff; font-size: 0.875rem; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; }
    .btn-primary:hover { background: #1d4ed8; }
    .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
    .btn-cancel { padding: 10px 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: white; color: #475569; font-size: 0.875rem; font-weight: 500; cursor: pointer; }
    .form-card { padding: 24px; margin-bottom: 24px; border-radius: 12px; border: 1px solid #e2e8f0; }
    .form-card h3 { font-size: 1rem; font-weight: 600; margin: 0 0 16px; }
    .form-row { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
    .form-input { flex: 1; min-width: 200px; padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem; font-family: 'Inter', sans-serif; }
    .form-actions { display: flex; gap: 8px; justify-content: flex-end; }
    .table-card { border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; margin-bottom: 24px; }
    .table-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #e2e8f0; }
    .table-header h2 { font-size: 1rem; font-weight: 600; margin: 0; }
    .result-count { font-size: 0.8125rem; color: #64748b; }
    .comp-table, .results-table { width: 100%; }
    .score-input { width: 80px; padding: 6px 8px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.875rem; text-align: center; font-family: 'Inter', sans-serif; }
    .score-input:focus { outline: 2px solid #2563eb; }
    .comment-input { width: 100%; min-width: 150px; padding: 6px 8px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.8125rem; font-family: 'Inter', sans-serif; }
    .grade-badge { padding: 2px 8px; border-radius: 100px; font-size: 0.75rem; font-weight: 600; background: #dbeafe; color: #1d4ed8; }
    .empty-state { text-align: center; padding: 32px; color: #94a3b8; }
    .loading-state { text-align: center; padding: 48px; color: #64748b; }
    .dist-chart { padding: 20px 24px; display: flex; flex-direction: column; gap: 8px; }
    .dist-bar-row { display: flex; align-items: center; gap: 12px; }
    .dist-label { width: 30px; font-weight: 600; font-size: 0.8125rem; color: #0f172a; }
    .dist-track { flex: 1; height: 20px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
    .dist-fill { height: 100%; border-radius: 4px; transition: width .3s ease; min-width: 4px; }
    .dist-count { width: 100px; font-size: 0.75rem; color: #64748b; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamDetailComponent {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  readonly service = inject(ExamService);

  readonly series = signal<ExamSeries | null>(null);
  readonly components = signal<ExamComponent[]>([]);
  readonly results = signal<StudentExamResult[]>([]);
  readonly gradeDist = this.service.gradeDistribution;

  readonly showComponentForm = signal(false);
  readonly newCompName = signal('');
  readonly newCompMaxScore = signal(100);
  readonly selectedComponent = signal<ExamComponent | null>(null);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadSeries(Number(id));
    }
  }

  private loadSeries(id: number): void {
    this.service.fetchExamSeries();
    this.http.get<ExamSeries>(getApiUrl(`/lms/exam-series/${id}/`)).subscribe({
      next: (data) => this.series.set(data),
    });
    this.http.get<ExamComponent[]>(getApiUrl(`/lms/exam-components/?series=${id}`)).subscribe({
      next: (data) => this.components.set(data),
    });
    this.service.fetchGradeDistribution();
  }

  addComponent(): void {
    const s = this.series();
    if (!s || !this.newCompName()) return;
    this.service.createComponent({
      series: s.id,
      name: this.newCompName(),
      max_score: Number(this.newCompMaxScore()),
    } as any).subscribe({
      next: () => {
        this.showComponentForm.set(false);
        this.newCompName.set('');
        this.newCompMaxScore.set(100);
        this.http.get<ExamComponent[]>(getApiUrl(`/lms/exam-components/?series=${s.id}`)).subscribe({
          next: (data) => this.components.set(data),
        });
      },
    });
  }

  deleteComponent(c: ExamComponent): void {
    if (!confirm(`Delete component "${c.name}"?`)) return;
    this.service.deleteComponent(c.id).subscribe({
      next: () => this.components.update(list => list.filter(x => x.id !== c.id)),
    });
  }

  selectComponent(c: ExamComponent): void {
    this.selectedComponent.set(c);
    this.http.get<StudentExamResult[]>(getApiUrl(`/lms/exam-results/?component=${c.id}`)).subscribe({
      next: (data) => this.results.set(data),
    });
  }

  updateScore(r: StudentExamResult, value: string): void {
    const score = value === '' ? null : Number(value);
    if (r.id) {
      this.service.updateResult(r.id, { raw_score: score } as any).subscribe({
        next: (updated) => {
          this.results.update(list => list.map(item => item.id === updated.id ? updated : item));
        },
      });
    } else {
      this.service.createResult({ component: r.component, student: r.student, raw_score: score } as any).subscribe({
        next: (created) => {
          this.results.update(list => list.map(item => item.id === created.id ? created : item));
        },
      });
    }
  }

  updateComment(r: StudentExamResult, value: string): void {
    if (r.id) {
      this.service.updateResult(r.id, { teacher_comment: value } as any).subscribe();
    }
  }

  gradeColor(grade: string): string {
    const colors: Record<string, string> = {
      'A*': '#16a34a', 'A': '#22c55e', 'B': '#3b82f6',
      'C': '#eab308', 'D': '#f97316', 'E': '#ef4444', 'U': '#991b1b',
    };
    return colors[grade] || '#94a3b8';
  }
}
