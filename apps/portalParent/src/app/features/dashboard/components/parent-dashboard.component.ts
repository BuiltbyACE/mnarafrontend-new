import { Component, effect, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SiblingStateService } from '@sms/core/state';
import { ParentDashboardService, ParentDashboardPayload } from '../services/parent-dashboard.service';
import { DatePipe } from '@angular/common';

interface SafetyStatus {
  color_code: 'success' | 'warning' | 'danger' | 'info';
  message: string;
  timestamp: string;
}

interface GradeEntry {
  subject: string;
  grade: string;
  term: string;
  date: string;
}

interface Notice {
  id: number;
  title: string;
  is_urgent: boolean;
  created_at: string;
}

@Component({
  selector: 'app-parent-dashboard',
  imports: [
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    DatePipe,
  ],
  templateUrl: './parent-dashboard.component.html',
  styleUrls: ['./parent-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParentDashboardComponent implements OnInit {
  private readonly siblingState = inject(SiblingStateService);
  private readonly dashboardService = inject(ParentDashboardService);
  private readonly http = inject(HttpClient);

  readonly dashboardData = signal<ParentDashboardPayload | null>(null);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly activeSibling = this.siblingState.activeSibling;

  private readonly mockData: ParentDashboardPayload = {
    student_id: '1',
    student_name: 'Wesley Figueroa',
    student_form: 'Form 3',
    safety_status: {
      color_code: 'success',
      message: 'Arrived safely at school',
      timestamp: '2026-05-18T07:42:00Z',
    },
    term_balance: 45000,
    last_payment_date: '2026-02-10',
    recent_grades: [
      { subject: 'Mathematics', grade: 'A', term: 'Term 1', date: '2026-03-15' },
      { subject: 'English', grade: 'B+', term: 'Term 1', date: '2026-03-15' },
      { subject: 'Science', grade: 'A-', term: 'Term 1', date: '2026-03-15' },
    ],
    urgent_notices: [
      { id: 1, title: 'Fee balance reminder - due March 15', is_urgent: true, created_at: '2026-03-10' },
      { id: 2, title: 'Parent-Teacher conference this Friday', is_urgent: false, created_at: '2026-03-12' },
    ],
  };

  constructor() {
    effect(() => {
      const siblingId = this.siblingState.activeSiblingId();
      this.loadDashboard(siblingId);
    });
  }

  ngOnInit(): void {
    // Initial load handled by effect
  }

  private loadDashboard(studentId: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.dashboardService.getDashboardSummary(studentId).subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        const baseData = { ...this.mockData, student_id: studentId };
        if (studentId === '2') {
          this.dashboardData.set({
            ...baseData,
            student_name: 'Alice Figueroa',
            student_form: 'Year 6',
            safety_status: { color_code: 'success', message: 'In class', timestamp: '2026-05-18T08:15:00Z' },
            term_balance: 0,
            recent_grades: [
              { subject: 'English', grade: 'A', term: 'Term 1', date: '2026-03-15' },
              { subject: 'Mathematics', grade: 'A', term: 'Term 1', date: '2026-03-15' },
            ],
            urgent_notices: [],
          });
        } else {
          this.dashboardData.set(baseData);
        }
        this.isLoading.set(false);
      },
    });
  }

  getGradeBgColor(grade: string): string {
    const g = grade.charAt(0).toUpperCase();
    if (['A'].includes(g)) return '#dcfce7';
    if (['B'].includes(g)) return '#dbeafe';
    if (['C'].includes(g)) return '#fef3c7';
    return '#fee2e2';
  }

  getGradeTextColor(grade: string): string {
    const g = grade.charAt(0).toUpperCase();
    if (['A'].includes(g)) return '#166534';
    if (['B'].includes(g)) return '#1e40af';
    if (['C'].includes(g)) return '#92400e';
    return '#991b1b';
  }

  formatBalance(balance: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0,
    }).format(balance);
  }
}