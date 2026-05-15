import {
  Component, inject, ChangeDetectionStrategy, OnInit, OnDestroy,
  ViewChild, ElementRef, effect,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { Chart } from 'chart.js/auto';
import { ExamsService } from '../services/exams.service';

@Component({
  selector: 'app-exam-results',
  imports: [
    MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule,
    MatExpansionModule,
  ],
  templateUrl: './exam-results.component.html',
  styleUrl: './exam-results.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamResultsComponent implements OnInit, OnDestroy {
  readonly service = inject(ExamsService);
  @ViewChild('progressChart') canvasRef!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;

  constructor() {
    effect(() => {
      const data = this.service.examData();
      const canvas = this.canvasRef?.nativeElement;
      if (data && canvas) {
        if (!this.chart) {
          this.initChart(canvas, data.graph);
        } else {
          this.updateChart(data.graph);
        }
      }
    });
  }

  ngOnInit(): void {
    this.service.fetchProgress();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private initChart(canvas: HTMLCanvasElement, graph: { labels: string[]; overall_trend: number[] }): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, 280);
    gradient.addColorStop(0, 'rgba(37, 99, 235, 0.25)');
    gradient.addColorStop(1, 'rgba(37, 99, 235, 0.02)');

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: graph.labels,
        datasets: [{
          label: 'Overall Performance (%)',
          data: graph.overall_trend,
          borderColor: '#2563eb',
          backgroundColor: gradient,
          borderWidth: 3,
          pointBackgroundColor: '#2563eb',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          tension: 0.4,
          fill: true,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e293b',
            titleFont: { size: 13, weight: 'bold' as const },
            bodyFont: { size: 12 },
            cornerRadius: 8,
            padding: 12,
          },
        },
        scales: {
          y: {
            min: 0,
            max: 100,
            ticks: { stepSize: 20, color: '#94a3b8', font: { size: 12 } },
            grid: { color: 'rgba(0,0,0,0.04)' },
          },
          x: {
            ticks: { color: '#94a3b8', font: { size: 12 } },
            grid: { display: false },
          },
        },
      },
    });
  }

  private updateChart(graph: { labels: string[]; overall_trend: number[] }): void {
    if (!this.chart) return;
    const gradient = this.chart.ctx?.createLinearGradient(0, 0, 0, 280);
    if (gradient) {
      gradient.addColorStop(0, 'rgba(37, 99, 235, 0.25)');
      gradient.addColorStop(1, 'rgba(37, 99, 235, 0.02)');
      this.chart.data.datasets[0].backgroundColor = gradient;
    }
    this.chart.data.labels = graph.labels;
    this.chart.data.datasets[0].data = graph.overall_trend;
    this.chart.update();
  }

  gradeColor(grade: string): string {
    const map: Record<string, string> = {
      A: '#16a34a', 'A-': '#22c55e',
      'B+': '#65a30d', B: '#a3e635', 'B-': '#eab308',
      'C+': '#f59e0b', C: '#f97316', 'C-': '#ea580c',
      D: '#ef4444', E: '#dc2626', F: '#b91c1c',
    };
    return map[grade] || '#64748b';
  }
}
