/**
 * Faculty List Component
 * Staff & HR module - faculty management with data table
 */

import { Component, inject, OnInit, computed } from '@angular/core';
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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { StaffService } from '../../services/staff.service';
import { Faculty } from '../../../../shared/models/staff.models';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-faculty-list',
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
    MatSnackBarModule,
    StatusBadgeComponent,
  ],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div class="title-section">
          <h1>Staff & HR</h1>
          <p class="subtitle">Faculty & Support Staff</p>
        </div>
        <button mat-raised-button color="primary" (click)="addStaff()">
          <mat-icon>person_add</mat-icon>
          Add Staff
        </button>
      </header>

      <!-- Payroll Summary Cards -->
      <div class="summary-cards">
        <mat-card class="summary-card">
          <mat-card-content>
            <div class="summary-icon payroll">
            <mat-icon>payments</mat-icon>
          </div>
          <div class="summary-info">
            <span class="summary-value">{{ formatCurrency(monthlyPayroll()) }}</span>
            <span class="summary-label">Monthly Payroll</span>
          </div>
        </mat-card-content>
      </mat-card>

        @if (payrollSummary(); as summary) {
          <mat-card class="summary-card" [class.alert]="summary.payrolls_pending_approval > 0">
            <mat-card-content>
              <div class="summary-icon pending">
                <mat-icon>pending_actions</mat-icon>
              </div>
              <div class="summary-info">
                <span class="summary-value">{{ summary.payrolls_pending_approval }}</span>
                <span class="summary-label">Pending Approvals</span>
              </div>
            </mat-card-content>
          </mat-card>
        }
      </div>

      @if (staffService.error()) {
        <div class="error-alert">
          <mat-icon>error</mat-icon>
          <span>{{ staffService.error() }}</span>
        </div>
      }

      <mat-card class="content-card">
        <mat-card-content>
          <div class="table-container">
            <table mat-table [dataSource]="staff()" matSort (matSortChange)="onSort($event)">
               
              <!-- Staff Column -->
              <ng-container matColumnDef="staff">
                <th mat-header-cell *matHeaderCellDef> Staff Member </th>
                <td mat-cell *matCellDef="let element">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <div class="avatar sm">{{ getInitials(element.other_names + ' ' + element.surname) }}</div>
                    <div style="display: flex; flex-direction: column;">
                      <span style="font-weight: 500;">{{ element.other_names }} {{ element.surname }}</span>
                      <span style="font-size: 0.75rem; color: #64748b;">{{ element.employee_id || 'ID Pending' }}</span>
                    </div>
                  </div>
                </td>
              </ng-container>

              <!-- Role & Department Column -->
              <ng-container matColumnDef="role">
                <th mat-header-cell *matHeaderCellDef> Role & Department </th>
                <td mat-cell *matCellDef="let element"> 
                  <div style="display: flex; flex-direction: column;">
                    <span style="font-weight: 500;">{{ element.role_display || 'Staff' }}</span>
                    <span style="font-size: 0.75rem; color: #64748b;">{{ element.department_name }}</span>
                  </div>
                </td>
              </ng-container>

              <!-- Type Column -->
              <ng-container matColumnDef="type">
                <th mat-header-cell *matHeaderCellDef> Type </th>
                <td mat-cell *matCellDef="let element"> {{ element.employment_type_display || 'Full-Time' }} </td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef> Status </th>
                <td mat-cell *matCellDef="let element"> 
                  <app-status-badge [type]="element.is_active ? 'active' : 'inactive'"></app-status-badge> 
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef> Actions </th>
                <td mat-cell *matCellDef="let element">
                  <button mat-icon-button color="primary"><mat-icon>visibility</mat-icon></button>
                  <button mat-icon-button color="accent"><mat-icon>edit</mat-icon></button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

              <tr class="mat-row no-data-row" *matNoDataRow>
                <td class="mat-cell" [attr.colspan]="displayedColumns.length">
                  <div class="no-data-message">
                    @if (staffService.isLoading()) {
                      <mat-spinner diameter="40"></mat-spinner>
                    } @else {
                      <mat-icon>people</mat-icon>
                      <p>No staff members found</p>
                    }
                  </div>
                </td>
              </tr>
            </table>
          </div>

          <mat-paginator
            [length]="staffService.totalCount()"
            [pageSize]="pageSize"
            [pageSizeOptions]="[10, 25, 50, 100]"
            [pageIndex]="currentPage"
            (page)="onPageChange($event)"
            aria-label="Select page of staff">
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
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .summary-card {
      border-radius: 12px;

      mat-card-content {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 20px;
      }

      &.alert {
        background: #fef3c7;
        border: 1px solid #f59e0b;
      }
    }

    .summary-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;

      &.payroll {
        background: #dbeafe;
        color: #3b82f6;
      }

      &.pending {
        background: #fef3c7;
        color: #f59e0b;
      }

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
    }

    .summary-info {
      display: flex;
      flex-direction: column;

      .summary-value {
        font-size: 24px;
        font-weight: 700;
        color: #1f2937;
      }

      .summary-label {
        font-size: 14px;
        color: #6b7280;
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

    .staff-info {
      display: flex;
      align-items: center;
      gap: 12px;

      .avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 600;
      }

      .staff-details {
        display: flex;
        flex-direction: column;

        .staff-name {
          font-weight: 500;
          color: #1f2937;
        }

        .staff-id {
          font-size: 12px;
          color: #6b7280;
        }
      }
    }

    .actions-header {
      width: 50px;
    }

    .actions-cell {
      text-align: right;
    }

    .deactivate-action {
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
export class FacultyListComponent implements OnInit {
  readonly staffService = inject(StaffService);
  private snackBar = inject(MatSnackBar);

  readonly staff = this.staffService.staff;
  readonly payrollSummary = this.staffService.payrollSummary;
  readonly displayedColumns = ['staff', 'role', 'type', 'status', 'actions'];

  readonly monthlyPayroll = computed(() => {
    return this.staff().reduce((sum, staff) => sum + (Number((staff as any).base_salary) || 0), 0);
  });

  currentPage = 0;
  pageSize = 25;

  ngOnInit(): void {
    this.loadStaff();
    this.staffService.loadPayrollSummary();
  }

  loadStaff(): void {
    this.staffService.getFaculty(this.currentPage + 1, this.pageSize)
      .subscribe({
        next: (response) => {
          this.staffService.setStaff(response.results, response.count);
        },
        error: () => {
          // Error handled in service
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadStaff();
  }

  onSort(sort: Sort): void {
    // Sort handled by backend in real implementation
    this.loadStaff();
  }

  getInitials(name: string): string {
    if (!name) return '??';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '??';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  addStaff(): void {
    this.snackBar.open('Add staff feature coming soon', 'Close', { duration: 3000 });
  }

  viewStaff(faculty: Faculty): void {
    this.snackBar.open(`Viewing ${faculty.full_name}'s profile`, 'Close', { duration: 3000 });
  }

  editStaff(faculty: Faculty): void {
    this.snackBar.open(`Editing ${faculty.full_name}`, 'Close', { duration: 3000 });
  }

  viewPayroll(faculty: Faculty): void {
    this.snackBar.open(`Viewing payroll for ${faculty.full_name}`, 'Close', { duration: 3000 });
  }

  deactivateStaff(faculty: Faculty): void {
    if (confirm(`Are you sure you want to deactivate ${faculty.full_name}?`)) {
      this.staffService.deactivateFaculty(faculty.id).subscribe({
        next: () => {
          this.snackBar.open(`${faculty.full_name} deactivated successfully`, 'Close', { duration: 3000 });
          this.loadStaff();
        },
        error: (err) => {
          this.snackBar.open(`Failed to deactivate: ${err.message}`, 'Close', { duration: 5000 });
        }
      });
    }
  }
}
