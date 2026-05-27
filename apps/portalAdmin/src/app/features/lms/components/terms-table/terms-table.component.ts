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
import { SchedulingService, AcademicTerm } from '../../services/scheduling.service';
import { TermDialogComponent } from '../term-dialog/term-dialog.component';

@Component({
  selector: 'app-terms-table',
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
           <input placeholder="Search terms..." [(ngModel)]="searchQuery" />
         </div>
         <button mat-flat-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          Add Term
        </button>
      </div>

      <table mat-table [dataSource]="filteredTerms()" class="full-width-table">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let row">{{ row.name }}</td>
        </ng-container>

        <ng-container matColumnDef="academic_year">
          <th mat-header-cell *matHeaderCellDef>Academic Year</th>
          <td mat-cell *matCellDef="let row">{{ row.academic_year.name }}</td>
        </ng-container>

        <ng-container matColumnDef="start_date">
          <th mat-header-cell *matHeaderCellDef>Start Date</th>
          <td mat-cell *matCellDef="let row">{{ row.start_date }}</td>
        </ng-container>

        <ng-container matColumnDef="end_date">
          <th mat-header-cell *matHeaderCellDef>End Date</th>
          <td mat-cell *matCellDef="let row">{{ row.end_date }}</td>
        </ng-container>

        <ng-container matColumnDef="is_active">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let row">
            <mat-chip [class.active]="row.is_active" [class.inactive]="!row.is_active">
              {{ row.is_active ? 'Active' : 'Inactive' }}
            </mat-chip>
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Actions</th>
          <td mat-cell *matCellDef="let row">
            <button mat-icon-button (click)="openEditDialog(row)">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button color="warn" (click)="deleteTerm(row)">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

        <tr class="mat-row" *matNoDataRow>
          <td class="mat-cell" [attr.colspan]="displayedColumns.length">
            No terms found
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
     mat-chip.active { background: #dcfce7; color: #166534; }
    mat-chip.inactive { background: #fee2e2; color: #991b1b; }
    @media (max-width: 768px) {
      .table-header { flex-direction: column; align-items: stretch; }
      .search-field { max-width: 100%; }
    }
  `],
})
export class TermsTableComponent {
  readonly service = inject(SchedulingService);
  readonly dialog = inject(MatDialog);

  searchQuery = '';
  displayedColumns = ['name', 'academic_year', 'start_date', 'end_date', 'is_active', 'actions'];

  readonly filteredTerms = () => {
    const terms = this.service.academicTerms();
    if (!this.searchQuery) return terms;
    const query = this.searchQuery.toLowerCase();
    return terms.filter(t => 
      t.name.toLowerCase().includes(query) ||
      t.academic_year.name.toLowerCase().includes(query)
    );
  };

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(TermDialogComponent, {
      width: '500px',
      data: { isEdit: false },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.service.createAcademicTerm(result).subscribe();
    });
  }

  openEditDialog(term: AcademicTerm): void {
    const dialogRef = this.dialog.open(TermDialogComponent, {
      width: '500px',
      data: { isEdit: true, term },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.service.updateAcademicTerm(term.id, result).subscribe();
    });
  }

  deleteTerm(term: AcademicTerm): void {
    if (confirm(`Delete ${term.name}?`)) {
      this.service.deleteAcademicTerm(term.id).subscribe();
    }
  }
}
