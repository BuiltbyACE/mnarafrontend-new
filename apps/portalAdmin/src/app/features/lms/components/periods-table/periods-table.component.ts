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
import { SchedulingService, Period } from '../../services/scheduling.service';
import { PeriodDialogComponent } from '../period-dialog/period-dialog.component';

@Component({
  selector: 'app-periods-table',
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
          <input matInput placeholder="Search periods..." [(ngModel)]="searchQuery" />
        </mat-form-field>
        <button mat-flat-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          Add Period
        </button>
      </div>

      <table mat-table [dataSource]="filteredPeriods()" class="full-width-table">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let row">{{ row.name }}</td>
        </ng-container>

        <ng-container matColumnDef="start_time">
          <th mat-header-cell *matHeaderCellDef>Start Time</th>
          <td mat-cell *matCellDef="let row">{{ row.start_time }}</td>
        </ng-container>

        <ng-container matColumnDef="end_time">
          <th mat-header-cell *matHeaderCellDef>End Time</th>
          <td mat-cell *matCellDef="let row">{{ row.end_time }}</td>
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
            <button mat-icon-button color="warn" (click)="deletePeriod(row)">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

        <tr class="mat-row" *matNoDataRow>
          <td class="mat-cell" [attr.colspan]="displayedColumns.length">
            No periods found
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
    mat-chip.active { background: #dcfce7; color: #166534; }
    mat-chip.inactive { background: #fee2e2; color: #991b1b; }
    @media (max-width: 768px) {
      .table-header { flex-direction: column; align-items: stretch; }
      .search-field { max-width: 100%; }
    }
  `],
})
export class PeriodsTableComponent {
  readonly service = inject(SchedulingService);
  readonly dialog = inject(MatDialog);

  searchQuery = '';
  displayedColumns = ['name', 'start_time', 'end_time', 'is_active', 'actions'];

  readonly filteredPeriods = () => {
    const periods = this.service.periods();
    if (!this.searchQuery) return periods;
    const query = this.searchQuery.toLowerCase();
    return periods.filter(p => p.name.toLowerCase().includes(query));
  };

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(PeriodDialogComponent, {
      width: '500px',
      data: { isEdit: false },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.service.createPeriod(result).subscribe();
    });
  }

  openEditDialog(period: Period): void {
    const dialogRef = this.dialog.open(PeriodDialogComponent, {
      width: '500px',
      data: { isEdit: true, period },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.service.updatePeriod(period.id, result).subscribe();
    });
  }

  deletePeriod(period: Period): void {
    if (confirm(`Delete ${period.name}?`)) {
      this.service.deletePeriod(period.id).subscribe();
    }
  }
}
