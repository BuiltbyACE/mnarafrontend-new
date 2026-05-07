import { Component, inject, OnInit, signal, computed } from '@angular/core';
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
import { AcademicsService, Classroom } from '../../services/academics.service';
import { ClassroomDialogComponent } from './classroom-dialog.component';

@Component({
  selector: 'app-classrooms-list',
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
    <div class="page-container">
      <div class="page-header">
        <div class="header-content">
          <h1>Classrooms</h1>
          <p>Manage classroom spaces and capacity</p>
        </div>
        <button mat-flat-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          Add Classroom
        </button>
      </div>

      <mat-card class="content-card">
        <div class="search-bar">
          <mat-form-field appearance="outline" class="search-field">
            <mat-icon matPrefix>search</mat-icon>
            <input matInput placeholder="Search classrooms..." [(ngModel)]="searchQuery" />
          </mat-form-field>
        </div>

        @if (service.isLoading()) {
          <div class="loading-state">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
        } @else {
          <table mat-table [dataSource]="filteredClassrooms()" class="full-width-table">
            <ng-container matColumnDef="room_number">
              <th mat-header-cell *matHeaderCellDef>Room Number</th>
              <td mat-cell *matCellDef="let row">{{ row.room_number }}</td>
            </ng-container>

            <ng-container matColumnDef="building">
              <th mat-header-cell *matHeaderCellDef>Building</th>
              <td mat-cell *matCellDef="let row">{{ row.building || 'N/A' }}</td>
            </ng-container>

            <ng-container matColumnDef="capacity">
              <th mat-header-cell *matHeaderCellDef>Capacity</th>
              <td mat-cell *matCellDef="let row">
                <span class="capacity-badge">{{ row.capacity }} seats</span>
              </td>
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
                <button mat-icon-button color="warn" (click)="deleteClassroom(row)">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

            <tr class="mat-row" *matNoDataRow><td class="mat-cell" [attr.colspan]="displayedColumns.length">No data available</td></tr>
          </table>
        }
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .header-content h1 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 4px;
    }

    .header-content p {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0;
    }

    .content-card {
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.07);
    }

    .search-bar {
      padding: 16px 16px 0;
    }

    .search-field {
      width: 100%;
      max-width: 400px;
    }

    .full-width-table {
      width: 100%;
    }

    .loading-state {
      display: flex;
      justify-content: center;
      padding: 48px;
    }

    .capacity-badge {
      display: inline-block;
      padding: 4px 12px;
      background: #f1f5f9;
      border-radius: 16px;
      font-size: 0.75rem;
      color: #475569;
      font-weight: 500;
    }

    mat-chip.active {
      background: #dcfce7;
      color: #166534;
    }

    mat-chip.inactive {
      background: #fee2e2;
      color: #991b1b;
    }

    .no-data-row {
      text-align: center;
    }

    .no-data-cell {
      padding: 48px;
      color: #94a3b8;
      font-size: 0.875rem;
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 16px;
      }
    }
  `],
})
export class ClassroomsListComponent implements OnInit {
  readonly service = inject(AcademicsService);
  readonly dialog = inject(MatDialog);

  searchQuery = '';
  displayedColumns = ['room_number', 'building', 'capacity', 'is_active', 'actions'];

  readonly filteredClassrooms = computed(() => {
    const classrooms = this.service.classrooms();
    if (!this.searchQuery) return classrooms;
    const query = this.searchQuery.toLowerCase();
    return classrooms.filter(c => 
      c.room_number.toLowerCase().includes(query) ||
      (c.building && c.building.toLowerCase().includes(query))
    );
  });

  ngOnInit(): void {
    this.service.getClassrooms().subscribe();
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(ClassroomDialogComponent, {
      width: '500px',
      data: { isEdit: false },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.createClassroom(result).subscribe();
      }
    });
  }

  openEditDialog(classroom: Classroom): void {
    const dialogRef = this.dialog.open(ClassroomDialogComponent, {
      width: '500px',
      data: { isEdit: true, classroom },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.updateClassroom(classroom.id, result).subscribe();
      }
    });
  }

  deleteClassroom(classroom: Classroom): void {
    if (confirm(`Delete classroom ${classroom.room_number}?`)) {
      this.service.deleteClassroom(classroom.id).subscribe();
    }
  }
}
