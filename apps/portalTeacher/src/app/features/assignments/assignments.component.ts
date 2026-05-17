import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { DatePipe, NgClass, NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { Assignment } from '../../shared/models/teacher.models';
import { TeacherAssignmentService } from '../../core/services/teacher-assignment.service';

type FilterType = 'ALL' | 'QUIZ' | 'ONLINE_TEXT' | 'FILE_UPLOAD' | 'PHYSICAL';

@Component({
  selector: 'app-teacher-assignments',
  standalone: true,
  imports: [DatePipe, NgClass, NgIf, MatCardModule, MatIconModule, MatButtonModule, MatChipsModule, MatTableModule, MatMenuModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Assignments</h1>
          <p class="page-subtitle">Manage and track class assignments</p>
        </div>
        <button class="btn-primary" (click)="createAssignment()">
          <mat-icon>add</mat-icon>
          Create Assignment
        </button>
      </div>

      <mat-card class="filter-card">
        <div class="filter-row">
          <div class="filter-group">
            <button class="filter-btn" [class.active]="activeFilter() === 'ALL'" (click)="setFilter('ALL')">All</button>
            <button class="filter-btn" [class.active]="activeFilter() === 'QUIZ'" (click)="setFilter('QUIZ')">Quiz</button>
            <button class="filter-btn" [class.active]="activeFilter() === 'ONLINE_TEXT'" (click)="setFilter('ONLINE_TEXT')">Online Text</button>
            <button class="filter-btn" [class.active]="activeFilter() === 'FILE_UPLOAD'" (click)="setFilter('FILE_UPLOAD')">File Upload</button>
            <button class="filter-btn" [class.active]="activeFilter() === 'PHYSICAL'" (click)="setFilter('PHYSICAL')">Physical</button>
          </div>
          <span class="result-count">{{ filteredAssignments().length }} assignment{{ filteredAssignments().length !== 1 ? 's' : '' }}</span>
        </div>
      </mat-card>

      <mat-card class="table-card">
        <div class="table-wrapper">
          <table mat-table [dataSource]="filteredAssignments()" class="assignments-table">

            <ng-container matColumnDef="title">
              <th mat-header-cell *matHeaderCellDef>Title</th>
              <td mat-cell *matCellDef="let a">
                <div class="title-cell">
                  <mat-icon class="title-icon" [style.color]="typeIconColor(a.type)">description</mat-icon>
                  <span>{{ a.title }}</span>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let a">
                <span class="type-badge"
                      [class.type-quiz]="a.type === 'QUIZ'"
                      [class.type-online-text]="a.type === 'ONLINE_TEXT'"
                      [class.type-file-upload]="a.type === 'FILE_UPLOAD'"
                      [class.type-physical]="a.type === 'PHYSICAL'">
                  {{ typeLabel(a.type) }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="class">
              <th mat-header-cell *matHeaderCellDef>Class</th>
              <td mat-cell *matCellDef="let a">{{ a.class }}</td>
            </ng-container>

            <ng-container matColumnDef="subject">
              <th mat-header-cell *matHeaderCellDef>Subject</th>
              <td mat-cell *matCellDef="let a">{{ a.subject }}</td>
            </ng-container>

            <ng-container matColumnDef="dueDate">
              <th mat-header-cell *matHeaderCellDef>Due Date</th>
              <td mat-cell *matCellDef="let a">
                <span class="due-date" [class.overdue]="isOverdue(a.dueDate)">
                  <mat-icon *ngIf="isOverdue(a.dueDate)" class="overdue-icon">warning</mat-icon>
                  {{ a.dueDate | date:'MMM d, y' }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="submissions">
              <th mat-header-cell *matHeaderCellDef>Submissions</th>
              <td mat-cell *matCellDef="let a">
                <span class="submissions-count">{{ a.submissions }}/{{ a.totalStudents }}</span>
                <div class="submissions-bar">
                  <div class="submissions-fill" [style.width.%]="(a.submissions / a.totalStudents) * 100"></div>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let a">
                <span class="status-badge"
                      [class.status-open]="a.status === 'OPEN'"
                      [class.status-closed]="a.status === 'CLOSED'"
                      [class.status-draft]="a.status === 'DRAFT'">
                  {{ a.status }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let a">
                <button mat-icon-button [matMenuTriggerFor]="menu" class="actions-btn">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu" class="teacher-menu">
                  <button mat-menu-item (click)="viewAssignment(a)"><mat-icon>visibility</mat-icon> View</button>
                  <button mat-menu-item (click)="editAssignment(a)"><mat-icon>edit</mat-icon> Edit</button>
                  <button mat-menu-item (click)="viewSubmissions(a)"><mat-icon>assignment</mat-icon> Submissions</button>
                  <button mat-menu-item (click)="deleteAssignment(a)"><mat-icon>delete</mat-icon> Delete</button>
                </mat-menu>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="table-row"></tr>
          </table>
        </div>

        <div class="empty-state" *ngIf="filteredAssignments().length === 0">
          <mat-icon class="empty-icon">assignment</mat-icon>
          <p>No assignments match the selected filter.</p>
        </div>
      </mat-card>
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
    .btn-primary {
      display: inline-flex; align-items: center; gap: 8px;
      background: var(--mnara-primary); color: white; border: none;
      padding: 10px 20px; border-radius: 8px; font-size: 0.875rem;
      font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif;
      transition: background 0.15s ease;
    }
    .btn-primary:hover { background: var(--mnara-primary-dark); }
    .btn-primary mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .filter-card { padding: 16px 20px; margin-bottom: 16px; border-radius: 12px; border: 1px solid var(--mnara-border); }
    .filter-row { display: flex; justify-content: space-between; align-items: center; }
    .filter-group { display: flex; gap: 8px; flex-wrap: wrap; }
    .filter-btn {
      padding: 6px 16px; border-radius: 100px; border: 1px solid var(--mnara-border);
      background: var(--mnara-surface); color: var(--mnara-text-secondary);
      font-size: 0.8125rem; font-weight: 500; cursor: pointer;
      font-family: 'Inter', sans-serif; transition: all 0.15s ease;
    }
    .filter-btn:hover { border-color: var(--mnara-primary); color: var(--mnara-primary); }
    .filter-btn.active { background: var(--mnara-primary-light); border-color: var(--mnara-primary); color: var(--mnara-primary); }
    .result-count { font-size: 0.8125rem; color: var(--mnara-text-secondary); font-weight: 500; }
    .table-card { border-radius: 12px; border: 1px solid var(--mnara-border); overflow: hidden; }
    .table-wrapper { overflow-x: auto; }
    .assignments-table { width: 100%; }
    .assignments-table .mat-mdc-header-cell {
      background: #f8fafc; color: var(--mnara-text-secondary); font-size: 0.75rem;
      font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
      padding: 12px 16px; border-bottom: 1px solid var(--mnara-border);
    }
    .assignments-table .mat-mdc-cell {
      padding: 14px 16px; font-size: 0.875rem; color: var(--mnara-text);
      border-bottom: 1px solid #f1f5f9;
    }
    .table-row { transition: background 0.1s ease; }
    .table-row:hover { background: #f8fafc; }
    .table-row:last-child .mat-mdc-cell { border-bottom: none; }
    .title-cell { display: flex; align-items: center; gap: 10px; font-weight: 500; }
    .title-icon { font-size: 20px; width: 20px; height: 20px; }
    .type-badge {
      display: inline-flex; align-items: center; padding: 3px 10px;
      border-radius: 100px; font-size: 0.6875rem; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.03em;
    }
    .type-quiz { background: #ede9fe; color: #5b21b6; }
    .type-online-text { background: var(--mnara-primary-light); color: var(--mnara-primary-dark); }
    .type-file-upload { background: #ffedd5; color: #c2410c; }
    .type-physical { background: #d1fae5; color: #065f46; }
    .due-date { display: inline-flex; align-items: center; gap: 4px; }
    .due-date.overdue { color: var(--mnara-error); font-weight: 600; }
    .overdue-icon { font-size: 16px; width: 16px; height: 16px; }
    .submissions-count { font-weight: 500; font-size: 0.8125rem; }
    .submissions-bar { width: 100px; height: 4px; background: #e2e8f0; border-radius: 4px; margin-top: 4px; overflow: hidden; }
    .submissions-fill { height: 100%; background: var(--mnara-primary); border-radius: 4px; transition: width 0.3s ease; }
    .status-badge {
      display: inline-flex; align-items: center; padding: 3px 10px;
      border-radius: 100px; font-size: 0.6875rem; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.03em;
    }
    .status-open { background: var(--mnara-success-bg); color: #065f46; }
    .status-closed { background: var(--mnara-error-bg); color: #991b1b; }
    .status-draft { background: var(--mnara-gray-bg); color: var(--mnara-gray); }
    .actions-btn { color: var(--mnara-text-secondary); }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 48px 24px; color: var(--mnara-text-secondary); }
    .empty-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 12px; opacity: 0.4; }
    .empty-state p { font-size: 0.9375rem; margin: 0; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignmentsComponent {
  private router = inject(Router);
  private assignmentService = inject(TeacherAssignmentService);

  readonly displayedColumns = ['title', 'type', 'class', 'subject', 'dueDate', 'submissions', 'status', 'actions'];

  readonly activeFilter = signal<FilterType>('ALL');

  private readonly allAssignments = this.assignmentService.assignments;

  readonly filteredAssignments = computed(() => {
    const filter = this.activeFilter();
    if (filter === 'ALL') return this.allAssignments();
    return this.allAssignments().filter(a => a.type === filter);
  });

  constructor() {
    this.assignmentService.fetchAssignments();
  }

  setFilter(filter: FilterType) {
    this.activeFilter.set(filter);
  }

  typeLabel(type: string): string {
    switch (type) {
      case 'QUIZ': return 'Quiz';
      case 'ONLINE_TEXT': return 'Online Text';
      case 'FILE_UPLOAD': return 'File Upload';
      case 'PHYSICAL': return 'Physical';
      default: return type;
    }
  }

  typeIconColor(type: string): string {
    switch (type) {
      case 'QUIZ': return '#7c3aed';
      case 'ONLINE_TEXT': return '#2563eb';
      case 'FILE_UPLOAD': return '#ea580c';
      case 'PHYSICAL': return '#059669';
      default: return '#64748b';
    }
  }

  isOverdue(dueDate: string): boolean {
    return new Date(dueDate) < new Date();
  }

  createAssignment() { this.router.navigate(['/teacher/assignments/create']); }
  viewAssignment(a: Assignment) { this.router.navigate(['/teacher/assignments', a.id]); }
  editAssignment(a: Assignment) { this.router.navigate(['/teacher/assignments', a.id, 'edit']); }
  viewSubmissions(a: Assignment) { this.router.navigate(['/teacher/assignments', a.id, 'submissions']); }
  deleteAssignment(a: Assignment) {}
}
