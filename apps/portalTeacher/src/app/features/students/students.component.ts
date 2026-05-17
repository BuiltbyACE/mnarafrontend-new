import { Component, signal, computed, inject } from '@angular/core';
import { NgClass, NgStyle } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TeacherStudentService } from '../../core/services/teacher-student.service';

interface Student {
  id: number;
  name: string;
  studentId: string;
  class: string;
  attendance: number;
  performance: number;
  parentContact: string;
  gender: string;
  stream: string;
  dob: string;
  address: string;
  subjects: string[];
}

interface FilterChip {
  label: string;
  value: string;
  active: boolean;
}

@Component({
  selector: 'app-teacher-students',
  standalone: true,
  imports: [
    NgClass, NgStyle,
    MatCardModule, MatIconModule, MatButtonModule, MatChipsModule,
    MatTableModule, MatFormFieldModule, MatInputModule, MatTooltipModule
  ],
  template: `
    <div class="students-container">
      <div class="header">
        <h1 class="page-title">Student Profiles</h1>
        <p class="page-subtitle">View and manage student information</p>
      </div>

      <div class="search-bar">
        <mat-icon class="search-icon">search</mat-icon>
        <input
          type="text"
          placeholder="Search students by name, ID, or class..."
          [value]="searchQuery()"
          (input)="onSearch($any($event.target).value)"
          class="search-input"
        />
      </div>

      <div class="filter-chips">
        @for (chip of filterChips(); track chip.value) {
          <button
            class="filter-chip"
            [class.active]="chip.active"
            (click)="setFilter(chip.value)"
          >
            {{ chip.label }}
          </button>
        }
      </div>

      <div class="table-wrapper">
        <table mat-table [dataSource]="filteredStudents()" multiTemplateDataRows class="students-table">

          <ng-container matColumnDef="expand">
            <th mat-header-cell *matHeaderCellDef aria-label="expand"></th>
            <td mat-cell *matCellDef="let student">
              <button mat-icon-button (click)="toggleExpand(student.id)">
                <mat-icon>{{ expandedStudentId() === student.id ? 'expand_less' : 'expand_more' }}</mat-icon>
              </button>
            </td>
          </ng-container>

          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef> Student Name </th>
            <td mat-cell *matCellDef="let student">
              <div class="student-name-cell">
                <div class="avatar">{{ student.name.charAt(0) }}{{ student.name.split(' ').pop()?.charAt(0) }}</div>
                <span>{{ student.name }}</span>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="studentId">
            <th mat-header-cell *matHeaderCellDef> Student ID </th>
            <td mat-cell *matCellDef="let student"> {{ student.studentId }} </td>
          </ng-container>

          <ng-container matColumnDef="class">
            <th mat-header-cell *matHeaderCellDef> Class </th>
            <td mat-cell *matCellDef="let student">
              <span class="class-badge">{{ student.class }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="attendance">
            <th mat-header-cell *matHeaderCellDef> Attendance % </th>
            <td mat-cell *matCellDef="let student">
              <div class="attendance-cell">
                <span
                  class="attendance-indicator"
                  [class.green]="student.attendance > 80"
                  [class.amber]="student.attendance >= 60 && student.attendance <= 80"
                  [class.red]="student.attendance < 60"
                ></span>
                <span>{{ student.attendance }}%</span>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="performance">
            <th mat-header-cell *matHeaderCellDef> Performance % </th>
            <td mat-cell *matCellDef="let student">
              <div class="performance-cell">
                <div class="performance-bar-track">
                  <div
                    class="performance-bar-fill"
                    [ngStyle]="{ width: student.performance + '%' }"
                  ></div>
                </div>
                <span class="performance-value">{{ student.performance }}%</span>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="parentContact">
            <th mat-header-cell *matHeaderCellDef> Parent Contact </th>
            <td mat-cell *matCellDef="let student"> {{ student.parentContact }} </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef> Actions </th>
            <td mat-cell *matCellDef="let student">
              <button
                mat-raised-button
                class="message-btn"
                [matTooltip]="'Send message to ' + student.name"
              >
                <mat-icon>message</mat-icon>
                Message
              </button>
            </td>
          </ng-container>

          <ng-container matColumnDef="expandedDetail">
            <td mat-cell *matCellDef="let student" [attr.colspan]="displayedColumns.length">
              @if (expandedStudentId() === student.id) {
                <div class="profile-card" @expand>
                  <div class="profile-header">
                    <div class="profile-avatar-large">{{ student.name.charAt(0) }}{{ student.name.split(' ').pop()?.charAt(0) }}</div>
                    <div>
                      <h3>{{ student.name }}</h3>
                      <p class="profile-id">{{ student.studentId }} | {{ student.class }}</p>
                    </div>
                  </div>
                  <div class="profile-grid">
                    <div class="profile-item">
                      <span class="profile-label">Gender</span>
                      <span class="profile-value">{{ student.gender }}</span>
                    </div>
                    <div class="profile-item">
                      <span class="profile-label">Date of Birth</span>
                      <span class="profile-value">{{ student.dob }}</span>
                    </div>
                    <div class="profile-item">
                      <span class="profile-label">Stream</span>
                      <span class="profile-value">{{ student.stream }}</span>
                    </div>
                    <div class="profile-item">
                      <span class="profile-label">Address</span>
                      <span class="profile-value">{{ student.address }}</span>
                    </div>
                    <div class="profile-item">
                      <span class="profile-label">Parent Contact</span>
                      <span class="profile-value">{{ student.parentContact }}</span>
                    </div>
                    <div class="profile-item">
                      <span class="profile-label">Subjects</span>
                      <span class="profile-value">{{ student.subjects.join(', ') }}</span>
                    </div>
                    <div class="profile-item">
                      <span class="profile-label">Attendance</span>
                      <span class="profile-value">
                        <span
                          class="attendance-indicator"
                          [class.green]="student.attendance > 80"
                          [class.amber]="student.attendance >= 60 && student.attendance <= 80"
                          [class.red]="student.attendance < 60"
                        ></span>
                        {{ student.attendance }}%
                      </span>
                    </div>
                    <div class="profile-item">
                      <span class="profile-label">Performance</span>
                      <span class="profile-value">
                        <div class="performance-bar-track inline">
                          <div
                            class="performance-bar-fill"
                            [ngStyle]="{ width: student.performance + '%' }"
                          ></div>
                        </div>
                        {{ student.performance }}%
                      </span>
                    </div>
                  </div>
                </div>
              }
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr
            mat-row
            *matRowDef="let student; columns: displayedColumns;"
            class="student-row"
            (click)="toggleExpand(student.id)"
          ></tr>
          <tr
            mat-row
            *matRowDef="let student; columns: ['expandedDetail'];"
            class="expanded-row"
          ></tr>
        </table>

        @if (filteredStudents().length === 0) {
          <div class="empty-state">
            <mat-icon>search_off</mat-icon>
            <p>No students found matching your search</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .students-container {
      padding: 24px;
      font-family: 'Segoe UI', Roboto, sans-serif;
      color: #1e293b;
    }
    .header {
      margin-bottom: 24px;
    }
    .page-title {
      font-size: 28px;
      font-weight: 700;
      color: #1e3a8a;
      margin: 0 0 4px 0;
    }
    .page-subtitle {
      font-size: 14px;
      color: #64748b;
      margin: 0;
    }
    .search-bar {
      display: flex;
      align-items: center;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 0 16px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .search-icon {
      color: #94a3b8;
      margin-right: 12px;
    }
    .search-input {
      flex: 1;
      border: none;
      outline: none;
      height: 48px;
      font-size: 15px;
      color: #1e293b;
      background: transparent;
    }
    .search-input::placeholder {
      color: #94a3b8;
    }
    .filter-chips {
      display: flex;
      gap: 8px;
      margin-bottom: 20px;
    }
    .filter-chip {
      padding: 6px 18px;
      border-radius: 20px;
      border: 1px solid #e2e8f0;
      background: #fff;
      font-size: 13px;
      font-weight: 500;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s;
    }
    .filter-chip:hover {
      border-color: #2563eb;
      color: #2563eb;
    }
    .filter-chip.active {
      background: #2563eb;
      color: #fff;
      border-color: #2563eb;
    }
    .table-wrapper {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
      overflow: hidden;
    }
    .students-table {
      width: 100%;
    }
    th.mat-header-cell {
      font-weight: 600;
      color: #475569;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: #f8fafc;
      padding: 14px 16px;
    }
    td.mat-cell {
      padding: 12px 16px;
      font-size: 14px;
    }
    .student-name-cell {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2563eb, #1e3a8a);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
    }
    .class-badge {
      background: #e0e7ff;
      color: #1e3a8a;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    .attendance-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .attendance-indicator {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
    }
    .attendance-indicator.green {
      background: #22c55e;
      box-shadow: 0 0 6px rgba(34,197,94,0.4);
    }
    .attendance-indicator.amber {
      background: #f59e0b;
      box-shadow: 0 0 6px rgba(245,158,11,0.4);
    }
    .attendance-indicator.red {
      background: #ef4444;
      box-shadow: 0 0 6px rgba(239,68,68,0.4);
    }
    .performance-cell {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 140px;
    }
    .performance-bar-track {
      flex: 1;
      height: 8px;
      background: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
      max-width: 100px;
    }
    .performance-bar-track.inline {
      display: inline-block;
      vertical-align: middle;
      width: 80px;
    }
    .performance-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #2563eb, #3b82f6);
      border-radius: 4px;
      transition: width 0.4s ease;
    }
    .performance-value {
      font-weight: 600;
      color: #1e293b;
      min-width: 36px;
    }
    .message-btn {
      background: #2563eb !important;
      color: #fff !important;
      font-size: 12px !important;
      padding: 0 14px !important;
      line-height: 32px !important;
      border-radius: 6px !important;
    }
    .message-btn mat-icon {
      font-size: 16px;
      margin-right: 4px;
    }
    .student-row {
      cursor: pointer;
      transition: background 0.15s;
    }
    .student-row:hover {
      background: #f1f5f9;
    }
    .expanded-row td {
      padding: 0;
      border-bottom: none;
    }
    .profile-card {
      padding: 24px 32px;
      background: #f8fafc;
      border-top: 2px solid #2563eb;
    }
    .profile-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
    }
    .profile-avatar-large {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2563eb, #1e3a8a);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: 700;
    }
    .profile-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
    }
    .profile-id {
      margin: 2px 0 0 0;
      font-size: 13px;
      color: #64748b;
    }
    .profile-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr;
      gap: 16px;
    }
    .profile-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .profile-label {
      font-size: 11px;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .profile-value {
      font-size: 14px;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      color: #94a3b8;
    }
    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 12px;
    }
    .empty-state p {
      font-size: 15px;
      margin: 0;
    }
  `]
})
export class StudentsComponent {
  private studentService = inject(TeacherStudentService);

  readonly displayedColumns = ['expand', 'name', 'studentId', 'class', 'attendance', 'performance', 'parentContact', 'actions'];

  readonly allStudents = computed<Student[]>(() =>
    this.studentService.profiles().map(p => ({
      id: p.id,
      name: `${p.first_name} ${p.last_name}`,
      studentId: p.user_school_id,
      class: p.class_name,
      attendance: p.attendance_percentage,
      performance: p.performance_average,
      parentContact: p.parent_contact,
      gender: p.gender ?? '',
      stream: p.stream ?? '',
      dob: p.date_of_birth ?? '',
      address: p.address ?? '',
      subjects: p.subjects ?? [],
    }))
  );

  readonly searchQuery = signal('');
  readonly activeFilter = signal('all');
  readonly expandedStudentId = signal<number | null>(null);

  readonly filterChips = signal([
    { label: 'All Students', value: 'all', active: true },
    { label: 'By Class', value: 'class', active: false },
    { label: 'By Performance', value: 'performance', active: false }
  ]);

  readonly filteredStudents = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const filter = this.activeFilter();
    return this.allStudents().filter(s => {
      const matchesSearch = !query || s.name.toLowerCase().includes(query) || s.studentId.toLowerCase().includes(query) || s.class.toLowerCase().includes(query);
      if (!matchesSearch) return false;
      if (filter === 'class') return true;
      if (filter === 'performance') return (s.performance ?? 0) >= 70;
      return true;
    });
  });

  constructor() {
    this.studentService.fetchProfiles();
  }

  onSearch(value: string) {
    this.searchQuery.set(value ?? '');
  }

  setFilter(value: string) {
    this.activeFilter.set(value);
    this.filterChips.update(chips => chips.map(c => ({ ...c, active: c.value === value })));
  }

  toggleExpand(id: number) {
    this.expandedStudentId.update(current => current === id ? null : id);
  }
}
