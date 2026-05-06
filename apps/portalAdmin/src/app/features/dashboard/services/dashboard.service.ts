import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { getApiUrl } from '@sms/core/config';

export interface DashboardMetric {
  total: number;
  changePct: number;
}

export interface AdminDashboardData {
  adminName: string;
  metrics: {
    students: DashboardMetric;
    staff: DashboardMetric;
    classes: DashboardMetric;
    subjects: DashboardMetric;
  };
  feeCollected: number;
  feePending: number;
  feeOverdue: number;
  attendancePercentage: number;
  attendanceLabels: string[];
  attendanceData: number[];
  alerts: {
    id: number;
    message: string;
    type: 'warning' | 'error' | 'info';
  }[];
  upcomingEvents: {
    id: number;
    title: string;
    date: string;
  }[];
  quickActions?: {
    label: string;
    route: string;
    icon: string;
  }[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private readonly apiUrl = getApiUrl('/api/v1/dashboard/admin/');

  getAdminDashboardData(): Observable<AdminDashboardData> {
    return this.http.get<AdminDashboardData>(this.apiUrl);
  }
}
