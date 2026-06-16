import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { getApiUrl } from '@sms/core/config';
import { LeaveBalance, LeaveRequest } from '../../shared/models/teacher.models';

interface RawLeaveBalance {
  id: number;
  staff_name?: string;
  points_remaining: number;
}

interface RawLeaveRequest {
  id: number;
  leave_type: string;
  leave_type_display?: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
}

interface Paginated<T> { results?: T[]; }

@Injectable({ providedIn: 'root' })
export class TeacherLeaveService {
  private readonly http = inject(HttpClient);

  readonly leaveBalances = signal<LeaveBalance[]>([]);
  readonly leaveRequests = signal<LeaveRequest[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  fetchBalances(): void {
    this.isLoading.set(true);
    this.http.get<Paginated<RawLeaveBalance> | RawLeaveBalance[]>(getApiUrl('/staff/leave-balances/'))
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          const rows = Array.isArray(res) ? res : (res.results ?? []);
          // Backend models leave as a points system (3 max per year).
          this.leaveBalances.set(rows.map(r => ({
            type: 'Compassionate Leave',
            total: 3,
            used: Math.max(0, 3 - (r.points_remaining ?? 0)),
            remaining: r.points_remaining ?? 0,
          })));
        },
        error: () => {
          this.leaveBalances.set([]);
          this.error.set('Failed to load leave balances');
        },
      });
  }

  fetchRequests(): void {
    this.isLoading.set(true);
    this.http.get<Paginated<RawLeaveRequest> | RawLeaveRequest[]>(getApiUrl('/staff/leave-requests/'))
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          const rows = Array.isArray(res) ? res : (res.results ?? []);
          this.leaveRequests.set(rows.map(r => this.mapRequest(r)));
        },
        error: () => {
          this.leaveRequests.set([]);
          this.error.set('Failed to load leave requests');
        },
      });
  }

  private mapRequest(r: RawLeaveRequest): LeaveRequest {
    const status = (r.status || '').toLowerCase();
    return {
      id: String(r.id),
      leaveType: r.leave_type_display || r.leave_type,
      startDate: r.start_date,
      endDate: r.end_date,
      status: (status === 'approved' || status === 'rejected' ? status : 'pending') as LeaveRequest['status'],
      reason: '',
      appliedOn: r.created_at,
    };
  }
}
