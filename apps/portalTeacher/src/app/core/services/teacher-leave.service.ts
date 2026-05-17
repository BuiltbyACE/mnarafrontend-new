import { Injectable, signal } from '@angular/core';
import { LeaveBalance, LeaveRequest } from '../../shared/models/teacher.models';

@Injectable({ providedIn: 'root' })
export class TeacherLeaveService {
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

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  fetchBalances(): void {
    this.isLoading.set(true);
    setTimeout(() => this.isLoading.set(false), 200);
  }

  fetchRequests(): void {
    this.isLoading.set(true);
    setTimeout(() => this.isLoading.set(false), 200);
  }
}
