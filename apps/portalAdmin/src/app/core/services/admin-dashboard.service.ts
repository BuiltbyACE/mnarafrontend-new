/**
 * Admin Dashboard Service
 * Fetches aggregated dashboard metrics from Analytics API
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, timer, switchMap, shareReplay } from 'rxjs';
import { environment, getApiUrl } from '@sms/core/config';

export interface EnrollmentHealth {
  total_active_students: number;
  total_capacity: number;
  capacity_utilization_percent: number;
  pending_admissions: number;
}

export interface DailyAttendance {
  date: string;
  students_present_percent: number;
  staff_present_percent: number;
  absentee_count: number;
}

export interface FinancialHealth {
  academic_term: string;
  expected_revenue_kes: number;
  collected_revenue_kes: number;
  collection_rate_percent: number;
  outstanding_arrears_kes: number;
  pending_expense_approvals: number;
}

export interface SystemAlert {
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  module: string;
  message: string;
}

export interface DashboardSummary {
  timestamp: string;
  enrollment_health: EnrollmentHealth;
  daily_attendance: DailyAttendance;
  financial_health: FinancialHealth;
  system_alerts: SystemAlert[];
}

@Injectable({
  providedIn: 'root',
})
export class AdminDashboardService {
  private http = inject(HttpClient);

  // Cache the dashboard data with shareReplay
  private dashboardCache$: Observable<DashboardSummary> | null = null;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  // Signal for reactive updates
  readonly dashboardData = signal<DashboardSummary | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  /**
   * Fetch dashboard summary with auto-refresh every 60 seconds
   */
  getDashboardSummary(autoRefresh = true): Observable<DashboardSummary> {
    this.isLoading.set(true);
    this.error.set(null);

    const fetch$ = this.http.get<DashboardSummary>(
      getApiUrl('/analytics/dashboard/summary/')
    ).pipe(
      catchError((err) => {
        // If endpoint doesn't exist (404), return mock data for development
        if (err.status === 404) {
          console.warn('Dashboard API not available, using mock data');
          return of(this.getMockDashboardData());
        }
        const message = err.error?.message || 'Failed to load dashboard data';
        this.error.set(message);
        this.isLoading.set(false);
        return of(this.getMockDashboardData());
      }),
      shareReplay({ bufferSize: 1, refCount: true, windowTime: this.CACHE_DURATION })
    );

    if (autoRefresh) {
      // Auto-refresh every 60 seconds
      return timer(0, 60000).pipe(
        switchMap(() => fetch$),
        switchMap((data) => {
          this.dashboardData.set(data);
          this.isLoading.set(false);
          return of(data);
        })
      );
    }

    return fetch$.pipe(
      switchMap((data) => {
        this.dashboardData.set(data);
        this.isLoading.set(false);
        return of(data);
      })
    );
  }

  /**
   * Manual refresh trigger
   */
  refreshDashboard(): void {
    this.getDashboardSummary(false).subscribe({
      next: (data) => {
        this.dashboardData.set(data);
      },
      error: () => {
        // Error already set in signal
      }
    });
  }

  /**
   * Mock data for development when API is not available
   */
  private getMockDashboardData(): DashboardSummary {
    return {
      timestamp: new Date().toISOString(),
      enrollment_health: {
        total_active_students: 1250,
        total_capacity: 1500,
        capacity_utilization_percent: 83.3,
        pending_admissions: 45
      },
      daily_attendance: {
        date: new Date().toISOString().split('T')[0],
        students_present_percent: 94.2,
        staff_present_percent: 96.5,
        absentee_count: 72
      },
      financial_health: {
        academic_term: 'Term 2 2025',
        expected_revenue_kes: 4500000,
        collected_revenue_kes: 3800000,
        collection_rate_percent: 84.4,
        outstanding_arrears_kes: 700000,
        pending_expense_approvals: 3
      },
      system_alerts: [
        { severity: 'WARNING', module: 'Finance', message: '3 expense approvals pending' },
        { severity: 'INFO', module: 'Transport', message: 'Fleet maintenance scheduled' }
      ]
    };
  }
}
