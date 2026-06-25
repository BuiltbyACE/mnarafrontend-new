import { Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { ExamService, ExamSeries } from '../../core/services/exam.service';

@Component({
  selector: 'app-exam-list',
  standalone: true,
  imports: [RouterLink, DatePipe, FormsModule, MatTableModule, MatIconModule, MatButtonModule, MatCardModule, MatChipsModule, MatMenuModule],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <h1 class="page-title">Exam Results</h1>
          <p class="page-subtitle">Manage exam series, components, and student scores</p>
        </div>
        <button class="btn-primary" (click)="showCreateForm.set(true)">
          <mat-icon>add</mat-icon> New Exam Series
        </button>
      </header>

      @if (service.error(); as err) {
        <div class="error-banner">{{ err }}</div>
      }

      @if (showCreateForm()) {
        <mat-card class="form-card">
          <h2 class="form-title">Create Exam Series</h2>
          <div class="form-row">
            <input class="form-input" placeholder="Exam name (e.g. Mid-Term 2026)" [(ngModel)]="newName" />
            <input class="form-input" type="date" [(ngModel)]="newStartDate" placeholder="Start date" />
            <input class="form-input" type="date" [(ngModel)]="newEndDate" placeholder="End date" />
          </div>
          <div class="form-actions">
            <button class="btn-cancel" (click)="showCreateForm.set(false)">Cancel</button>
            <button class="btn-primary" (click)="createSeries()" [disabled]="!newName()">Create</button>
          </div>
        </mat-card>
      }

      <mat-card class="table-card">
        <table mat-table [dataSource]="examSeries()" class="exam-table">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Exam Series</th>
            <td mat-cell *matCellDef="let s">
              <a class="series-link" [routerLink]="['/teacher/exams', s.id]">{{ s.name }}</a>
            </td>
          </ng-container>

          <ng-container matColumnDef="term">
            <th mat-header-cell *matHeaderCellDef>Term</th>
            <td mat-cell *matCellDef="let s">{{ s.term_name }}</td>
          </ng-container>

          <ng-container matColumnDef="dates">
            <th mat-header-cell *matHeaderCellDef>Dates</th>
            <td mat-cell *matCellDef="let s">
              {{ s.start_date | date:'MMM d' }} – {{ s.end_date | date:'MMM d, y' }}
            </td>
          </ng-container>

          <ng-container matColumnDef="weighting">
            <th mat-header-cell *matHeaderCellDef>Weighting</th>
            <td mat-cell *matCellDef="let s">{{ s.term_weighting_percentage }}%</td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let s">
              <span class="status-chip" [class.published]="s.is_published">
                {{ s.is_published ? 'Published' : 'Draft' }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let s">
              <button mat-icon-button [matMenuTriggerFor]="menu"><mat-icon>more_vert</mat-icon></button>
              <mat-menu #menu="matMenu">
                <button mat-menu-item [routerLink]="['/teacher/exams', s.id]"><mat-icon>visibility</mat-icon> View</button>
                <button mat-menu-item (click)="deleteSeries(s)"><mat-icon>delete</mat-icon> Delete</button>
              </mat-menu>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

        @if (examSeries().length === 0 && !service.isLoading()) {
          <div class="empty-state">
            <mat-icon class="empty-icon">assignment</mat-icon>
            <p>No exam series yet. Create your first one above.</p>
          </div>
        }
      </mat-card>
    </div>
  `,
  styles: [`
    :host { display: block; font-family: 'Inter', sans-serif; }
    .page { padding: 24px 32px; max-width: 1200px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0; }
    .page-subtitle { font-size: 0.875rem; color: #64748b; margin: 4px 0 0; }
    .btn-primary { display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px; border: none; border-radius: 8px; background: #2563eb; color: #fff; font-size: 0.875rem; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; transition: background .15s; }
    .btn-primary:hover { background: #1d4ed8; }
    .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
    .btn-cancel { padding: 10px 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: white; color: #475569; font-size: 0.875rem; font-weight: 500; cursor: pointer; font-family: 'Inter', sans-serif; }
    .error-banner { padding: 12px 16px; background: #fee2e2; color: #991b1b; border-radius: 8px; font-size: 0.875rem; margin-bottom: 16px; }
    .form-card { padding: 24px; margin-bottom: 24px; border-radius: 12px; border: 1px solid #e2e8f0; }
    .form-title { font-size: 1rem; font-weight: 600; color: #0f172a; margin: 0 0 16px; }
    .form-row { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
    .form-input { flex: 1; min-width: 200px; padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem; font-family: 'Inter', sans-serif; color: #1e293b; }
    .form-input:focus { outline: 2px solid #2563eb; outline-offset: -1px; }
    .form-actions { display: flex; gap: 8px; justify-content: flex-end; }
    .table-card { border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
    .exam-table { width: 100%; }
    .series-link { color: #2563eb; text-decoration: none; font-weight: 500; }
    .series-link:hover { text-decoration: underline; }
    .status-chip { display: inline-block; padding: 3px 10px; border-radius: 100px; font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; background: #f1f5f9; color: #64748b; }
    .status-chip.published { background: #dcfce7; color: #16a34a; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 48px; color: #94a3b8; }
    .empty-icon { font-size: 40px; width: 40px; height: 40px; margin-bottom: 8px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamListComponent {
  readonly service = inject(ExamService);
  private router = inject(Router);

  readonly displayedColumns = ['name', 'term', 'dates', 'weighting', 'status', 'actions'];
  readonly examSeries = this.service.examSeries;
  readonly showCreateForm = signal(false);
  readonly newName = signal('');
  readonly newStartDate = signal('');
  readonly newEndDate = signal('');

  constructor() {
    this.service.fetchExamSeries();
  }

  createSeries(): void {
    if (!this.newName()) return;
    this.service.createExamSeries({
      name: this.newName(),
      start_date: this.newStartDate(),
      end_date: this.newEndDate(),
      term_weighting_percentage: 100,
      is_published: false,
    } as any).subscribe({
      next: () => {
        this.showCreateForm.set(false);
        this.newName.set('');
        this.newStartDate.set('');
        this.newEndDate.set('');
        this.service.fetchExamSeries();
      },
    });
  }

  deleteSeries(s: ExamSeries): void {
    if (!confirm(`Delete "${s.name}"? This cannot be undone.`)) return;
    this.service.deleteExamSeries(s.id).subscribe({
      next: () => this.service.fetchExamSeries(),
    });
  }
}
