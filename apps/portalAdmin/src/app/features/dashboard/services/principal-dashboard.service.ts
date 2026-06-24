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

  approveApproval(id: number, type: string): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(`${this.baseUrl}/analytics/approvals/${id}/approve/`, { type });
  }

  rejectApproval(id: number, type: string, reason: string): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(`${this.baseUrl}/analytics/approvals/${id}/reject/`, { type, reason });
  }
}