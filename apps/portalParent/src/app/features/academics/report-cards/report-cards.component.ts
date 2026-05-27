import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ParentApiService } from '../../../services/parent-api.service';
import { ExamResultEntry } from '../../../models/parent.models';

@Component({
  selector: 'app-report-cards',
  imports: [MatCardModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="report-cards-page">
      <h2>Academic Performance</h2>
      @if (loading()) { <div class="loading-wrap"><mat-spinner diameter="28"></mat-spinner></div> }
      @else if (results().length > 0) {
        <div class="results-list">
          @for (exam of groupedExams(); track exam.series) {
            <mat-card class="exam-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>assessment</mat-icon>
                <mat-card-title>{{ exam.series }}</mat-card-title>
                <mat-card-subtitle>{{ exam.results.length }} subject{{ exam.results.length === 1 ? '' : 's' }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <table class="grades-table">
                  <thead><tr><th>Subject</th><th>Component</th><th>Score</th><th>Grade</th></tr></thead>
                  <tbody>
                    @for (r of exam.results; track r.id) {
                      <tr>
                        <td>{{ r.subject }}</td>
                        <td>{{ r.component_name }}</td>
                        <td class="mono">{{ r.raw_score }}%</td>
                        <td><span class="grade-badge" [style.background]="getGradeBgColor(r.computed_grade)" [style.color]="getGradeTextColor(r.computed_grade)">{{ r.computed_grade }}</span></td>
                      </tr>
                    }
                  </tbody>
                </table>
              </mat-card-content>
            </mat-card>
          }
        </div>
      } @else { <div class="no-data">No exam results available</div> }
    </div>
  `,
  styles: [`
    .report-cards-page { padding: 16px 0; }
    h2 { font-size: 1.125rem; margin: 0 0 16px; color: #1e293b; }
    .loading-wrap { display: flex; justify-content: center; padding: 48px; }
    .results-list { display: flex; flex-direction: column; gap: 16px; }
    .grades-table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 0.8125rem; }
    .grades-table th { text-align: left; padding: 8px 12px; border-bottom: 2px solid #e2e8f0; color: #64748b; font-weight: 600; font-size: 0.6875rem; text-transform: uppercase; }
    .grades-table td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
    .mono { font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; font-weight: 500; }
    .grade-badge { display: inline-block; padding: 2px 10px; border-radius: 4px; font-weight: 700; font-size: 0.75rem; }
    .no-data { padding: 48px; text-align: center; color: #94a3b8; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportCardsComponent implements OnInit {
  private readonly api = inject(ParentApiService);

  readonly results = signal<ExamResultEntry[]>([]);
  readonly loading = signal(true);

  ngOnInit() {
    this.api.getExamResults().subscribe({
      next: (r) => this.results.set(r),
      complete: () => this.loading.set(false),
    });
  }

  get groupedExams() {
    return () => {
      const groups = new Map<string, ExamResultEntry[]>();
      for (const r of this.results()) {
        if (!groups.has(r.exam_series)) groups.set(r.exam_series, []);
        groups.get(r.exam_series)!.push(r);
      }
      return Array.from(groups.entries()).map(([series, results]) => ({ series, results }));
    };
  }

  getGradeBgColor(g: string): string {
    const c = g.charAt(0).toUpperCase();
    if (['A'].includes(c)) return '#dcfce7';
    if (['B'].includes(c)) return '#dbeafe';
    if (['C'].includes(c)) return '#fef3c7';
    return '#fee2e2';
  }

  getGradeTextColor(g: string): string {
    const c = g.charAt(0).toUpperCase();
    if (['A'].includes(c)) return '#166534';
    if (['B'].includes(c)) return '#1e40af';
    if (['C'].includes(c)) return '#92400e';
    return '#991b1b';
  }
}
