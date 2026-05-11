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
// import { OperationsService, IncidentLog } from '../../services/operations.service';

// @Component({
//   selector: 'app-incidents-table',
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
//           <input matInput placeholder="Search incidents..." [(ngModel)]="searchQuery" />
//         </mat-form-field>
//         <button mat-flat-button color="primary" (click)="openCreateDialog()">
//           <mat-icon>add</mat-icon>
//           Add Incident
//         </button>
//       </div>

//       <table mat-table [dataSource]="filtered()" class="full-width-table">
//         <ng-container matColumnDef="date">
//           <th mat-header-cell *matHeaderCellDef>Date</th>
//           <td mat-cell *matCellDef="let row">{{ row.date }}</td>
//         </ng-container>

//         <ng-container matColumnDef="description">
//           <th mat-header-cell *matHeaderCellDef>Description</th>
//           <td mat-cell *matCellDef="let row">{{ row.description }}</td>
//         </ng-container>

//         <ng-container matColumnDef="reported_by">
//           <th mat-header-cell *matHeaderCellDef>Reported By</th>
//           <td mat-cell *matCellDef="let row">{{ row.reported_by }}</td>
//         </ng-container>

//         <ng-container matColumnDef="status">
//           <th mat-header-cell *matHeaderCellDef>Status</th>
//           <td mat-cell *matCellDef="let row">
//             <mat-chip [class.open]="row.status === 'OPEN'"
//                       [class.resolved]="row.status === 'RESOLVED'">
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
//             No incidents found
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
//     mat-chip.open { background: #fee2e2; color: #991b1b; }
//     mat-chip.resolved { background: #dcfce7; color: #166534; }
//     @media (max-width: 768px) {
//       .table-header { flex-direction: column; align-items: stretch; }
//       .search-field { max-width: 100%; }
//     }
//   `],
// })
// export class IncidentsTableComponent {
//   readonly service = inject(OperationsService);

//   searchQuery = '';
//   displayedColumns = ['date', 'description', 'reported_by', 'status', 'actions'];

//   readonly filtered = () => {
//     const items = this.service.incidents();
//     if (!this.searchQuery) return items;
//     const q = this.searchQuery.toLowerCase();
//     return items.filter(i =>
//       i.description.toLowerCase().includes(q) ||
//       i.reported_by_name.toLowerCase().includes(q) ||
//       i.status.toLowerCase().includes(q)
//     );
//   };

//   openCreateDialog(): void {
//     console.log('Create Incident — Phase 2');
//   }

//   openEditDialog(item: IncidentLog): void {
//     console.log('Edit Incident — Phase 2', item);
//   }

//   deleteItem(item: IncidentLog): void {
//     if (confirm(`Delete incident "${item.description}"?`)) {
//       console.log('Delete Incident — Phase 2', item);
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { OperationsService, IncidentLog } from '../../services/operations.service';

@Component({
  selector: 'app-incidents-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, 
    FormsModule, 
    MatTableModule, 
    MatChipsModule, 
    MatButtonModule, 
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule
  ],
  template: `
    <div class="table-container">
      <div class="table-header">
        <mat-form-field appearance="outline" class="search-field">
          <mat-icon matPrefix>search</mat-icon>
          <input matInput placeholder="Search incidents..." 
                 [ngModel]="searchQuery()" 
                 (ngModelChange)="searchQuery.set($event)" />
        </mat-form-field>
        <button mat-flat-button color="warn" (click)="openCreateDialog()">
          <mat-icon>report_problem</mat-icon>
          Report Incident
        </button>
      </div>

      <table mat-table [dataSource]="filtered() || []" class="full-width-table mat-elevation-z2">

        <ng-container matColumnDef="details">
          <th mat-header-cell *matHeaderCellDef> Incident Details </th>
          <td mat-cell *matCellDef="let row"> 
            <div class="incident-cell">
              <span class="incident-title">{{ row.title }}</span>
              <span class="incident-desc">{{ row.description }}</span>
            </div>
          </td>
        </ng-container>

        <ng-container matColumnDef="severity">
          <th mat-header-cell *matHeaderCellDef> Severity </th>
          <td mat-cell *matCellDef="let row">
            <mat-chip [class]="'severity-' + row.severity.toLowerCase()">
              {{ row.severity }}
            </mat-chip>
          </td>
        </ng-container>

        <ng-container matColumnDef="report_info">
          <th mat-header-cell *matHeaderCellDef> Reported By </th>
          <td mat-cell *matCellDef="let row">
            <div class="report-cell">
              <span>{{ row.reported_by_name }}</span>
              <span class="date-sub">{{ row.incident_date | date:'medium' }}</span>
            </div>
          </td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef> Status </th>
          <td mat-cell *matCellDef="let row">
            <span class="status-badge" [class]="row.status.toLowerCase()">
              {{ row.status }}
            </span>
          </td>
        </ng-container>

        <ng-container matColumnDef="resolution">
          <th mat-header-cell *matHeaderCellDef> Action Taken </th>
          <td mat-cell *matCellDef="let row">
            <span class="action-text" [matTooltip]="row.action_taken">
              {{ row.action_taken || 'Pending action...' }}
            </span>
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef> Actions </th>
          <td mat-cell *matCellDef="let row">
            <button mat-icon-button color="primary" (click)="openEditDialog(row)">
              <mat-icon>edit</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
    </div>
  `,
  styles: [`
    .table-container { padding: 16px; }
    .table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; gap: 16px; }
    .search-field { flex: 1; max-width: 400px; }
    .full-width-table { width: 100%; }
    
    .incident-cell, .report-cell { display: flex; flex-direction: column; padding: 8px 0; }
    .incident-title { font-weight: 600; color: #1e293b; }
    .incident-desc { font-size: 0.8rem; color: #64748b; line-height: 1.2; }
    .date-sub { font-size: 0.75rem; color: #94a3b8; }
    
    .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; }
    .open { background: #fee2e2; color: #991b1b; }
    .investigating { background: #fef3c7; color: #92400e; }
    .closed { background: #dcfce7; color: #166534; }

    .severity-high { background: #7f1d1d !important; color: white !important; }
    .severity-medium { background: #f97316 !important; color: white !important; }
    .severity-low { background: #3b82f6 !important; color: white !important; }

    .action-text { font-style: italic; color: #475569; font-size: 0.85rem; }
  `]
})
export class IncidentsTableComponent {
  operationsService = inject(OperationsService);

  displayedColumns: string[] = [
    'details', 
    'severity', 
    'report_info', 
    'status', 
    'resolution', 
    'actions'
  ];

  searchQuery = signal('');

  filtered = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const items = this.operationsService.incidents() || [];
    if (!query) return items;
    return items.filter(item => 
      item.title?.toLowerCase().includes(query) ||
      item.reported_by_name?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query)
    );
  });

  openCreateDialog() { console.log('Opening Incident Form...'); }
  openEditDialog(row: IncidentLog) { console.log('Editing Incident:', row.id); }
}