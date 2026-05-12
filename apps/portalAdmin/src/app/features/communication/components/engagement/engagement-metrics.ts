import { Component, inject, ChangeDetectionStrategy, effect, afterNextRender, Injector, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import Chart from 'chart.js/auto';
import { CommunicationService, DeliveryReceipt } from '../../services/communication.service';

@Component({
  selector: 'app-engagement-metrics',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="engagement-page">
      <header class="page-header">
        <div class="title-section">
          <h1>Engagement & Delivery Logs</h1>
          <p class="subtitle">Track message open rates, delivery success, and audience interaction</p>
        </div>
        <button mat-stroked-button color="primary" (click)="refresh()">
          <mat-icon>refresh</mat-icon>
          Refresh
        </button>
      </header>

      @if (isLoading()) {
        <div class="loading-overlay">
          <mat-spinner diameter="40" />
        </div>
      }

      @if (em(); as m) {
        <section class="kpi-grid">
          <mat-card class="kpi-card">
            <mat-card-content>
              <div class="kpi-value">{{ m.delivery_rate }}%</div>
              <div class="kpi-label">Delivery Rate</div>
              <mat-icon class="kpi-icon positive">check_circle</mat-icon>
            </mat-card-content>
          </mat-card>
          <mat-card class="kpi-card">
            <mat-card-content>
              <div class="kpi-value">{{ m.read_rate }}%</div>
              <div class="kpi-label">Read Rate</div>
              <mat-icon class="kpi-icon positive">visibility</mat-icon>
            </mat-card-content>
          </mat-card>
          <mat-card class="kpi-card">
            <mat-card-content>
              <div class="kpi-value">{{ m.total_sent | number }}</div>
              <div class="kpi-label">Total Processed</div>
              <mat-icon class="kpi-icon">send</mat-icon>
            </mat-card-content>
          </mat-card>
          <mat-card class="kpi-card" [class.warn]="m.failed_count > 0">
            <mat-card-content>
              <div class="kpi-value">{{ m.failed_count | number }}</div>
              <div class="kpi-label">Failed / Bounced</div>
              @if (m.failed_count > 0) {
                <mat-icon class="kpi-icon" style="color: #dc2626;">warning</mat-icon>
              } @else {
                <mat-icon class="kpi-icon positive">check_circle</mat-icon>
              }
            </mat-card-content>
          </mat-card>
        </section>
      }

      <mat-card class="chart-card">
        <mat-card-header><mat-card-title>Status Distribution</mat-card-title></mat-card-header>
        <mat-card-content>
          <div class="chart-wrapper">
            <canvas id="engagementChart"></canvas>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="table-card">
        <mat-card-header>
          <mat-card-title>Delivery Logs</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          @if (logs().length > 0) {
            <div class="table-container">
              <table mat-table [dataSource]="logs()">
                <ng-container matColumnDef="recipient_name">
                  <th mat-header-cell *matHeaderCellDef>Recipient</th>
                  <td mat-cell *matCellDef="let r">{{ r.recipient_name }}</td>
                </ng-container>
                <ng-container matColumnDef="channel">
                  <th mat-header-cell *matHeaderCellDef>Channel</th>
                  <td mat-cell *matCellDef="let r">
                    <mat-chip [class]="r.channel.toLowerCase()" highlighted>
                      {{ r.channel }}
                    </mat-chip>
                  </td>
                </ng-container>
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let r">
                    <mat-chip [class]="r.status.toLowerCase()">
                      {{ r.status }}
                    </mat-chip>
                  </td>
                </ng-container>
                <ng-container matColumnDef="created_at">
                  <th mat-header-cell *matHeaderCellDef>Timestamp</th>
                  <td mat-cell *matCellDef="let r">{{ r.created_at | date:'short' }}</td>
                </ng-container>
                <ng-container matColumnDef="error_message">
                  <th mat-header-cell *matHeaderCellDef>Error Detail</th>
                  <td mat-cell *matCellDef="let r">
                    @if (r.status === 'FAILED' && r.error_message) {
                      <span class="error-msg">{{ r.error_message }}</span>
                    }
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>
            </div>
          } @else {
            <div class="empty-state">
              <mat-icon>inbox</mat-icon>
              <p>No delivery logs yet</p>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .engagement-page { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
    }
    .title-section h1 { margin: 0 0 2px; font-size: 24px; font-weight: 700; color: #111827; }
    .subtitle { margin: 0; color: #6b7280; font-size: 0.9rem; }
    .loading-overlay {
      display: flex; justify-content: center; padding: 48px 0;
    }

    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    .kpi-card { border-radius: 12px; }
    .kpi-card.warn { background: #fef2f2; border-color: #fecaca; }
    .kpi-card mat-card-content {
      display: flex; flex-direction: column; align-items: center;
      padding: 20px; text-align: center; position: relative;
    }
    .kpi-value { font-size: 2rem; font-weight: 800; color: #111827; }
    .kpi-label { font-size: 0.85rem; color: #6b7280; margin-top: 2px; }
    .kpi-icon { position: absolute; top: 12px; right: 12px; font-size: 22px; color: #9ca3af; }
    .kpi-icon.positive { color: #16a34a; }

    .chart-card { border-radius: 12px; }
    .chart-wrapper { max-width: 400px; margin: 0 auto; padding: 16px 0; }

    .table-card { border-radius: 12px; }
    .table-container { overflow-x: auto; }
    table { width: 100%; }
    .mat-mdc-chip { font-size: 0.75rem; }
    .mat-mdc-chip.sms { background: #dbeafe; color: #1d4ed8; }
    .mat-mdc-chip.email { background: #f3e8ff; color: #7c3aed; }
    .mat-mdc-chip.push { background: #fef3c7; color: #b45309; }
    .mat-mdc-chip.in_app { background: #d1fae5; color: #059669; }
    .mat-mdc-chip.pending { background: #f3f4f6; color: #6b7280; }
    .mat-mdc-chip.sent { background: #fef3c7; color: #b45309; }
    .mat-mdc-chip.delivered { background: #dbeafe; color: #1d4ed8; }
    .mat-mdc-chip.read { background: #d1fae5; color: #059669; }
    .mat-mdc-chip.failed { background: #fee2e2; color: #dc2626; }
    .error-msg { font-size: 0.8rem; color: #dc2626; max-width: 200px; display: block; }
    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      gap: 12px; padding: 48px; color: #9ca3af;
    }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
  `],
})
export class EngagementMetricsComponent {
  private communicationService = inject(CommunicationService);
  private injector = inject(Injector);
  private chartInstance: Chart | null = null;

  readonly displayedColumns = ['recipient_name', 'channel', 'status', 'created_at', 'error_message'];

  readonly logs = this.communicationService.deliveryLogs.asReadonly();
  readonly em = this.communicationService.engagementMetrics.asReadonly();
  readonly isLoading = this.communicationService.isEngagementLoading.asReadonly();

  constructor() {
    effect(() => {
      const logs = this.logs();
      if (logs && logs.length > 0) {
        afterNextRender(() => {
          this.renderChart(logs);
        }, { injector: this.injector });
      }
    });
  }

  ngOnInit(): void {
    this.communicationService.loadEngagementMetrics();
    this.communicationService.getDeliveryLogs();
  }

  refresh(): void {
    this.communicationService.loadEngagementMetrics();
    this.communicationService.getDeliveryLogs();
  }

  private renderChart(logs: DeliveryReceipt[]): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
    const counts: Record<string, number> = {};
    for (const r of logs) {
      counts[r.status] = (counts[r.status] || 0) + 1;
    }
    const statuses = ['READ', 'DELIVERED', 'SENT', 'PENDING', 'FAILED'];
    const labels: string[] = [];
    const data: number[] = [];
    const colors: string[] = [];
    const colorMap: Record<string, string> = {
      READ: '#059669',
      DELIVERED: '#2563eb',
      SENT: '#d97706',
      PENDING: '#9ca3af',
      FAILED: '#dc2626',
    };
    for (const s of statuses) {
      if ((counts[s] || 0) > 0) {
        labels.push(s);
        data.push(counts[s]);
        colors.push(colorMap[s] || '#6b7280');
      }
    }
    const canvas = document.getElementById('engagementChart') as HTMLCanvasElement | null;
    if (!canvas) return;
    this.chartInstance = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data, backgroundColor: colors, borderWidth: 0 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 16, usePointStyle: true, pointStyle: 'circle' },
          },
        },
      },
    });
  }
}
