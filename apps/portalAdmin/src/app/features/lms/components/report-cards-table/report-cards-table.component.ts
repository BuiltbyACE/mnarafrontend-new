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
import { ExaminationsService, ReportCard } from '../../services/examinations.service';
import { ReportCardDialogComponent, ReportCardDialogData } from '../report-card-dialog/report-card-dialog.component';

@Component({
  selector: 'app-report-cards-table',
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
           <input placeholder="Search report cards..." [(ngModel)]="searchQuery" />
         </div>
         <button mat-flat-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          Add Report Card
        </button>
      </div>

      @if (service.isLoading()) {
        <div class="loading-state">
          <mat-spinner diameter="30"></mat-spinner>
        </div>
      }

      <table mat-table [dataSource]="filteredCards()" class="full-width-table">
        <ng-container matColumnDef="student">
          <th mat-header-cell *matHeaderCellDef>Student</th>
          <td mat-cell *matCellDef="let row">{{ row.student?.first_name }} {{ row.student?.last_name }}</td>
        </ng-container>

        <ng-container matColumnDef="academic_term">
          <th mat-header-cell *matHeaderCellDef>Term</th>
          <td mat-cell *matCellDef="let row">{{ row.academic_term?.name }}</td>
        </ng-container>

        <ng-container matColumnDef="total_score">
          <th mat-header-cell *matHeaderCellDef>Total</th>
          <td mat-cell *matCellDef="let row">{{ row.total_score }}</td>
        </ng-container>

        <ng-container matColumnDef="average">
          <th mat-header-cell *matHeaderCellDef>Average</th>
          <td mat-cell *matCellDef="let row">{{ row.average }}</td>
        </ng-container>

        <ng-container matColumnDef="grade">
          <th mat-header-cell *matHeaderCellDef>Grade</th>
          <td mat-cell *matCellDef="let row">{{ row.grade }}</td>
        </ng-container>

        <ng-container matColumnDef="rank">
          <th mat-header-cell *matHeaderCellDef>Rank</th>
          <td mat-cell *matCellDef="let row">{{ row.rank }}</td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let row">
            <mat-chip [class.draft]="row.status === 'DRAFT'"
                      [class.published]="row.status === 'PUBLISHED'"
                      [class.withheld]="row.status === 'WITHHELD'">
              {{ row.status }}
            </mat-chip>
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Actions</th>
          <td mat-cell *matCellDef="let row">
            <button mat-icon-button (click)="openEditDialog(row)">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button color="warn" (click)="deleteReportCard(row)">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

        <tr class="mat-row" *matNoDataRow>
          <td class="mat-cell" [attr.colspan]="displayedColumns.length">
            No report cards found
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
     mat-chip.draft { background: #f1f5f9; color: #475569; }
    mat-chip.published { background: #dcfce7; color: #166534; }
    mat-chip.withheld { background: #fee2e2; color: #991b1b; }
    @media (max-width: 768px) {
      .table-header { flex-direction: column; align-items: stretch; }
      .search-field { max-width: 100%; }
    }
  `],
})
export class ReportCardsTableComponent {
  readonly service = inject(ExaminationsService);
  readonly dialog = inject(MatDialog);

  searchQuery = '';
  displayedColumns = ['student', 'academic_term', 'total_score', 'average', 'grade', 'rank', 'status', 'actions'];

  readonly filteredCards = () => {
    const items = this.service.reportCards();
    if (!this.searchQuery) return items;
    const q = this.searchQuery.toLowerCase();
    return items.filter(c =>
      c.student?.first_name?.toLowerCase().includes(q) ||
      c.student?.last_name?.toLowerCase().includes(q) ||
      c.academic_term?.name?.toLowerCase().includes(q) ||
      c.grade?.toLowerCase().includes(q) ||
      c.status?.toLowerCase().includes(q)
    );
  };

  openCreateDialog(): void {
    const dialogRef = this.dialog.open<ReportCardDialogComponent, ReportCardDialogData>(ReportCardDialogComponent, {
      width: '520px',
      data: { isEdit: false },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.createReportCard(result).subscribe();
      }
    });
  }

  openEditDialog(card: ReportCard): void {
    const dialogRef = this.dialog.open<ReportCardDialogComponent, ReportCardDialogData>(ReportCardDialogComponent, {
      width: '520px',
      data: { isEdit: true, card },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.updateReportCard(card.id, result).subscribe();
      }
    });
  }

  deleteReportCard(card: ReportCard): void {
    if (confirm(`Delete report card for ${card.student?.first_name} ${card.student?.last_name}?`)) {
      this.service.deleteReportCard(card.id).subscribe();
    }
  }
}
