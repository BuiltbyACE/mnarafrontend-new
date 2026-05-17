import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { DashboardData } from '../../shared/models/teacher.models';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [
    UpperCasePipe,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <h1>Welcome back, {{ dashboardData().teacherName }}</h1>
        <p class="subtitle">{{ currentDate }}</p>
      </header>

      <section class="quick-actions">
        <button mat-raised-button color="primary" class="action-btn">
          <mat-icon>how_to_reg</mat-icon>
          Take Attendance
        </button>
        <button mat-raised-button color="primary" class="action-btn">
          <mat-icon>assignment_add</mat-icon>
          Create Assignment
        </button>
        <button mat-raised-button color="primary" class="action-btn">
          <mat-icon>upload_file</mat-icon>
          Upload Resource
        </button>
        <button mat-raised-button color="primary" class="action-btn">
          <mat-icon>videocam</mat-icon>
          Start Live Class
        </button>
      </section>

      <section class="section">
        <h2 class="section-title">
          <mat-icon>today</mat-icon>
          Today's Classes
        </h2>
        <div class="class-grid">
          @for (cls of dashboardData().todayClasses; track cls.id) {
            <mat-card class="class-card" appearance="outlined">
              <mat-card-header>
                <mat-card-title>{{ cls.subject }}</mat-card-title>
                <mat-card-subtitle>{{ cls.section }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="class-detail">
                  <mat-icon>room</mat-icon>
                  <span>{{ cls.classroom }}</span>
                </div>
                <div class="class-detail">
                  <mat-icon>schedule</mat-icon>
                  <span>{{ cls.time }}</span>
                </div>
              </mat-card-content>
              <mat-card-actions>
                <button mat-stroked-button color="primary">
                  <mat-icon>how_to_reg</mat-icon>
                  Take Attendance
                </button>
              </mat-card-actions>
            </mat-card>
          }
        </div>
      </section>

      <section class="section">
        <h2 class="section-title">
          <mat-icon>insights</mat-icon>
          Academic Snapshot
        </h2>
        <div class="kpi-grid">
          <mat-card class="kpi-card" appearance="outlined">
            <mat-card-content>
              <div class="kpi-value">{{ dashboardData().academicSnapshot.averagePerformance }}%</div>
              <div class="kpi-label">Average Performance</div>
              <div class="kpi-trend positive">
                <mat-icon>trending_up</mat-icon>
                +3% vs last term
              </div>
            </mat-card-content>
          </mat-card>
          <mat-card class="kpi-card" appearance="outlined">
            <mat-card-content>
              <div class="kpi-value">{{ dashboardData().academicSnapshot.assignmentCompletionRate }}%</div>
              <div class="kpi-label">Assignment Completion Rate</div>
              <div class="kpi-trend positive">
                <mat-icon>trending_up</mat-icon>
                +5% vs last term
              </div>
            </mat-card-content>
          </mat-card>
          <mat-card class="kpi-card" appearance="outlined">
            <mat-card-content>
              <div class="kpi-value">{{ dashboardData().academicSnapshot.attendancePercentage }}%</div>
              <div class="kpi-label">Attendance</div>
              <div class="kpi-trend warning">
                <mat-icon>trending_flat</mat-icon>
                -1% vs last term
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </section>

      <div class="two-column-layout">
        <section class="section">
          <h2 class="section-title">
            <mat-icon>pending_actions</mat-icon>
            Pending Grading
          </h2>
          <div class="list-cards">
            @for (item of dashboardData().pendingGrading; track item.id) {
              <mat-card class="list-card" appearance="outlined">
                <mat-card-header>
                  <mat-card-title>{{ item.title }}</mat-card-title>
                  <mat-card-subtitle>{{ item.subject }}</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <div class="progress-info">
                    <span>{{ item.submittedCount }} / {{ item.totalCount }} submitted</span>
                    <span class="due-date">Due: {{ item.dueDate }}</span>
                  </div>
                  <div class="progress-bar-bg">
                    <div class="progress-bar-fill" [style.width.%]="(item.submittedCount / item.totalCount) * 100"></div>
                  </div>
                </mat-card-content>
                <mat-card-actions>
                  <button mat-stroked-button color="primary">Grade Now</button>
                </mat-card-actions>
              </mat-card>
            }
          </div>
        </section>

        <section class="section">
          <h2 class="section-title">
            <mat-icon>notifications_active</mat-icon>
            Student Alerts
          </h2>
          <div class="list-cards">
            @for (alert of dashboardData().studentAlerts; track alert.id) {
              <mat-card class="alert-card" appearance="outlined" [class]="'severity-' + alert.severity">
                <mat-card-header>
                  <mat-chip-row [color]="alert.severity === 'high' ? 'warn' : alert.severity === 'medium' ? 'accent' : 'primary'" highlighted>
                    {{ alert.type | uppercase }}
                  </mat-chip-row>
                  <mat-card-title>{{ alert.studentName }}</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <p>{{ alert.message }}</p>
                </mat-card-content>
              </mat-card>
            }
          </div>
        </section>
      </div>

      <div class="two-column-layout">
        <section class="section">
          <h2 class="section-title">
            <mat-icon>campaign</mat-icon>
            Announcements
          </h2>
          <div class="list-cards">
            @for (ann of dashboardData().announcements; track ann.id) {
              <mat-card class="list-card" appearance="outlined">
                <mat-card-header>
                  <mat-card-title>{{ ann.title }}</mat-card-title>
                  <mat-card-subtitle>Posted by {{ ann.postedBy }} &middot; {{ ann.postedAt }}</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <p>{{ ann.content }}</p>
                </mat-card-content>
              </mat-card>
            }
          </div>
        </section>

        <section class="section">
          <h2 class="section-title">
            <mat-icon>event</mat-icon>
            Upcoming Meetings
          </h2>
          <div class="list-cards">
            @for (meeting of dashboardData().upcomingMeetings; track meeting.id) {
              <mat-card class="list-card" appearance="outlined">
                <mat-card-header>
                  <mat-card-title>{{ meeting.title }}</mat-card-title>
                  <mat-card-subtitle>{{ meeting.organizer }}</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <div class="meeting-detail">
                    <mat-icon>event</mat-icon>
                    <span>{{ meeting.date }}</span>
                  </div>
                  <div class="meeting-detail">
                    <mat-icon>schedule</mat-icon>
                    <span>{{ meeting.time }}</span>
                  </div>
                </mat-card-content>
                <mat-card-actions>
                  <button mat-stroked-button color="primary">Join</button>
                  <button mat-button color="primary">Set Reminder</button>
                </mat-card-actions>
              </mat-card>
            }
          </div>
        </section>
      </div>
    </div>
  `,
  styles: `
    :host {
      --mnara-primary: #2563eb;
      --mnara-primary-dark: #1d4ed8;
      --mnara-primary-light: #dbeafe;
      --mnara-surface: #ffffff;
      --mnara-background: #f0f4ff;
      --mnara-text: #1e293b;
      --mnara-text-secondary: #64748b;
      --mnara-border: #e2e8f0;
      --mnara-success: #16a34a;
      --mnara-warning: #d97706;
      --mnara-danger: #dc2626;
      display: block;
      min-height: 100vh;
      background: var(--mnara-background);
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      color: var(--mnara-text);
    }

    .dashboard-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }

    .dashboard-header {
      margin-bottom: 32px;
    }

    .dashboard-header h1 {
      font-size: 28px;
      font-weight: 600;
      color: var(--mnara-text);
      margin: 0 0 4px 0;
    }

    .subtitle {
      color: var(--mnara-text-secondary);
      font-size: 14px;
      margin: 0;
    }

    .section {
      margin-bottom: 32px;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 600;
      color: var(--mnara-text);
      margin: 0 0 16px 0;
    }

    .section-title mat-icon {
      color: var(--mnara-primary);
      font-size: 22px;
      width: 22px;
      height: 22px;
    }

    .quick-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 32px;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 20px;
      font-weight: 500;
    }

    .action-btn mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .class-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }

    .class-card {
      background: var(--mnara-surface);
      border: 1px solid var(--mnara-border);
      border-radius: 12px;
    }

    .class-card mat-card-header {
      padding-bottom: 8px;
    }

    .class-card mat-card-title {
      font-size: 16px;
      font-weight: 600;
    }

    .class-card mat-card-subtitle {
      font-size: 13px;
    }

    .class-detail {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: var(--mnara-text-secondary);
      margin-bottom: 4px;
    }

    .class-detail mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--mnara-primary);
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 16px;
    }

    .kpi-card {
      background: var(--mnara-surface);
      border: 1px solid var(--mnara-border);
      border-radius: 12px;
      text-align: center;
      padding: 16px 0;
    }

    .kpi-value {
      font-size: 36px;
      font-weight: 700;
      color: var(--mnara-primary);
      line-height: 1.2;
    }

    .kpi-label {
      font-size: 14px;
      color: var(--mnara-text-secondary);
      margin-top: 4px;
      font-weight: 500;
    }

    .kpi-trend {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      font-size: 12px;
      margin-top: 8px;
    }

    .kpi-trend.positive {
      color: var(--mnara-success);
    }

    .kpi-trend.warning {
      color: var(--mnara-warning);
    }

    .kpi-trend mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .two-column-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 32px;
    }

    @media (max-width: 768px) {
      .two-column-layout {
        grid-template-columns: 1fr;
      }
    }

    .list-cards {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .list-card {
      background: var(--mnara-surface);
      border: 1px solid var(--mnara-border);
      border-radius: 12px;
    }

    .list-card mat-card-title {
      font-size: 15px;
      font-weight: 600;
    }

    .list-card mat-card-subtitle {
      font-size: 13px;
    }

    .progress-info {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      color: var(--mnara-text-secondary);
      margin-bottom: 8px;
    }

    .due-date {
      color: var(--mnara-warning);
      font-weight: 500;
    }

    .progress-bar-bg {
      height: 6px;
      background: var(--mnara-border);
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      background: var(--mnara-primary);
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .alert-card {
      background: var(--mnara-surface);
      border: 1px solid var(--mnara-border);
      border-radius: 12px;
    }

    .alert-card mat-card-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .alert-card mat-card-title {
      font-size: 15px;
      font-weight: 600;
      margin-top: 4px;
    }

    .alert-card mat-card-content p {
      font-size: 13px;
      color: var(--mnara-text-secondary);
      margin: 0;
    }

    .meeting-detail {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: var(--mnara-text-secondary);
      margin-bottom: 4px;
    }

    .meeting-detail mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--mnara-primary);
    }

    .severity-high {
      border-left: 4px solid var(--mnara-danger);
    }

    .severity-medium {
      border-left: 4px solid var(--mnara-warning);
    }

    .severity-low {
      border-left: 4px solid var(--mnara-primary);
    }
  `,
})
export class TeacherDashboardComponent {
  currentDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  dashboardData = signal<DashboardData>({
    teacherName: 'Mr. Johnson',
    quickActions: [
      { label: 'Take Attendance', icon: 'how_to_reg' },
      { label: 'Create Assignment', icon: 'assignment_add' },
      { label: 'Upload Resource', icon: 'upload_file' },
      { label: 'Start Live Class', icon: 'videocam' },
    ],
    todayClasses: [
      {
        id: '1',
        subject: 'Mathematics',
        classroom: 'Room 204',
        time: '08:00 - 09:00',
        section: 'Form 2A',
      },
      {
        id: '2',
        subject: 'Physics',
        classroom: 'Lab 101',
        time: '09:15 - 10:15',
        section: 'Form 3B',
      },
      {
        id: '3',
        subject: 'Chemistry',
        classroom: 'Lab 102',
        time: '10:30 - 11:30',
        section: 'Form 4A',
      },
      {
        id: '4',
        subject: 'Additional Mathematics',
        classroom: 'Room 206',
        time: '12:00 - 13:00',
        section: 'Form 2B',
      },
    ],
    academicSnapshot: {
      averagePerformance: 78,
      assignmentCompletionRate: 85,
      attendancePercentage: 92,
    },
    pendingGrading: [
      {
        id: 'g1',
        title: 'End of Term Exam',
        subject: 'Mathematics - Form 2A',
        submittedCount: 28,
        totalCount: 32,
        dueDate: '20 May 2026',
      },
      {
        id: 'g2',
        title: 'Lab Report - Optics',
        subject: 'Physics - Form 3B',
        submittedCount: 18,
        totalCount: 24,
        dueDate: '18 May 2026',
      },
      {
        id: 'g3',
        title: 'Quiz: Periodic Table',
        subject: 'Chemistry - Form 4A',
        submittedCount: 24,
        totalCount: 24,
        dueDate: '16 May 2026',
      },
    ],
    studentAlerts: [
      {
        id: 'a1',
        studentName: 'Alice Kamau',
        type: 'academic',
        message: 'Scored below 40% on the last two Mathematics quizzes.',
        severity: 'high',
      },
      {
        id: 'a2',
        studentName: 'Brian Ochieng',
        type: 'attendance',
        message: 'Has missed 3 Physics classes this term.',
        severity: 'medium',
      },
      {
        id: 'a3',
        studentName: 'Catherine Wanjiku',
        type: 'behavior',
        message: 'Disruptive behavior reported during Chemistry lab.',
        severity: 'low',
      },
      {
        id: 'a4',
        studentName: 'Daniel Mwangi',
        type: 'academic',
        message: 'Shows significant improvement in Additional Mathematics.',
        severity: 'low',
      },
    ],
    announcements: [
      {
        id: 'ann1',
        title: 'Staff Meeting Rescheduled',
        content: 'The weekly staff meeting has been moved to Thursday at 14:00 in the staffroom.',
        postedBy: 'Principal',
        postedAt: '15 May 2026',
      },
      {
        id: 'ann2',
        title: 'Science Fair - Call for Projects',
        content: 'All science teachers are requested to submit their students\' project proposals by 25 May.',
        postedBy: 'Head of Science Department',
        postedAt: '14 May 2026',
      },
      {
        id: 'ann3',
        title: 'End of Term Exam Schedule',
        content: 'The final examination timetable has been published. Please review and confirm your invigilation slots.',
        postedBy: 'Examinations Office',
        postedAt: '12 May 2026',
      },
    ],
    upcomingMeetings: [
      {
        id: 'm1',
        title: 'Mathematics Department Meeting',
        date: '18 May 2026',
        time: '14:30 - 15:30',
        organizer: 'Dr. Kimani - HOD Mathematics',
      },
      {
        id: 'm2',
        title: 'Parent-Teacher Conference',
        date: '22 May 2026',
        time: '09:00 - 16:00',
        organizer: 'Academic Office',
      },
      {
        id: 'm3',
        title: 'Form 2A Academic Review',
        date: '25 May 2026',
        time: '11:00 - 12:00',
        organizer: 'Mr. Johnson (Class Teacher)',
      },
    ],
  });
}
