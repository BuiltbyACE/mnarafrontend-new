import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { getApiUrl } from '@sms/core/config';
import { LeaveBalance, LeaveRequest, CreateLeavePayload } from '../../shared/models/teacher.models';

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
  reason?: string;
  created_at: string;
}

interface Paginated<T> { results?: T[]; }

const LEAVE_TYPE_LIMITS: Record<string, { total: number; label: string }> = {
  COMPASSIONATE: { total: 3, label: 'Compassionate Leave' },
  SICK: { total: 0, label: 'Sick Leave' },
  MATERNITY: { total: 90, label: 'Maternity Leave' },
};

@Injectable({ providedIn: 'root' })
export class TeacherLeaveService {
  private readonly http = inject(HttpClient);

  readonly leaveBalances = signal<LeaveBalance[]>([]);
  readonly leaveRequests = signal<LeaveRequest[]>([]);
  readonly isLoading = signal(false);
  readonly createSuccess = signal(false);
  readonly error = signal<string | null>(null);

  fetchBalances(): void {
    this.isLoading.set(true);
    this.http.get<Paginated<RawLeaveBalance> | RawLeaveBalance[]>(getApiUrl('/staff/leave-balances/'))
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          const rows = Array.isArray(res) ? res : (res.results ?? []);
          const cards: LeaveBalance[] = [];
          for (const leaveType of Object.keys(LEAVE_TYPE_LIMITS)) {
            const limit = LEAVE_TYPE_LIMITS[leaveType];
            let used = 0;
            if (leaveType === 'COMPASSIONATE') {
              const row = rows.find(r => r.points_remaining >= 0);
              if (row) {
                const remaining = row.points_remaining ?? 0;
                used = Math.max(0, limit.total - remaining);
                cards.push({
                  type: limit.label,
                  total: limit.total,
                  used,
                  remaining,
                });
              } else {
                cards.push({ type: limit.label, total: limit.total, used: 0, remaining: limit.total });
              }
            } else {
              cards.push({ type: limit.label, total: limit.total, used: 0, remaining: limit.total });
            }
          }
          this.leaveBalances.set(cards);
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

  createRequest(payload: CreateLeavePayload): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.createSuccess.set(false);
    this.http.post<RawLeaveRequest>(getApiUrl('/staff/leave-requests/'), payload)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (r) => {
          this.createSuccess.set(true);
          this.leaveRequests.update(list => [this.mapRequest(r), ...list]);
          this.fetchBalances();
        },
        error: () => this.error.set('Failed to submit leave request'),
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
      reason: r.reason || '',
      appliedOn: r.created_at,
    };
  }
}
