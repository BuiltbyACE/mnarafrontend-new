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
// import { OperationsService, SchoolEvent } from '../../services/operations.service';

// @Component({
//   selector: 'app-events-table',
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
//           <input matInput placeholder="Search events..." [(ngModel)]="searchQuery" />
//         </mat-form-field>
//         <button mat-flat-button color="primary" (click)="openCreateDialog()">
//           <mat-icon>add</mat-icon>
//           Add Event
//         </button>
//       </div>

//       <table mat-table [dataSource]="filtered()" class="full-width-table">
//         <ng-container matColumnDef="title">
//           <th mat-header-cell *matHeaderCellDef>Title</th>
//           <td mat-cell *matCellDef="let row">{{ row.title }}</td>
//         </ng-container>

//         <ng-container matColumnDef="start_date">
//           <th mat-header-cell *matHeaderCellDef>Start Date</th>
//           <td mat-cell *matCellDef="let row">{{ row.start_date }}</td>
//         </ng-container>

//         <ng-container matColumnDef="end_date">
//           <th mat-header-cell *matHeaderCellDef>End Date</th>
//           <td mat-cell *matCellDef="let row">{{ row.end_date }}</td>
//         </ng-container>

//         <ng-container matColumnDef="location">
//           <th mat-header-cell *matHeaderCellDef>Location</th>
//           <td mat-cell *matCellDef="let row">{{ row.location }}</td>
//         </ng-container>

//         <ng-container matColumnDef="type">
//           <th mat-header-cell *matHeaderCellDef>Type</th>
//           <td mat-cell *matCellDef="let row">
//             <mat-chip [class.academic]="row.type === 'Academic'"
//                       [class.sports]="row.type === 'Sports'"
//                       [class.general]="row.type === 'General'">
//               {{ row.type }}
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
//             No events found
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
//     mat-chip.academic { background: #dbeafe; color: #1e40af; }
//     mat-chip.sports { background: #dcfce7; color: #166534; }
//     mat-chip.general { background: #f1f5f9; color: #475569; }
//     @media (max-width: 768px) {
//       .table-header { flex-direction: column; align-items: stretch; }
//       .search-field { max-width: 100%; }
//     }
//   `],
// })
// export class EventsTableComponent {
//   readonly service = inject(OperationsService);

//   searchQuery = '';
//   displayedColumns = ['title', 'start_date', 'end_date', 'location', 'type', 'actions'];

//   readonly filtered = () => {
//     const items = this.service.events();
//     if (!this.searchQuery) return items;
//     const q = this.searchQuery.toLowerCase();
//     return items.filter(e =>
//       e.title.toLowerCase().includes(q) ||
//       e.location.toLowerCase().includes(q) ||
//       e.type.toLowerCase().includes(q)
//     );
//   };

//   openCreateDialog(): void {
//     console.log('Create Event — Phase 2');
//   }

//   openEditDialog(item: SchoolEvent): void {
//     console.log('Edit Event — Phase 2', item);
//   }

//   deleteItem(item: SchoolEvent): void {
//     if (confirm(`Delete event "${item.title}"?`)) {
//       console.log('Delete Event — Phase 2', item);
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
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { OperationsService, SchoolEvent } from '../../services/operations.service';
import { EventDialogComponent, EventDialogData } from '../event-dialog/event-dialog.component';

@Component({
  selector: 'app-events-table',
  changeDetection: ChangeDetectionStrategy.OnPush, // Manifesto compliance
  imports: [
    CommonModule, 
    FormsModule, 
    MatTableModule, 
    MatChipsModule, 
     MatButtonModule, 
     MatIconModule,
     MatDialogModule
   ],
  template: `
    <div class="table-container">
       <div class="table-header">
         <div class="search-field">
           <input placeholder="Search events..." 
                  [ngModel]="searchQuery()" 
                  (ngModelChange)="searchQuery.set($event)" />
         </div>
         <button mat-flat-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          Add Event
        </button>
      </div>

      <table mat-table [dataSource]="filtered() || []" class="full-width-table mat-elevation-z2">

        <ng-container matColumnDef="title">
          <th mat-header-cell *matHeaderCellDef> Event Title </th>
          <td mat-cell *matCellDef="let row"> <strong>{{ row.title }}</strong> </td>
        </ng-container>

        <ng-container matColumnDef="description">
          <th mat-header-cell *matHeaderCellDef> Description </th>
          <td mat-cell *matCellDef="let row">
            <span [title]="row.description">
              {{ row.description?.length > 45 ? (row.description | slice:0:45) + '...' : row.description }}
            </span>
          </td>
        </ng-container>

        <ng-container matColumnDef="schedule">
          <th mat-header-cell *matHeaderCellDef> Schedule </th>
          <td mat-cell *matCellDef="let row">
            <div style="display: flex; flex-direction: column;">
              <span>{{ row.event_date | date:'mediumDate' }}</span>
              <span style="font-size: 0.8rem; color: #64748b;">
                {{ row.start_time | slice:0:5 }} - {{ row.end_time | slice:0:5 }}
              </span>
            </div>
          </td>
        </ng-container>

        <ng-container matColumnDef="location">
          <th mat-header-cell *matHeaderCellDef> Location </th>
          <td mat-cell *matCellDef="let row"> 
            <mat-chip>{{ row.location }}</mat-chip> 
          </td>
        </ng-container>

        <ng-container matColumnDef="organizer_name">
          <th mat-header-cell *matHeaderCellDef> Organizer </th>
          <td mat-cell *matCellDef="let row"> {{ row.organizer_name }} </td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef> Status </th>
          <td mat-cell *matCellDef="let row">
            <mat-chip [style.background]="row.is_active ? '#dcfce7' : '#fee2e2'" 
                      [style.color]="row.is_active ? '#166534' : '#991b1b'">
              {{ row.is_active ? 'Active' : 'Cancelled' }}
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
            No events found matching your search.
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
     
     @media (max-width: 768px) {
      .table-header { flex-direction: column; align-items: stretch; }
      .search-field { max-width: 100%; }
    }
  `]
})
export class EventsTableComponent {
  operationsService = inject(OperationsService);
  private dialog = inject(MatDialog);

  displayedColumns: string[] = [
    'title', 
    'description', 
    'schedule', 
    'location', 
    'organizer_name', 
    'status', 
    'actions'
  ];

  searchQuery = signal('');

  filtered = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const events = this.operationsService.events() || [];

    if (!query) return events;

    return events.filter(item => 
      item.title?.toLowerCase().includes(query) ||
      item.location?.toLowerCase().includes(query) ||
      item.organizer_name?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query)
    );
  });

  openCreateDialog() {
    const data: EventDialogData = { isEdit: false };
    const ref = this.dialog.open(EventDialogComponent, { data, width: '600px' });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.operationsService.createEvent(result).subscribe();
      }
    });
  }

  openEditDialog(row: SchoolEvent) {
    const data: EventDialogData = { isEdit: true, event: row };
    const ref = this.dialog.open(EventDialogComponent, { data, width: '600px' });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.operationsService.updateEvent(row.id, result).subscribe();
      }
    });
  }

  deleteItem(row: SchoolEvent) {
    if (confirm(`Delete event "${row.title}"?`)) {
      this.operationsService.deleteEvent(row.id).subscribe();
    }
  }
}