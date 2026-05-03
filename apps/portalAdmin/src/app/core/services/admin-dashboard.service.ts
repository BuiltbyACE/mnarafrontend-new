/**
 * Admin Dashboard Service
 * Fetches aggregated dashboard metrics from Analytics API
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, timer, switchMap, shareReplay, throwError } from 'rxjs';
import { getApiUrl } from '@sms/core/config';

export interface DashboardMetric {
  total: number;
  change_pct: number;
}

export interface DashboardMetrics {
  students: DashboardMetric;
  staff: DashboardMetric;
  classes: DashboardMetric;
  courses: DashboardMetric;
}

export interface AttendanceOverview {
  labels: string[];
  data: number[];
}

export interface FeeCollection {
  collected_pct: number;
  collected_amount: number;
  pending_amount: number;
  overdue_amount: number;
}

export interface TopClass {
  name: string;
  average: number;
}

export interface SystemAlert {
  type: string;
  title: string;
  desc: string;
  time: string;
}

export interface DashboardSummary {
  metrics: DashboardMetrics;
  attendance_overview: AttendanceOverview;
  fee_collection: FeeCollection;
  top_classes: TopClass[];
  system_alerts: SystemAlert[];
}

@Injectable({
  providedIn: 'root',
})
export class AdminDashboardService {
  private http = inject(HttpClient);

  // Cache the dashboard data with shareReplay
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
      getApiUrl('/analytics/dashboard/overview/')
    ).pipe(
      catchError((err) => {
        // Log error and set error state - don't silently fall back to mock data
        const message = err.error?.message || `Failed to load dashboard data (${err.status})`;
        console.error('Dashboard API error:', err);
        this.error.set(message);
        this.isLoading.set(false);
        return throwError(() => new Error(message));
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
      error: () => {}
    });
  }

  /**
   * Mock data mimicking the API response for robustness
   */
  private getMockDashboardData(): DashboardSummary {
    return {
      metrics: {
        students: { total: 2548, change_pct: 12.5 },
        staff: { total: 156, change_pct: 5.3 },
        classes: { total: 78, change_pct: 8.1 },
        courses: { total: 24, change_pct: 3.7 }
      },
      attendance_overview: {
        labels: ["May 1", "May 6", "May 11", "May 16", "May 21", "May 26", "May 31"],
        data: [19, 48, 35, 82.4, 42, 68, 100]
      },
      fee_collection: {
        collected_pct: 72.0,
        collected_amount: 48750.00,
        pending_amount: 18750.00,
        overdue_amount: 5250.00
      },
      top_classes: [
        { name: "Grade 10 - A", average: 89.5 },
        { name: "Grade 9 - B", average: 87.2 },
        { name: "Grade 8 - A", average: 85.7 }
      ],
      system_alerts: [
        { type: "warning", title: "Pending Requisitions", desc: "3 purchase requisitions waiting for approval.", time: "Just now" },
        { type: "danger", title: "Low Inventory Alert", desc: "12 items have dropped below their minimum threshold.", time: "System" }
      ]
    };
  }
}
