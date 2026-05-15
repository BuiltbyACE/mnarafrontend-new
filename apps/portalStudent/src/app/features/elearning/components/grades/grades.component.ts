import { Component, ChangeDetectionStrategy, inject, computed, effect, viewChild, ElementRef, OnInit, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import Chart from 'chart.js/auto';
import { GradesService, TrendData } from '../../services/grades.service';

@Component({
  selector: 'app-grades',
  imports: [
    MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule,
    MatProgressBarModule, MatExpansionModule, DatePipe, NgClass,
  ],
  template: `
    <div class="grades-page">
      <div class="page-heading">
        <h2>Grades & Performance</h2>
        <p>Track your academic progress across all subjects</p>
      </div>

      @if (isLoading()) {
        <div class="loading-state"><mat-spinner diameter="36" /><p>Loading performance data...</p></div>
      } @else if (data(); as d) {
        <div class="kpi-row">
          <mat-card class="kpi-card" appearance="outlined">
            <mat-card-content>
              <mat-icon class="kpi-icon avg-icon">trending_up</mat-icon>
              <span class="kpi-value">{{ d.overall_average }}%</span>
              <span class="kpi-label">Overall Average</span>
            </mat-card-content>
          </mat-card>
          <mat-card class="kpi-card" appearance="outlined">
            <mat-card-content>
              <mat-icon class="kpi-icon best-icon">star</mat-icon>
              <span class="kpi-value">{{ d.best_subject }}</span>
              <span class="kpi-label">Best Subject ({{ d.best_subject_score }}%)</span>
            </mat-card-content>
          </mat-card>
          <mat-card class="kpi-card" appearance="outlined">
            <mat-card-content>
              <mat-icon class="kpi-icon graded-icon">fact_check</mat-icon>
              <span class="kpi-value">{{ d.assessments_graded }}</span>
              <span class="kpi-label">Assessments Graded</span>
            </mat-card-content>
          </mat-card>
        </div>

        @if (d.trend.length) {
          <mat-card class="chart-card" appearance="outlined">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>show_chart</mat-icon>
                Performance Trend
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-wrapper">
                <canvas #trendChart></canvas>
              </div>
            </mat-card-content>
          </mat-card>
        }

        @if (d.subjects.length) {
          <mat-card class="subjects-card" appearance="outlined">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>folder</mat-icon>
                Subject Breakdown
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <mat-accordion multi>
                @for (subj of d.subjects; track subj.subject) {
                  <mat-expansion-panel>
                    <mat-expansion-panel-header>
                      <mat-panel-title>
                        <span class="panel-subject">{{ subj.subject }}</span>
                        <span class="panel-average">{{ subj.average }}%</span>
                      </mat-panel-title>
                      <mat-panel-description>
                        <mat-progress-bar mode="determinate" [value]="subj.average"
                          [ngClass]="barClass(subj.average)">
                        </mat-progress-bar>
                      </mat-panel-description>
                    </mat-expansion-panel-header>
                    <div class="assessments-list">
                      @for (a of subj.assessments; track a.title) {
                        <div class="assessment-row">
                          <div class="assessment-info">
                            <span class="assessment-title">{{ a.title }}</span>
                            <span class="assessment-date">{{ a.date | date:'mediumDate' }}</span>
                          </div>
                          <span class="assessment-score" [ngClass]="scoreClass(a.score, a.max_score)">
                            {{ a.score }} / {{ a.max_score }}
                          </span>
                        </div>
                      }
                    </div>
                  </mat-expansion-panel>
                }
              </mat-accordion>
            </mat-card-content>
          </mat-card>
        }
      }
    </div>
  `,
  styles: [`
    .grades-page { max-width: 1200px; }

    .page-heading { margin-bottom: 24px; }
    .page-heading h2 { margin: 0; font-size: 1.4rem; font-weight: 700; color: #1e293b; }
    .page-heading p { margin: 4px 0 0; color: #64748b; }

    .loading-state {
      display: flex; flex-direction: column; align-items: center;
      gap: 12px; min-height: 260px; justify-content: center; color: #64748b;
    }

    .kpi-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .kpi-card {
      border-radius: 12px !important;
      transition: box-shadow 0.2s, transform 0.2s;
    }
    .kpi-card:hover {
      box-shadow: 0 8px 24px rgba(0,0,0,0.08);
      transform: translateY(-2px);
    }
    .kpi-card mat-card-content {
      display: flex; flex-direction: column; align-items: center;
      padding: 24px !important; text-align: center; gap: 4px;
    }

    .kpi-icon {
      font-size: 32px; width: 32px; height: 32px;
      padding: 8px; border-radius: 12px; margin-bottom: 4px;
    }
    .avg-icon { color: #3b82f6; background: #dbeafe; }
    .best-icon { color: #f59e0b; background: #fef3c7; }
    .graded-icon { color: #10b981; background: #d1fae5; }

    .kpi-value {
      font-size: 1.5rem; font-weight: 700; color: #1e293b;
    }
    .kpi-label {
      font-size: 0.8rem; color: #64748b;
    }

    .chart-card {
      border-radius: 12px !important; margin-bottom: 24px;
    }
    .chart-card mat-card-header {
      padding: 16px 20px 0;
    }
    .chart-card mat-card-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 1rem; font-weight: 600; color: #1e293b;
    }
    .chart-card mat-card-title mat-icon { color: #3b82f6; }

    .chart-wrapper {
      height: 280px; padding: 12px 0;
    }

    .subjects-card {
      border-radius: 12px !important;
    }
    .subjects-card mat-card-header {
      padding: 16px 20px 0;
    }
    .subjects-card mat-card-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 1rem; font-weight: 600; color: #1e293b;
    }
    .subjects-card mat-card-title mat-icon { color: #6366f1; }

    mat-accordion { display: flex; flex-direction: column; gap: 8px; }

    mat-expansion-panel {
      border-radius: 8px !important;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04) !important;
    }

    .panel-subject {
      font-weight: 600; color: #1e293b; font-size: 0.95rem; min-width: 140px;
    }
    .panel-average {
      font-size: 0.85rem; font-weight: 700; color: #6366f1; margin-left: 12px;
    }

    mat-progress-bar {
      height: 6px; border-radius: 3px; width: 100%;
    }
    mat-progress-bar.high ::ng-deep .mdc-linear-progress__bar-inner { background-color: #10b981 !important; }
    mat-progress-bar.medium ::ng-deep .mdc-linear-progress__bar-inner { background-color: #3b82f6 !important; }
    mat-progress-bar.low ::ng-deep .mdc-linear-progress__bar-inner { background-color: #f59e0b !important; }
    mat-progress-bar.danger ::ng-deep .mdc-linear-progress__bar-inner { background-color: #ef4444 !important; }

    .assessments-list { display: flex; flex-direction: column; gap: 0; }

    .assessment-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 0; border-bottom: 1px solid #f1f5f9;
    }
    .assessment-row:last-child { border-bottom: none; }

    .assessment-info {
      display: flex; flex-direction: column; gap: 2px;
    }
    .assessment-title {
      font-size: 0.9rem; font-weight: 500; color: #334155;
    }
    .assessment-date {
      font-size: 0.75rem; color: #94a3b8;
    }
    .assessment-score {
      font-size: 0.9rem; font-weight: 700; white-space: nowrap; margin-left: 16px;
    }
    .assessment-score.high { color: #10b981; }
    .assessment-score.medium { color: #3b82f6; }
    .assessment-score.low { color: #f59e0b; }
    .assessment-score.danger { color: #ef4444; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GradesComponent implements OnInit {
  private gradesService = inject(GradesService);
  private chartInstance: Chart | null = null;

  readonly trendChart = viewChild<ElementRef<HTMLCanvasElement>>('trendChart');

  readonly data = this.gradesService.performanceData.asReadonly();
  readonly isLoading = this.gradesService.isLoading.asReadonly();

  private chartReady = signal(false);

  constructor() {
    effect(() => {
      const canvasEl = this.trendChart();
      const payload = this.data();
      if (canvasEl && payload?.trend.length && payload !== null) {
        this.renderChart(canvasEl.nativeElement, payload.trend);
        this.chartReady.set(true);
      }
    });
  }

  ngOnInit(): void {
    this.gradesService.fetchPerformance();
  }

  private renderChart(canvas: HTMLCanvasElement, trend: TrendData[]): void {
    this.chartInstance?.destroy();
    this.chartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        labels: trend.map(t => t.label),
        datasets: [{
          label: 'Performance',
          data: trend.map(t => t.average),
          borderColor: '#1e3a8a',
          backgroundColor: 'rgba(30, 58, 138, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#1e3a8a',
          pointRadius: 4,
          pointHoverRadius: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            min: 0,
            max: 100,
            grid: { display: false },
            ticks: { stepSize: 20 },
          },
          x: {
            grid: { display: false },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#f8fafc',
            bodyColor: '#e2e8f0',
            cornerRadius: 8,
            padding: 10,
          },
        },
      },
    });
  }

  barClass(average: number): string {
    if (average >= 70) return 'high';
    if (average >= 50) return 'medium';
    if (average >= 30) return 'low';
    return 'danger';
  }

  scoreClass(score: number, maxScore: number): string {
    const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
    if (pct >= 70) return 'high';
    if (pct >= 50) return 'medium';
    if (pct >= 30) return 'low';
    return 'danger';
  }
}
