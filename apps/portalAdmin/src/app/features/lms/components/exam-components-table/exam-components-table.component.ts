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
import { ExaminationsService, ExamComponent } from '../../services/examinations.service';
import { ExamComponentDialogComponent, ExamComponentDialogData } from '../exam-component-dialog/exam-component-dialog.component';

@Component({
  selector: 'app-exam-components-table',
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
          <input matInput placeholder="Search components..." [(ngModel)]="searchQuery" />
        </mat-form-field>
        <button mat-flat-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          Add Component
        </button>
      </div>

      @if (service.isLoading()) {
        <div class="loading-state">
          <mat-spinner diameter="30"></mat-spinner>
        </div>
      }

      <table mat-table [dataSource]="filteredComponents()" class="full-width-table">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let row">{{ row.name }}</td>
        </ng-container>

        <ng-container matColumnDef="exam_series">
          <th mat-header-cell *matHeaderCellDef>Series</th>
          <td mat-cell *matCellDef="let row">{{ row.exam_series?.name }}</td>
        </ng-container>

        <ng-container matColumnDef="max_score">
          <th mat-header-cell *matHeaderCellDef>Max Score</th>
          <td mat-cell *matCellDef="let row">{{ row.max_score }}</td>
        </ng-container>

        <ng-container matColumnDef="weight">
          <th mat-header-cell *matHeaderCellDef>Weight</th>
          <td mat-cell *matCellDef="let row">{{ row.weight }}%</td>
        </ng-container>

        <ng-container matColumnDef="component_type">
          <th mat-header-cell *matHeaderCellDef>Type</th>
          <td mat-cell *matCellDef="let row">{{ row.component_type }}</td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Actions</th>
          <td mat-cell *matCellDef="let row">
            <button mat-icon-button (click)="openEditDialog(row)">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button color="warn" (click)="deleteComponent(row)">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

        <tr class="mat-row" *matNoDataRow>
          <td class="mat-cell" [attr.colspan]="displayedColumns.length">
            No exam components found
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
    @media (max-width: 768px) {
      .table-header { flex-direction: column; align-items: stretch; }
      .search-field { max-width: 100%; }
    }
  `],
})
export class ExamComponentsTableComponent {
  readonly service = inject(ExaminationsService);
  readonly dialog = inject(MatDialog);

  searchQuery = '';
  displayedColumns = ['name', 'exam_series', 'max_score', 'weight', 'component_type', 'actions'];

  readonly filteredComponents = () => {
    const items = this.service.examComponents();
    if (!this.searchQuery) return items;
    const q = this.searchQuery.toLowerCase();
    return items.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.exam_series?.name?.toLowerCase().includes(q) ||
      c.component_type.toLowerCase().includes(q)
    );
  };

  openCreateDialog(): void {
    const dialogRef = this.dialog.open<ExamComponentDialogComponent, ExamComponentDialogData>(ExamComponentDialogComponent, {
      width: '520px',
      data: { isEdit: false },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.createExamComponent(result).subscribe();
      }
    });
  }

  openEditDialog(component: ExamComponent): void {
    const dialogRef = this.dialog.open<ExamComponentDialogComponent, ExamComponentDialogData>(ExamComponentDialogComponent, {
      width: '520px',
      data: { isEdit: true, component },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.updateExamComponent(component.id, result).subscribe();
      }
    });
  }

  deleteComponent(component: ExamComponent): void {
    if (confirm(`Delete component "${component.name}"?`)) {
      this.service.deleteExamComponent(component.id).subscribe();
    }
  }
}
