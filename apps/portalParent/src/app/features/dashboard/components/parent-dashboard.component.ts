import { Component, effect, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
 import { NgIf } from '@angular/common';
import { SiblingStateService } from '@sms/core/state';
import { ParentApiService } from '../../../services/parent-api.service';
import { DashboardSummary, STATUS_COLORS } from '../../../models/parent.models';

@Component({
  selector: 'app-parent-dashboard',
  imports: [
    RouterLink, MatCardModule, MatIconModule, MatButtonModule,
    MatProgressSpinnerModule, NgIf,
  ],
  templateUrl: './parent-dashboard.component.html',
  styleUrls: ['./parent-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParentDashboardComponent implements OnInit {
  private readonly siblingState = inject(SiblingStateService);
  private readonly api = inject(ParentApiService);

  readonly dashboardData = signal<DashboardSummary | null>(null);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly activeSibling = this.siblingState.activeSibling;

  readonly STATUS_COLORS = STATUS_COLORS;

  constructor() {
    effect(() => {
      const siblingId = this.siblingState.activeSiblingId();
      if (siblingId) this.loadDashboard(siblingId);
    });
  }

  ngOnInit(): void {
    this.siblingState.loadProfiles();
  }

  private loadDashboard(studentId: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.api.getDashboardSummary(Number(studentId)).subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set(err.error?.message || err.error?.detail || 'Failed to load dashboard data');
      },
    });
  }

  getGradeBgColor(grade: string): string {
    if (['A*', 'A'].includes(grade)) return '#dcfce7';
    if (grade.startsWith('B')) return '#dbeafe';
    if (grade.startsWith('C')) return '#fef3c7';
    return '#fee2e2';
  }

  getGradeTextColor(grade: string): string {
    if (['A*', 'A'].includes(grade)) return '#166534';
    if (grade.startsWith('B')) return '#1e40af';
    if (grade.startsWith('C')) return '#92400e';
    return '#991b1b';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0,
    }).format(amount);
  }
}
