import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { OperationsService, IncidentLog } from '../../services/operations.service';

@Component({
  selector: 'app-incidents-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
  ],
  template: `
    <div class="table-container">
      <div class="table-header">
        <mat-form-field appearance="outline" class="search-field">
          <mat-icon matPrefix>search</mat-icon>
          <input matInput placeholder="Search incidents..." [(ngModel)]="searchQuery" />
        </mat-form-field>
        <button mat-flat-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          Add Incident
        </button>
      </div>

      <table mat-table [dataSource]="filtered()" class="full-width-table">
        <ng-container matColumnDef="date">
          <th mat-header-cell *matHeaderCellDef>Date</th>
          <td mat-cell *matCellDef="let row">{{ row.date }}</td>
        </ng-container>

        <ng-container matColumnDef="description">
          <th mat-header-cell *matHeaderCellDef>Description</th>
          <td mat-cell *matCellDef="let row">{{ row.description }}</td>
        </ng-container>

        <ng-container matColumnDef="reported_by">
          <th mat-header-cell *matHeaderCellDef>Reported By</th>
          <td mat-cell *matCellDef="let row">{{ row.reported_by }}</td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let row">
            <mat-chip [class.open]="row.status === 'OPEN'"
                      [class.resolved]="row.status === 'RESOLVED'">
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
            <button mat-icon-button color="warn" (click)="deleteItem(row)">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

        <tr class="mat-row" *matNoDataRow>
          <td class="mat-cell" [attr.colspan]="displayedColumns.length">
            No incidents found
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
    mat-chip.open { background: #fee2e2; color: #991b1b; }
    mat-chip.resolved { background: #dcfce7; color: #166534; }
    @media (max-width: 768px) {
      .table-header { flex-direction: column; align-items: stretch; }
      .search-field { max-width: 100%; }
    }
  `],
})
export class IncidentsTableComponent {
  readonly service = inject(OperationsService);

  searchQuery = '';
  displayedColumns = ['date', 'description', 'reported_by', 'status', 'actions'];

  readonly filtered = () => {
    const items = this.service.incidents();
    if (!this.searchQuery) return items;
    const q = this.searchQuery.toLowerCase();
    return items.filter(i =>
      i.description.toLowerCase().includes(q) ||
      i.reported_by.toLowerCase().includes(q) ||
      i.status.toLowerCase().includes(q)
    );
  };

  openCreateDialog(): void {
    console.log('Create Incident — Phase 2');
  }

  openEditDialog(item: IncidentLog): void {
    console.log('Edit Incident — Phase 2', item);
  }

  deleteItem(item: IncidentLog): void {
    if (confirm(`Delete incident "${item.description}"?`)) {
      console.log('Delete Incident — Phase 2', item);
    }
  }
}
