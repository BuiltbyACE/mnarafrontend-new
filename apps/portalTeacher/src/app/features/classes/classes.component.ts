import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';

interface ClassSubject {
  id: string;
  subjectName: string;
  subjectCode: string;
  classroom: string;
  studentCount: number;
  teacherRole: string;
  nextLesson: string;
  form: string;
}

interface ClassDetail {
  students: { name: string; id: string; gender: string }[];
  assignments: { title: string; dueDate: string; submissions: number; total: number }[];
  resources: { title: string; type: string; size: string }[];
  grades: { name: string; average: number; grade: string }[];
  attendance: { date: string; present: number; total: number }[];
  announcements: { title: string; date: string; author: string }[];
}

@Component({
  selector: 'app-teacher-classes',
  standalone: true,
  imports: [NgClass, RouterLink, MatCardModule, MatIconModule, MatButtonModule, MatChipsModule, MatTabsModule],
  template: `
    <div class="classes-page">
      <header class="page-header">
        <h1>My Classes</h1>
        <span class="academic-year">Academic Year 2025-2026</span>
      </header>

      <div class="class-grid">
        @for (cls of classes(); track cls.id) {
          <mat-card
            class="class-card"
            [class.selected]="selectedClassId() === cls.id"
            (click)="selectClass(cls.id)"
          >
            <mat-card-header>
              <mat-card-title>{{ cls.subjectName }}</mat-card-title>
              <mat-card-subtitle>{{ cls.subjectCode }} · {{ cls.form }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="class-info">
                <div class="info-row">
                  <mat-icon>meeting_room</mat-icon>
                  <span>{{ cls.classroom }}</span>
                </div>
                <div class="info-row">
                  <mat-icon>people</mat-icon>
                  <span>{{ cls.studentCount }} Students</span>
                </div>
                <div class="info-row">
                  <mat-icon>badge</mat-icon>
                  <span class="role-badge">{{ cls.teacherRole }}</span>
                </div>
                <div class="info-row">
                  <mat-icon>schedule</mat-icon>
                  <span>Next: {{ cls.nextLesson }}</span>
                </div>
              </div>
            </mat-card-content>
            <mat-card-actions>
              <button mat-raised-button color="primary" (click)="$event.stopPropagation(); takeAttendance(cls.id)">
                <mat-icon>fact_check</mat-icon>
                Attendance
              </button>
              <button mat-stroked-button (click)="$event.stopPropagation(); viewStudents(cls.id)">
                <mat-icon>visibility</mat-icon>
                Students
              </button>
              <button mat-stroked-button (click)="$event.stopPropagation(); createAssignment(cls.id)">
                <mat-icon>assignment_add</mat-icon>
                Assignment
              </button>
            </mat-card-actions>
          </mat-card>
        }
      </div>

      @if (selectedClassId()) {
        <div class="class-detail">
          <div class="detail-header">
            <h2>{{ selectedClass()?.subjectName }} — {{ selectedClass()?.form }}</h2>
            <button mat-icon-button (click)="selectedClassId.set(null)" class="close-detail">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <mat-tab-group>
            <mat-tab label="Students">
              <div class="tab-content">
                <table class="detail-table">
                  <thead>
                    <tr><th>Name</th><th>ID</th><th>Gender</th></tr>
                  </thead>
                  <tbody>
                    @for (s of detailData().students; track s.id) {
                      <tr><td>{{ s.name }}</td><td>{{ s.id }}</td><td>{{ s.gender }}</td></tr>
                    }
                  </tbody>
                </table>
              </div>
            </mat-tab>
            <mat-tab label="Assignments">
              <div class="tab-content">
                @for (a of detailData().assignments; track a.title) {
                  <div class="list-item">
                    <div class="list-item-main">
                      <strong>{{ a.title }}</strong>
                      <span class="subdue">Due: {{ a.dueDate }}</span>
                    </div>
                    <mat-chip>{{ a.submissions }}/{{ a.total }} submitted</mat-chip>
                  </div>
                }
              </div>
            </mat-tab>
            <mat-tab label="Resources">
              <div class="tab-content">
                @for (r of detailData().resources; track r.title) {
                  <div class="list-item">
                    <mat-icon>description</mat-icon>
                    <div class="list-item-main">
                      <strong>{{ r.title }}</strong>
                      <span class="subdue">{{ r.type }} · {{ r.size }}</span>
                    </div>
                    <button mat-icon-button><mat-icon>download</mat-icon></button>
                  </div>
                }
              </div>
            </mat-tab>
            <mat-tab label="Grades">
              <div class="tab-content">
                <table class="detail-table">
                  <thead>
                    <tr><th>Student</th><th>Average</th><th>Grade</th></tr>
                  </thead>
                  <tbody>
                    @for (g of detailData().grades; track g.name) {
                      <tr><td>{{ g.name }}</td><td>{{ g.average }}%</td><td><span class="grade-badge">{{ g.grade }}</span></td></tr>
                    }
                  </tbody>
                </table>
              </div>
            </mat-tab>
            <mat-tab label="Attendance">
              <div class="tab-content">
                <table class="detail-table">
                  <thead>
                    <tr><th>Date</th><th>Present</th><th>Total</th><th>Rate</th></tr>
                  </thead>
                  <tbody>
                    @for (a of detailData().attendance; track a.date) {
                      <tr>
                        <td>{{ a.date }}</td>
                        <td>{{ a.present }}</td>
                        <td>{{ a.total }}</td>
                        <td>{{ (a.present / a.total * 100).toFixed(0) }}%</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </mat-tab>
            <mat-tab label="Announcements">
              <div class="tab-content">
                @for (a of detailData().announcements; track a.title) {
                  <div class="list-item announcement-item">
                    <mat-icon>campaign</mat-icon>
                    <div class="list-item-main">
                      <strong>{{ a.title }}</strong>
                      <span class="subdue">{{ a.date }} by {{ a.author }}</span>
                    </div>
                  </div>
                }
              </div>
            </mat-tab>
          </mat-tab-group>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      --mnara-primary: #2563eb;
      --mnara-primary-light: #dbeafe;
      --mnara-primary-dark: #1e40af;
      --mnara-bg: #f1f5f9;
      --mnara-surface: #ffffff;
      --mnara-text: #1e293b;
      --mnara-text-secondary: #64748b;
      --mnara-border: #e2e8f0;
      display: block;
      min-height: 100vh;
      background: var(--mnara-bg);
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    }
    .classes-page {
      padding: 32px;
      max-width: 1280px;
      margin: 0 auto;
    }
    .page-header {
      display: flex;
      align-items: baseline;
      gap: 16px;
      margin-bottom: 32px;
    }
    .page-header h1 {
      font-size: 28px;
      font-weight: 600;
      color: var(--mnara-text);
      margin: 0;
    }
    .academic-year {
      font-size: 14px;
      color: var(--mnara-text-secondary);
    }
    .class-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 24px;
    }
    .class-card {
      cursor: pointer;
      border-radius: 12px;
      border: 1px solid var(--mnara-border);
      transition: box-shadow 0.2s, border-color 0.2s;
      background: var(--mnara-surface);
    }
    .class-card:hover {
      box-shadow: 0 4px 16px rgba(37, 99, 235, 0.10);
      border-color: var(--mnara-primary);
    }
    .class-card.selected {
      border-color: var(--mnara-primary);
      box-shadow: 0 0 0 2px var(--mnara-primary-light);
    }
    .class-card mat-card-header {
      padding-bottom: 8px;
    }
    .class-card mat-card-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--mnara-text);
    }
    .class-card mat-card-subtitle {
      font-size: 13px;
      color: var(--mnara-primary);
      font-weight: 500;
    }
    .class-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin: 12px 0 4px;
    }
    .info-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: var(--mnara-text-secondary);
    }
    .info-row mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--mnara-primary);
    }
    .role-badge {
      background: var(--mnara-primary-light);
      color: var(--mnara-primary-dark);
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    mat-card-actions {
      display: flex;
      gap: 8px;
      padding: 12px 16px 16px;
      flex-wrap: wrap;
    }
    mat-card-actions button {
      font-size: 13px;
    }
    .class-detail {
      margin-top: 40px;
      background: var(--mnara-surface);
      border-radius: 12px;
      border: 1px solid var(--mnara-border);
      overflow: hidden;
    }
    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px 0;
    }
    .detail-header h2 {
      font-size: 20px;
      font-weight: 600;
      color: var(--mnara-text);
      margin: 0;
    }
    .close-detail {
      color: var(--mnara-text-secondary);
    }
    .tab-content {
      padding: 24px;
    }
    .detail-table {
      width: 100%;
      border-collapse: collapse;
    }
    .detail-table thead th {
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--mnara-text-secondary);
      padding: 8px 12px;
      border-bottom: 2px solid var(--mnara-border);
    }
    .detail-table tbody td {
      padding: 10px 12px;
      font-size: 14px;
      color: var(--mnara-text);
      border-bottom: 1px solid var(--mnara-border);
    }
    .grade-badge {
      background: var(--mnara-primary-light);
      color: var(--mnara-primary-dark);
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    .list-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid var(--mnara-border);
    }
    .list-item:last-child {
      border-bottom: none;
    }
    .list-item mat-icon {
      color: var(--mnara-primary);
    }
    .list-item-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      font-size: 14px;
      color: var(--mnara-text);
    }
    .subdue {
      font-size: 12px;
      color: var(--mnara-text-secondary);
      margin-top: 2px;
    }
    .announcement-item mat-icon {
      color: #d97706;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClassesComponent {
  readonly selectedClassId = signal<string | null>(null);

  readonly classes = signal<ClassSubject[]>([
    { id: 'MATH2A', subjectName: 'Mathematics', subjectCode: 'MATH 201', classroom: 'Room 12', studentCount: 28, teacherRole: 'Class Teacher', nextLesson: 'Mon 7:30 AM', form: 'Form 2A' },
    { id: 'PHY3B', subjectName: 'Physics', subjectCode: 'PHY 301', classroom: 'Lab 3', studentCount: 24, teacherRole: 'Subject Teacher', nextLesson: 'Mon 8:30 AM', form: 'Form 3B' },
    { id: 'CHEM4A', subjectName: 'Chemistry', subjectCode: 'CHEM 401', classroom: 'Lab 1', studentCount: 22, teacherRole: 'Subject Teacher', nextLesson: 'Tue 9:30 AM', form: 'Form 4A' },
    { id: 'BIO1C', subjectName: 'Biology', subjectCode: 'BIO 101', classroom: 'Lab 2', studentCount: 26, teacherRole: 'Subject Teacher', nextLesson: 'Wed 10:30 AM', form: 'Form 1C' },
    { id: 'ENG2B', subjectName: 'English Literature', subjectCode: 'ENG 202', classroom: 'Room 8', studentCount: 30, teacherRole: 'Class Teacher', nextLesson: 'Thu 11:30 AM', form: 'Form 2B' },
    { id: 'HIS3A', subjectName: 'History', subjectCode: 'HIS 302', classroom: 'Room 5', studentCount: 20, teacherRole: 'Subject Teacher', nextLesson: 'Fri 12:30 PM', form: 'Form 3A' },
  ]);

  readonly selectedClass = signal<ClassSubject | undefined>(undefined);

  readonly detailData = signal<ClassDetail>({
    students: [
      { name: 'Amara Okafor', id: 'STU-001', gender: 'Female' },
      { name: 'Brian Mwangi', id: 'STU-002', gender: 'Male' },
      { name: 'Catherine Wanjiku', id: 'STU-003', gender: 'Female' },
      { name: 'David Kimani', id: 'STU-004', gender: 'Male' },
      { name: 'Esther Akinyi', id: 'STU-005', gender: 'Female' },
      { name: 'Francis Njoroge', id: 'STU-006', gender: 'Male' },
    ],
    assignments: [
      { title: 'Algebra Quiz 3', dueDate: '2025-06-20', submissions: 22, total: 28 },
      { title: 'Geometry Project', dueDate: '2025-06-27', submissions: 15, total: 28 },
    ],
    resources: [
      { title: 'Chapter 5 Notes.pdf', type: 'PDF', size: '2.4 MB' },
      { title: 'Practice Problems Set 3', type: 'Document', size: '1.1 MB' },
    ],
    grades: [
      { name: 'Amara Okafor', average: 88, grade: 'A' },
      { name: 'Brian Mwangi', average: 72, grade: 'B' },
      { name: 'Catherine Wanjiku', average: 94, grade: 'A' },
    ],
    attendance: [
      { date: '2025-06-09', present: 26, total: 28 },
      { date: '2025-06-10', present: 25, total: 28 },
      { date: '2025-06-11', present: 28, total: 28 },
    ],
    announcements: [
      { title: 'Mid-Term Exam Schedule Released', date: '2025-06-12', author: 'Academic Office' },
      { title: 'Parent-Teacher Conference Next Week', date: '2025-06-10', author: 'Principal' },
    ],
  });

  selectClass(id: string | null): void {
    this.selectedClassId.set(id);
    const found = this.classes().find(c => c.id === id);
    this.selectedClass.set(found);
  }

  takeAttendance(id: string): void {
    console.log(`Take attendance for class ${id}`);
  }

  viewStudents(id: string): void {
    console.log(`View students for class ${id}`);
  }

  createAssignment(id: string): void {
    console.log(`Create assignment for class ${id}`);
  }
}
