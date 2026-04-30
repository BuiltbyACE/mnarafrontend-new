/**
 * Classrooms List Component
 * Academics module - classroom management with data table
 */

import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AcademicsService } from '../../services/academics.service';
import { Classroom } from '../../../../shared/models/academics.models';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge';
import { BulkPromotionDialogComponent } from '../bulk-promotion-dialog/bulk-promotion-dialog';

@Component({
  selector: 'app-classrooms-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatChipsModule,
    MatMenuModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    StatusBadgeComponent,
  ],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div class="title-section">
          <h1>Academics</h1>
          <p class="subtitle">Classrooms & Year Levels</p>
        </div>
        <div class="actions">
          <button mat-stroked-button (click)="openBulkPromotion()">
            <mat-icon>upgrade</mat-icon>
            Bulk Promote
          </button>
          <button mat-raised-button color="primary" (click)="addClassroom()">
            <mat-icon>add</mat-icon>
            Add Classroom
          </button>
        </div>
      </header>

      @if (academicsService.error()) {
        <div class="error-alert">
          <mat-icon>error</mat-icon>
          <span>{{ academicsService.error() }}</span>
        </div>
      }

      <mat-card class="content-card">
        <mat-card-content>
          <div class="table-container">
            <table mat-table [dataSource]="classrooms()" matSort (matSortChange)="onSort($event)">
              
              <!-- Name Column -->
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Classroom</th>
                <td mat-cell *matCellDef="let classroom">
                  <div class="classroom-info">
                    <span class="classroom-name">{{ classroom.name }}</span>
                    <span class="room-number">{{ classroom.room_number }}</span>
                  </div>
                </td>
              </ng-container>

              <!-- Year Level Column -->
              <ng-container matColumnDef="year_level">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Year Level</th>
                <td mat-cell *matCellDef="let classroom">
                  {{ classroom.year_level_name }}
                </td>
              </ng-container>

              <!-- Capacity Column -->
              <ng-container matColumnDef="capacity">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Capacity</th>
                <td mat-cell *matCellDef="let classroom">
                  <div class="capacity-info">
                    <span class="enrollment">{{ classroom.current_enrollment }} / {{ classroom.capacity }}</span>
                    <div class="capacity-bar">
                      <div class="capacity-fill" [style.width.%]="(classroom.current_enrollment / classroom.capacity) * 100"
                           [class.high]="(classroom.current_enrollment / classroom.capacity) > 0.9"
                           [class.medium]="(classroom.current_enrollment / classroom.capacity) > 0.75 && (classroom.current_enrollment / classroom.capacity) <= 0.9">
                      </div>
                    </div>
                  </div>
                </td>
              </ng-container>

              <!-- Teacher Column -->
              <ng-container matColumnDef="teacher">
                <th mat-header-cell *matHeaderCellDef>Class Teacher</th>
                <td mat-cell *matCellDef="let classroom">
                  @if (classroom.class_teacher) {
                    <div class="teacher-info">
                      <mat-icon>person</mat-icon>
                      <span>{{ classroom.class_teacher.full_name }}</span>
                    </div>
                  } @else {
                    <span class="unassigned">Unassigned</span>
                  }
                </td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let classroom">
                  <app-status-badge [type]="classroom.is_active ? 'active' : 'archived'"></app-status-badge>
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="actions-header"></th>
                <td mat-cell *matCellDef="let classroom" class="actions-cell">
                  <button mat-icon-button [matMenuTriggerFor]="menu">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #menu="matMenu">
                    <button mat-menu-item (click)="viewClassroom(classroom)">
                      <mat-icon>visibility</mat-icon>
                      <span>View Details</span>
                    </button>
                    <button mat-menu-item (click)="editClassroom(classroom)">
                      <mat-icon>edit</mat-icon>
                      <span>Edit</span>
                    </button>
                    <button mat-menu-item (click)="manageStudents(classroom)">
                      <mat-icon>people</mat-icon>
                      <span>Manage Students</span>
                    </button>
                    <mat-divider></mat-divider>
                    @if (classroom.is_active) {
                      <button mat-menu-item (click)="archiveClassroom(classroom)" class="archive-action">
                        <mat-icon>archive</mat-icon>
                        <span>Archive</span>
                      </button>
                    }
                  </mat-menu>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

              <!-- No data row -->
              <tr class="mat-row no-data-row" *matNoDataRow>
                <td class="mat-cell" [attr.colspan]="displayedColumns.length">
                  <div class="no-data-message">
                    @if (academicsService.isLoading()) {
                      <mat-spinner diameter="40"></mat-spinner>
                    } @else {
                      <mat-icon>school</mat-icon>
                      <p>No classrooms found</p>
                    }
                  </div>
                </td>
              </tr>
            </table>
          </div>

          <mat-paginator
            [length]="academicsService.totalCount()"
            [pageSize]="pageSize"
            [pageSizeOptions]="[10, 25, 50, 100]"
            [pageIndex]="currentPage"
            (page)="onPageChange($event)"
            aria-label="Select page of classrooms">
          </mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 24px;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 24px;

      .title-section {
        h1 {
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 4px 0;
        }

        .subtitle {
          color: #6b7280;
          margin: 0;
        }
      }

      .actions {
        display: flex;
        gap: 12px;
      }
    }

    .error-alert {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px;
      background: #fee2e2;
      border-radius: 8px;
      color: #dc2626;
      margin-bottom: 24px;
    }

    .content-card {
      border-radius: 12px;
    }

    .table-container {
      overflow-x: auto;
    }

    table {
      width: 100%;
    }

    .mat-mdc-header-cell {
      font-weight: 600;
      color: #374151;
      background-color: #f9fafb;
    }

    .classroom-info {
      display: flex;
      flex-direction: column;

      .classroom-name {
        font-weight: 500;
        color: #1f2937;
      }

      .room-number {
        font-size: 12px;
        color: #6b7280;
      }
    }

    .capacity-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 100px;

      .enrollment {
        font-size: 13px;
        color: #4b5563;
      }

      .capacity-bar {
        height: 4px;
        background: #e5e7eb;
        border-radius: 2px;
        overflow: hidden;

        .capacity-fill {
          height: 100%;
          background: #10b981;
          border-radius: 2px;
          transition: width 0.3s;

          &.medium {
            background: #f59e0b;
          }

          &.high {
            background: #ef4444;
          }
        }
      }
    }

    .teacher-info {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #4b5563;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #9ca3af;
      }
    }

    .unassigned {
      color: #9ca3af;
      font-style: italic;
    }

    .actions-header {
      width: 50px;
    }

    .actions-cell {
      text-align: right;
    }

    .archive-action {
      color: #dc2626;

      mat-icon {
        color: #dc2626;
      }
    }

    .no-data-row .mat-cell {
      padding: 48px 24px;
      text-align: center;
    }

    .no-data-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      color: #9ca3af;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
      }

      p {
        margin: 0;
      }
    }

    mat-paginator {
      border-top: 1px solid #e5e7eb;
    }
  `],
})
export class ClassroomsListComponent implements OnInit {
  readonly academicsService = inject(AcademicsService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  readonly classrooms = this.academicsService.classrooms;
  readonly displayedColumns = ['name', 'year_level', 'capacity', 'teacher', 'status', 'actions'];

  currentPage = 0;
  pageSize = 25;
  sortField = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  ngOnInit(): void {
    this.loadClassrooms();
  }

  loadClassrooms(): void {
    this.academicsService.getClassrooms(this.currentPage + 1, this.pageSize)
      .subscribe({
        next: (response) => {
          this.academicsService.setClassrooms(response.results, response.count);
        },
        error: () => {
          // Error handled in service
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadClassrooms();
  }

  onSort(sort: Sort): void {
    this.sortField = sort.active;
    this.sortDirection = sort.direction as 'asc' | 'desc' || 'asc';
    this.loadClassrooms();
  }

  addClassroom(): void {
    this.snackBar.open('Add classroom feature coming soon', 'Close', { duration: 3000 });
  }

  viewClassroom(classroom: Classroom): void {
    this.snackBar.open(`Viewing ${classroom.name}`, 'Close', { duration: 3000 });
  }

  editClassroom(classroom: Classroom): void {
    this.snackBar.open(`Editing ${classroom.name}`, 'Close', { duration: 3000 });
  }

  manageStudents(classroom: Classroom): void {
    this.snackBar.open(`Managing students in ${classroom.name}`, 'Close', { duration: 3000 });
  }

  archiveClassroom(classroom: Classroom): void {
    if (confirm(`Are you sure you want to archive ${classroom.name}?`)) {
      this.academicsService.archiveClassroom(classroom.id).subscribe({
        next: () => {
          this.snackBar.open(`${classroom.name} archived successfully`, 'Close', { duration: 3000 });
          this.loadClassrooms();
        },
        error: (err) => {
          this.snackBar.open(`Failed to archive: ${err.message}`, 'Close', { duration: 5000 });
        }
      });
    }
  }

  openBulkPromotion(): void {
    const dialogRef = this.dialog.open(BulkPromotionDialogComponent, {
      width: '600px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.success) {
        this.snackBar.open(result.message, 'Close', { duration: 5000 });
        this.loadClassrooms();
      }
    });
  }
}
