import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { getApiUrl } from '@sms/core/config';

export interface StudentInfo {
  first_name: string;
  last_name: string;
  admission_number: string;
  current_class: string;
}

export interface KpiData {
  upcoming_classes_count: number;
  pending_assignments_count: number;
  average_grade: string | null;
  attendance_rate: number | null;
}

export interface AnnouncementItem {
  id: number;
  title: string;
  content: string;
  created_at: string;
  audience: string;
}

export interface StudentDashboardPayload {
  student: StudentInfo;
  kpis: KpiData;
  recent_announcements: AnnouncementItem[];
}

@Injectable({ providedIn: 'root' })
export class StudentDashboardService {
  private http = inject(HttpClient);

  readonly dashboardData = signal<StudentDashboardPayload | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<StudentDashboardPayload>(getApiUrl('/students/dashboard/')).subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.status === 0 ? 'Network error' : 'Failed to load dashboard');
        this.loading.set(false);
      },
    });
  }

  reload(): void {
    this.loadDashboard();
  }
}
