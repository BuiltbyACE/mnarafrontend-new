import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ExaminationsService, ExamResult } from '../../services/examinations.service';
import { ExamResultDialogComponent, ExamResultDialogData } from '../exam-result-dialog/exam-result-dialog.component';

@Component({
  selector: 'app-exam-results-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
     MatDialogModule,
     MatChipsModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="table-container">
       <div class="table-header">
         <div class="search-field">
           <input placeholder="Search results..." [(ngModel)]="searchQuery" />
         </div>
         <button mat-flat-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          Add Result
        </button>
      </div>

      @if (service.isLoading()) {
        <div class="loading-state">
          <mat-spinner diameter="30"></mat-spinner>
        </div>
      }

      <table mat-table [dataSource]="filteredResults()" class="full-width-table">
        <ng-container matColumnDef="student">
          <th mat-header-cell *matHeaderCellDef>Student</th>
          <td mat-cell *matCellDef="let row">{{ row.student?.first_name }} {{ row.student?.last_name }}</td>
        </ng-container>

        <ng-container matColumnDef="exam_component">
          <th mat-header-cell *matHeaderCellDef>Component</th>
          <td mat-cell *matCellDef="let row">{{ row.exam_component?.name }}</td>
        </ng-container>

        <ng-container matColumnDef="score">
          <th mat-header-cell *matHeaderCellDef>Score</th>
          <td mat-cell *matCellDef="let row">{{ row.score }}</td>
        </ng-container>

        <ng-container matColumnDef="grade">
          <th mat-header-cell *matHeaderCellDef>Grade</th>
          <td mat-cell *matCellDef="let row">
            <mat-chip [class.grade-pass]="row.grade !== 'F' && row.grade !== 'E'"
                      [class.grade-fail]="row.grade === 'F' || row.grade === 'E'">
              {{ row.grade }}
            </mat-chip>
          </td>
        </ng-container>

        <ng-container matColumnDef="remarks">
          <th mat-header-cell *matHeaderCellDef>Remarks</th>
          <td mat-cell *matCellDef="let row">{{ row.remarks || '—' }}</td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Actions</th>
          <td mat-cell *matCellDef="let row">
            <button mat-icon-button (click)="openEditDialog(row)">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button color="warn" (click)="deleteResult(row)">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

        <tr class="mat-row" *matNoDataRow>
          <td class="mat-cell" [attr.colspan]="displayedColumns.length">
            No exam results found
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
     .search-field input {
       width: 100%;
       max-width: 400px;
       padding: 10px 14px;
       border: 1px solid #d1d5db;
       border-radius: 8px;
       font-size: 14px;
       color: #1f2937;
       background: #fff;
       transition: border-color 0.15s;
       box-sizing: border-box;
     }
     .search-field input:focus {
       outline: none;
       border-color: #3b82f6;
       box-shadow: 0 0 0 2px rgba(59,130,246,0.2);
     }
     .full-width-table { width: 100%; }
     .loading-state { display: flex; justify-content: center; padding: 24px; }
    mat-chip.grade-pass { background: #dcfce7; color: #166534; }
    mat-chip.grade-fail { background: #fee2e2; color: #991b1b; }
    @media (max-width: 768px) {
      .table-header { flex-direction: column; align-items: stretch; }
      .search-field { max-width: 100%; }
    }
  `],
})
export class ExamResultsTableComponent {
  readonly service = inject(ExaminationsService);
  readonly dialog = inject(MatDialog);

  searchQuery = '';
  displayedColumns = ['student', 'exam_component', 'score', 'grade', 'remarks', 'actions'];

  readonly filteredResults = () => {
    const items = this.service.examResults();
    if (!this.searchQuery) return items;
    const q = this.searchQuery.toLowerCase();
    return items.filter(r =>
      r.student?.first_name?.toLowerCase().includes(q) ||
      r.student?.last_name?.toLowerCase().includes(q) ||
      r.exam_component?.name?.toLowerCase().includes(q) ||
      r.grade.toLowerCase().includes(q)
    );
  };

  openCreateDialog(): void {
    const dialogRef = this.dialog.open<ExamResultDialogComponent, ExamResultDialogData>(ExamResultDialogComponent, {
      width: '520px',
      data: { isEdit: false },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.createExamResult(result).subscribe();
      }
    });
  }

  openEditDialog(row: ExamResult): void {
    const dialogRef = this.dialog.open<ExamResultDialogComponent, ExamResultDialogData>(ExamResultDialogComponent, {
      width: '520px',
      data: { isEdit: true, result: row },
    });
    dialogRef.afterClosed().subscribe(formValue => {
      if (formValue) {
        this.service.updateExamResult(row.id, formValue).subscribe();
      }
    });
  }

  deleteResult(result: ExamResult): void {
    if (confirm(`Delete result for ${result.student?.first_name} ${result.student?.last_name}?`)) {
      this.service.deleteExamResult(result.id).subscribe();
    }
  }
}
