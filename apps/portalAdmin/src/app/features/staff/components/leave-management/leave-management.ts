import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { StaffService } from '../../services/staff.service';
import { LeaveRequest } from '../../../../shared/models/staff.models';
import { StatusBadgeComponent, BadgeType } from '../../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-leave-management',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    StatusBadgeComponent,
  ],
  template: `
    <div class="leave-container">
      <header class="page-header">
        <div class="title-section">
          <h1>Leave & Time Off</h1>
          <p class="subtitle">Manage staff leave requests and balances</p>
        </div>
      </header>

      @if (staffService.leaveError(); as err) {
        <div class="error-alert">
          <mat-icon>error</mat-icon>
          <span>{{ err }}</span>
        </div>
      }

      <!-- Leave Requests Table -->
      <mat-card class="content-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>event_note</mat-icon>
            Leave Requests
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="table-container">
            <table mat-table [dataSource]="staffService.leaveRequests()">

              <ng-container matColumnDef="staff_name">
                <th mat-header-cell *matHeaderCellDef>Staff Name</th>
                <td mat-cell *matCellDef="let req">
                  <span class="staff-name">{{ req.staff_name }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="leave_type">
                <th mat-header-cell *matHeaderCellDef>Leave Type</th>
                <td mat-cell *matCellDef="let req">
                  <span class="leave-type-chip" [class]="req.leave_type.toLowerCase()">
                    {{ req.leave_type_display }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="dates">
                <th mat-header-cell *matHeaderCellDef>Dates</th>
                <td mat-cell *matCellDef="let req">
                  <div class="dates-cell">
                    <span>{{ req.start_date | date: 'mediumDate' }}</span>
                    <mat-icon>arrow_forward</mat-icon>
                    <span>{{ req.end_date | date: 'mediumDate' }}</span>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let req">
                  <app-status-badge [type]="getStatusType(req.status)" />
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let req">
                  @if (req.status === 'PENDING') {
                    <div class="action-buttons">
                      <button
                        mat-stroked-button
                        color="primary"
                        (click)="approveLeave(req)">
                        <mat-icon>check_circle</mat-icon>
                        Approve
                      </button>
                      <button
                        mat-stroked-button
                        color="warn"
                        (click)="rejectLeave(req)">
                        <mat-icon>cancel</mat-icon>
                        Reject
                      </button>
                    </div>
                  } @else {
                    <span class="no-action">&mdash;</span>
                  }
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

              <!-- No data / loading row -->
              <tr class="mat-row no-data-row" *matNoDataRow>
                <td class="mat-cell" [attr.colspan]="displayedColumns.length">
                  <div class="no-data-message">
                    @if (staffService.isLeaveLoading()) {
                      <mat-spinner diameter="40"></mat-spinner>
                      <p>Loading leave requests...</p>
                    } @else {
                      <mat-icon>event_busy</mat-icon>
                      <p>No leave requests found</p>
                    }
                  </div>
                </td>
              </tr>
            </table>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Leave Balances Section -->
      <mat-card class="content-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>account_balance_wallet</mat-icon>
            Leave Balances
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="table-container">
            <table mat-table [dataSource]="staffService.leaveBalances()">

              <ng-container matColumnDef="staff_name">
                <th mat-header-cell *matHeaderCellDef>Staff Name</th>
                <td mat-cell *matCellDef="let bal">{{ bal.staff_name || bal.staff }}</td>
              </ng-container>

              <ng-container matColumnDef="points_remaining">
                <th mat-header-cell *matHeaderCellDef>Compassionate Points Remaining</th>
                <td mat-cell *matCellDef="let bal">
                  <span class="points-badge">{{ bal.points_remaining }}</span>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="balanceColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: balanceColumns;"></tr>

              <!-- No data / loading row -->
              <tr class="mat-row no-data-row" *matNoDataRow>
                <td class="mat-cell" [attr.colspan]="balanceColumns.length">
                  <div class="no-data-message">
                    @if (staffService.isLeaveLoading()) {
                      <mat-spinner diameter="40"></mat-spinner>
                      <p>Loading leave balances...</p>
                    } @else {
                      <mat-icon>account_balance_wallet</mat-icon>
                      <p>No leave balances found</p>
                    }
                  </div>
                </td>
              </tr>
            </table>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .leave-container { padding: 24px; }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }
    .page-header h1 { font-size: 24px; font-weight: 600; margin: 0; }
    .page-header .subtitle { color: #6b7280; margin: 0; }

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

    .content-card { border-radius: 12px; margin-bottom: 24px; }
    .content-card mat-card-header { padding: 20px 24px 0; }
    .content-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.1rem;
      font-weight: 600;
    }
    .content-card mat-card-title mat-icon { color: #6b7280; }

    .table-container { overflow-x: auto; }
    table { width: 100%; }
    .mat-mdc-header-cell { font-weight: 600; color: #374151; background: #f9fafb; }

    .staff-name { font-weight: 500; }

    .leave-type-chip {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .leave-type-chip.sick { background: #fce7f3; color: #be185d; }
    .leave-type-chip.maternity { background: #f3e8ff; color: #7c3aed; }
    .leave-type-chip.compassionate { background: #fff7ed; color: #ea580c; }

    .dates-cell {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
    }
    .dates-cell mat-icon { font-size: 16px; width: 16px; height: 16px; color: #9ca3af; }

    .action-buttons {
      display: flex;
      gap: 8px;
    }
    .action-buttons button {
      font-size: 0.8rem;
      line-height: 1;
      padding: 4px 12px;
    }
    .action-buttons button mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    .no-action { color: #d1d5db; }

    .no-data-row .mat-cell { padding: 48px 24px; text-align: center; }
    .no-data-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      color: #9ca3af;
    }
    .no-data-message mat-icon { font-size: 48px; width: 48px; height: 48px; }

    .points-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 28px;
      padding: 2px 10px;
      border-radius: 12px;
      background: #fff7ed;
      color: #ea580c;
      font-weight: 600;
      font-size: 0.85rem;
    }
  `],
})
export class LeaveManagementComponent implements OnInit {
  readonly staffService = inject(StaffService);
  private readonly snackBar = inject(MatSnackBar);

  readonly displayedColumns = ['staff_name', 'leave_type', 'dates', 'status', 'actions'];
  readonly balanceColumns = ['staff_name', 'points_remaining'];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.staffService.getLeaveRequests().subscribe({
      next: (response) => this.staffService.leaveRequests.set(response.results),
    });

    this.staffService.getLeaveBalances().subscribe({
      next: (response) => this.staffService.leaveBalances.set(response.results),
    });
  }

  getStatusType(status: string): BadgeType {
    switch (status) {
      case 'APPROVED': return 'approved';
      case 'REJECTED': return 'rejected';
      default: return 'pending';
    }
  }

  approveLeave(req: LeaveRequest): void {
    this.staffService.approveLeave(req.id).subscribe({
      next: () => {
        this.snackBar.open(`${req.staff_name}'s leave approved`, 'Close', { duration: 3000 });
        this.loadData();
      },
      error: (err) => {
        this.snackBar.open(`Failed: ${err.message}`, 'Close', { duration: 5000 });
      },
    });
  }

  rejectLeave(req: LeaveRequest): void {
    this.staffService.rejectLeave(req.id).subscribe({
      next: () => {
        this.snackBar.open(`${req.staff_name}'s leave rejected`, 'Close', { duration: 3000 });
        this.loadData();
      },
      error: (err) => {
        this.snackBar.open(`Failed: ${err.message}`, 'Close', { duration: 5000 });
      },
    });
  }
}
