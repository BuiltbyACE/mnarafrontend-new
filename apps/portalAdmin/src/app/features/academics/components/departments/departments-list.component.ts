import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AcademicsService, Department } from '../../services/academics.service';
import { DepartmentDialogComponent } from './department-dialog.component';

@Component({
  selector: 'app-departments-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  
    MatIconModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-content">
          <h1>Departments</h1>
          <p>Manage academic departments and their heads</p>
        </div>
        <button mat-flat-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          Create Department
        </button>
      </div>

      <mat-card class="content-card">
        <div class="search-bar">
          <div class="search-field">
            <input placeholder="Search departments..." [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)" />
          </div>
        </div>

        @if (service.isLoading()) {
          <div class="loading-state">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
        } @else {
          <table mat-table [dataSource]="filteredDepartments()" class="full-width-table">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let row">{{ row.name }}</td>
            </ng-container>

            <ng-container matColumnDef="code">
              <th mat-header-cell *matHeaderCellDef>Code</th>
              <td mat-cell *matCellDef="let row">{{ row.code || '—' }}</td>
            </ng-container>

            <ng-container matColumnDef="head_of_department">
              <th mat-header-cell *matHeaderCellDef>HOD</th>
              <td mat-cell *matCellDef="let row">
                {{ row.head_of_department?.name || row.hod_name || 'Not assigned' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="is_active">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let row">
                <mat-chip [class.active]="row.is_active !== false" [class.inactive]="row.is_active === false">
                  {{ row.is_active === false ? 'Inactive' : 'Active' }}
                </mat-chip>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let row">
                <button mat-icon-button (click)="openEditDialog(row)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="deleteDepartment(row)">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell" [attr.colspan]="displayedColumns.length">
                No departments found
              </td>
            </tr>
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

    .full-width-table {
      width: 100%;
    }

    .loading-state {
      display: flex;
      justify-content: center;
      padding: 48px;
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

      .displayedColumns {
        font-size: 0.75rem;
      }
    }
  `],
})
export class DepartmentsListComponent implements OnInit {
  readonly service = inject(AcademicsService);
  readonly dialog = inject(MatDialog);

  searchQuery = signal('');
  displayedColumns = ['name', 'code', 'head_of_department', 'is_active', 'actions'];

  readonly filteredDepartments = computed(() => {
    const departments = this.service.departments();
    if (!this.searchQuery()) return departments;
    const query = this.searchQuery().toLowerCase();
    return departments.filter(d => 
      d.name.toLowerCase().includes(query) ||
      d.code.toLowerCase().includes(query) ||
      (d.head_of_department?.name?.toLowerCase().includes(query) ?? false) ||
      (d.hod_name?.toLowerCase().includes(query) ?? false)
    );
  });

  ngOnInit(): void {
    this.service.getDepartments().subscribe();
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(DepartmentDialogComponent, {
      width: '500px',
      data: { isEdit: false },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && typeof result === 'object') {
        this.service.createDepartment(result).subscribe({
          next: () => this.service.getDepartments().subscribe()
        });
      }
    });
  }

  openEditDialog(department: Department): void {
    const dialogRef = this.dialog.open(DepartmentDialogComponent, {
      width: '500px',
      data: { isEdit: true, department },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && typeof result === 'object') {
        this.service.updateDepartment(department.id, result).subscribe({
          next: () => this.service.getDepartments().subscribe()
        });
      }
    });
  }

  deleteDepartment(department: Department): void {
    if (confirm(`Delete ${department.name}?`)) {
      this.service.deleteDepartment(department.id).subscribe({
        next: () => this.service.getDepartments().subscribe()
      });
    }
  }
}

