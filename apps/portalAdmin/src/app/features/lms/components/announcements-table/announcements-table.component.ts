import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { OperationsService, Announcement } from '../../services/operations.service';
import { AnnouncementDialogComponent, AnnouncementDialogData } from '../announcement-dialog/announcement-dialog.component';
import { OmnichannelComposerComponent } from '@sms/shared/ui';

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
     MatDialogModule,
     OmnichannelComposerComponent,
   ],
  template: `
    <div class="table-container">
       <div class="table-header">
         <div class="search-field">
           <input placeholder="Search announcements..." 
                  [ngModel]="searchQuery()" 
                  (ngModelChange)="searchQuery.set($event)" />
         </div>
         <div class="header-actions">
           <button mat-stroked-button color="primary" (click)="showComposer.set(true)">
            <mat-icon>campaign</mat-icon>
            New Message
          </button>
          <button mat-flat-button color="primary" (click)="openCreateDialog()">
            <mat-icon>add</mat-icon>
            Add Announcement
          </button>
         </div>
       </div>

       @if (showComposer()) {
        <ss-omnichannel-composer (closed)="showComposer.set(false)" />
      }

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
     .header-actions { display: flex; gap: 8px; align-items: center; flex-shrink: 0; }
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
export class AnnouncementsTableComponent implements OnInit {
  operationsService = inject(OperationsService);
  private dialog = inject(MatDialog);

  displayedColumns: string[] = [
    'title', 
    'content', 
    'audience', 
    'created_by_name', 
    'created_at', 
    'status', 
    'actions'
  ];

  searchQuery = signal('');
  showComposer = signal(false);

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
    const data: AnnouncementDialogData = { isEdit: false };
    const ref = this.dialog.open(AnnouncementDialogComponent, { data, width: '600px' });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.operationsService.createAnnouncement(result).subscribe();
      }
    });
  }

  openEditDialog(row: Announcement) {
    const data: AnnouncementDialogData = { isEdit: true, announcement: row };
    const ref = this.dialog.open(AnnouncementDialogComponent, { data, width: '600px' });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.operationsService.updateAnnouncement(row.id, result).subscribe();
      }
    });
  }

  deleteItem(row: Announcement) {
    if (confirm(`Delete announcement "${row.title}"?`)) {
      this.operationsService.deleteAnnouncement(row.id).subscribe();
    }
  }
}