import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { getApiUrl } from '@sms/core/config';

export interface TodayClassSlot {
  id: number;
  subject: string;
  subject_code: string;
  class_name: string;
  start_time: string;
  end_time: string;
  room: string;
  status: 'LIVE' | 'UPCOMING' | 'COMPLETED' | 'ATTENDANCE_TAKEN';
  student_count: number;
  topic: string;
}

export interface KpiMetric {
  value: number;
  trend: string;
}

export interface ActionableInboxItem {
  id: number;
  title: string;
  subject: string;
  completed: number;
  total: number;
  urgency: 'high' | 'medium' | 'low';
  action_label: string;
  action_route: string;
}

export interface AtRiskRadarItem {
  id: number;
  student_name: string;
  class_name: string;
  subject: string;
  risk_type: 'grade_drop' | 'attendance' | 'both';
  previous_grade?: string;
  current_grade?: string;
  missed_classes?: number;
  attendance_rate?: number;
  trend: 'declining' | 'critical';
}

export interface TeacherDashboardPayload {
  teacher_name: string;
  todays_classes: TodayClassSlot[];
  kpis: {
    avg_performance: KpiMetric;
    submission_rate: KpiMetric;
    attendance_rate: KpiMetric;
    pending_tasks: KpiMetric;
  };
  actionable_inbox: ActionableInboxItem[];
  at_risk_radar: AtRiskRadarItem[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  readonly data = signal<TeacherDashboardPayload | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  fetchDashboardSummary(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get<TeacherDashboardPayload>(getApiUrl('/staff/dashboard/summary/'))
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => this.data.set(data),
        error: () => this.error.set('Failed to load dashboard'),
      });
  }
}
