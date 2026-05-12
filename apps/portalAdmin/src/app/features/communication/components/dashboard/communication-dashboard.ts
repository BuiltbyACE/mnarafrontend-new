import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommunicationService } from '../../services/communication.service';

@Component({
  selector: 'app-communication-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="dash-container">
      <header class="dash-header">
        <div>
          <h1>Communication Command Center</h1>
          <p class="subtitle">Operational overview of all school communication channels</p>
        </div>
      </header>

      @if (service.isDashboardLoading()) {
        <div class="loading-state">
          <mat-spinner diameter="48"></mat-spinner>
          <p>Loading command center...</p>
        </div>
      } @else if (service.dashboardMetrics(); as m) {

        <!-- Critical Alerts Row -->
        <div class="alert-grid">
          <mat-card class="alert-card" [class.critical]="m.active_emergencies > 0">
            <mat-card-content>
              <div class="alert-icon emergencies">
                <mat-icon>emergency</mat-icon>
              </div>
              <div class="alert-info">
                <span class="alert-value">{{ m.active_emergencies }}</span>
                <span class="alert-label">Active Emergencies</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="alert-card" [class.warning]="m.unread_urgent_items > 0">
            <mat-card-content>
              <div class="alert-icon urgent">
                <mat-icon>priority_high</mat-icon>
              </div>
              <div class="alert-info">
                <span class="alert-value">{{ m.unread_urgent_items }}</span>
                <span class="alert-label">Unread Urgent Items</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="alert-card" [class.critical]="m.delivery_failures > 0">
            <mat-card-content>
              <div class="alert-icon failures">
                <mat-icon>error_outline</mat-icon>
              </div>
              <div class="alert-info">
                <span class="alert-value">{{ m.delivery_failures }}</span>
                <span class="alert-label">Delivery Failures</span>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Middle Grid -->
        <div class="middle-grid">

          <!-- Panel 1: Action Items -->
          <mat-card class="panel-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>assignment</mat-icon>
                Action Items
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="action-item">
                <div class="action-info">
                  <span class="action-count">{{ m.pending_approvals }}</span>
                  <span class="action-label">Pending Approvals</span>
                </div>
                <button mat-stroked-button color="primary" routerLink="../broadcasts">
                  <mat-icon>rate_review</mat-icon>
                  Review
                </button>
              </div>
              <mat-divider></mat-divider>
              <div class="action-item">
                <div class="action-info">
                  <span class="action-count">{{ m.active_complaints }}</span>
                  <span class="action-label">Active Complaints</span>
                </div>
                <button mat-stroked-button color="primary" routerLink="../support">
                  <mat-icon>rate_review</mat-icon>
                  Review
                </button>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Panel 2: Engagement Pulse -->
          <mat-card class="panel-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>trending_up</mat-icon>
                Engagement Pulse
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="engagement-section">
                <div class="engagement-header">
                  <span class="engagement-label">Parent Engagement Rate</span>
                  <span class="engagement-pct">{{ m.parent_engagement_rate }}%</span>
                </div>
                <mat-progress-bar
                  mode="determinate"
                  [value]="m.parent_engagement_rate"
                  [color]="m.parent_engagement_rate >= 80 ? 'primary' : 'warn'">
                </mat-progress-bar>
                <div class="engagement-footer">
                  <mat-icon>groups</mat-icon>
                  <span>{{ m.upcoming_meetings }} upcoming meetings scheduled</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

        </div>
      }
    </div>
  `,
  styles: [`
    .dash-container { padding: 24px; }

    .dash-header { margin-bottom: 24px; }
    .dash-header h1 { font-size: 24px; font-weight: 700; margin: 0 0 4px; color: #111827; }
    .dash-header .subtitle { color: #6b7280; margin: 0; font-size: 0.9rem; }

    .loading-state {
      display: flex; flex-direction: column; align-items: center; gap: 16px;
      padding: 80px 24px; color: #6b7280;
    }

    /* ── Critical Alerts Row ── */
    .alert-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .alert-card { border-radius: 12px; }
    .alert-card mat-card-content {
      display: flex; align-items: center; gap: 16px; padding: 20px;
    }
    .alert-card.critical {
      background: #fef2f2; border: 1px solid #fecaca;
    }
    .alert-card.warning {
      background: #fffbeb; border: 1px solid #fde68a;
    }

    .alert-icon {
      width: 48px; height: 48px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .alert-icon mat-icon { font-size: 24px; width: 24px; height: 24px; }
    .alert-icon.emergencies { background: #fee2e2; color: #dc2626; }
    .alert-icon.urgent { background: #fef3c7; color: #d97706; }
    .alert-icon.failures { background: #fce7f3; color: #db2777; }

    .alert-info { display: flex; flex-direction: column; }
    .alert-value { font-size: 1.8rem; font-weight: 800; color: #1f2937; line-height: 1.1; }
    .alert-label { font-size: 0.8rem; color: #6b7280; margin-top: 2px; }

    /* ── Middle Grid ── */
    .middle-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .panel-card { border-radius: 12px; }
    .panel-card mat-card-header { padding: 20px 24px 0; }
    .panel-card mat-card-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 1.05rem; font-weight: 600;
    }
    .panel-card mat-card-title mat-icon { color: #6b7280; }
    .panel-card mat-card-content { padding: 16px 24px 24px; }

    /* Action items */
    .action-item {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 0; gap: 12px;
    }
    .action-info { display: flex; align-items: baseline; gap: 8px; }
    .action-count {
      font-size: 1.5rem; font-weight: 700; color: #2563eb; min-width: 32px;
    }
    .action-label { color: #374151; font-weight: 500; font-size: 0.9rem; }

    /* Engagement */
    .engagement-section { display: flex; flex-direction: column; gap: 12px; padding: 8px 0; }
    .engagement-header {
      display: flex; justify-content: space-between; align-items: center;
    }
    .engagement-label { font-weight: 500; color: #374151; font-size: 0.9rem; }
    .engagement-pct { font-size: 1.5rem; font-weight: 700; color: #059669; }
    .engagement-footer {
      display: flex; align-items: center; gap: 8px;
      color: #6b7280; font-size: 0.85rem; margin-top: 8px;
    }
    .engagement-footer mat-icon { font-size: 18px; width: 18px; height: 18px; color: #9ca3af; }

    @media (max-width: 800px) {
      .middle-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class CommunicationDashboardComponent implements OnInit {
  readonly service = inject(CommunicationService);

  ngOnInit(): void {
    this.service.loadDashboardMetrics();
  }
}
