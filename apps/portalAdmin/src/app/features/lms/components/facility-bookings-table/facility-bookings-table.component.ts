// import { Component, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { MatTableModule } from '@angular/material/table';
// import { MatButtonModule } from '@angular/material/button';
// import { MatIconModule } from '@angular/material/icon';
// import { MatCardModule } from '@angular/material/card';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatInputModule } from '@angular/material/input';
// import { MatChipsModule } from '@angular/material/chips';
// import { OperationsService, FacilityBooking } from '../../services/operations.service';

// @Component({
//   selector: 'app-facility-bookings-table',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     MatTableModule,
//     MatButtonModule,
//     MatIconModule,
//     MatCardModule,
//     MatFormFieldModule,
//     MatInputModule,
//     MatChipsModule,
//   ],
//   template: `
//     <div class="table-container">
//       <div class="table-header">
//         <mat-form-field appearance="outline" class="search-field">
//           <mat-icon matPrefix>search</mat-icon>
//           <input matInput placeholder="Search bookings..." [(ngModel)]="searchQuery" />
//         </mat-form-field>
//         <button mat-flat-button color="primary" (click)="openCreateDialog()">
//           <mat-icon>add</mat-icon>
//           Add Booking
//         </button>
//       </div>

//       <table mat-table [dataSource]="filtered()" class="full-width-table">
//         <ng-container matColumnDef="facility_name">
//           <th mat-header-cell *matHeaderCellDef>Facility</th>
//           <td mat-cell *matCellDef="let row">{{ row.facility_name }}</td>
//         </ng-container>

//         <ng-container matColumnDef="requested_by">
//           <th mat-header-cell *matHeaderCellDef>Requested By</th>
//           <td mat-cell *matCellDef="let row">{{ row.requested_by }}</td>
//         </ng-container>

//         <ng-container matColumnDef="date">
//           <th mat-header-cell *matHeaderCellDef>Date</th>
//           <td mat-cell *matCellDef="let row">{{ row.date }}</td>
//         </ng-container>

//         <ng-container matColumnDef="status">
//           <th mat-header-cell *matHeaderCellDef>Status</th>
//           <td mat-cell *matCellDef="let row">
//             <mat-chip [class.pending]="row.status === 'PENDING'"
//                       [class.approved]="row.status === 'APPROVED'"
//                       [class.rejected]="row.status === 'REJECTED'">
//               {{ row.status }}
//             </mat-chip>
//           </td>
//         </ng-container>

//         <ng-container matColumnDef="actions">
//           <th mat-header-cell *matHeaderCellDef>Actions</th>
//           <td mat-cell *matCellDef="let row">
//             <button mat-icon-button (click)="openEditDialog(row)">
//               <mat-icon>edit</mat-icon>
//             </button>
//             <button mat-icon-button color="warn" (click)="deleteItem(row)">
//               <mat-icon>delete</mat-icon>
//             </button>
//           </td>
//         </ng-container>

//         <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
//         <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

//         <tr class="mat-row" *matNoDataRow>
//           <td class="mat-cell" [attr.colspan]="displayedColumns.length">
//             No facility bookings found
//           </td>
//         </tr>
//       </table>
//     </div>
//   `,
//   styles: [`
//     .table-container { padding: 16px; }
//     .table-header {
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       margin-bottom: 16px;
//       gap: 16px;
//     }
//     .search-field { flex: 1; max-width: 400px; }
//     .full-width-table { width: 100%; }
//     mat-chip.pending { background: #fef9c3; color: #854d0e; }
//     mat-chip.approved { background: #dcfce7; color: #166534; }
//     mat-chip.rejected { background: #fee2e2; color: #991b1b; }
//     @media (max-width: 768px) {
//       .table-header { flex-direction: column; align-items: stretch; }
//       .search-field { max-width: 100%; }
//     }
//   `],
// })
// export class FacilityBookingsTableComponent {
//   readonly service = inject(OperationsService);

//   searchQuery = '';
//   displayedColumns = ['facility_name', 'requested_by', 'date', 'status', 'actions'];

//   readonly filtered = () => {
//     const items = this.service.facilityBookings();
//     if (!this.searchQuery) return items;
//     const q = this.searchQuery.toLowerCase();
//     return items.filter(b =>
//       b.facility_name.toLowerCase().includes(q) ||
//       b.requested_by.toLowerCase().includes(q) ||
//       b.status.toLowerCase().includes(q)
//     );
//   };

//   openCreateDialog(): void {
//     console.log('Create Facility Booking — Phase 2');
//   }

//   openEditDialog(item: FacilityBooking): void {
//     console.log('Edit Facility Booking — Phase 2', item);
//   }

//   deleteItem(item: FacilityBooking): void {
//     if (confirm(`Delete booking for "${item.facility_name}"?`)) {
//       console.log('Delete Facility Booking — Phase 2', item);
//     }
//   }
// }









import { Component, inject, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { OperationsService, FacilityBooking } from '../../services/operations.service';

@Component({
  selector: 'app-facility-bookings-table',
  changeDetection: ChangeDetectionStrategy.OnPush, // Manifesto compliance
  imports: [
    CommonModule, 
    FormsModule, 
    MatTableModule, 
    MatChipsModule, 
    MatButtonModule, 
    MatIconModule,
    MatInputModule,
    MatFormFieldModule
  ],
  template: `
    <div class="table-container">
      <div class="table-header">
        <mat-form-field appearance="outline" class="search-field">
          <mat-icon matPrefix>search</mat-icon>
          <input matInput placeholder="Search bookings..." 
                 [ngModel]="searchQuery()" 
                 (ngModelChange)="searchQuery.set($event)" />
        </mat-form-field>
        <button mat-flat-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          New Booking
        </button>
      </div>

      <table mat-table [dataSource]="filtered() || []" class="full-width-table mat-elevation-z2">

        <ng-container matColumnDef="facility_name">
          <th mat-header-cell *matHeaderCellDef> Facility </th>
          <td mat-cell *matCellDef="let row"> <strong>{{ row.facility_name }}</strong> </td>
        </ng-container>

        <ng-container matColumnDef="purpose">
          <th mat-header-cell *matHeaderCellDef> Purpose </th>
          <td mat-cell *matCellDef="let row">
            <span [title]="row.purpose">
              {{ row.purpose?.length > 40 ? (row.purpose | slice:0:40) + '...' : row.purpose }}
            </span>
          </td>
        </ng-container>

        <ng-container matColumnDef="schedule">
          <th mat-header-cell *matHeaderCellDef> Reserved Time </th>
          <td mat-cell *matCellDef="let row">
            <div style="display: flex; flex-direction: column;">
              <span>{{ row.start_time | date:'mediumDate' }}</span>
              <span style="font-size: 0.8rem; color: #64748b;">
                {{ row.start_time | date:'shortTime' }} - {{ row.end_time | date:'shortTime' }}
              </span>
            </div>
          </td>
        </ng-container>

        <ng-container matColumnDef="requested_by_name">
          <th mat-header-cell *matHeaderCellDef> Requested By </th>
          <td mat-cell *matCellDef="let row"> {{ row.requested_by_name }} </td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef> Status </th>
          <td mat-cell *matCellDef="let row">
            <mat-chip 
              [style.background]="row.status === 'APPROVED' ? '#dcfce7' : (row.status === 'PENDING' ? '#fef3c7' : '#fee2e2')" 
              [style.color]="row.status === 'APPROVED' ? '#166534' : (row.status === 'PENDING' ? '#92400e' : '#991b1b')">
              {{ row.status }}
            </mat-chip>
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef> Actions </th>
          <td mat-cell *matCellDef="let row">
            <button mat-icon-button color="primary" (click)="openEditDialog(row)">
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
          <td class="mat-cell" [attr.colspan]="displayedColumns.length" style="text-align: center; padding: 2rem;">
            No facility bookings found matching your search.
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
    
    @media (max-width: 768px) {
      .table-header { flex-direction: column; align-items: stretch; }
      .search-field { max-width: 100%; }
    }
  `]
})
export class FacilityBookingsTableComponent {
  operationsService = inject(OperationsService);

  displayedColumns: string[] = [
    'facility_name', 
    'purpose', 
    'schedule', 
    'requested_by_name', 
    'status', 
    'actions'
  ];

  searchQuery = signal('');

  filtered = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const bookings = this.operationsService.facilityBookings() || [];

    if (!query) return bookings;

    return bookings.filter(item => 
      item.facility_name?.toLowerCase().includes(query) ||
      item.requested_by_name?.toLowerCase().includes(query) ||
      item.purpose?.toLowerCase().includes(query) ||
      item.status?.toLowerCase().includes(query)
    );
  });

  // --- ADD THIS METHOD ---
  openCreateDialog() {
    console.log('Opening Create Booking Dialog...');
    // We will wire this up to MatDialog later today
  }

  // Ensure these exist too for the row buttons
  openEditDialog(row: FacilityBooking) {
    console.log('Opening Edit Dialog for:', row.facility_name);
  }

  deleteItem(row: FacilityBooking) {
    console.log('Triggering delete for booking ID:', row.id);
  }
}