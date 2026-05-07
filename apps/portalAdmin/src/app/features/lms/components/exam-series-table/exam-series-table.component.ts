import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ExaminationsService, ExamSeries } from '../../services/examinations.service';
import { ExamSeriesDialogComponent, ExamSeriesDialogData } from '../exam-series-dialog/exam-series-dialog.component';

function computeSeriesStatus(row: ExamSeries): { label: string; cssClass: string } {
  if (row.is_published !== undefined) {
    return row.is_published
      ? { label: 'Published', cssClass: 'published' }
      : { label: 'Draft', cssClass: 'draft' };
  }
  if (row.is_locked !== undefined) {
    return row.is_locked
      ? { label: 'Locked', cssClass: 'locked' }
      : { label: 'Open', cssClass: 'open' };
  }
  const s = row.status;
  switch (s) {
    case 'DRAFT': return { label: 'Draft', cssClass: 'draft' };
    case 'IN_PROGRESS': return { label: 'In Progress', cssClass: 'in-progress' };
    case 'COMPLETED': return { label: 'Completed', cssClass: 'completed' };
    case 'LOCKED': return { label: 'Locked', cssClass: 'locked' };
    default: return { label: (s ?? '').replace('_', ' '), cssClass: '' };
  }
}

@Component({
  selector: 'app-exam-series-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="table-container">
      <div class="table-header">
        <mat-form-field appearance="outline" class="search-field">
          <mat-icon matPrefix>search</mat-icon>
          <input matInput placeholder="Search exam series..." [(ngModel)]="searchQuery" />
        </mat-form-field>
        <button mat-flat-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          Add Exam Series
        </button>
      </div>

      @if (service.isLoading()) {
        <div class="loading-state">
          <mat-spinner diameter="30"></mat-spinner>
        </div>
      }

      <table mat-table [dataSource]="filteredSeries()" class="full-width-table">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let row">{{ row.name }}</td>
        </ng-container>

        <ng-container matColumnDef="academic_term">
          <th mat-header-cell *matHeaderCellDef>Term</th>
          <td mat-cell *matCellDef="let row">{{ row.academic_term?.name }}</td>
        </ng-container>

        <ng-container matColumnDef="exam_type">
          <th mat-header-cell *matHeaderCellDef>Type</th>
          <td mat-cell *matCellDef="let row">{{ row.exam_type }}</td>
        </ng-container>

        <ng-container matColumnDef="start_date">
          <th mat-header-cell *matHeaderCellDef>Start Date</th>
          <td mat-cell *matCellDef="let row">{{ row.start_date }}</td>
        </ng-container>

        <ng-container matColumnDef="end_date">
          <th mat-header-cell *matHeaderCellDef>End Date</th>
          <td mat-cell *matCellDef="let row">{{ row.end_date }}</td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let row">
            @let status = computeStatus(row);
            <mat-chip [class]="status.cssClass">
              {{ status.label }}
            </mat-chip>
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Actions</th>
          <td mat-cell *matCellDef="let row">
            <button mat-icon-button (click)="openEditDialog(row)">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button color="warn" (click)="deleteSeries(row)">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

        <tr class="mat-row" *matNoDataRow>
          <td class="mat-cell" [attr.colspan]="displayedColumns.length">
            No exam series found
          </td>
        </tr>
      </table>
    </div>
  `,
  styles: [`
    .table-container { padding: 16px; }
    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      gap: 16px;
    }
    .search-field { flex: 1; max-width: 400px; }
    .full-width-table { width: 100%; }
    .loading-state { display: flex; justify-content: center; padding: 24px; }

    mat-chip.draft { background: #f1f5f9; color: #475569; }
    mat-chip.in-progress { background: #dbeafe; color: #1e40af; }
    mat-chip.completed { background: #dcfce7; color: #166534; }
    mat-chip.locked { background: #fee2e2; color: #991b1b; }
    mat-chip.published { background: #dcfce7; color: #166534; }
    mat-chip.open { background: #dbeafe; color: #1e40af; }

    @media (max-width: 768px) {
      .table-header { flex-direction: column; align-items: stretch; }
      .search-field { max-width: 100%; }
    }
  `],
})
export class ExamSeriesTableComponent {
  readonly service = inject(ExaminationsService);
  readonly dialog = inject(MatDialog);

  searchQuery = '';
  displayedColumns = ['name', 'academic_term', 'exam_type', 'start_date', 'end_date', 'status', 'actions'];

  readonly filteredSeries = () => {
    const items = this.service.examSeries();
    if (!this.searchQuery) return items;
    const q = this.searchQuery.toLowerCase();
    return items.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.academic_term?.name?.toLowerCase().includes(q) ||
      s.exam_type.toLowerCase().includes(q)
    );
  };

  readonly computeStatus = computeSeriesStatus;

  openCreateDialog(): void {
    const dialogRef = this.dialog.open<ExamSeriesDialogComponent, ExamSeriesDialogData>(ExamSeriesDialogComponent, {
      width: '520px',
      data: { isEdit: false },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.createExamSeries(result).subscribe();
      }
    });
  }

  openEditDialog(series: ExamSeries): void {
    const dialogRef = this.dialog.open<ExamSeriesDialogComponent, ExamSeriesDialogData>(ExamSeriesDialogComponent, {
      width: '520px',
      data: { isEdit: true, series },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.updateExamSeries(series.id, result).subscribe();
      }
    });
  }

  deleteSeries(series: ExamSeries): void {
    if (confirm(`Delete exam series "${series.name}"?`)) {
      this.service.deleteExamSeries(series.id).subscribe();
    }
  }
}
