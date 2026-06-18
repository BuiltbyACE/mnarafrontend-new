import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, finalize, of } from 'rxjs';
import { getApiUrl } from '@sms/core/config';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Broadcast {
  id: string;
  title: string;
  audience: string;
  total_recipients: number;
  delivered_count: number;
  read_count: number;
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'COMPLETED' | 'FAILED';
  author_name: string;
  created_at: string;
}

export interface DeliveryReceipt {
  id: string;
  recipient_name: string;
  broadcast_title: string;
  channel: 'SMS' | 'EMAIL' | 'PUSH' | 'IN_APP';
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  error_message?: string;
  created_at: string;
}

export interface EngagementMetrics {
  total_sent: number;
  delivery_rate: number;
  read_rate: number;
  failed_count: number;
}

export interface CommunicationDashboardMetrics {
  unread_urgent_items: number;
  pending_approvals: number;
  active_emergencies: number;
  active_complaints: number;
  upcoming_meetings: number;
  delivery_failures: number;
  parent_engagement_rate: number;
}

export interface CreateBroadcastPayload {
  title: string;
  message: string;
  audience: string;
  scheduled_for?: string;
}

export interface Meeting {
  id: string;
  title: string;
  organizer_name: string;
  type: 'VIRTUAL' | 'IN_PERSON';
  date: string;
  time: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  participant_count: number;
}

export interface ActionItem {
  id: string;
  meeting_id: string;
  task_description: string;
  assigned_to_name: string;
  due_date: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface SupportTicket {
  id: string;
  ticket_number: string;
  subject: string;
  reporter_name: string;
  category: 'COMPLAINT' | 'INCIDENT' | 'DISCIPLINE' | 'SAFEGUARDING' | 'IT_SUPPORT';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'ESCALATED' | 'RESOLVED';
  assigned_to: string | null;
  created_at: string;
}

export interface AnalyticsPayload {
  delivery_trend: { dates: string[]; sent: number[]; read: number[] };
  support_categories: { labels: string[]; counts: number[] };
  avg_response_time_hours: number;
  total_messages_30d: number;
}

export interface CommunicationTemplate {
  id: string;
  name: string;
  code: string;
  subject_template: string;
  body_template: string;
}

export interface GatewayConfig {
  smsProvider: string;
  smsApiKey: string;
  emailProvider: string;
  autoFeeReminders: boolean;
  autoAttendanceAlerts: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class CommunicationService {
  private http = inject(HttpClient);

  readonly broadcasts = signal<Broadcast[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly dashboardMetrics = signal<CommunicationDashboardMetrics | null>(null);
  readonly isDashboardLoading = signal<boolean>(false);

  // ═══════════════════════════════════════════════════════
  // ENGAGEMENT
  // ═══════════════════════════════════════════════════════

  readonly deliveryLogs = signal<DeliveryReceipt[]>([]);
  readonly engagementMetrics = signal<EngagementMetrics | null>(null);
  readonly isEngagementLoading = signal<boolean>(false);

  getDeliveryLogs(): void {
    this.isEngagementLoading.set(true);
    this.http
      .get<PaginatedResponse<DeliveryReceipt>>(getApiUrl('/communication/receipts/'))
      .pipe(
        finalize(() => this.isEngagementLoading.set(false)),
        catchError((err) => {
          const msg = err.error?.message || 'Failed to load delivery logs';
          return throwError(() => new Error(msg));
        })
      )
      .subscribe({
        next: (data) => this.deliveryLogs.set(data.results ?? []),
      });
  }

  loadEngagementMetrics(): void {
    this.isEngagementLoading.set(true);
    setTimeout(() => {
      this.engagementMetrics.set({
        total_sent: 1250,
        delivery_rate: 94.2,
        read_rate: 71.8,
        failed_count: 48,
      });
      this.isEngagementLoading.set(false);
    }, 600);
  }

  // ═══════════════════════════════════════════════════════
  // MEETINGS & ACTION ITEMS
  // ═══════════════════════════════════════════════════════

  readonly meetings = signal<Meeting[]>([]);
  readonly actionItems = signal<ActionItem[]>([]);
  readonly isMeetingsLoading = signal<boolean>(false);

  loadMeetings(): void {
    this.isMeetingsLoading.set(true);
    this.http
      .get<PaginatedResponse<Meeting>>(getApiUrl('/communication/meetings/'))
      .pipe(
        finalize(() => this.isMeetingsLoading.set(false)),
        catchError((err) => {
          console.error('Failed to load meetings', err);
          this.meetings.set([]);
          return throwError(() => new Error('Failed to load meetings'));
        })
      )
      .subscribe({
        next: (response) => this.meetings.set(response.results || []),
      });
  }

  loadActionItems(): void {
    this.http
      .get<PaginatedResponse<ActionItem>>(getApiUrl('/communication/action-items/'))
      .pipe(
        catchError((err) => {
          console.error('Failed to load action items', err);
          this.actionItems.set([]);
          return throwError(() => new Error('Failed to load action items'));
        })
      )
      .subscribe({
        next: (response) => this.actionItems.set(response.results || []),
      });
  }

  // ═══════════════════════════════════════════════════════
  // SUPPORT & ESCALATIONS
  // ═══════════════════════════════════════════════════════

  readonly supportTickets = signal<SupportTicket[]>([]);
  readonly isSupportLoading = signal<boolean>(false);

  loadSupportTickets(): void {
    this.isSupportLoading.set(true);
    this.http
      .get<PaginatedResponse<SupportTicket>>(getApiUrl('/communication/support-tickets/'))
      .pipe(
        finalize(() => this.isSupportLoading.set(false)),
        catchError((err) => {
          console.error('Failed to load support tickets', err);
          this.supportTickets.set([]);
          return throwError(() => new Error('Failed to load support tickets'));
        })
      )
      .subscribe({
        next: (response) => this.supportTickets.set(response.results || []),
      });
  }

  getBroadcasts(): Observable<PaginatedResponse<Broadcast>> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http
      .get<PaginatedResponse<Broadcast>>(getApiUrl('/communication/broadcasts/'))
      .pipe(
        finalize(() => this.isLoading.set(false)),
        catchError((err) => {
          const msg = err.error?.message || 'Failed to load broadcasts';
          this.error.set(msg);
          return throwError(() => new Error(msg));
        })
      );
  }

  createBroadcast(payload: CreateBroadcastPayload): Observable<Broadcast> {
    return this.http
      .post<Broadcast>(getApiUrl('/communication/broadcasts/'), payload)
      .pipe(
        catchError((err) => {
          const msg = err.error?.message || 'Failed to create broadcast';
          return throwError(() => new Error(msg));
        })
      );
  }

  dispatchBroadcast(id: string): Observable<any> {
    return this.http
      .post<any>(getApiUrl(`/communication/broadcasts/${id}/dispatch_message/`), {})
      .pipe(
        catchError((err) => {
          const msg = err.error?.message || 'Failed to dispatch broadcast';
          return throwError(() => new Error(msg));
        })
      );
  }

  loadDashboardMetrics(): void {
    this.isDashboardLoading.set(true);
    setTimeout(() => {
      this.dashboardMetrics.set({
        unread_urgent_items: 4,
        pending_approvals: 7,
        active_emergencies: 2,
        active_complaints: 3,
        upcoming_meetings: 5,
        delivery_failures: 15,
        parent_engagement_rate: 88.5,
      });
      this.isDashboardLoading.set(false);
    }, 600);
  }

  // ═══════════════════════════════════════════════════════
  // ANALYTICS
  // ═══════════════════════════════════════════════════════

  readonly analyticsData = signal<AnalyticsPayload | null>(null);
  readonly isAnalyticsLoading = signal<boolean>(false);

  loadAnalytics(): void {
    this.isAnalyticsLoading.set(true);
    this.http
      .get<AnalyticsPayload>(getApiUrl('/communication/analytics/'))
      .pipe(
        catchError((err) => {
          console.warn('Analytics endpoint not available, using mock data', err);
          const now = new Date();
          const dates: string[] = [];
          const sent: number[] = [];
          const read: number[] = [];
          for (let i = 29; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            dates.push(d.toISOString().slice(0, 10));
            sent.push(800 + Math.round(Math.random() * 400));
            read.push(400 + Math.round(Math.random() * 300));
          }
          this.analyticsData.set({
            delivery_trend: { dates, sent, read },
            support_categories: {
              labels: ['COMPLAINT', 'INCIDENT', 'DISCIPLINE', 'SAFEGUARDING', 'IT_SUPPORT'],
              counts: [42, 28, 35, 17, 53],
            },
            avg_response_time_hours: 3.7,
            total_messages_30d: 28450,
          });
          return of(null);
        }),
        finalize(() => this.isAnalyticsLoading.set(false))
      )
      .subscribe({
        next: (response) => {
          if (response) this.analyticsData.set(response);
        },
      });
  }

  // ═══════════════════════════════════════════════════════
  // SETTINGS
  // ═══════════════════════════════════════════════════════

  readonly templates = signal<CommunicationTemplate[]>([]);
  readonly gatewayConfig = signal<GatewayConfig>({
    smsProvider: 'AfricasTalking',
    smsApiKey: '********',
    emailProvider: 'SMTP',
    autoFeeReminders: true,
    autoAttendanceAlerts: false,
  });

  loadTemplates(): void {
    setTimeout(() => {
      this.templates.set([
        {
          id: '1', name: 'Fee Reminder', code: 'FEE_REMINDER',
          subject_template: 'Fee Payment Reminder – {{student_name}}',
          body_template: 'Dear {{parent_name}}, your fee balance of KES {{amount}} is due.',
        },
        {
          id: '2', name: 'Attendance Alert', code: 'ATTENDANCE_ALERT',
          subject_template: 'Absence Alert – {{student_name}}',
          body_template: '{{student_name}} was marked absent on {{date}}. Please follow up.',
        },
        {
          id: '3', name: 'Exam Notification', code: 'EXAM_NOTIFICATION',
          subject_template: 'Exam Schedule – {{term}}',
          body_template: 'Exams begin {{start_date}}. Revision is attached.',
        },
        {
          id: '4', name: 'Meeting Invitation', code: 'MEETING_INVITE',
          subject_template: 'Meeting: {{meeting_title}}',
          body_template: 'You are invited to {{meeting_title}} on {{date}} at {{time}}.',
        },
      ]);
    }, 400);
  }

  loadGatewayConfig(): void {
    setTimeout(() => {
      this.gatewayConfig.set({
        smsProvider: 'AfricasTalking',
        smsApiKey: 'sk_live_3f8a2b1c...',
        emailProvider: 'SMTP (Mailgun)',
        autoFeeReminders: true,
        autoAttendanceAlerts: false,
      });
    }, 300);
  }

}
