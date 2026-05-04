/**
 * Students Overview Component
 * Main landing page for the Students module
 */

import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StudentsService } from '../../services/students.service';
import { StudentProfile } from '../../../../shared/models/students.models';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-students-overview',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatTabsModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatChipsModule,
    MatTooltipModule,
    StatusBadgeComponent,
  ],
  template: `
    <div class="overview-container">

      <!-- Breadcrumb -->
      <nav class="breadcrumb">
        <span>Home</span>
        <mat-icon>chevron_right</mat-icon>
        <a [routerLink]="['/portalAdmin/students']">Students</a>
        <mat-icon>chevron_right</mat-icon>
        <span class="current">All Students</span>
      </nav>

      <!-- Hero Banner -->
      <div class="hero-card">
        <div class="hero-text">
          <h1>Students Overview</h1>
          <p>Manage and monitor all students in your institution.</p>
        </div>
        <div class="hero-image-wrapper">
          <img
            class="hero-image"
            [src]="heroImageSrc"
            alt="Students illustration"
            (error)="onHeroImageError()"
          />
        </div>
        <button mat-raised-button color="primary" class="add-btn" [routerLink]="['/portalAdmin/students/admissions']">
          <mat-icon>person_add</mat-icon>
          Add New Student
        </button>
      </div>

      <!-- Stat Cards -->
      <div class="stat-cards">
        <div class="stat-card">
          <div class="stat-icon blue"><mat-icon>groups</mat-icon></div>
          <div class="stat-body">
            <span class="stat-label">Total Students</span>
            <span class="stat-value">{{ totalCount() }}</span>
            <span class="stat-delta positive">↑ from last term</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon indigo"><mat-icon>man</mat-icon></div>
          <div class="stat-body">
            <span class="stat-label">Male Students</span>
            <span class="stat-value">{{ maleCount() }}</span>
            <span class="stat-delta neutral">{{ malePercent() }}% of total</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon pink"><mat-icon>woman</mat-icon></div>
          <div class="stat-body">
            <span class="stat-label">Female Students</span>
            <span class="stat-value">{{ femaleCount() }}</span>
            <span class="stat-delta neutral">{{ femalePercent() }}% of total</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green"><mat-icon>how_to_reg</mat-icon></div>
          <div class="stat-body">
            <span class="stat-label">Active</span>
            <span class="stat-value">{{ activeCount() }}</span>
            <span class="stat-delta positive">↑ this term</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon amber"><mat-icon>school</mat-icon></div>
          <div class="stat-body">
            <span class="stat-label">Graduated</span>
            <span class="stat-value">{{ graduatedCount() }}</span>
            <span class="stat-delta neutral">this year</span>
          </div>
        </div>
      </div>

      <!-- Table + Right Widgets -->
      <div class="content-row">

        <!-- Main Table -->
        <div class="table-section">
          <!-- Tabs -->
          <mat-tab-group (selectedIndexChange)="onTabChange($event)" animationDuration="150ms">
            <mat-tab label="All Students"></mat-tab>
            <mat-tab label="Active"></mat-tab>
            <mat-tab label="Inactive"></mat-tab>
            <mat-tab label="Graduated"></mat-tab>
            <mat-tab label="Transferred"></mat-tab>
          </mat-tab-group>

          <!-- Filters -->
          <div class="filter-bar">
            <mat-form-field appearance="outline" class="search-field">
              <mat-icon matPrefix>search</mat-icon>
              <input matInput placeholder="Search students..." [(ngModel)]="searchQuery" (ngModelChange)="onSearch()" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="filter-select">
              <mat-label>Class</mat-label>
              <mat-select [(ngModel)]="filterClass" (ngModelChange)="applyFilters()">
                <mat-option value="">All Classes</mat-option>
                <mat-option value="grade-8">Grade 8</mat-option>
                <mat-option value="grade-7">Grade 7</mat-option>
                <mat-option value="grade-6">Grade 6</mat-option>
                <mat-option value="grade-5">Grade 5</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="filter-select">
              <mat-label>Status</mat-label>
              <mat-select [(ngModel)]="filterStatus" (ngModelChange)="applyFilters()">
                <mat-option value="">All Status</mat-option>
                <mat-option value="ACTIVE">Active</mat-option>
                <mat-option value="INACTIVE">Inactive</mat-option>
                <mat-option value="GRADUATED">Graduated</mat-option>
                <mat-option value="TRANSFERRED">Transferred</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <!-- Table -->
          <div class="table-wrapper">
            @if (studentsService.isLoading()) {
              <div class="loading-overlay"><mat-spinner diameter="40"></mat-spinner></div>
            }
            <table mat-table [dataSource]="profiles()">

              <ng-container matColumnDef="school_id">
                <th mat-header-cell *matHeaderCellDef>Student ID</th>
                <td mat-cell *matCellDef="let s">{{ s.user_school_id }}</td>
              </ng-container>

              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Student Name</th>
                <td mat-cell *matCellDef="let s">
                  <div class="student-cell">
                    <div class="avatar" [class]="getAvatarClass(s.admission_record?.gender)">{{ getInitials(s.first_name + ' ' + s.last_name) }}</div>
                    <div>
                      <div class="student-name">{{ s.first_name }} {{ s.last_name }}</div>
                      <div class="student-id-sub">{{ s.user_school_id }}</div>
                    </div>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="class">
                <th mat-header-cell *matHeaderCellDef>Class</th>
                <td mat-cell *matCellDef="let s">{{ getClassName(s) }}</td>
              </ng-container>

              <ng-container matColumnDef="dob">
                <th mat-header-cell *matHeaderCellDef>Date of Birth</th>
                <td mat-cell *matCellDef="let s">{{ s.date_of_birth | date:'mediumDate' }}</td>
              </ng-container>

              <ng-container matColumnDef="gender">
                <th mat-header-cell *matHeaderCellDef>Gender</th>
                <td mat-cell *matCellDef="let s">
                  <span class="gender-badge" [class.male]="s.admission_record?.gender === 'MALE'" [class.female]="s.admission_record?.gender === 'FEMALE'">
                    {{ (s.admission_record?.gender || '—') | titlecase }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let s">
                  <app-status-badge [type]="getEnrollmentStatus(s) === 'ACTIVE' ? 'active' : 'inactive'"></app-status-badge>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let s">
                  <button mat-icon-button matTooltip="View">
                    <mat-icon>visibility</mat-icon>
                  </button>
                  <button mat-icon-button matTooltip="Edit">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button [matMenuTriggerFor]="rowMenu">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #rowMenu="matMenu">
                    <button mat-menu-item><mat-icon>visibility</mat-icon> View Profile</button>
                    <button mat-menu-item><mat-icon>edit</mat-icon> Edit Details</button>
                    <button mat-menu-item><mat-icon>account_balance_wallet</mat-icon> View Fees</button>
                    <button mat-menu-item (click)="archiveStudent(s)">
                      <mat-icon>archive</mat-icon> Archive
                    </button>
                  </mat-menu>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

              <tr class="mat-row" *matNoDataRow>
                <td class="mat-cell no-data" [attr.colspan]="displayedColumns.length">
                  <div class="empty-state">
                    <mat-icon>person_search</mat-icon>
                    <span>No students found</span>
                  </div>
                </td>
              </tr>
            </table>

            <mat-paginator
              [length]="totalCount()"
              [pageSize]="pageSize"
              [pageSizeOptions]="[10, 25, 50]"
              (page)="onPageChange($event)"
              showFirstLastButtons>
            </mat-paginator>
          </div>
        </div>

        <!-- Right Widgets -->
        <div class="right-widgets">

          <!-- Quick Actions -->
          <div class="widget-card">
            <div class="widget-header">
              <h3>Quick Actions</h3>
            </div>
            <div class="quick-actions-grid">
              <button class="qa-btn" [routerLink]="['/portalAdmin/students/admissions']">
                <div class="qa-icon blue"><mat-icon>person_add</mat-icon></div>
                <span>Add New Student</span>
              </button>
              <button class="qa-btn" [routerLink]="['/portalAdmin/students/admissions']">
                <div class="qa-icon green"><mat-icon>upload</mat-icon></div>
                <span>Import Students</span>
              </button>
              <button class="qa-btn" [routerLink]="['/portalAdmin/students/categories']">
                <div class="qa-icon orange"><mat-icon>category</mat-icon></div>
                <span>Categories</span>
              </button>
              <button class="qa-btn" [routerLink]="['/portalAdmin/academics']">
                <div class="qa-icon purple"><mat-icon>assignment_ind</mat-icon></div>
                <span>Assign to Class</span>
              </button>
              <button class="qa-btn" [routerLink]="['/portalAdmin/students/promote']">
                <div class="qa-icon teal"><mat-icon>upgrade</mat-icon></div>
                <span>Promote Students</span>
              </button>
              <button class="qa-btn" [routerLink]="['/portalAdmin/finance']">
                <div class="qa-icon green"><mat-icon>description</mat-icon></div>
                <span>Generate Report</span>
              </button>
            </div>
          </div>

          <!-- Birthdays This Month -->
          <div class="widget-card">
            <div class="widget-header">
              <h3>Birthdays This Month</h3>
              <a class="view-all">View All</a>
            </div>
            <div class="birthday-list">
              @if (profiles().length === 0) {
                <p class="empty-text">No birthdays this month</p>
              }
              @for (s of birthdayStudents(); track s.id) {
                <div class="birthday-item">
                  <div class="avatar sm" [class]="getAvatarClass(s.admission_record?.gender)">{{ getInitials(s.first_name + ' ' + s.last_name) }}</div>
                  <div class="birthday-info">
                    <span class="bday-name">{{ s.first_name }} {{ s.last_name }}</span>
                    <span class="bday-class">{{ getClassName(s) }}</span>
                  </div>
                  <span class="bday-date">{{ s.date_of_birth | date:'MMM d' }}</span>
                </div>
              }
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .overview-container {
      padding: 0 0 32px;
      font-family: 'Inter', sans-serif;
    }

    /* Breadcrumb */
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8125rem;
      color: #64748b;
      margin-bottom: 20px;
      a { color: #2563eb; text-decoration: none; &:hover { text-decoration: underline; } }
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      .current { color: #1e293b; font-weight: 500; }
    }

    /* Hero */
    .hero-card {
      position: relative;
      background: linear-gradient(135deg, #f0f4ff 0%, #fafbff 55%, #f5f0ff 100%);
      border-radius: 16px;
      padding: 36px 380px 0 36px;
      margin-bottom: 24px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
      display: flex;
      align-items: flex-start;
      overflow: hidden;
      min-height: 200px;
    }
    .hero-text {
      flex: 1;
      z-index: 1;
      padding-bottom: 36px;
      h1 { font-size: 1.625rem; font-weight: 700; color: #1e293b; margin: 0 0 8px; }
      p { font-size: 0.9rem; color: #64748b; margin: 0; }
    }
    .hero-image-wrapper {
      position: absolute;
      right: 80px;
      bottom: 0;
      height: 200px;
      display: flex;
      align-items: flex-end;
      pointer-events: none;
    }
    .hero-image {
      height: 200px;
      width: auto;
      max-width: 420px;
      object-fit: contain;
      object-position: bottom;
      display: block;
    }
    .add-btn {
      position: absolute;
      top: 28px;
      right: 28px;
      z-index: 2;
      white-space: nowrap;
      border-radius: 8px !important;
      font-weight: 600;
    }

    /* Stat Cards */
    .stat-cards {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.07);
    }
    .stat-icon {
      width: 48px; height: 48px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      mat-icon { color: white; font-size: 22px; }
      &.blue { background: #2563eb; }
      &.indigo { background: #4f46e5; }
      &.pink { background: #ec4899; }
      &.green { background: #10b981; }
      &.amber { background: #f59e0b; }
    }
    .stat-body {
      display: flex; flex-direction: column;
      .stat-label { font-size: 0.75rem; color: #64748b; }
      .stat-value { font-size: 1.5rem; font-weight: 700; color: #1e293b; line-height: 1.2; }
      .stat-delta { font-size: 0.7rem; &.positive { color: #10b981; } &.neutral { color: #64748b; } }
    }

    /* Content Row */
    .content-row {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 24px;
      align-items: start;
    }

    /* Table Section */
    .table-section {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.07);
      overflow: hidden;
    }
    .filter-bar {
      display: flex;
      gap: 12px;
      padding: 16px 20px;
      align-items: center;
      border-bottom: 1px solid #f1f5f9;
      flex-wrap: wrap;
    }
    .search-field { flex: 1; min-width: 200px; }
    .filter-select { width: 140px; }
    ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }

    .table-wrapper { position: relative; }
    .loading-overlay {
      position: absolute; inset: 0; display: flex;
      align-items: center; justify-content: center;
      background: rgba(255,255,255,0.7); z-index: 10;
    }

    table { width: 100%; }
    .mat-mdc-header-cell { font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    .mat-mdc-cell { font-size: 0.875rem; color: #334155; }

    .student-cell { display: flex; align-items: center; gap: 12px; }
    .student-name { font-weight: 500; color: #1e293b; }
    .student-id-sub { font-size: 0.75rem; color: #94a3b8; }

    .avatar {
      width: 36px; height: 36px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.8rem; color: white; flex-shrink: 0;
      &.male { background: #2563eb; }
      &.female { background: #ec4899; }
      &.other { background: #8b5cf6; }
      &.sm { width: 32px; height: 32px; font-size: 0.7rem; }
    }

    .gender-badge {
      padding: 2px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 500;
      &.male { background: #dbeafe; color: #1d4ed8; }
      &.female { background: #fce7f3; color: #be185d; }
    }

    .no-data { text-align: center; padding: 40px 0; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; color: #94a3b8;
      mat-icon { font-size: 40px; width: 40px; height: 40px; }
    }

    /* Right Widgets */
    .right-widgets { display: flex; flex-direction: column; gap: 16px; }

    .widget-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.07);
    }
    .widget-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 16px;
      h3 { font-size: 0.9375rem; font-weight: 600; color: #1e293b; margin: 0; }
      .view-all { font-size: 0.75rem; color: #2563eb; cursor: pointer; text-decoration: none; }
    }

    /* Quick Actions */
    .quick-actions-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
    }
    .qa-btn {
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      background: none; border: none; cursor: pointer; padding: 8px 4px;
      border-radius: 8px; transition: background 0.15s;
      &:hover { background: #f8fafc; }
      span { font-size: 0.7rem; color: #475569; text-align: center; line-height: 1.2; }
    }
    .qa-icon {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 20px; color: white; }
      &.blue { background: #2563eb; }
      &.green { background: #10b981; }
      &.orange { background: #f59e0b; }
      &.purple { background: #8b5cf6; }
      &.teal { background: #0891b2; }
    }

    /* Birthdays */
    .birthday-list { display: flex; flex-direction: column; gap: 12px; }
    .birthday-item {
      display: flex; align-items: center; gap: 10px;
      .birthday-info { flex: 1; display: flex; flex-direction: column; }
      .bday-name { font-size: 0.8125rem; font-weight: 500; color: #1e293b; }
      .bday-class { font-size: 0.7rem; color: #94a3b8; }
      .bday-date { font-size: 0.75rem; color: #64748b; white-space: nowrap; }
    }
    .empty-text { font-size: 0.8125rem; color: #94a3b8; text-align: center; padding: 8px 0; }

    @media (max-width: 1200px) {
      .stat-cards { grid-template-columns: repeat(3, 1fr); }
      .content-row { grid-template-columns: 1fr; }
    }
  `],
})
export class StudentsOverviewComponent implements OnInit {
  readonly studentsService = inject(StudentsService);
  private router = inject(Router);

  readonly profiles = signal<StudentProfile[]>([]);
  readonly totalCount = signal<number>(0);

  currentPage = 0;
  pageSize = 25;
  activeTab = 0;
  searchQuery = '';
  filterClass = '';
  filterStatus = '';
  heroImageSrc = 'images/students-hero.png';

  readonly displayedColumns = ['school_id', 'name', 'class', 'dob', 'gender', 'status', 'actions'];

  readonly maleCount = computed(() => this.profiles().filter(s => s.admission_record?.gender === 'MALE').length);
  readonly femaleCount = computed(() => this.profiles().filter(s => s.admission_record?.gender === 'FEMALE').length);
  readonly activeCount = computed(() => this.profiles().filter(s => this.getEnrollmentStatus(s) === 'ACTIVE').length);
  readonly graduatedCount = computed(() => this.profiles().filter(s => this.getEnrollmentStatus(s) === 'GRADUATED').length);
  readonly malePercent = computed(() => {
    const total = this.totalCount();
    return total > 0 ? Math.round((this.maleCount() / total) * 100) : 0;
  });
  readonly femalePercent = computed(() => {
    const total = this.totalCount();
    return total > 0 ? Math.round((this.femaleCount() / total) * 100) : 0;
  });

  readonly birthdayStudents = computed(() => {
    const thisMonth = new Date().getMonth();
    return this.profiles().filter(s => {
      if (!s.date_of_birth) return false;
      return new Date(s.date_of_birth).getMonth() === thisMonth;
    }).slice(0, 5);
  });

  ngOnInit(): void {
    this.loadProfiles();
  }

  loadProfiles(): void {
    const tabStatuses: Record<number, string> = { 1: 'ACTIVE', 2: 'INACTIVE', 3: 'GRADUATED', 4: 'TRANSFERRED' };
    const statusFilter = this.filterStatus || tabStatuses[this.activeTab] || '';

    this.studentsService.getProfiles(this.currentPage + 1, this.pageSize, {
      status: statusFilter || undefined,
      search: this.searchQuery || undefined,
    }).subscribe((res) => {
      this.profiles.set(res.results);
      this.totalCount.set(res.count);
      this.studentsService.isLoading.set(false);
    });
  }

  onTabChange(index: number): void {
    this.activeTab = index;
    this.currentPage = 0;
    this.filterStatus = '';
    this.loadProfiles();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadProfiles();
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadProfiles();
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.loadProfiles();
  }

  archiveStudent(student: StudentProfile): void {
    if (student.admission_record?.id) {
      this.studentsService.updateAdmissionStatus(student.admission_record.id, 'INACTIVE').subscribe(() => this.loadProfiles());
    }
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getAvatarClass(gender: string | undefined | null): string {
    if (gender === 'MALE') return 'avatar male';
    if (gender === 'FEMALE') return 'avatar female';
    return 'avatar other';
  }

  getClassName(s: StudentProfile): string {
    if (s.enrollments?.length) return s.enrollments[0].classroom_name;
    return '—';
  }

  getEnrollmentStatus(s: StudentProfile): string {
    if (s.enrollments?.length) return s.enrollments[0].status;
    return 'INACTIVE';
  }

  onHeroImageError(): void {
    this.heroImageSrc = '';
  }
}
