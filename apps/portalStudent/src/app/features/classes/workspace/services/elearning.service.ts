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

  private readonly assignments = signal<Assignment[]>([
    {
      id: 'a1', title: 'Algebraic Expressions', subject: 'Mathematics',
      type: 'mcq', dueDate: new Date('2026-05-20'), status: 'pending',
      description: 'Complete the MCQ on algebraic expressions covering factorization and expansion.',
    },
    {
      id: 'a2', title: 'Essay on Climate Change', subject: 'English',
      type: 'essay', dueDate: new Date('2026-05-22'), status: 'pending',
      description: 'Write a 500-word essay on the impact of climate change in Africa.',
    },
    {
      id: 'a3', title: 'Lab Report: Photosynthesis', subject: 'Biology',
      type: 'upload', dueDate: new Date('2026-05-18'), status: 'submitted',
      description: 'Upload your completed lab report on the photosynthesis experiment.',
    },
    {
      id: 'a4', title: 'Trigonometry Test', subject: 'Mathematics',
      type: 'mcq', dueDate: new Date('2026-05-15'), status: 'graded', grade: 18, totalMarks: 20,
      description: 'Test your knowledge of trigonometric ratios and identities.',
    },
    {
      id: 'a5', title: 'History of East Africa', subject: 'History',
      type: 'essay', dueDate: new Date('2026-05-25'), status: 'pending',
      description: 'Discuss the major historical events that shaped East Africa.',
    },
    {
      id: 'a6', title: 'Chemistry Practical Report', subject: 'Chemistry',
      type: 'upload', dueDate: new Date('2026-05-12'), status: 'graded', grade: 14, totalMarks: 15,
      description: 'Upload your practical report on acid-base titration.',
    },
  ]);

  private readonly grades = signal<Grade[]>([
    { subject: 'Mathematics', score: 88, totalMarks: 100, grade: 'A', term: 'Term 1', teacher: 'Mr. Kamau' },
    { subject: 'English', score: 75, totalMarks: 100, grade: 'B+', term: 'Term 1', teacher: 'Ms. Akinyi' },
    { subject: 'Biology', score: 92, totalMarks: 100, grade: 'A', term: 'Term 1', teacher: 'Dr. Omondi' },
    { subject: 'Chemistry', score: 70, totalMarks: 100, grade: 'B', term: 'Term 1', teacher: 'Mrs. Wanjiku' },
    { subject: 'History', score: 85, totalMarks: 100, grade: 'A-', term: 'Term 1', teacher: 'Mr. Mutua' },
    { subject: 'Geography', score: 78, totalMarks: 100, grade: 'B+', term: 'Term 1', teacher: 'Ms. Chebet' },
    { subject: 'Physics', score: 82, totalMarks: 100, grade: 'A-', term: 'Term 1', teacher: 'Mr. Njenga' },
    { subject: 'Kiswahili', score: 90, totalMarks: 100, grade: 'A', term: 'Term 1', teacher: 'Mrs. Hassan' },
  ]);

  private readonly resources = signal<Resource[]>([
    { id: 'r1', title: 'Introduction to Algebra', type: 'video', subject: 'Mathematics', description: 'Video lesson on basic algebraic concepts.', url: '#', uploadedAt: new Date('2026-01-15'), fileSize: '45 MB' },
    { id: 'r2', title: 'Cambridge Mathematics Textbook', type: 'textbook', subject: 'Mathematics', description: 'Full textbook covering the Cambridge syllabus.', url: '#', uploadedAt: new Date('2026-01-10'), fileSize: '12 MB' },
    { id: 'r3', title: 'Biology Coursebook Form 3', type: 'coursebook', subject: 'Biology', description: 'Structured coursebook with exercises and summaries.', url: '#', uploadedAt: new Date('2026-02-01'), fileSize: '8 MB' },
    { id: 'r4', title: 'KCSE History Past Papers 2023', type: 'past-paper', subject: 'History', description: 'Past examination papers with marking schemes.', url: '#', uploadedAt: new Date('2026-03-05'), fileSize: '3 MB' },
    { id: 'r5', title: 'Chemical Bonding Animation', type: 'video', subject: 'Chemistry', description: '3D animated tutorial on ionic and covalent bonds.', url: '#', uploadedAt: new Date('2026-02-20'), fileSize: '62 MB' },
    { id: 'r6', title: 'English Grammar Coursebook', type: 'coursebook', subject: 'English', description: 'Comprehensive grammar guide with practice exercises.', url: '#', uploadedAt: new Date('2026-01-25'), fileSize: '5 MB' },
    { id: 'r7', title: 'Geography Past Papers 2022', type: 'past-paper', subject: 'Geography', description: 'Past papers with confidential marking schemes.', url: '#', uploadedAt: new Date('2026-03-10'), fileSize: '4 MB' },
    { id: 'r8', title: 'Photosynthesis Explained', type: 'video', subject: 'Biology', description: 'Detailed video explanation of the photosynthesis process.', url: '#', uploadedAt: new Date('2026-02-15'), fileSize: '55 MB' },
    { id: 'r9', title: 'Physics Textbook Vol 1', type: 'textbook', subject: 'Physics', description: 'Complete textbook covering mechanics and thermodynamics.', url: '#', uploadedAt: new Date('2026-01-20'), fileSize: '15 MB' },
    { id: 'r10', title: 'Kiswahili Past Papers 2021-2023', type: 'past-paper', subject: 'Kiswahili', description: 'Compilation of recent past papers with answers.', url: '#', uploadedAt: new Date('2026-03-15'), fileSize: '6 MB' },
  ]);

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
