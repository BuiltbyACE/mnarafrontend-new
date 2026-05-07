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
import { OperationsService, Announcement } from '../../services/operations.service';

@Component({
  selector: 'app-announcements-table',
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
          <input matInput placeholder="Search announcements..." [(ngModel)]="searchQuery" />
        </mat-form-field>
        <button mat-flat-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          Add Announcement
        </button>
      </div>

      <table mat-table [dataSource]="filtered()" class="full-width-table">
        <ng-container matColumnDef="title">
          <th mat-header-cell *matHeaderCellDef>Title</th>
          <td mat-cell *matCellDef="let row">{{ row.title }}</td>
        </ng-container>

        <ng-container matColumnDef="message">
          <th mat-header-cell *matHeaderCellDef>Message</th>
          <td mat-cell *matCellDef="let row">{{ row.message }}</td>
        </ng-container>

        <ng-container matColumnDef="target_audience">
          <th mat-header-cell *matHeaderCellDef>Audience</th>
          <td mat-cell *matCellDef="let row">{{ row.target_audience }}</td>
        </ng-container>

        <ng-container matColumnDef="priority">
          <th mat-header-cell *matHeaderCellDef>Priority</th>
          <td mat-cell *matCellDef="let row">
            <mat-chip [class.high]="row.priority === 'High'"
                      [class.normal]="row.priority === 'Normal'"
                      [class.low]="row.priority === 'Low'">
              {{ row.priority }}
            </mat-chip>
          </td>
        </ng-container>

        <ng-container matColumnDef="date">
          <th mat-header-cell *matHeaderCellDef>Date</th>
          <td mat-cell *matCellDef="let row">{{ row.date }}</td>
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
            No announcements found
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
    mat-chip.high { background: #fee2e2; color: #991b1b; }
    mat-chip.normal { background: #f1f5f9; color: #475569; }
    mat-chip.low { background: #dbeafe; color: #1e40af; }
    @media (max-width: 768px) {
      .table-header { flex-direction: column; align-items: stretch; }
      .search-field { max-width: 100%; }
    }
  `],
})
export class AnnouncementsTableComponent {
  readonly service = inject(OperationsService);

  searchQuery = '';
  displayedColumns = ['title', 'message', 'target_audience', 'priority', 'date', 'actions'];

  readonly filtered = () => {
    const items = this.service.announcements();
    if (!this.searchQuery) return items;
    const q = this.searchQuery.toLowerCase();
    return items.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.message.toLowerCase().includes(q) ||
      a.target_audience.toLowerCase().includes(q)
    );
  };

  openCreateDialog(): void {
    console.log('Create Announcement — Phase 2');
  }

  openEditDialog(item: Announcement): void {
    console.log('Edit Announcement — Phase 2', item);
  }

  deleteItem(item: Announcement): void {
    if (confirm(`Delete announcement "${item.title}"?`)) {
      console.log('Delete Announcement — Phase 2', item);
    }
  }
}
