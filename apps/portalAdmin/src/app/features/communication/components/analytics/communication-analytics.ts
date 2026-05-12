import {
  Component,
  inject,
  ChangeDetectionStrategy,
  OnInit,
  effect,
  afterNextRender,
  Injector,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import Chart from 'chart.js/auto';
import { CommunicationService } from '../../services/communication.service';

@Component({
  selector: 'app-communication-analytics',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="analytics-page">
      <header class="page-header">
        <div class="title-section">
          <h1>Communication Analytics</h1>
          <p class="subtitle">Executive intelligence and macro-trends.</p>
        </div>
      </header>

      @if (isLoading()) {
        <div class="loading-overlay">
          <mat-spinner diameter="40" />
        </div>
      }

      @if (data(); as d) {
        <section class="mini-kpi-row">
          <mat-card class="mini-kpi">
            <mat-card-content>
              <div class="kpi-inner">
                <mat-icon class="kpi-icon">mail</mat-icon>
                <div class="kpi-body">
                  <span class="kpi-value">{{ d.total_messages_30d | number }}</span>
                  <span class="kpi-label">Total Messages (30d)</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
          <mat-card class="mini-kpi">
            <mat-card-content>
              <div class="kpi-inner">
                <mat-icon class="kpi-icon">schedule</mat-icon>
                <div class="kpi-body">
                  <span class="kpi-value">{{ d.avg_response_time_hours }}h</span>
                  <span class="kpi-label">Avg Support Response Time</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </section>

        <div class="chart-grid">
          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>trending_up</mat-icon>
                30-Day Engagement Trend
              </mat-card-title>
            </mat-card-header>
            <mat-divider />
            <mat-card-content>
              <div class="chart-wrapper">
                <canvas id="engagementTrendChart"></canvas>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>pie_chart</mat-icon>
                Support Ticket Distribution
              </mat-card-title>
            </mat-card-header>
            <mat-divider />
            <mat-card-content>
              <div class="chart-wrapper">
                <canvas id="supportTrendChart"></canvas>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      }
    </div>
  `,
  styles: [`
    .analytics-page { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
    .title-section h1 { margin: 0 0 2px; font-size: 24px; font-weight: 700; color: #111827; }
    .subtitle { margin: 0; color: #6b7280; font-size: 0.9rem; }
    .loading-overlay { display: flex; justify-content: center; padding: 48px 0; }

    .mini-kpi-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .mini-kpi { border-radius: 12px; }
    .mini-kpi mat-card-content { padding: 16px 20px; }
    .kpi-inner { display: flex; align-items: center; gap: 16px; }
    .kpi-icon { font-size: 28px; width: 28px; height: 28px; color: #6366f1; }
    .kpi-body { display: flex; flex-direction: column; }
    .kpi-value { font-size: 1.6rem; font-weight: 800; color: #111827; line-height: 1.2; }
    .kpi-label { font-size: 0.82rem; color: #6b7280; }

    .chart-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .chart-card { border-radius: 12px; }
    .chart-card mat-card-title { display: flex; align-items: center; gap: 8px; font-size: 1rem; }
    .chart-wrapper { padding: 16px 0; }

    @media (max-width: 900px) {
      .chart-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 600px) {
      .mini-kpi-row { grid-template-columns: 1fr; }
    }
  `],
})
export class CommunicationAnalyticsComponent implements OnInit {
  private communicationService = inject(CommunicationService);
  private injector = inject(Injector);
  private trendChartInstance: Chart | null = null;
  private supportChartInstance: Chart | null = null;

  readonly data = this.communicationService.analyticsData.asReadonly();
  readonly isLoading = this.communicationService.isAnalyticsLoading.asReadonly();

  constructor() {
    effect(() => {
      const payload = this.data();
      if (payload) {
        afterNextRender(() => {
          this.renderEngagementChart(payload.delivery_trend);
          this.renderSupportChart(payload.support_categories);
        }, { injector: this.injector });
      }
    });
  }

  ngOnInit(): void {
    this.communicationService.loadAnalytics();
  }

  private renderEngagementChart(trend: { dates: string[]; sent: number[]; read: number[] }): void {
    if (this.trendChartInstance) {
      this.trendChartInstance.destroy();
      this.trendChartInstance = null;
    }
    const canvas = document.getElementById('engagementTrendChart') as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    this.trendChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: trend.dates.map((d) => {
          const parts = d.split('-');
          return `${parts[1]}/${parts[2]}`;
        }),
        datasets: [
          {
            label: 'Sent',
            data: trend.sent,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            fill: true,
            tension: 0.4,
            pointRadius: 2,
            pointHoverRadius: 5,
          },
          {
            label: 'Read',
            data: trend.read,
            borderColor: '#16a34a',
            backgroundColor: 'rgba(22, 163, 74, 0.08)',
            fill: true,
            tension: 0.4,
            pointRadius: 2,
            pointHoverRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: {
            position: 'top',
            labels: { usePointStyle: true, pointStyle: 'circle', padding: 16 },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { maxTicksLimit: 10, color: '#9ca3af' },
          },
          y: {
            beginAtZero: true,
            grid: { color: '#f3f4f6' },
            ticks: { color: '#9ca3af' },
          },
        },
      },
    });
  }

  private renderSupportChart(cat: { labels: string[]; counts: number[] }): void {
    if (this.supportChartInstance) {
      this.supportChartInstance.destroy();
      this.supportChartInstance = null;
    }
    const canvas = document.getElementById('supportTrendChart') as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const colorPalette = [
      '#6366f1', '#f59e0b', '#ef4444', '#10b981', '#3b82f6',
    ];
    this.supportChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: cat.labels.map((l) => l.replace(/_/g, ' ')),
        datasets: [
          {
            data: cat.counts,
            backgroundColor: colorPalette.slice(0, cat.labels.length),
            borderWidth: 2,
            borderColor: '#fff',
          },
        ],
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
