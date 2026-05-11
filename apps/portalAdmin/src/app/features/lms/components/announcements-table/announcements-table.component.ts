import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { OperationsService, Announcement } from '../../services/operations.service';

@Component({
  selector: 'app-announcements-table',
  standalone: true,
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
          <input matInput placeholder="Search announcements..." 
                 [ngModel]="searchQuery()" 
                 (ngModelChange)="searchQuery.set($event)" />
        </mat-form-field>
        <button mat-flat-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          Add Announcement
        </button>
      </div>

      <table mat-table [dataSource]="filtered() || []" class="full-width-table mat-elevation-z2">

        <ng-container matColumnDef="title">
          <th mat-header-cell *matHeaderCellDef> Title </th>
          <td mat-cell *matCellDef="let row"> <strong>{{ row.title }}</strong> </td>
        </ng-container>

        <ng-container matColumnDef="content">
          <th mat-header-cell *matHeaderCellDef> Message </th>
          <td mat-cell *matCellDef="let row">
            <span [title]="row.content">
              {{ row.content?.length > 50 ? (row.content | slice:0:50) + '...' : row.content }}
            </span>
          </td>
        </ng-container>

        <ng-container matColumnDef="audience">
          <th mat-header-cell *matHeaderCellDef> Audience </th>
          <td mat-cell *matCellDef="let row"> 
            <mat-chip>{{ row.audience }}</mat-chip> 
          </td>
        </ng-container>

        <ng-container matColumnDef="created_by_name">
          <th mat-header-cell *matHeaderCellDef> Author </th>
          <td mat-cell *matCellDef="let row"> {{ row.created_by_name }} </td>
        </ng-container>

        <ng-container matColumnDef="created_at">
          <th mat-header-cell *matHeaderCellDef> Date Posted </th>
          <td mat-cell *matCellDef="let row"> {{ row.created_at | date:'mediumDate' }} </td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef> Status </th>
          <td mat-cell *matCellDef="let row">
            <mat-chip [style.background]="row.is_active ? '#dcfce7' : '#fee2e2'" 
                      [style.color]="row.is_active ? '#166534' : '#991b1b'">
              {{ row.is_active ? 'Active' : 'Inactive' }}
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
            No announcements found matching your search.
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
export class AnnouncementsTableComponent implements OnInit {
  operationsService = inject(OperationsService);

  // Mapped exactly to your HTML ng-containers
  displayedColumns: string[] = [
    'title', 
    'content', 
    'audience', 
    'created_by_name', 
    'created_at', 
    'status', 
    'actions'
  ];

  // The Signal holding what the user types in the search bar
  searchQuery = signal('');

  // The Magic Computed Signal: Automatically filters the table instantly as you type
  filtered = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const announcements = this.operationsService.announcements() || [];

    if (!query) return announcements;

    // Searches through Title, Message content, and Audience
    return announcements.filter(item => 
      item.title?.toLowerCase().includes(query) ||
      item.content?.toLowerCase().includes(query) ||
      item.audience?.toLowerCase().includes(query)
    );
  });

  // ngOnInit() {
  //   this.operationsService.getAnnouncements().subscribe();
  // }

  ngOnInit() {
    this.operationsService.loadAnnouncements();
  }

  openCreateDialog() {
    console.log('Opening Create Dialog...');
    // Add MatDialog open logic here later
  }

  openEditDialog(row: Announcement) {
    console.log('Opening Edit Dialog for:', row.title);
    // Add MatDialog edit logic here later
  }

  deleteItem(row: Announcement) {
    console.log('Triggering delete for:', row.id);
    // Add service delete call here later
  }
}