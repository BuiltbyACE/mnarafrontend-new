import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@sms/core/config';

export interface PrincipalDashboardPayload {
  adminName: string;
  lastRefresh: string;
  kpis: {
    totalStudents: number;
    totalStaff: number;
    totalClasses: number;
    feeCollection: number;
    activeIncidents: number;
    attendanceRate: number;
  };
  financialHealth: {
    collected: number;
    pending: number;
    overdue: number;
    total: number;
  };
  pendingApprovals: {
    id: number;
    type: string;
    requester: string;
    description: string;
    submittedAt: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  liveOperations: {
    id: number;
    timestamp: string;
    type: 'info' | 'warning' | 'alert' | 'success';
    message: string;
    location: string;
  }[];
  quickStats: {
    label: string;
    value: number;
    change: number;
    unit: string;
  }[];
}

export interface SystemAlert {
  type: 'warning' | 'danger' | 'info';
  title: string;
  desc: string;
  count?: number;
}

export interface RecentActivity {
  message: string;
  timestamp: string;
}

export interface StaffAbsence {
  id: number;
  name: string;
  department_name: string;
  reason: string;
}

export interface AdminDashboardPayload {
  metrics: {
    students: { total: number; change_pct: number };
    staff: { total: number; change_pct: number };
    classes: { total: number; change_pct: number };
    subjects: { total: number; change_pct: number };
  };
  financial_doughnut: {
    total_expected: number;
    total_collected: number;
    total_pending: number;
    collection_rate_pct: number;
  };
  attendance_trend: { labels: string[]; data: number[] };
  upcoming_calendar_events: {
    id: number;
    title: string;
    start_date: string;
    end_date: string;
    category: string | null;
    color_hex: string;
    term: string | null;
    academic_year: string | null;
  }[];
  upcoming_events: {
    id: number;
    title: string;
    date: string;
    type: string;
  }[];
  staff_absences: StaffAbsence[];
  recent_activities: RecentActivity[];
  system_alerts: SystemAlert[];
}

@Injectable({
  providedIn: 'root',
})
export class PrincipalDashboardService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  getPrincipalSummary(): Observable<PrincipalDashboardPayload> {
    return this.http.get<PrincipalDashboardPayload>(
      `${this.baseUrl}/analytics/dashboard/principal-summary/`
    );
  }

  getAdminDashboard(): Observable<AdminDashboardPayload> {
    return this.http.get<AdminDashboardPayload>(
      `${this.baseUrl}/analytics/dashboard/admin/`
    );
  }

  approveApproval(id: number, type: string): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(`${this.baseUrl}/analytics/approvals/${id}/approve/`, { type });
  }

  rejectApproval(id: number, type: string, reason: string): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(`${this.baseUrl}/analytics/approvals/${id}/reject/`, { type, reason });
  }
}