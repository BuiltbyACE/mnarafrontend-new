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
import { OperationsService, FacilityBooking } from '../../services/operations.service';

@Component({
  selector: 'app-facility-bookings-table',
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
          <input matInput placeholder="Search bookings..." [(ngModel)]="searchQuery" />
        </mat-form-field>
        <button mat-flat-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          Add Booking
        </button>
      </div>

      <table mat-table [dataSource]="filtered()" class="full-width-table">
        <ng-container matColumnDef="facility_name">
          <th mat-header-cell *matHeaderCellDef>Facility</th>
          <td mat-cell *matCellDef="let row">{{ row.facility_name }}</td>
        </ng-container>

        <ng-container matColumnDef="requested_by">
          <th mat-header-cell *matHeaderCellDef>Requested By</th>
          <td mat-cell *matCellDef="let row">{{ row.requested_by }}</td>
        </ng-container>

        <ng-container matColumnDef="date">
          <th mat-header-cell *matHeaderCellDef>Date</th>
          <td mat-cell *matCellDef="let row">{{ row.date }}</td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let row">
            <mat-chip [class.pending]="row.status === 'PENDING'"
                      [class.approved]="row.status === 'APPROVED'"
                      [class.rejected]="row.status === 'REJECTED'">
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
            No facility bookings found
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
    mat-chip.pending { background: #fef9c3; color: #854d0e; }
    mat-chip.approved { background: #dcfce7; color: #166534; }
    mat-chip.rejected { background: #fee2e2; color: #991b1b; }
    @media (max-width: 768px) {
      .table-header { flex-direction: column; align-items: stretch; }
      .search-field { max-width: 100%; }
    }
  `],
})
export class FacilityBookingsTableComponent {
  readonly service = inject(OperationsService);

  searchQuery = '';
  displayedColumns = ['facility_name', 'requested_by', 'date', 'status', 'actions'];

  readonly filtered = () => {
    const items = this.service.facilityBookings();
    if (!this.searchQuery) return items;
    const q = this.searchQuery.toLowerCase();
    return items.filter(b =>
      b.facility_name.toLowerCase().includes(q) ||
      b.requested_by.toLowerCase().includes(q) ||
      b.status.toLowerCase().includes(q)
    );
  };

  openCreateDialog(): void {
    console.log('Create Facility Booking — Phase 2');
  }

  openEditDialog(item: FacilityBooking): void {
    console.log('Edit Facility Booking — Phase 2', item);
  }

  deleteItem(item: FacilityBooking): void {
    if (confirm(`Delete booking for "${item.facility_name}"?`)) {
      console.log('Delete Facility Booking — Phase 2', item);
    }
  }
}
