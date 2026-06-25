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

interface RawDashboardResponse {
  teacher_name: string;
  todays_classes: Array<{
    id: number;
    time_range: string;
    status: string;
    subject: string;
    classroom: string;
    room: string;
    students_count: number;
    topic: string;
  }>;
  kpis: {
    avg_performance: { value: number; trend: string };
    submission_rate: { value: number; trend: string };
    attendance_rate: { value: number; trend: string };
    pending_tasks: { value: number; trend: string };
  };
  actionable_inbox: Array<{
    id: number;
    title: string;
    subject: string;
    completed: number;
    total: number;
  }>;
  at_risk_radar: Array<{
    id: number;
    student_name: string;
    classroom: string;
    subject: string;
    issue_type: string;
    old_grade?: string;
    new_grade?: string;
    details?: string;
  }>;
  upcoming_events: Array<{
    id: string;
    time: string;
    title: string;
    description: string;
    is_priority: boolean;
  }>;
}

function mapTimeRange(range: string): { start_time: string; end_time: string } {
  const parts = range.split('–').map(s => s.trim());
  if (parts.length === 2) {
    return { start_time: parts[0], end_time: parts[1] };
  }
  return { start_time: range, end_time: '' };
}

function parseDetails(details?: string): { missed_classes?: number; attendance_rate?: number } {
  if (!details) return {};
  const match = details.match(/(\d+)\s*classes?/i);
  return match ? { missed_classes: parseInt(match[1], 10) } : {};
}

function mapRiskType(issueType: string): 'grade_drop' | 'attendance' | 'both' {
  if (issueType === 'GRADE_DROP') return 'grade_drop';
  if (issueType === 'ATTENDANCE') return 'attendance';
  return 'grade_drop';
}

function computeTrend(item: { completed: number; total: number }): 'high' | 'medium' | 'low' {
  const remaining = item.total - item.completed;
  if (remaining === 0) return 'low';
  const ratio = item.completed / item.total;
  if (ratio < 0.3) return 'high';
  if (ratio < 0.7) return 'medium';
  return 'low';
}

function computeAtRiskTrend(issueType: string): 'declining' | 'critical' {
  return issueType === 'ATTENDANCE' ? 'critical' : 'declining';
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
    this.http.get<RawDashboardResponse>(getApiUrl('/staff/dashboard/summary/'))
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (raw) => this.data.set(this.mapPayload(raw)),
        error: () => this.error.set('Failed to load dashboard'),
      });
  }

  private mapPayload(raw: RawDashboardResponse): TeacherDashboardPayload {
    return {
      teacher_name: raw.teacher_name,
      todays_classes: raw.todays_classes.map(c => {
        const { start_time, end_time } = mapTimeRange(c.time_range);
        return {
          id: c.id,
          subject: c.subject,
          subject_code: '',
          class_name: c.classroom,
          start_time,
          end_time,
          room: c.room,
          status: c.status as TodayClassSlot['status'],
          student_count: c.students_count,
          topic: c.topic,
        };
      }),
      kpis: raw.kpis,
      actionable_inbox: raw.actionable_inbox.map(item => ({
        id: item.id,
        title: item.title,
        subject: item.subject,
        completed: item.completed,
        total: item.total,
        urgency: computeTrend(item),
        action_label: 'Grade',
        action_route: `/teacher/assignments/${item.id}/pipeline`,
      })),
      at_risk_radar: raw.at_risk_radar.map(s => ({
        id: s.id,
        student_name: s.student_name,
        class_name: s.classroom,
        subject: s.subject,
        risk_type: mapRiskType(s.issue_type),
        previous_grade: s.old_grade,
        current_grade: s.new_grade,
        ...parseDetails(s.details),
        trend: computeAtRiskTrend(s.issue_type),
      })),
    };
  }
}
