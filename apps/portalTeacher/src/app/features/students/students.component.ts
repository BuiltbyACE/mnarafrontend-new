import { Component, signal } from '@angular/core';
import { NgClass, NgStyle } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';

interface Student {
  id: string;
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
  readonly displayedColumns = ['expand', 'name', 'studentId', 'class', 'attendance', 'performance', 'parentContact', 'actions'];

  readonly allStudents = signal<Student[]>([
    { id: '1', name: 'Amara Okafor', studentId: 'MNS-2401', class: 'Form 2A', attendance: 92, performance: 85, parentContact: '+254 712 345 001', gender: 'Female', stream: 'Science', dob: '2008-03-14', address: '14 Kimathi Street, Nairobi', subjects: ['Math', 'English', 'Science', 'History'] },
    { id: '2', name: 'Brian Kamau', studentId: 'MNS-2402', class: 'Form 2A', attendance: 78, performance: 62, parentContact: '+254 723 456 002', gender: 'Male', stream: 'Science', dob: '2008-07-21', address: '55 Moi Avenue, Nairobi', subjects: ['Math', 'English', 'Science', 'Geography'] },
    { id: '3', name: 'Cynthia Wanjiku', studentId: 'MNS-2403', class: 'Form 2A', attendance: 95, performance: 91, parentContact: '+254 734 567 003', gender: 'Female', stream: 'Humanities', dob: '2008-01-09', address: '28 Kenyatta Road, Kiambu', subjects: ['English', 'History', 'Geography', 'CRE'] },
    { id: '4', name: 'David Mwangi', studentId: 'MNS-2404', class: 'Form 2A', attendance: 55, performance: 41, parentContact: '+254 745 678 004', gender: 'Male', stream: 'Science', dob: '2008-11-30', address: '7 Industrial Area, Nairobi', subjects: ['Math', 'English', 'Science'] },
    { id: '5', name: 'Esther Akinyi', studentId: 'MNS-2405', class: 'Form 2A', attendance: 88, performance: 76, parentContact: '+254 756 789 005', gender: 'Female', stream: 'Humanities', dob: '2008-05-17', address: '42 Ngong Road, Nairobi', subjects: ['English', 'History', 'Geography', 'Business'] },
    { id: '6', name: 'Felix Odhiambo', studentId: 'MNS-2406', class: 'Form 2A', attendance: 73, performance: 58, parentContact: '+254 767 890 006', gender: 'Male', stream: 'Science', dob: '2008-09-03', address: '19 Jogoo Road, Nairobi', subjects: ['Math', 'Science', 'Geography'] },
    { id: '7', name: 'Grace Nyambura', studentId: 'MNS-2407', class: 'Form 2A', attendance: 97, performance: 94, parentContact: '+254 778 901 007', gender: 'Female', stream: 'Science', dob: '2008-02-28', address: '8 Riverside Drive, Nairobi', subjects: ['Math', 'English', 'Science', 'Physics'] },
    { id: '8', name: 'Hassan Ali', studentId: 'MNS-2408', class: 'Form 2A', attendance: 81, performance: 70, parentContact: '+254 789 012 008', gender: 'Male', stream: 'Humanities', dob: '2008-06-14', address: '33 River Road, Nairobi', subjects: ['English', 'History', 'Business', 'CRE'] },
    { id: '9', name: 'Irene Chebet', studentId: 'MNS-2409', class: 'Form 3B', attendance: 68, performance: 53, parentContact: '+254 790 123 009', gender: 'Female', stream: 'Science', dob: '2007-04-19', address: '11 Langata Road, Nairobi', subjects: ['Math', 'English', 'Science', 'Chemistry'] },
    { id: '10', name: 'James Kiprop', studentId: 'MNS-2410', class: 'Form 3B', attendance: 91, performance: 88, parentContact: '+254 701 234 010', gender: 'Male', stream: 'Science', dob: '2007-08-22', address: '27 Thika Road, Nairobi', subjects: ['Math', 'Physics', 'Chemistry', 'Biology'] },
    { id: '11', name: 'Katherine Njoki', studentId: 'MNS-2411', class: 'Form 3B', attendance: 85, performance: 79, parentContact: '+254 712 345 011', gender: 'Female', stream: 'Humanities', dob: '2007-12-05', address: '16 Muthithi Road, Nairobi', subjects: ['English', 'History', 'Geography', 'Literature'] },
    { id: '12', name: 'Lawrence Otieno', studentId: 'MNS-2412', class: 'Form 3B', attendance: 45, performance: 35, parentContact: '+254 723 456 012', gender: 'Male', stream: 'Science', dob: '2007-03-11', address: '5 Kariokor, Nairobi', subjects: ['Math', 'Science'] },
    { id: '13', name: 'Mary Wambui', studentId: 'MNS-2413', class: 'Form 3B', attendance: 94, performance: 96, parentContact: '+254 734 567 013', gender: 'Female', stream: 'Science', dob: '2007-07-29', address: '21 Lavington, Nairobi', subjects: ['Math', 'Physics', 'Chemistry', 'Biology', 'English'] },
    { id: '14', name: 'Nicholas Mutua', studentId: 'MNS-2414', class: 'Form 3B', attendance: 77, performance: 65, parentContact: '+254 745 678 014', gender: 'Male', stream: 'Humanities', dob: '2007-10-15', address: '38 Eastleigh, Nairobi', subjects: ['English', 'History', 'Geography', 'Business'] },
    { id: '15', name: 'Olivia Achieng', studentId: 'MNS-2415', class: 'Form 3B', attendance: 89, performance: 82, parentContact: '+254 756 789 015', gender: 'Female', stream: 'Science', dob: '2007-01-08', address: '9 Westlands, Nairobi', subjects: ['Math', 'English', 'Science', 'Chemistry'] },
    { id: '16', name: 'Patrick Kimani', studentId: 'MNS-2416', class: 'Form 3B', attendance: 82, performance: 74, parentContact: '+254 767 890 016', gender: 'Male', stream: 'Humanities', dob: '2007-05-26', address: '12 Buruburu, Nairobi', subjects: ['Math', 'English', 'History', 'Geography'] }
  ]);

  readonly searchQuery = signal('');
  readonly activeFilter = signal('all');
  readonly expandedStudentId = signal<string | null>(null);

  readonly filterChips = signal<FilterChip[]>([
    { label: 'All Students', value: 'all', active: true },
    { label: 'By Class', value: 'class', active: false },
    { label: 'By Performance', value: 'performance', active: false }
  ]);

  readonly filteredStudents = () => {
    const query = this.searchQuery().toLowerCase();
    const filter = this.activeFilter();
    return this.allStudents().filter(s => {
      const matchesSearch = !query || s.name.toLowerCase().includes(query) || s.studentId.toLowerCase().includes(query) || s.class.toLowerCase().includes(query);
      if (!matchesSearch) return false;
      if (filter === 'class') return s.class === 'Form 2A' || s.class === 'Form 3B';
      if (filter === 'performance') return s.performance >= 70;
      return true;
    });
  };

  onSearch(value: string) {
    this.searchQuery.set(value ?? '');
  }

  setFilter(value: string) {
    this.activeFilter.set(value);
    this.filterChips.update(chips => chips.map(c => ({ ...c, active: c.value === value })));
  }

  toggleExpand(id: string) {
    this.expandedStudentId.update(current => current === id ? null : id);
  }
}
