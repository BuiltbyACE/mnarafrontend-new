import { Component, inject, ViewChild, ElementRef, AfterViewInit, OnDestroy, effect, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { Chart, registerables } from 'chart.js';
import { GradingService, GradingPayload } from '../services/grading.service';

Chart.register(...registerables);

@Component({
  selector: 'app-grading-dashboard',
  standalone: true,
  imports: [DatePipe, MatCardModule, MatIconModule, MatButtonModule, MatTableModule],
  templateUrl: './grading-dashboard.component.html',
  styles: [`
    :host {
      --p: #2563eb; --pl: #dbeafe; --pd: #1d4ed8;
      --s: #fff; --b: #f1f5f9; --t: #1e293b; --ts: #64748b; --bo: #e2e8f0;
      --su: #10b981; --wa: #f59e0b; --er: #ef4444; --ga: #6b7280;
      display: block; min-height: 100vh; background: var(--b);
      font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; padding: 24px;
    }
    .page { max-width: 1280px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: var(--t); margin: 0; }
    .page-subtitle { font-size: 0.875rem; color: var(--ts); margin: 4px 0 0; }
    .section { margin-bottom: 32px; }
    .section-title { font-size: 1.125rem; font-weight: 600; color: var(--t); margin: 0 0 16px; display: flex; align-items: center; gap: 8px; }

    .table-card { border-radius: 12px; border: 1px solid var(--bo); overflow: hidden; }
    .grading-table { width: 100%; }
    .grading-table .mat-mdc-header-cell {
      background: #f8fafc; color: var(--ts); font-size: 0.75rem;
      font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
      padding: 12px 16px; border-bottom: 1px solid var(--bo);
    }
    .grading-table .mat-mdc-cell {
      padding: 14px 16px; font-size: 0.875rem; color: var(--t);
      border-bottom: 1px solid #f1f5f9;
    }
    .table-row:hover { background: #f8fafc; }
    .table-row:last-child .mat-mdc-cell { border-bottom: none; }

    .task-title { font-weight: 500; }
    .task-meta { display: flex; flex-direction: column; gap: 2px; }
    .task-class { font-size: 0.75rem; color: var(--ts); }

    .progress-col { display: flex; flex-direction: column; gap: 4px; min-width: 140px; }
    .progress-text { font-size: 0.8125rem; font-weight: 500; }
    .progress-track { height: 6px; background: #e2e8f0; border-radius: 100px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 100px; transition: width .4s ease; background: var(--p); }
    .progress-fill.overdue { background: var(--wa); }

    .due-date { font-size: 0.8125rem; }
    .due-date.overdue { color: var(--er); font-weight: 600; }
    .overdue-icon { font-size: 14px; width: 14px; height: 14px; vertical-align: middle; margin-right: 2px; }

    .action-btn {
      display: inline-flex; align-items: center; gap: 6px;
      background: var(--p); color: #fff; border: none;
      padding: 8px 16px; border-radius: 8px; font-size: 0.8125rem;
      font-weight: 600; cursor: pointer; white-space: nowrap;
      font-family: 'Inter', sans-serif; transition: background .15s;
    }
    .action-btn:hover { background: var(--pd); }
    .action-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .analytics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .chart-card { border-radius: 12px; border: 1px solid var(--bo); padding: 20px; }
    .chart-card h3 { font-size: 0.9375rem; font-weight: 600; color: var(--t); margin: 0 0 16px; }
    .chart-wrapper { position: relative; height: 280px; }

    .empty-state { text-align: center; padding: 60px 24px; color: var(--ts); }
    .empty-icon { font-size: 48px; width: 48px; height: 48px; opacity: .35; margin-bottom: 12px; }
    .empty-state p { font-size: 0.9375rem; margin: 0 0 4px; }
    .empty-hint { font-size: 0.8125rem; color: var(--ts); }

    .loading { text-align: center; padding: 60px; color: var(--ts); }
    .error-banner { padding: 12px 20px; background: #fee2e2; color: #991b1b; border-radius: 8px; margin-bottom: 16px; font-size: 0.875rem; display: flex; align-items: center; gap: 8px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GradingDashboardComponent implements AfterViewInit, OnDestroy {
  private router = inject(Router);
  readonly service = inject(GradingService);

  @ViewChild('distChart') distCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('avgChart') avgCanvas!: ElementRef<HTMLCanvasElement>;

  private distChart?: Chart;
  private avgChart?: Chart;

  readonly displayedColumns = ['title', 'class', 'progress', 'dueDate', 'actions'];

  isOverdue(dateStr: string): boolean {
    return new Date(dateStr) < new Date();
  }

  gradeTask(task: { id: number; submitted_count: number }): void {
    this.router.navigate(['../bulk-grade', task.id]);
  }

  constructor() {
    this.service.fetchDashboard();
    effect(() => {
      const payload = this.service.data();
      if (payload) {
        this.buildCharts(payload);
      }
    });
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.distChart?.destroy();
    this.avgChart?.destroy();
  }

  private buildCharts(p: GradingPayload): void {
    this.buildDistributionChart(p.grade_distribution);
    this.buildAverageChart(p.subject_averages);
  }

  private buildDistributionChart(data: GradingPayload['grade_distribution']): void {
    this.distChart?.destroy();
    if (!this.distCanvas) return;
    const ctx = this.distCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.distChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => d.grade),
        datasets: [{
          label: 'Students',
          data: data.map(d => d.count),
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.12)',
          borderWidth: 2,
          pointBackgroundColor: '#2563eb',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.35,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e293b',
            titleFont: { size: 12, family: 'Inter' },
            bodyFont: { size: 12, family: 'Inter' },
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (ctx) => `${ctx.parsed.y} students (${data[ctx.dataIndex].percentage}%)`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 11, family: 'Inter' }, color: '#64748b' },
          },
          y: {
            beginAtZero: true,
            grid: { color: '#f1f5f9' },
            ticks: { font: { size: 11, family: 'Inter' }, color: '#64748b', stepSize: 1 },
          },
        },
      },
    });
  }

  private buildAverageChart(data: GradingPayload['subject_averages']): void {
    this.avgChart?.destroy();
    if (!this.avgCanvas) return;
    const ctx = this.avgCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const colors = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];

    this.avgChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.subject),
        datasets: [{
          label: 'Average Score',
          data: data.map(d => d.average_score),
          backgroundColor: data.map((_, i) => colors[i % colors.length] + 'cc'),
          borderColor: data.map((_, i) => colors[i % colors.length]),
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.65,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e293b',
            titleFont: { size: 12, family: 'Inter' },
            bodyFont: { size: 12, family: 'Inter' },
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (ctx) => `${ctx.parsed.y}%`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 11, family: 'Inter' }, color: '#64748b' },
          },
          y: {
            beginAtZero: true,
            max: 100,
            grid: { color: '#f1f5f9' },
            ticks: { font: { size: 11, family: 'Inter' }, color: '#64748b', callback: (v) => `${v}%` },
          },
        },
      },
    });
  }
}
