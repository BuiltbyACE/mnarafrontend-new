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
import { SchedulingService, AcademicYear } from '../../services/scheduling.service';
import { AcademicYearDialogComponent } from '../academic-year-dialog/academic-year-dialog.component';

@Component({
  selector: 'app-academic-years-table',
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
          <input matInput placeholder="Search academic years..." [(ngModel)]="searchQuery" />
        </mat-form-field>
        <button mat-flat-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          Add Academic Year
        </button>
      </div>

      <table mat-table [dataSource]="filteredYears()" class="full-width-table">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let row">{{ row.name }}</td>
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
            <button mat-icon-button color="warn" (click)="deleteYear(row)">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

        <tr class="mat-row" *matNoDataRow>
          <td class="mat-cell" [attr.colspan]="displayedColumns.length">
            No academic years found
          </td>
        </tr>
      </table>
    </div>
  `,
  styles: [`
    .table-container {
      padding: 16px;
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      gap: 16px;
    }

    .search-field {
      flex: 1;
      max-width: 400px;
    }

    .full-width-table {
      width: 100%;
    }

    mat-chip.active {
      background: #dcfce7;
      color: #166534;
    }

    mat-chip.inactive {
      background: #fee2e2;
      color: #991b1b;
    }

    @media (max-width: 768px) {
      .table-header {
        flex-direction: column;
        align-items: stretch;
      }

      .search-field {
        max-width: 100%;
      }
    }
  `],
})
export class AcademicYearsTableComponent {
  readonly service = inject(SchedulingService);
  readonly dialog = inject(MatDialog);

  searchQuery = '';
  displayedColumns = ['name', 'start_date', 'end_date', 'is_active', 'actions'];

  readonly filteredYears = () => {
    const years = this.service.academicYears();
    if (!this.searchQuery) return years;
    const query = this.searchQuery.toLowerCase();
    return years.filter(y => y.name.toLowerCase().includes(query));
  };

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(AcademicYearDialogComponent, {
      width: '500px',
      data: { isEdit: false },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.createAcademicYear(result).subscribe();
      }
    });
  }

  openEditDialog(year: AcademicYear): void {
    const dialogRef = this.dialog.open(AcademicYearDialogComponent, {
      width: '500px',
      data: { isEdit: true, year },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.updateAcademicYear(year.id, result).subscribe();
      }
    });
  }

  deleteYear(year: AcademicYear): void {
    if (confirm(`Delete ${year.name}?`)) {
      this.service.deleteAcademicYear(year.id).subscribe();
    }
  }
}
