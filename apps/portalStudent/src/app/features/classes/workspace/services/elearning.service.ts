import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { getApiUrl } from '@sms/core/config';

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  type: 'mcq' | 'upload' | 'essay';
  dueDate: Date;
  status: 'pending' | 'submitted' | 'graded';
  grade?: number;
  totalMarks?: number;
  description: string;
}

export interface Grade {
  subject: string;
  score: number;
  totalMarks: number;
  grade: string;
  term: string;
  teacher: string;
}

export interface Resource {
  id: string;
  title: string;
  type: 'video' | 'textbook' | 'coursebook' | 'past-paper';
  subject: string;
  description: string;
  url: string;
  uploadedAt: Date;
  fileSize?: string;
}

export interface McqQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  selectedAnswer?: number;
}

export interface AssignmentDTO {
  id: string;
  title: string;
  subject: string;
  type: string;
  due_date: string;
  status: string;
  description?: string;
}

export interface LiveClassDTO {
  id: string;
  title: string;
  subject: string;
  teacher: string;
  start_time: string;
  status: string;
  description?: string;
}

export interface ELearningPayload {
  kpis: {
    pending_assignments: number;
    average_grade: number;
    upcoming_live_classes: number;
    resources_available: number;
  };
  recent_assignments: AssignmentDTO[];
  upcoming_live_classes: LiveClassDTO[];
}

@Injectable({ providedIn: 'root' })
export class ElearningService {
  private http = inject(HttpClient);

  private readonly assignments = signal<Assignment[]>([]);
  private readonly grades = signal<Grade[]>([]);
  private readonly resources = signal<Resource[]>([]);

  readonly dashboardData = signal<ELearningPayload | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly dashboardError = signal<string | null>(null);

  readonly assignmentsList = this.assignments.asReadonly();
  readonly gradesList = this.grades.asReadonly();
  readonly resourcesList = this.resources.asReadonly();

  getAssignmentsByType(type: Assignment['type'] | 'all'): Assignment[] {
    const all = this.assignments();
    return type === 'all' ? all : all.filter(a => a.type === type);
  }

  getPendingCount(): number {
    return this.assignments().filter(a => a.status === 'pending').length;
  }

  getAverageGrade(): number {
    const graded = this.grades();
    if (!graded.length) return 0;
    const total = graded.reduce((sum, g) => sum + (g.score / g.totalMarks) * 100, 0);
    return Math.round(total / graded.length);
  }

  loadDashboard(workspaceId?: number): void {
    this.isLoading.set(true);
    this.dashboardError.set(null);
    let url = '/lms/elearning-dashboard/';
    if (workspaceId) {
      url += `?workspace_id=${workspaceId}`;
    }
    this.http.get<ELearningPayload>(getApiUrl(url))
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (payload) => this.dashboardData.set(payload),
        error: (err) => {
          console.error('[ElearningDashboard] API error:', err.status, err.statusText, err.message);
          this.dashboardData.set(null);
          if (err.status === 403) {
            this.dashboardError.set('Access denied. Your account may not have permission to view the learning dashboard.');
          } else if (err.status === 401) {
            this.dashboardError.set('Session expired. Please log in again.');
          } else {
            this.dashboardError.set('Failed to load dashboard. Please try again later.');
          }
        },
      });
  }
}
