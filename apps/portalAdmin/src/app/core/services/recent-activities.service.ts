/**
 * Recent Activities Service
 * Fetches recent system activities for the admin dashboard
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { getApiUrl } from '@sms/core/config';

export interface Activity {
  id: string;
  type: 'student' | 'staff' | 'payment' | 'attendance' | 'exam' | 'system';
  title: string;
  description: string;
  timestamp: string;
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface ActivitiesResponse {
  activities: Activity[];
  total_count: number;
}

@Injectable({
  providedIn: 'root',
})
export class RecentActivitiesService {
  private http = inject(HttpClient);

  // Signals for state management
  readonly activities = signal<Activity[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  /**
   * Fetch recent activities
   * @param limit Number of activities to fetch (default: 10)
   */
  getRecentActivities(limit = 10): Observable<ActivitiesResponse> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http
      .get<ActivitiesResponse>(getApiUrl('/analytics/activities/recent/'), {
        params: { limit: limit.toString() },
      })
      .pipe(
        catchError((err) => {
          const message =
            err.error?.message ||
            `Failed to load recent activities (${err.status})`;
          console.error('Activities API error:', err);
          this.error.set(message);
          this.isLoading.set(false);
          return throwError(() => new Error(message));
        })
      );
  }

  /**
   * Set activities data in signal
   */
  setActivities(data: Activity[]): void {
    this.activities.set(data);
    this.isLoading.set(false);
  }

  /**
   * Load activities and update signal
   */
  loadActivities(limit = 10): void {
    this.getRecentActivities(limit).subscribe({
      next: (response) => {
        this.setActivities(response.activities);
      },
      error: () => {
        // Error already set in signal
      },
    });
  }
}
