import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { getApiUrl } from '@sms/core/config';
import { DashboardData } from '../../shared/models/teacher.models';

@Injectable({ providedIn: 'root' })
export class TeacherDashboardService {
  private http = inject(HttpClient);
  readonly data = signal<DashboardData | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  fetchDashboard(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get<DashboardData>(getApiUrl('/teachers/dashboard/'))
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => this.data.set(data),
        error: () => this.error.set('Failed to load dashboard data'),
      });
  }
}
