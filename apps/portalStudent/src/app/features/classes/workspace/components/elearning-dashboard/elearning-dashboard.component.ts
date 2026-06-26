import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ElearningService } from '../../services/elearning.service';

@Component({
  selector: 'app-elearning-dashboard',
  imports: [
    RouterLink, MatCardModule, MatIconModule, MatButtonModule,
    MatProgressSpinnerModule, DatePipe,
  ],
  template: `
    @if (elearningService.dashboardData(); as data) {
      <div class="dashboard">
        <div class="stats-grid">
          <mat-card class="stat-card pending" appearance="outlined">
            <mat-card-content>
              <mat-icon class="stat-icon">assignment_late</mat-icon>
              <div class="stat-info">
                <span class="stat-value">{{ data.kpis.pending_assignments }}</span>
                <span class="stat-label">Pending Assignments</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card avg-grade" appearance="outlined">
            <mat-card-content>
              <mat-icon class="stat-icon">trending_up</mat-icon>
              <div class="stat-info">
                <span class="stat-value">{{ data.kpis.average_grade }}%</span>
                <span class="stat-label">Average Grade</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card live" appearance="outlined">
            <mat-card-content>
              <mat-icon class="stat-icon">live_tv</mat-icon>
              <div class="stat-info">
                <span class="stat-value">{{ data.kpis.upcoming_live_classes }}</span>
                <span class="stat-label">Upcoming Live Classes</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card resources" appearance="outlined">
            <mat-card-content>
              <mat-icon class="stat-icon">library_books</mat-icon>
              <div class="stat-info">
                <span class="stat-value">{{ data.kpis.resources_available }}</span>
                <span class="stat-label">Resources Available</span>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <div class="dashboard-grid">
          <mat-card class="section-card" appearance="outlined">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>assignment</mat-icon>
                Recent Assignments
              </mat-card-title>
              <a mat-button routerLink="../assignments" class="view-all">View All</a>
            </mat-card-header>
            <mat-card-content>
              @for (assignment of data.recent_assignments; track assignment.id) {
                <div class="list-item">
                  <div class="item-left">
                    <mat-icon class="type-icon" [class]="assignment.type">
                      {{ assignment.type === 'mcq' ? 'quiz' : assignment.type === 'upload' ? 'cloud_upload' : 'edit' }}
                    </mat-icon>
                    <div class="item-info">
                      <span class="item-title">{{ assignment.title }}</span>
                      <span class="item-sub">{{ assignment.subject }}</span>
                    </div>
                  </div>
                  <div class="item-right">
                    <span class="due-date">Due {{ assignment.due_date | date:'mediumDate' }}</span>
                    <span class="status-badge"
                         [class.pending]="assignment.status === 'pending'"
                         [class.submitted]="assignment.status === 'submitted'"
                         [class.graded]="assignment.status === 'graded'">
                      {{ assignment.status }}
                    </span>
                  </div>
                </div>
              } @empty {
                <p class="empty-state">No pending assignments</p>
              }
            </mat-card-content>
          </mat-card>

          <mat-card class="section-card" appearance="outlined">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>videocam</mat-icon>
                Upcoming Live Classes
              </mat-card-title>
              <a mat-button routerLink="../live" class="view-all">View All</a>
            </mat-card-header>
            <mat-card-content>
              @for (liveClass of data.upcoming_live_classes; track liveClass.id) {
                <div class="list-item">
                  <div class="item-left">
                    <mat-icon class="type-icon" [class.pulse]="liveClass.status === 'live'">
                      {{ liveClass.status === 'live' ? 'fiber_manual_record' : 'schedule' }}
                    </mat-icon>
                    <div class="item-info">
                      <span class="item-title">{{ liveClass.title }}</span>
                      <span class="item-sub">{{ liveClass.subject }} &middot; {{ liveClass.teacher }}</span>
                    </div>
                  </div>
                  <div class="item-right">
                    @if (liveClass.status === 'live') {
                      <a mat-raised-button color="primary" routerLink="../live/{{ liveClass.id }}">
                        Join Now
                      </a>
                    } @else {
                      <span class="due-date">
                        {{ liveClass.start_time | date:'MMM d, h:mm a' }}
                      </span>
                    }
                  </div>
                </div>
              } @empty {
                <p class="empty-state">No upcoming live classes</p>
              }
            </mat-card-content>
          </mat-card>
        </div>
      </div>

    } @else if (elearningService.dashboardError(); as error) {
      <div class="error-container">
        <mat-icon class="error-icon">error_outline</mat-icon>
        <h3>Unable to load dashboard</h3>
        <p>{{ error }}</p>
        <button mat-stroked-button color="primary" (click)="elearningService.loadDashboard()">
          <mat-icon>refresh</mat-icon>
          Retry
        </button>
      </div>

    } @else {
      <div class="loading-container">
        <mat-spinner diameter="40" />
        <p>Loading dashboard...</p>
      </div>
    }
  `,
  styles: [`
    .dashboard { display: flex; flex-direction: column; gap: 24px; }

    .loading-container, .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 300px;
      gap: 16px;
      color: #64748b;
    }

    .error-container { color: #991b1b; }
    .error-icon { font-size: 48px; width: 48px; height: 48px; color: #ef4444; }
    .error-container h3 { margin: 0; font-size: 1.1rem; font-weight: 600; color: #1e293b; }
    .error-container p { margin: 0; font-size: 0.9rem; color: #64748b; max-width: 400px; text-align: center; }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }

    .stat-card {
      mat-card-content {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 20px;
      }
    }

    .stat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      padding: 10px;
      border-radius: 12px;
    }

    .pending .stat-icon { color: #f59e0b; background: #fef3c7; }
    .avg-grade .stat-icon { color: #10b981; background: #d1fae5; }
    .live .stat-icon { color: #3b82f6; background: #dbeafe; }
    .resources .stat-icon { color: #8b5cf6; background: #ede9fe; }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1e293b;
      line-height: 1.2;
    }

    .stat-label {
      font-size: 0.8rem;
      color: #64748b;
      font-weight: 500;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    @media (max-width: 960px) {
      .dashboard-grid { grid-template-columns: 1fr; }
    }

    .section-card {
      mat-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 16px 0;

        mat-card-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;

          mat-icon { font-size: 20px; width: 20px; height: 20px; color: #3b82f6; }
        }
      }

      .view-all { font-size: 0.8rem; }
    }

    .list-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #f1f5f9;

      &:last-child { border-bottom: none; }
    }

    .item-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .type-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      padding: 6px;
      border-radius: 8px;
      background: #f1f5f9;
      color: #3b82f6;

      &.pulse { color: #ef4444; background: #fee2e2; }
      &.mcq { color: #8b5cf6; background: #ede9fe; }
      &.upload { color: #10b981; background: #d1fae5; }
      &.essay { color: #f59e0b; background: #fef3c7; }
    }

    .item-info {
      display: flex;
      flex-direction: column;
    }

    .item-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: #1e293b;
    }

    .item-sub {
      font-size: 0.75rem;
      color: #64748b;
    }

    .item-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }

    .due-date {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .status-badge {
      font-size: 0.7rem;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 12px;
      text-transform: capitalize;

      &.pending { background: #fef3c7; color: #92400e; }
      &.submitted { background: #dbeafe; color: #1e40af; }
      &.graded { background: #d1fae5; color: #065f46; }
    }

    .empty-state {
      text-align: center;
      color: #94a3b8;
      padding: 24px;
      margin: 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ElearningDashboardComponent implements OnInit {
  readonly elearningService = inject(ElearningService);
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    const wId = this.route.parent?.snapshot.paramMap.get('workspaceId');
    const workspaceId = wId ? parseInt(wId, 10) : undefined;
    this.elearningService.loadDashboard(workspaceId);
  }
}
