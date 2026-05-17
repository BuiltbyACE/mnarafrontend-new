import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe, NgClass, TitleCasePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { TeacherProfile, LeaveBalance, LeaveRequest } from '../../shared/models/teacher.models';

@Component({
  selector: 'app-teacher-hr',
  imports: [DatePipe, NgClass, TitleCasePipe, MatCardModule, MatIconModule, MatButtonModule, MatChipsModule, MatTableModule, MatDividerModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">HR & Leave Management</h1>
          <p class="page-desc">Manage your profile and leave requests</p>
        </div>
        <button class="request-btn">
          <mat-icon>add</mat-icon>
          Request Leave
        </button>
      </div>

      <mat-card class="profile-card">
        <div class="profile-left">
          <div class="profile-avatar">{{ initials() }}</div>
          <div class="profile-info">
            <h2 class="profile-name">{{ profile.name }}</h2>
            <span class="profile-id">Employee ID: {{ profile.employeeId }}</span>
          </div>
        </div>
        <mat-divider vertical class="profile-divider" />
        <div class="profile-details">
          <div class="detail-item">
            <mat-icon class="detail-icon">business</mat-icon>
            <div>
              <span class="detail-label">Department</span>
              <span class="detail-value">{{ profile.department }}</span>
            </div>
          </div>
          <div class="detail-item">
            <mat-icon class="detail-icon">badge</mat-icon>
            <div>
              <span class="detail-label">Role</span>
              <span class="detail-value">{{ profile.role }}</span>
            </div>
          </div>
          <div class="detail-item">
            <mat-icon class="detail-icon">mail</mat-icon>
            <div>
              <span class="detail-label">Email</span>
              <span class="detail-value">{{ profile.email }}</span>
            </div>
          </div>
          <div class="detail-item">
            <mat-icon class="detail-icon">phone</mat-icon>
            <div>
              <span class="detail-label">Phone</span>
              <span class="detail-value">{{ profile.phone }}</span>
            </div>
          </div>
        </div>
      </mat-card>

      <div class="section">
        <h2 class="section-title">Leave Balance</h2>
        <div class="leave-cards">
          @for (lb of leaveBalances(); track lb.type) {
            <mat-card class="leave-card">
              <div class="leave-header">
                <span class="leave-type">{{ lb.type }}</span>
                <span class="leave-total">{{ lb.remaining }} / {{ lb.total }}</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill" [style.width.%]="usagePercent(lb)"></div>
              </div>
              <div class="leave-stats">
                <div class="stat">
                  <span class="stat-label">Total</span>
                  <span class="stat-value">{{ lb.total }}</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Used</span>
                  <span class="stat-value used">{{ lb.used }}</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Remaining</span>
                  <span class="stat-value remaining">{{ lb.remaining }}</span>
                </div>
              </div>
            </mat-card>
          }
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h2 class="section-title">Leave Request History</h2>
        </div>
        <mat-card class="table-card">
          <table mat-table [dataSource]="leaveRequests()" class="leave-table">
            <ng-container matColumnDef="leaveType">
              <th mat-header-cell *matHeaderCellDef>Leave Type</th>
              <td mat-cell *matCellDef="let r">{{ r.leaveType }}</td>
            </ng-container>
            <ng-container matColumnDef="startDate">
              <th mat-header-cell *matHeaderCellDef>Start Date</th>
              <td mat-cell *matCellDef="let r">{{ r.startDate | date:'MMM d, yyyy' }}</td>
            </ng-container>
            <ng-container matColumnDef="endDate">
              <th mat-header-cell *matHeaderCellDef>End Date</th>
              <td mat-cell *matCellDef="let r">{{ r.endDate | date:'MMM d, yyyy' }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let r">
                <span class="status-badge" [ngClass]="r.status">
                  {{ r.status | titlecase }}
                </span>
              </td>
            </ng-container>
            <ng-container matColumnDef="reason">
              <th mat-header-cell *matHeaderCellDef>Reason</th>
              <td mat-cell *matCellDef="let r" class="reason-cell">{{ r.reason }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
          @if (leaveRequests().length === 0) {
            <div class="table-empty">
              <p>No leave requests found</p>
            </div>
          }
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; font-family: 'Inter', sans-serif; }
    .page { padding: 24px 32px; max-width: 1100px; }
    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: 24px;
    }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0; }
    .page-desc { font-size: 0.875rem; color: #64748b; margin: 4px 0 0; }
    .request-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 10px 20px; border-radius: 8px; border: none;
      background: #2563eb; color: white; font-size: 0.875rem;
      font-weight: 600; font-family: 'Inter', sans-serif; cursor: pointer;
      transition: background 0.15s ease; flex-shrink: 0;
    }
    .request-btn:hover { background: #1d4ed8; }
    .request-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .profile-card {
      display: flex; align-items: stretch; gap: 24px;
      padding: 24px; border-radius: 10px; border: 1px solid #e2e8f0;
      background: white; margin-bottom: 32px;
    }
    .profile-left { display: flex; align-items: center; gap: 16px; flex-shrink: 0; }
    .profile-avatar {
      width: 52px; height: 52px; border-radius: 50%;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: white; display: flex; align-items: center; justify-content: center;
      font-size: 1.125rem; font-weight: 700; flex-shrink: 0;
    }
    .profile-info { display: flex; flex-direction: column; }
    .profile-name { font-size: 1.0625rem; font-weight: 700; color: #0f172a; margin: 0; }
    .profile-id { font-size: 0.75rem; color: #94a3b8; margin-top: 2px; }
    .profile-divider { height: auto; }
    .profile-details {
      display: flex; flex-wrap: wrap; gap: 16px 32px; flex: 1;
      align-content: center;
    }
    .detail-item {
      display: flex; align-items: center; gap: 10px;
    }
    .detail-item .detail-icon { font-size: 20px; width: 20px; height: 20px; color: #94a3b8; }
    .detail-item div { display: flex; flex-direction: column; }
    .detail-label { font-size: 0.6875rem; font-weight: 500; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em; }
    .detail-value { font-size: 0.8125rem; font-weight: 500; color: #334155; }

    .section { margin-bottom: 32px; }
    .section-header { margin-bottom: 16px; }
    .section-title {
      font-size: 1.0625rem; font-weight: 700; color: #0f172a; margin: 0 0 16px;
    }

    .leave-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .leave-card {
      padding: 20px; border-radius: 10px; border: 1px solid #e2e8f0;
      background: white; display: flex; flex-direction: column; gap: 14px;
    }
    .leave-header { display: flex; align-items: center; justify-content: space-between; }
    .leave-type { font-size: 0.875rem; font-weight: 600; color: #0f172a; }
    .leave-total { font-size: 0.8125rem; font-weight: 700; color: #2563eb; }

    .progress-track {
      width: 100%; height: 6px; background: #e2e8f0; border-radius: 3px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%; background: #2563eb; border-radius: 3px;
      transition: width 0.3s ease;
    }

    .leave-stats { display: flex; justify-content: space-between; }
    .stat { display: flex; flex-direction: column; align-items: center; }
    .stat-label { font-size: 0.6875rem; color: #94a3b8; font-weight: 500; }
    .stat-value { font-size: 1rem; font-weight: 700; color: #0f172a; }
    .stat-value.used { color: #f59e0b; }
    .stat-value.remaining { color: #10b981; }

    .table-card {
      border-radius: 10px; border: 1px solid #e2e8f0;
      overflow: hidden; background: white;
    }
    .leave-table { width: 100%; }
    .leave-table th {
      font-size: 0.75rem; font-weight: 600; color: #64748b;
      text-transform: uppercase; letter-spacing: 0.04em;
      padding: 14px 16px; border-bottom: 1px solid #e2e8f0;
      background: #f8fafc; font-family: 'Inter', sans-serif;
    }
    .leave-table td {
      font-size: 0.8125rem; color: #334155; padding: 12px 16px;
      border-bottom: 1px solid #f1f5f9; font-family: 'Inter', sans-serif;
    }
    .reason-cell { max-width: 240px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .status-badge {
      display: inline-flex; align-items: center; padding: 3px 10px;
      border-radius: 100px; font-size: 0.6875rem; font-weight: 600;
    }
    .status-badge.pending { background: #fef3c7; color: #92400e; }
    .status-badge.approved { background: #dcfce7; color: #166534; }
    .status-badge.rejected { background: #fee2e2; color: #991b1b; }

    .table-empty { padding: 32px; text-align: center; color: #94a3b8; font-size: 0.875rem; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HrComponent {
  readonly displayedColumns = ['leaveType', 'startDate', 'endDate', 'status', 'reason'];

  readonly profile: TeacherProfile = {
    name: 'Mr. David Johnson',
    employeeId: 'TCH-2024-0042',
    department: 'Science Department',
    role: 'Senior Science Teacher',
    email: 'david.johnson@mnaraschool.com',
    phone: '+254 712 345 678',
  };

  readonly initials = computed(() =>
    this.profile.name.split(' ').filter(n => n.length > 0).map(n => n[0]).join('').toUpperCase()
  );

  readonly leaveBalances = signal<LeaveBalance[]>([
    { type: 'Sick Leave', total: 30, used: 8, remaining: 22 },
    { type: 'Annual Leave', total: 24, used: 10, remaining: 14 },
    { type: 'Personal Leave', total: 12, used: 3, remaining: 9 },
  ]);

  readonly leaveRequests = signal<LeaveRequest[]>([
    { id: 'LR-001', leaveType: 'Annual Leave', startDate: '2026-06-15', endDate: '2026-06-20', status: 'approved', reason: 'Family vacation abroad', appliedOn: '2026-05-01' },
    { id: 'LR-002', leaveType: 'Sick Leave', startDate: '2026-04-22', endDate: '2026-04-23', status: 'approved', reason: 'Medical appointment', appliedOn: '2026-04-21' },
    { id: 'LR-003', leaveType: 'Personal Leave', startDate: '2026-05-10', endDate: '2026-05-10', status: 'approved', reason: 'Personal errand', appliedOn: '2026-05-05' },
    { id: 'LR-004', leaveType: 'Annual Leave', startDate: '2026-07-01', endDate: '2026-07-10', status: 'pending', reason: 'End of term break', appliedOn: '2026-05-12' },
    { id: 'LR-005', leaveType: 'Personal Leave', startDate: '2026-03-05', endDate: '2026-03-05', status: 'rejected', reason: 'Insufficient coverage in department', appliedOn: '2026-03-01' },
    { id: 'LR-006', leaveType: 'Sick Leave', startDate: '2026-02-10', endDate: '2026-02-12', status: 'approved', reason: 'Flu recovery', appliedOn: '2026-02-09' },
  ]);

  usagePercent(lb: LeaveBalance): number {
    return lb.total > 0 ? Math.round((lb.used / lb.total) * 100) : 0;
  }
}
