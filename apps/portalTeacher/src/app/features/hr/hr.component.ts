import { Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe, NgClass, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { TeacherProfile, LeaveBalance, LeaveRequest } from '../../shared/models/teacher.models';
import { TeacherSettingsService } from '../../core/services/teacher-settings.service';
import { TeacherLeaveService } from '../../core/services/teacher-leave.service';

@Component({
  selector: 'app-teacher-hr',
  imports: [DatePipe, NgClass, TitleCasePipe, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatChipsModule, MatTableModule, MatDividerModule, MatSelectModule, MatOptionModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">HR & Leave Management</h1>
          <p class="page-desc">Manage your profile and leave requests</p>
        </div>
        <button class="request-btn" (click)="showForm.set(true)">
          <mat-icon>add</mat-icon>
          Request Leave
        </button>
      </div>

      @if (showForm()) {
        <mat-card class="leave-form-card">
          <div class="form-header">
            <h3>New Leave Request</h3>
            <button class="form-close" (click)="cancelForm()">&times;</button>
          </div>
          <div class="form-body">
            <div class="form-field">
              <label>Leave Type</label>
              <mat-select [(ngModel)]="formLeaveType" class="form-select">
                <mat-option value="COMPASSIONATE">Compassionate Leave (3 days)</mat-option>
                <mat-option value="SICK">Sick Leave</mat-option>
                <mat-option value="MATERNITY">Maternity Leave (90 days)</mat-option>
              </mat-select>
            </div>
            <div class="form-row">
              <div class="form-field">
                <label>Start Date</label>
                <input type="date" class="form-input" [(ngModel)]="formStartDate" />
              </div>
              <div class="form-field">
                <label>End Date</label>
                <input type="date" class="form-input" [(ngModel)]="formEndDate" />
              </div>
            </div>
            <div class="form-field">
              <label>Reason for Leave</label>
              <textarea class="form-textarea" [(ngModel)]="formReason" rows="3" placeholder="Brief reason for your leave request..."></textarea>
            </div>
            @if (leaveService.error()) {
              <div class="form-error">{{ leaveService.error() }}</div>
            }
            <div class="form-actions">
              <button class="btn-cancel" (click)="cancelForm()">Cancel</button>
              <button class="btn-submit" (click)="submitRequest()" [disabled]="leaveService.isLoading() || !formValid()">
                {{ leaveService.isLoading() ? 'Submitting...' : 'Submit Request' }}
              </button>
            </div>
          </div>
        </mat-card>
      }

      <mat-card class="profile-card">
        <div class="profile-left">
          @if (profile().photoUrl; as photoUrl) {
            <img [src]="photoUrl" class="profile-avatar-img" alt="" />
          } @else {
            <div class="profile-avatar">{{ initials() }}</div>
          }
          <div class="profile-info">
            <h2 class="profile-name">{{ profile().name }}</h2>
            <span class="profile-id">Employee ID: {{ profile().employeeId }}</span>
            @if (profile().tscNumber) {
              <span class="profile-tsc">TSC: {{ profile().tscNumber }}</span>
            }
          </div>
        </div>
        <mat-divider vertical class="profile-divider" />
        <div class="profile-details">
          <div class="detail-item">
            <mat-icon class="detail-icon">business</mat-icon>
            <div>
              <span class="detail-label">Department</span>
              <span class="detail-value">{{ profile().department }}</span>
            </div>
          </div>
          <div class="detail-item">
            <mat-icon class="detail-icon">school</mat-icon>
            <div>
              <span class="detail-label">Qualification</span>
              <span class="detail-value">{{ qualificationLabel() }}</span>
            </div>
          </div>
          <div class="detail-item">
            <mat-icon class="detail-icon">psychology</mat-icon>
            <div>
              <span class="detail-label">Specialization</span>
              <span class="detail-value">{{ profile().specializationArea || '—' }}</span>
            </div>
          </div>
          <div class="detail-item">
            <mat-icon class="detail-icon">badge</mat-icon>
            <div>
              <span class="detail-label">National ID</span>
              <span class="detail-value">{{ profile().nationalId || '—' }}</span>
            </div>
          </div>
          <div class="detail-item">
            <mat-icon class="detail-icon">receipt_long</mat-icon>
            <div>
              <span class="detail-label">KRA PIN</span>
              <span class="detail-value">{{ profile().kraPin || '—' }}</span>
            </div>
          </div>
          <div class="detail-item">
            <mat-icon class="detail-icon">mail</mat-icon>
            <div>
              <span class="detail-label">Email</span>
              <span class="detail-value">{{ profile().email }}</span>
            </div>
          </div>
          <div class="detail-item">
            <mat-icon class="detail-icon">phone</mat-icon>
            <div>
              <span class="detail-label">Phone</span>
              <span class="detail-value">{{ profile().phone }}</span>
            </div>
          </div>
          <div class="detail-item">
            <mat-icon class="detail-icon">calendar_today</mat-icon>
            <div>
              <span class="detail-label">Hire Date</span>
              <span class="detail-value">{{ profile().hireDate ? (profile().hireDate | date:'MMM d, yyyy') : '—' }}</span>
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
                <span class="leave-total" [class.unlimited]="lb.total === 0">{{ lb.total > 0 ? lb.remaining + ' / ' + lb.total : 'Available' }}</span>
              </div>
              @if (lb.total > 0) {
                <div class="progress-track">
                  <div class="progress-fill" [style.width.%]="usagePercent(lb)"></div>
                </div>
              }
              <div class="leave-stats">
                <div class="stat">
                  <span class="stat-label">Total</span>
                  <span class="stat-value">{{ lb.total > 0 ? lb.total : '—' }}</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Used</span>
                  <span class="stat-value used">{{ lb.used }}</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Remaining</span>
                  <span class="stat-value remaining">{{ lb.total > 0 ? lb.remaining : '—' }}</span>
                </div>
              </div>
            </mat-card>
          }
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h2 class="section-title">Leave Request History</h2>
          <span class="section-count">{{ leaveRequests().length }} request(s)</span>
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
              <th mat-header-cell *matHeaderCellDef>Approval Pipeline</th>
              <td mat-cell *matCellDef="let r">
                <div class="pipeline">
                  <div class="pipeline-step" [class.active]="true" [class.done]="true">
                    <span class="step-dot"></span>
                    <span class="step-label">Submitted</span>
                  </div>
                  <div class="pipeline-connector" [class.done]="r.status !== 'pending'"></div>
                  <div class="pipeline-step" [class.active]="r.status === 'pending'" [class.done]="r.status === 'approved'" [class.rejected]="r.status === 'rejected'">
                    <span class="step-dot"></span>
                    <span class="step-label">{{ r.status === 'rejected' ? 'Rejected' : 'Admin Review' }}</span>
                  </div>
                  <div class="pipeline-connector" [class.done]="r.status === 'approved'"></div>
                  <div class="pipeline-step" [class.done]="r.status === 'approved'">
                    <span class="step-dot"></span>
                    <span class="step-label">Approved</span>
                  </div>
                </div>
              </td>
            </ng-container>
            <ng-container matColumnDef="reason">
              <th mat-header-cell *matHeaderCellDef>Reason</th>
              <td mat-cell *matCellDef="let r" class="reason-cell">{{ r.reason || '—' }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
          @if (leaveRequests().length === 0) {
            <div class="table-empty">
              <mat-icon>inbox</mat-icon>
              <p>No leave requests yet. Submit your first request above.</p>
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
    .page-title { font-size: 1.5rem; font-weight: 700; color: var(--mnara-text-primary, #0f172a); margin: 0; }
    .page-desc { font-size: 0.875rem; color: var(--mnara-text-muted, #64748b); margin: 4px 0 0; }
    .request-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 10px 20px; border-radius: 8px; border: none;
      background: var(--mnara-primary, #2563eb); color: white; font-size: 0.875rem;
      font-weight: 600; font-family: 'Inter', sans-serif; cursor: pointer;
      transition: background 0.15s ease; flex-shrink: 0;
    }
    .request-btn:hover { background: var(--mnara-primary-dark, #1d4ed8); }
    .request-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .leave-form-card {
      padding: 0; border-radius: 10px; border: 1px solid var(--mnara-border, #e2e8f0);
      margin-bottom: 24px; overflow: hidden;
    }
    .form-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px; background: var(--mnara-surface-alt, #f8fafc);
      border-bottom: 1px solid var(--mnara-border, #e2e8f0);
    }
    .form-header h3 { margin: 0; font-size: 0.9375rem; font-weight: 600; color: var(--mnara-text-primary, #0f172a); }
    .form-close {
      background: none; border: none; font-size: 1.5rem; cursor: pointer;
      color: var(--mnara-text-muted, #64748b); line-height: 1; padding: 0 4px;
    }
    .form-body { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
    .form-row { display: flex; gap: 16px; }
    .form-row .form-field { flex: 1; }
    .form-field { display: flex; flex-direction: column; gap: 6px; }
    .form-field label { font-size: 0.8125rem; font-weight: 600; color: var(--mnara-text-secondary, #475569); }
    .form-input, .form-select {
      padding: 10px 12px; border: 1px solid var(--mnara-border, #e2e8f0);
      border-radius: 6px; font-size: 0.875rem; font-family: 'Inter', sans-serif;
      background: var(--mnara-surface, #fff); color: var(--mnara-text-primary, #0f172a);
      transition: border-color 0.15s;
    }
    .form-input:focus { outline: none; border-color: var(--mnara-primary, #2563eb); }
    .form-textarea {
      padding: 10px 12px; border: 1px solid var(--mnara-border, #e2e8f0);
      border-radius: 6px; font-size: 0.875rem; font-family: 'Inter', sans-serif;
      resize: vertical; background: var(--mnara-surface, #fff); color: var(--mnara-text-primary, #0f172a);
    }
    .form-textarea:focus { outline: none; border-color: var(--mnara-primary, #2563eb); }
    .form-error { color: var(--mnara-error, #ef4444); font-size: 0.8125rem; }
    .form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 4px; }
    .btn-cancel {
      padding: 8px 18px; border-radius: 6px; border: 1px solid var(--mnara-border, #e2e8f0);
      background: var(--mnara-surface, #fff); color: var(--mnara-text-secondary, #475569);
      font-size: 0.8125rem; font-weight: 600; font-family: 'Inter', sans-serif; cursor: pointer;
    }
    .btn-submit {
      padding: 8px 18px; border-radius: 6px; border: none;
      background: var(--mnara-primary, #2563eb); color: white;
      font-size: 0.8125rem; font-weight: 600; font-family: 'Inter', sans-serif; cursor: pointer;
    }
    .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-submit:hover:not(:disabled) { background: var(--mnara-primary-dark, #1d4ed8); }

    .profile-card {
      display: flex; align-items: stretch; gap: 24px;
      padding: 24px; border-radius: 10px; border: 1px solid var(--mnara-border, #e2e8f0);
      background: var(--mnara-surface, white); margin-bottom: 32px;
    }
    .profile-left { display: flex; align-items: center; gap: 16px; flex-shrink: 0; }
    .profile-avatar-img {
      width: 56px; height: 56px; border-radius: 50%; object-fit: cover;
    }
    .profile-avatar {
      width: 56px; height: 56px; border-radius: 50%;
      background: linear-gradient(135deg, var(--mnara-primary, #2563eb), var(--mnara-primary-dark, #1d4ed8));
      color: white; display: flex; align-items: center; justify-content: center;
      font-size: 1.25rem; font-weight: 700; flex-shrink: 0;
    }
    .profile-info { display: flex; flex-direction: column; }
    .profile-name { font-size: 1.0625rem; font-weight: 700; color: var(--mnara-text-primary, #0f172a); margin: 0; }
    .profile-id { font-size: 0.75rem; color: var(--mnara-text-faint, #94a3b8); margin-top: 2px; }
    .profile-tsc { font-size: 0.6875rem; color: var(--mnara-text-muted, #64748b); }
    .profile-divider { height: auto; }
    .profile-details {
      display: grid; grid-template-columns: 1fr 1fr; gap: 12px 28px; flex: 1;
      align-content: center;
    }
    .detail-item { display: flex; align-items: center; gap: 10px; }
    .detail-item .detail-icon { font-size: 20px; width: 20px; height: 20px; color: var(--mnara-text-faint, #94a3b8); }
    .detail-item div { display: flex; flex-direction: column; }
    .detail-label { font-size: 0.6875rem; font-weight: 500; color: var(--mnara-text-faint, #94a3b8); text-transform: uppercase; letter-spacing: 0.04em; }
    .detail-value { font-size: 0.8125rem; font-weight: 500; color: var(--mnara-text-primary, #334155); }

    .section { margin-bottom: 32px; }
    .section-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 16px;
    }
    .section-title {
      font-size: 1.0625rem; font-weight: 700; color: var(--mnara-text-primary, #0f172a); margin: 0;
    }
    .section-count { font-size: 0.75rem; color: var(--mnara-text-faint, #94a3b8); }

    .leave-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .leave-card {
      padding: 20px; border-radius: 10px; border: 1px solid var(--mnara-border, #e2e8f0);
      background: var(--mnara-surface, white); display: flex; flex-direction: column; gap: 14px;
    }
    .leave-header { display: flex; align-items: center; justify-content: space-between; }
    .leave-type { font-size: 0.875rem; font-weight: 600; color: var(--mnara-text-primary, #0f172a); }
    .leave-total { font-size: 0.8125rem; font-weight: 700; color: var(--mnara-primary, #2563eb); }
    .leave-total.unlimited { color: var(--mnara-text-muted, #64748b); font-weight: 500; }

    .progress-track {
      width: 100%; height: 6px; background: var(--mnara-border, #e2e8f0); border-radius: 3px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%; background: var(--mnara-primary, #2563eb); border-radius: 3px;
      transition: width 0.3s ease;
    }

    .leave-stats { display: flex; justify-content: space-between; }
    .stat { display: flex; flex-direction: column; align-items: center; }
    .stat-label { font-size: 0.6875rem; color: var(--mnara-text-faint, #94a3b8); font-weight: 500; }
    .stat-value { font-size: 1rem; font-weight: 700; color: var(--mnara-text-primary, #0f172a); }
    .stat-value.used { color: var(--mnara-warning, #f59e0b); }
    .stat-value.remaining { color: var(--mnara-success, #10b981); }

    .table-card {
      border-radius: 10px; border: 1px solid var(--mnara-border, #e2e8f0);
      overflow: hidden; background: var(--mnara-surface, white);
    }
    .leave-table { width: 100%; }
    .leave-table th {
      font-size: 0.75rem; font-weight: 600; color: var(--mnara-text-muted, #64748b);
      text-transform: uppercase; letter-spacing: 0.04em;
      padding: 14px 16px; border-bottom: 1px solid var(--mnara-border, #e2e8f0);
      background: var(--mnara-surface-alt, #f8fafc); font-family: 'Inter', sans-serif;
    }
    .leave-table td {
      font-size: 0.8125rem; color: var(--mnara-text-secondary, #334155); padding: 12px 16px;
      border-bottom: 1px solid var(--mnara-surface-hover, #f1f5f9); font-family: 'Inter', sans-serif;
    }
    .reason-cell { max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .pipeline { display: flex; align-items: center; gap: 4px; }
    .pipeline-step {
      display: flex; align-items: center; gap: 4px;
      font-size: 0.6875rem; font-weight: 500;
      color: var(--mnara-text-faint, #94a3b8);
    }
    .pipeline-step .step-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--mnara-border, #e2e8f0); flex-shrink: 0;
    }
    .pipeline-step.active { color: var(--mnara-warning, #f59e0b); }
    .pipeline-step.active .step-dot { background: var(--mnara-warning, #f59e0b); }
    .pipeline-step.done { color: var(--mnara-success, #10b981); }
    .pipeline-step.done .step-dot { background: var(--mnara-success, #10b981); }
    .pipeline-step.rejected { color: var(--mnara-error, #ef4444); }
    .pipeline-step.rejected .step-dot { background: var(--mnara-error, #ef4444); }
    .pipeline-connector {
      width: 16px; height: 2px; background: var(--mnara-border, #e2e8f0); flex-shrink: 0;
    }
    .pipeline-connector.done { background: var(--mnara-success, #10b981); }

    .table-empty {
      padding: 40px; text-align: center; display: flex; flex-direction: column;
      align-items: center; gap: 8px; color: var(--mnara-text-faint, #94a3b8);
    }
    .table-empty mat-icon { font-size: 40px; width: 40px; height: 40px; }
    .table-empty p { font-size: 0.875rem; margin: 0; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HrComponent {
  private settingsService = inject(TeacherSettingsService);
  readonly leaveService = inject(TeacherLeaveService);

  readonly displayedColumns = ['leaveType', 'startDate', 'endDate', 'status', 'reason'];

  readonly showForm = signal(false);
  readonly formLeaveType = signal<string>('COMPASSIONATE');
  readonly formStartDate = signal('');
  readonly formEndDate = signal('');
  readonly formReason = signal('');

  readonly profile = computed<TeacherProfile>(() =>
    this.settingsService.profile() ?? {
      name: 'Loading...',
      employeeId: '',
      department: '',
      role: '',
      email: '',
      phone: '',
    }
  );

  readonly initials = computed(() =>
    this.profile().name.split(' ').filter(n => n.length > 0).map(n => n[0]).join('').toUpperCase()
  );

  readonly qualificationLabel = computed(() => {
    const q = this.profile().qualificationLevel;
    const labels: Record<string, string> = {
      DIPLOMA: 'Diploma',
      DEGREE: 'Bachelor\'s Degree',
      MASTERS: 'Master\'s Degree',
      PHD: 'PhD/Doctorate',
    };
    return q ? (labels[q] || q) : '—';
  });

  readonly leaveBalances = this.leaveService.leaveBalances;
  readonly leaveRequests = this.leaveService.leaveRequests;

  readonly formValid = computed(() =>
    !!this.formLeaveType() && !!this.formStartDate() && !!this.formEndDate()
  );

  constructor() {
    this.settingsService.fetchProfile();
    this.leaveService.fetchBalances();
    this.leaveService.fetchRequests();
  }

  usagePercent(lb: LeaveBalance): number {
    return lb.total > 0 ? Math.round((lb.used / lb.total) * 100) : 0;
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.formLeaveType.set('COMPASSIONATE');
    this.formStartDate.set('');
    this.formEndDate.set('');
    this.formReason.set('');
  }

  submitRequest(): void {
    if (!this.formValid()) return;
    this.leaveService.createRequest({
      leave_type: this.formLeaveType(),
      start_date: this.formStartDate(),
      end_date: this.formEndDate(),
      reason: this.formReason(),
    });
    this.cancelForm();
  }
}
