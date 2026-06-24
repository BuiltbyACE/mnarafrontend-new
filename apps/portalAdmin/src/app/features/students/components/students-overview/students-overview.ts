import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StudentsService } from '../../services/students.service';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { StudentProfile, CarerData, CONDITION_LABELS, MedicalConditionKey } from '../../../../shared/models/students.models';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge';
import { TransferDialogComponent } from '../transfer-dialog/transfer-dialog';

@Component({
  selector: 'app-students-overview',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule,
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
          <img class="hero-image" [src]="heroImageSrc" alt="Students illustration" (error)="onHeroImageError()" />
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
          <mat-tab-group (selectedIndexChange)="onTabChange($event)" animationDuration="150ms">
            <mat-tab label="All Students"></mat-tab>
            <mat-tab label="Active"></mat-tab>
            <mat-tab label="Inactive"></mat-tab>
            <mat-tab label="Graduated"></mat-tab>
            <mat-tab label="Transferred"></mat-tab>
          </mat-tab-group>

          <div class="filter-bar">
            <div class="search-field">
              <input placeholder="Search students..." [formControl]="searchControl" />
            </div>
            <div class="form-field filter-select">
              <label class="input-label">Class</label>
              <select [(ngModel)]="filterClass" (ngModelChange)="applyFilters()">
                <option value="">All Classes</option>
                <option value="grade-8">Grade 8</option>
                <option value="grade-7">Grade 7</option>
                <option value="grade-6">Grade 6</option>
                <option value="grade-5">Grade 5</option>
              </select>
            </div>
            <div class="form-field filter-select">
              <label class="input-label">Status</label>
              <select [(ngModel)]="filterStatus" (ngModelChange)="applyFilters()">
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="GRADUATED">Graduated</option>
                <option value="TRANSFERRED">Transferred</option>
              </select>
            </div>
          </div>

          <div class="table-wrapper">
            @if (studentsService.isLoading()) {
              <div class="loading-overlay"><mat-spinner diameter="40"></mat-spinner></div>
            }
            <!-- Scrollable body -->
            <div class="table-body-scroll">
              <table mat-table [dataSource]="profiles()">

                <ng-container matColumnDef="school_id">
                  <th mat-header-cell *matHeaderCellDef>Student ID</th>
                  <td mat-cell *matCellDef="let s">{{ s.user_school_id }}</td>
                </ng-container>

                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Student Name</th>
                  <td mat-cell *matCellDef="let s">
                    <div class="student-cell">
                      @if (s.admission_record?.photo_url) {
                        <img class="avatar-photo" [src]="s.admission_record.photo_url" [alt]="s.first_name" (error)="onRowPhotoError($event, s)" />
                      } @else {
                        <div class="avatar" [class]="getAvatarClass(s.admission_record?.gender)">{{ getInitials(s.first_name + ' ' + s.last_name) }}</div>
                      }
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

                <ng-container matColumnDef="gender">
                  <th mat-header-cell *matHeaderCellDef>Gender</th>
                  <td mat-cell *matCellDef="let s">
                    <span class="gender-badge"
                          [class.male]="(s.admission_record?.gender || s.gender) === 'MALE'"
                          [class.female]="(s.admission_record?.gender || s.gender) === 'FEMALE'">
                      {{ ((s.admission_record?.gender || s.gender) || '—') | titlecase }}
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
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let s">
                    <button class="view-action-btn" (click)="openStudentPopup(s)" matTooltip="View Details">
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"
                           stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                        <circle cx="8" cy="8" r="3"/><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/>
                      </svg>
                      View
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="table-row" (click)="openStudentPopup(row)"></tr>

                <tr class="mat-row" *matNoDataRow>
                  <td class="mat-cell no-data" [attr.colspan]="displayedColumns.length">
                    <div class="empty-state">
                      <mat-icon>person_search</mat-icon>
                      <span>No students found</span>
                    </div>
                  </td>
                </tr>
              </table>
            </div><!-- /table-body-scroll -->

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

          <div class="widget-card">
            <div class="widget-header">
              <h3>Birthdays This Month</h3>
              <a class="view-all">View All</a>
            </div>
            <div class="birthday-list">
              @if (profiles().length === 0) {
                <p class="empty-text">No students found</p>
              }
              @for (s of profiles().slice(0, 5); track s.id) {
                <div class="birthday-item" (click)="openStudentPopup(s)" style="cursor:pointer">
                  @if (s.admission_record?.photo_url) {
                    <img class="avatar-photo sm" [src]="s.admission_record!.photo_url!" [alt]="s.first_name" (error)="onRowPhotoError($event, s)" />
                  } @else {
                    <div class="avatar sm" [class]="getAvatarClass(s.admission_record?.gender)">{{ getInitials(s.first_name + ' ' + s.last_name) }}</div>
                  }
                  <div class="birthday-info">
                    <span class="bday-name">{{ s.first_name }} {{ s.last_name }}</span>
                    <span class="bday-class">{{ getClassName(s) }}</span>
                  </div>
                  <span class="bday-date">{{ s.enrollment_date | date:'MMM d' }}</span>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════════════ -->
    <!-- Student Detail Popup                                              -->
    <!-- ══════════════════════════════════════════════════════════════════ -->
    @if (selectedStudent()) {
      <div class="popup-backdrop" (click)="closeStudentPopup()">
        <div class="student-popup" (click)="$event.stopPropagation()">

          <!-- ── Header ─────────────────────────────────────────────── -->
          <div class="popup-header">
            <div class="popup-photo-wrap">
              @if (popupStudent()?.admission_record?.photo_url) {
                <img class="popup-photo"
                     [src]="popupStudent()!.admission_record!.photo_url!"
                     [alt]="popupStudent()!.first_name"
                     (error)="onPopupPhotoError($event)" />
              } @else {
                <div class="popup-avatar"
                     [class.male]="(popupStudent()?.admission_record?.gender || popupStudent()?.gender) === 'MALE'"
                     [class.female]="(popupStudent()?.admission_record?.gender || popupStudent()?.gender) === 'FEMALE'">
                  {{ getInitials((popupStudent()?.first_name || '') + ' ' + (popupStudent()?.last_name || '')) }}
                </div>
              }
            </div>

            <div class="popup-identity">
              <h2 class="popup-name">{{ popupStudent()?.first_name }} {{ popupStudent()?.last_name }}</h2>
              <span class="popup-id">{{ popupStudent()?.user_school_id }}</span>
              <div class="popup-meta">
                <span class="popup-status" [class.active]="getEnrollmentStatus(popupStudent()!) === 'ACTIVE'">
                  <span class="status-dot"></span>
                  {{ getEnrollmentStatus(popupStudent()!) | titlecase }}
                </span>
                <span class="popup-enroll">Enrolled: {{ popupStudent()?.enrollment_date | date:'MMM d, y' }}</span>
              </div>
            </div>

            <button class="popup-close" (click)="closeStudentPopup()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                   stroke-linecap="round" width="16" height="16">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <!-- ── Action Bar ──────────────────────────────────────────── -->
          <div class="popup-actions">
            <button class="pact-btn pact-btn--print" (click)="printStudentForm()">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"
                   stroke-linecap="round" stroke-linejoin="round" width="15" height="15">
                <polyline points="5 7 5 2 15 2 15 7"/>
                <path d="M5 16H3a1 1 0 01-1-1V8a1 1 0 011-1h14a1 1 0 011 1v7a1 1 0 01-1 1h-2"/>
                <rect x="5" y="12" width="10" height="6"/>
              </svg>
              Print Admission Form
            </button>
            <button class="pact-btn pact-btn--transfer" (click)="openTransferDialog()">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"
                   stroke-linecap="round" stroke-linejoin="round" width="15" height="15">
                <polyline points="14 5 17 8 14 11"/>
                <line x1="3" y1="8" x2="17" y2="8"/>
                <polyline points="6 15 3 12 6 9"/>
                <line x1="17" y1="12" x2="3" y2="12"/>
              </svg>
              Transfer Student
            </button>
            <button class="pact-btn pact-btn--fee">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"
                   stroke-linecap="round" stroke-linejoin="round" width="15" height="15">
                <path d="M14 2H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2z"/>
                <line x1="8" y1="10" x2="12" y2="10"/>
                <line x1="10" y1="8" x2="10" y2="12"/>
              </svg>
              Generate Fee Statement
            </button>
          </div>

          <!-- ── Tabs ────────────────────────────────────────────────── -->
          <div class="popup-tab-bar">
            <button class="ptab" [class.ptab--active]="activeDetailTab() === 0" (click)="activeDetailTab.set(0)">General Info</button>
            <button class="ptab" [class.ptab--active]="activeDetailTab() === 1" (click)="activeDetailTab.set(1)">Medical</button>
            <button class="ptab" [class.ptab--active]="activeDetailTab() === 2" (click)="activeDetailTab.set(2)">Family & Siblings</button>
            <button class="ptab" [class.ptab--active]="activeDetailTab() === 3" (click)="activeDetailTab.set(3)">Commitment</button>
          </div>

          <!-- ── Tab Content ─────────────────────────────────────────── -->
          <div class="popup-content">

            @if (popupLoading()) {
              <div class="popup-loading">
                <div class="loading-ring"></div>
                <span>Loading student details…</span>
              </div>
            }

            <!-- General Info -->
            @if (!popupLoading() && activeDetailTab() === 0) {
              <div class="detail-section">
                <div class="info-grid">
                  <div class="info-field">
                    <span class="if-label">Gender</span>
                    <span class="if-value"
                          [class.gender-female]="(popupStudent()?.admission_record?.gender || popupStudent()?.gender) === 'FEMALE'">
                      {{ popupStudent()?.admission_record?.gender || popupStudent()?.gender || '—' }}
                    </span>
                  </div>
                  <div class="info-field">
                    <span class="if-label">Date of Birth</span>
                    <span class="if-value">{{ popupStudent()?.date_of_birth | date:'MMM d, y' }}</span>
                  </div>
                  <div class="info-field">
                    <span class="if-label">Nationality</span>
                    <span class="if-value">{{ popupStudent()?.admission_record?.nationality || '—' }}</span>
                  </div>
                  <div class="info-field">
                    <span class="if-label">Current Class</span>
                    <span class="if-value">{{ getClassName(popupStudent()!) }}</span>
                  </div>
                  <div class="info-field">
                    <span class="if-label">Admission Date</span>
                    <span class="if-value">{{ popupStudent()?.admission_record?.date_of_admission | date:'MMM d, y' }}</span>
                  </div>
                  <div class="info-field">
                    <span class="if-label">Residence</span>
                    <span class="if-value">{{ popupStudent()?.admission_record?.residence || 'N/A' }}</span>
                  </div>
                </div>
              </div>
            }

            <!-- Medical -->
            @if (!popupLoading() && activeDetailTab() === 1) {
              <div class="detail-section">
                @if (popupStudent()?.medical_record) {
                  <div class="info-grid">
                    <div class="info-field">
                      <span class="if-label">Blood Group</span>
                      <span class="if-value blood">{{ popupStudent()!.medical_record!.blood_group || '—' }}</span>
                    </div>
                    <div class="info-field">
                      <span class="if-label">Immunization</span>
                      <span class="if-value" [class.green-text]="popupStudent()!.medical_record!.immunization_uptodate">
                        {{ popupStudent()!.medical_record!.immunization_uptodate ? 'Up to date ✓' : 'Not updated' }}
                      </span>
                    </div>
                    <div class="info-field">
                      <span class="if-label">Emergency Contact</span>
                      <span class="if-value">{{ popupStudent()!.medical_record!.emergency_contact || '—' }}</span>
                    </div>
                    <div class="info-field">
                      <span class="if-label">Doctor</span>
                      <span class="if-value">{{ popupStudent()!.medical_record!.doctor_name || '—' }}</span>
                    </div>
                    <div class="info-field">
                      <span class="if-label">Doctor Contact</span>
                      <span class="if-value">{{ popupStudent()!.medical_record!.doctor_contact || '—' }}</span>
                    </div>
                    <div class="info-field">
                      <span class="if-label">Hospital Preference</span>
                      <span class="if-value">{{ popupStudent()!.medical_record!.hospital_preference || '—' }}</span>
                    </div>
                  </div>
                  @if (getActiveConditions(popupStudent()!).length > 0) {
                    <div class="chip-section">
                      <span class="cs-label">Active Conditions</span>
                      <div class="chip-row">
                        @for (c of getActiveConditions(popupStudent()!); track c) {
                          <span class="chip chip--red">{{ c }}</span>
                        }
                      </div>
                    </div>
                  }
                  @if ((popupStudent()!.medical_record!.allergies?.length ?? 0) > 0) {
                    <div class="chip-section">
                      <span class="cs-label">Allergies</span>
                      <div class="chip-row">
                        @for (a of popupStudent()!.medical_record!.allergies; track a) {
                          <span class="chip chip--amber">{{ a }}</span>
                        }
                      </div>
                    </div>
                  }
                } @else {
                  <div class="no-data-msg">No medical record on file</div>
                }
              </div>
            }

            <!-- Family & Siblings -->
            @if (!popupLoading() && activeDetailTab() === 2) {
              <div class="detail-section">
                @if (getCarerData(popupStudent()!).length > 0) {
                  <div class="section-heading">Carers</div>
                  @for (carer of getCarerData(popupStudent()!); track carer.mobile_1) {
                    <div class="carer-card">
                      <div class="carer-badge" [class.primary]="carer.carer_level === 'PRIMARY'">
                        {{ carer.carer_level === 'PRIMARY' ? 'Primary Carer' : 'Secondary Carer' }}
                      </div>
                      <div class="carer-name">{{ carer.title }} {{ carer.first_name }} {{ carer.surname }}</div>
                      <div class="carer-meta">{{ carer.relationship }} · {{ carer.nationality }}</div>
                      <div class="carer-contacts">
                        @if (carer.mobile_1) {
                          <span class="contact-item">
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="12" height="12">
                              <path d="M13.6 10.3l-2.1-.7a1 1 0 00-1 .24l-.9.9a7.6 7.6 0 01-3.4-3.4l.9-.9a1 1 0 00.24-1L6.7 3.4A1 1 0 005.75 3H4a1 1 0 00-1 1.1C3.4 10 6 12.6 11.9 13a1 1 0 001.1-1v-1.75a1 1 0 00-.4-.95z"/>
                            </svg>
                            {{ carer.mobile_1 }}
                          </span>
                        }
                        @if (carer.email) {
                          <span class="contact-item">
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="12" height="12">
                              <rect x="2" y="4" width="12" height="9" rx="1"/>
                              <polyline points="2 4 8 9 14 4"/>
                            </svg>
                            {{ carer.email }}
                          </span>
                        }
                      </div>
                    </div>
                  }
                } @else {
                  <div class="no-data-msg">No carer information on file</div>
                }

                @if ((popupStudent()!.siblings?.length ?? 0) > 0) {
                  <div class="section-heading" style="margin-top:20px">Siblings</div>
                  @for (sib of popupStudent()!.siblings; track sib.id) {
                    <div class="sibling-row">
                      <div class="sib-avatar">{{ sib.full_name.charAt(0).toUpperCase() }}</div>
                      <div class="sib-info">
                        <span class="sib-name">{{ sib.full_name }}</span>
                        <span class="sib-class">{{ sib.class_name }}</span>
                      </div>
                    </div>
                  }
                }
              </div>
            }

            <!-- Commitment -->
            @if (!popupLoading() && activeDetailTab() === 3) {
              <div class="detail-section commitment-section">
                <div class="commitment-block">
                  <div class="cb-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                         stroke-linecap="round" stroke-linejoin="round" width="30" height="30">
                      <path d="M9 11l3 3L22 4"/>
                      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                    </svg>
                  </div>
                  <div>
                    <div class="cb-title">Behaviour Commitment</div>
                    <div class="cb-sub">View and manage the student's 16-point behaviour commitment form</div>
                  </div>
                </div>
                <button class="view-commitment-btn" (click)="viewCommitment()">
                  Open Commitment Form
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"
                       stroke-linecap="round" width="14" height="14">
                    <line x1="3" y1="8" x2="13" y2="8"/><polyline points="9 4 13 8 9 12"/>
                  </svg>
                </button>
              </div>
            }

          </div><!-- /popup-content -->
        </div><!-- /student-popup -->
      </div><!-- /popup-backdrop -->
    }
  `,
  styles: [`
    .overview-container {
      padding: 0 0 32px;
      font-family: 'Inter', sans-serif;
    }

    /* Breadcrumb */
    .breadcrumb {
      display: flex; align-items: center; gap: 4px;
      font-size: 0.8125rem; color: #64748b; margin-bottom: 20px;
      a { color: #2563eb; text-decoration: none; &:hover { text-decoration: underline; } }
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      .current { color: #1e293b; font-weight: 500; }
    }

    /* Hero */
    .hero-card {
      position: relative;
      background: linear-gradient(135deg, #f0f4ff 0%, #fafbff 55%, #f5f0ff 100%);
      border-radius: 16px; padding: 36px 380px 0 36px;
      margin-bottom: 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.08);
      display: flex; align-items: flex-start; overflow: hidden; min-height: 200px;
    }
    .hero-text {
      flex: 1; z-index: 1; padding-bottom: 36px;
      h1 { font-size: 1.625rem; font-weight: 700; color: #1e293b; margin: 0 0 8px; }
      p  { font-size: 0.9rem; color: #64748b; margin: 0; }
    }
    .hero-image-wrapper {
      position: absolute; right: 80px; bottom: 0; height: 200px;
      display: flex; align-items: flex-end; pointer-events: none;
    }
    .hero-image {
      height: 200px; width: auto; max-width: 420px;
      object-fit: contain; object-position: bottom; display: block;
    }
    .add-btn {
      position: absolute; top: 28px; right: 28px; z-index: 2;
      white-space: nowrap; border-radius: 8px !important; font-weight: 600;
    }

    /* Stat Cards */
    .stat-cards {
      display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; margin-bottom: 24px;
    }
    .stat-card {
      background: white; border-radius: 12px; padding: 20px;
      display: flex; align-items: center; gap: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.07);
    }
    .stat-icon {
      width: 48px; height: 48px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      mat-icon { color: white; font-size: 22px; }
      &.blue   { background: #2563eb; }
      &.indigo { background: #4f46e5; }
      &.pink   { background: #ec4899; }
      &.green  { background: #10b981; }
      &.amber  { background: #f59e0b; }
    }
    .stat-body {
      display: flex; flex-direction: column;
      .stat-label { font-size: 0.75rem; color: #64748b; }
      .stat-value { font-size: 1.5rem; font-weight: 700; color: #1e293b; line-height: 1.2; }
      .stat-delta { font-size: 0.7rem; &.positive { color: #10b981; } &.neutral { color: #64748b; } }
    }

    /* Content Row */
    .content-row {
      display: grid; grid-template-columns: 1fr 300px; gap: 24px; align-items: start;
    }

    /* Table Section */
    .table-section {
      background: white; border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.07); overflow: hidden;
      display: flex; flex-direction: column;
    }
    .filter-bar {
      display: flex; gap: 12px; padding: 16px 20px;
      align-items: center; border-bottom: 1px solid #f1f5f9; flex-wrap: wrap;
    }
    .search-field { flex: 1; min-width: 200px; }
    .search-field input {
      width: 100%; max-width: 400px; padding: 10px 14px;
      border: 1px solid #d1d5db; border-radius: 8px;
      font-size: 14px; color: #1f2937; background: #fff;
      transition: border-color 0.15s; box-sizing: border-box;
      &:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.2); }
    }
    .form-field { display: flex; flex-direction: column; gap: 4px; }
    .form-field select {
      width: 100%; padding: 10px 14px;
      border: 1px solid #d1d5db; border-radius: 8px;
      font-size: 14px; color: #1f2937; background: #fff;
      font-family: inherit; cursor: pointer;
      &:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.2); }
    }
    .input-label { font-size: 0.75rem; font-weight: 600; color: #374151; }
    .filter-select { width: 140px; }

    .table-wrapper { position: relative; display: flex; flex-direction: column; }
    .loading-overlay {
      position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.7); z-index: 10;
    }

    /* ── Scrollable table body ─────────────────────────────────────────── */
    .table-body-scroll {
      overflow-y: auto;
      max-height: calc(100vh - 500px);
      min-height: 280px;
      scrollbar-width: thin;
      scrollbar-color: #e2e8f0 transparent;
      &::-webkit-scrollbar       { width: 5px; }
      &::-webkit-scrollbar-track { background: transparent; }
      &::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px;
        &:hover { background: #cbd5e1; }
      }
    }

    table { width: 100%; }

    /* Sticky header stays visible while body scrolls */
    .mat-mdc-header-row th {
      position: sticky; top: 0; z-index: 2;
      background: #fff;
      border-bottom: 1px solid #e2e8f0;
    }
    .mat-mdc-header-cell {
      font-size: 0.75rem; font-weight: 600; color: #64748b;
      text-transform: uppercase; letter-spacing: 0.05em;
    }
    .mat-mdc-cell { font-size: 0.875rem; color: #334155; }

    .table-row {
      cursor: pointer;
      transition: background 0.12s;
      &:hover { background: #f8fafc; }
    }

    .student-cell { display: flex; align-items: center; gap: 12px; }
    .student-name { font-weight: 500; color: #1e293b; }
    .student-id-sub { font-size: 0.75rem; color: #94a3b8; }

    .avatar {
      width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.8rem; color: white;
      &.male   { background: #2563eb; }
      &.female { background: #ec4899; }
      &.other  { background: #8b5cf6; }
      &.sm     { width: 32px; height: 32px; font-size: 0.7rem; }
    }

    .avatar-photo {
      width: 36px; height: 36px; border-radius: 50%; object-fit: cover;
      flex-shrink: 0; border: 2px solid #e2e8f0;
      &.sm { width: 32px; height: 32px; }
    }

    .gender-badge {
      padding: 2px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 500;
      &.male   { background: #dbeafe; color: #1d4ed8; }
      &.female { background: #fce7f3; color: #be185d; }
    }

    /* Row View Action Button */
    .view-action-btn {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 6px 12px; border-radius: 7px;
      border: 1px solid #e2e8f0; background: #f8fafc;
      font-size: 12.5px; font-weight: 600; color: #374151;
      font-family: inherit; cursor: pointer;
      transition: all 0.15s;
      &:hover { background: #eff6ff; border-color: #bfdbfe; color: #2563eb; }
    }

    .no-data { text-align: center; padding: 40px 0; }
    .empty-state {
      display: flex; flex-direction: column; align-items: center; gap: 8px; color: #94a3b8;
      mat-icon { font-size: 40px; width: 40px; height: 40px; }
    }

    /* Right Widgets */
    .right-widgets { display: flex; flex-direction: column; gap: 16px; }
    .widget-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.07); }
    .widget-header {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;
      h3 { font-size: 0.9375rem; font-weight: 600; color: #1e293b; margin: 0; }
      .view-all { font-size: 0.75rem; color: #2563eb; cursor: pointer; }
    }
    .quick-actions-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
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
      &.blue   { background: #2563eb; }
      &.green  { background: #10b981; }
      &.orange { background: #f59e0b; }
      &.purple { background: #8b5cf6; }
      &.teal   { background: #0891b2; }
    }
    .birthday-list { display: flex; flex-direction: column; gap: 12px; }
    .birthday-item {
      display: flex; align-items: center; gap: 10px;
      border-radius: 8px; padding: 4px; transition: background 0.12s;
      &:hover { background: #f8fafc; }
      .birthday-info { flex: 1; display: flex; flex-direction: column; }
      .bday-name  { font-size: 0.8125rem; font-weight: 500; color: #1e293b; }
      .bday-class { font-size: 0.7rem; color: #94a3b8; }
      .bday-date  { font-size: 0.75rem; color: #64748b; white-space: nowrap; }
    }
    .empty-text { font-size: 0.8125rem; color: #94a3b8; text-align: center; padding: 8px 0; }

    @media (max-width: 1200px) {
      .stat-cards { grid-template-columns: repeat(3, 1fr); }
      .content-row { grid-template-columns: 1fr; }
    }

    /* ══════════════════════════════════════════════════════════════════════ */
    /* STUDENT POPUP                                                          */
    /* ══════════════════════════════════════════════════════════════════════ */

    @keyframes backdropFadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes popupSlideIn {
      from { opacity: 0; transform: translateY(28px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0)    scale(1);    }
    }
    @keyframes pulse-dot {
      50% { opacity: 0.35; }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .popup-backdrop {
      position: fixed; inset: 0;
      background: rgba(15, 23, 42, 0.55);
      backdrop-filter: blur(7px);
      -webkit-backdrop-filter: blur(7px);
      z-index: 1000;
      display: flex; align-items: center; justify-content: center;
      padding: 20px;
      animation: backdropFadeIn 0.22s ease;
    }

    .student-popup {
      background: #ffffff;
      border-radius: 20px;
      width: min(92vw, 740px);
      max-height: min(88vh, 720px);
      display: flex; flex-direction: column;
      overflow: hidden;
      box-shadow:
        0 32px 80px rgba(0,0,0,0.22),
        0 8px 32px rgba(0,0,0,0.10);
      animation: popupSlideIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
    }

    /* Header */
    .popup-header {
      display: flex; align-items: center; gap: 16px;
      padding: 20px 24px;
      background: linear-gradient(135deg, #f0f6ff 0%, #f8faff 60%, #f3f0ff 100%);
      border-bottom: 1px solid #e8f0fe;
      flex-shrink: 0;
    }

    .popup-photo-wrap { flex-shrink: 0; }

    .popup-photo {
      width: 72px; height: 72px; border-radius: 18px;
      object-fit: cover;
      border: 3px solid #fff;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }

    .popup-avatar {
      width: 72px; height: 72px; border-radius: 18px;
      display: flex; align-items: center; justify-content: center;
      font-size: 24px; font-weight: 800; color: #fff;
      border: 3px solid #fff;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      &.male   { background: linear-gradient(135deg, #2563eb, #3b82f6); }
      &.female { background: linear-gradient(135deg, #db2777, #ec4899); }
      &:not(.male):not(.female) { background: linear-gradient(135deg, #7c3aed, #8b5cf6); }
    }

    .popup-identity { flex: 1; display: flex; flex-direction: column; gap: 4px; }
    .popup-name {
      font-size: 20px; font-weight: 800; color: #0f172a;
      letter-spacing: -0.02em; margin: 0; line-height: 1.1;
    }
    .popup-id {
      font-size: 12.5px; font-weight: 600; color: #64748b;
      letter-spacing: 0.03em;
    }
    .popup-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

    .popup-status {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 11.5px; font-weight: 600; padding: 3px 10px;
      border-radius: 20px; background: #f1f5f9; color: #64748b;
      &.active { background: #dcfce7; color: #16a34a;
        .status-dot { background: #16a34a; }
      }
    }
    .status-dot {
      width: 6px; height: 6px; border-radius: 50%; background: #94a3b8;
      animation: pulse-dot 2s ease infinite;
    }
    .popup-enroll { font-size: 12px; color: #94a3b8; }

    .popup-close {
      width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
      border: 1px solid #e2e8f0; background: #fff;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.15s;
      svg { stroke: #64748b; }
      &:hover { background: #fef2f2; border-color: #fecaca; svg { stroke: #ef4444; } }
    }

    /* Action bar */
    .popup-actions {
      display: flex; gap: 8px; padding: 12px 24px;
      background: #fafbff; border-bottom: 1px solid #f1f5f9;
      flex-shrink: 0; flex-wrap: wrap;
    }

    .pact-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 14px; border-radius: 9px;
      font-size: 12.5px; font-weight: 600; font-family: inherit;
      cursor: pointer; transition: all 0.15s; border: 1.5px solid;
      &--print {
        background: #fff; border-color: #e2e8f0; color: #374151;
        &:hover { background: #f8fafc; border-color: #94a3b8; }
      }
      &--transfer {
        background: #fff; border-color: #dbeafe; color: #2563eb;
        &:hover { background: #eff6ff; }
      }
      &--fee {
        background: linear-gradient(135deg, #2563eb, #3b82f6);
        border-color: transparent; color: #fff;
        box-shadow: 0 2px 8px rgba(37,99,235,0.25);
        &:hover { box-shadow: 0 4px 16px rgba(37,99,235,0.35); transform: translateY(-1px); }
      }
    }

    /* Tab bar */
    .popup-tab-bar {
      display: flex; border-bottom: 1px solid #f1f5f9;
      padding: 0 24px; flex-shrink: 0;
      overflow-x: auto;
      scrollbar-width: none;
      &::-webkit-scrollbar { display: none; }
    }
    .ptab {
      padding: 11px 16px; border: none; background: none;
      font-size: 13px; font-weight: 500; color: #64748b;
      cursor: pointer; white-space: nowrap;
      border-bottom: 2.5px solid transparent; margin-bottom: -1px;
      transition: all 0.15s; font-family: inherit;
      &:hover { color: #1e293b; }
      &--active { color: #2563eb; font-weight: 700; border-bottom-color: #2563eb; }
    }

    /* Scrollable content area */
    .popup-content {
      flex: 1; overflow-y: auto; padding: 22px 24px;
      scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent;
      &::-webkit-scrollbar       { width: 4px; }
      &::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
    }

    /* Loading ring */
    .popup-loading {
      display: flex; flex-direction: column; align-items: center; gap: 12px;
      padding: 48px; color: #94a3b8; font-size: 14px;
    }
    .loading-ring {
      width: 36px; height: 36px;
      border: 3px solid #e2e8f0; border-top-color: #2563eb;
      border-radius: 50%; animation: spin 0.8s linear infinite;
    }

    /* Info grid */
    .detail-section { display: flex; flex-direction: column; gap: 16px; }
    .info-grid {
      display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;
      @media (max-width: 500px) { grid-template-columns: 1fr; }
    }
    .info-field {
      background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 10px; padding: 12px 14px;
      display: flex; flex-direction: column; gap: 4px;
    }
    .if-label {
      font-size: 10px; font-weight: 700; color: #94a3b8;
      text-transform: uppercase; letter-spacing: 0.08em;
    }
    .if-value {
      font-size: 14px; font-weight: 600; color: #1e293b;
      &.gender-female { color: #db2777; }
      &.blood         { color: #dc2626; font-weight: 800; font-size: 16px; }
      &.green-text    { color: #16a34a; }
    }

    /* Chips */
    .chip-section { display: flex; flex-direction: column; gap: 8px; }
    .cs-label { font-size: 10.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; }
    .chip-row { display: flex; flex-wrap: wrap; gap: 6px; }
    .chip {
      padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 500;
      &--red   { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
      &--amber { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
    }

    /* Carers */
    .section-heading {
      font-size: 10.5px; font-weight: 700; color: #94a3b8;
      text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px;
    }
    .carer-card {
      background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 12px;
      padding: 14px 16px; display: flex; flex-direction: column; gap: 4px;
    }
    .carer-badge {
      display: inline-block; padding: 2px 8px; border-radius: 20px;
      font-size: 10.5px; font-weight: 700; background: #f1f5f9; color: #64748b;
      width: fit-content;
      &.primary { background: #dbeafe; color: #1d4ed8; }
    }
    .carer-name { font-size: 14px; font-weight: 600; color: #1e293b; }
    .carer-meta { font-size: 12px; color: #64748b; }
    .carer-contacts { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 4px; }
    .contact-item {
      display: flex; align-items: center; gap: 4px; font-size: 12px; color: #475569;
    }

    /* Siblings */
    .sibling-row {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 14px; background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 10px;
    }
    .sib-avatar {
      width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, #7c3aed, #8b5cf6);
      color: #fff; font-size: 14px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }
    .sib-info  { display: flex; flex-direction: column; }
    .sib-name  { font-size: 13px; font-weight: 600; color: #1e293b; }
    .sib-class { font-size: 11px; color: #94a3b8; }

    /* Commitment */
    .commitment-section { align-items: stretch; }
    .commitment-block {
      display: flex; align-items: center; gap: 16px;
      background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px 20px;
    }
    .cb-icon { color: #16a34a; flex-shrink: 0; }
    .cb-title { font-size: 15px; font-weight: 700; color: #166534; }
    .cb-sub   { font-size: 12.5px; color: #4ade80; margin-top: 3px; }
    .view-commitment-btn {
      display: inline-flex; align-items: center; gap: 6px; margin-top: 14px;
      padding: 10px 20px; background: #fff;
      border: 1.5px solid #e2e8f0; border-radius: 9px;
      font-size: 13.5px; font-weight: 600; font-family: inherit;
      color: #374151; cursor: pointer; transition: all 0.15s;
      &:hover { background: #eff6ff; border-color: #bfdbfe; color: #2563eb; }
    }

    .no-data-msg {
      text-align: center; color: #94a3b8; font-size: 14px; padding: 36px 0;
    }
  `],
})
export class StudentsOverviewComponent implements OnInit, OnDestroy {
  readonly studentsService = inject(StudentsService);
  private router  = inject(Router);
  private dialog  = inject(MatDialog);
  private destroy$ = new Subject<void>();

  readonly profiles   = signal<StudentProfile[]>([]);
  readonly totalCount = signal<number>(0);

  /* ── Popup state ─────────────────────────────────────────────────────── */
  selectedStudent     = signal<StudentProfile | null>(null);
  selectedStudentFull = signal<StudentProfile | null>(null);
  activeDetailTab     = signal(0);
  popupLoading        = signal(false);

  readonly popupStudent = computed(() => this.selectedStudentFull() ?? this.selectedStudent());

  /* ── List state ──────────────────────────────────────────────────────── */
  searchControl = new FormControl('');
  searchQuery   = '';
  currentPage   = 0;
  pageSize      = 25;
  activeTab     = 0;
  filterClass   = '';
  filterStatus  = '';
  heroImageSrc  = 'images/students-hero.png';

  readonly displayedColumns = ['school_id', 'name', 'gender', 'class', 'status', 'actions'];

  readonly maleCount     = computed(() => this.profiles().filter(s => (s.admission_record?.gender || s.gender) === 'MALE').length);
  readonly femaleCount   = computed(() => this.profiles().filter(s => (s.admission_record?.gender || s.gender) === 'FEMALE').length);
  readonly activeCount   = computed(() => this.profiles().filter(s => this.getEnrollmentStatus(s) === 'ACTIVE').length);
  readonly graduatedCount= computed(() => this.profiles().filter(s => this.getEnrollmentStatus(s) === 'GRADUATED').length);
  readonly malePercent   = computed(() => { const t = this.totalCount(); return t > 0 ? Math.round((this.maleCount() / t) * 100) : 0; });
  readonly femalePercent = computed(() => { const t = this.totalCount(); return t > 0 ? Math.round((this.femaleCount() / t) * 100) : 0; });

  ngOnInit(): void {
    this.loadProfiles();
    this.searchControl.valueChanges.pipe(
      debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$)
    ).subscribe(term => {
      this.searchQuery = term || '';
      this.currentPage = 0;
      this.loadProfiles();
    });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  loadProfiles(): void {
    const tabStatuses: Record<number, string> = { 1: 'ACTIVE', 2: 'INACTIVE', 3: 'GRADUATED', 4: 'TRANSFERRED' };
    const statusFilter = this.filterStatus || tabStatuses[this.activeTab] || '';
    this.studentsService.getProfiles(this.currentPage + 1, this.pageSize, {
      status: statusFilter || undefined,
      search: this.searchQuery || undefined,
    }).subscribe(res => {
      this.profiles.set(res.results);
      this.totalCount.set(res.count);
      this.studentsService.isLoading.set(false);
    });
  }

  onTabChange(index: number): void { this.activeTab = index; this.currentPage = 0; this.filterStatus = ''; this.loadProfiles(); }
  onPageChange(event: PageEvent): void { this.currentPage = event.pageIndex; this.pageSize = event.pageSize; this.loadProfiles(); }
  applyFilters(): void { this.currentPage = 0; this.loadProfiles(); }

  /* ── Popup ───────────────────────────────────────────────────────────── */
  openStudentPopup(s: StudentProfile): void {
    this.selectedStudent.set(s);
    this.selectedStudentFull.set(null);
    this.activeDetailTab.set(0);
    this.popupLoading.set(true);
    this.studentsService.getStudentDetail(s.id).subscribe({
      next:  full => { this.selectedStudentFull.set(full); this.popupLoading.set(false); },
      error: ()   => this.popupLoading.set(false),
    });
  }

  closeStudentPopup(): void {
    this.selectedStudent.set(null);
    this.selectedStudentFull.set(null);
  }

  printStudentForm(): void {
    window.print();
  }

  openTransferDialog(): void {
    const s = this.selectedStudent();
    if (!s) return;
    this.dialog.open(TransferDialogComponent, {
      width: '480px',
      data: { enrollmentId: s.enrollments?.[0]?.id, studentName: `${s.first_name} ${s.last_name}` },
    }).afterClosed().subscribe(result => {
      if (result) { this.closeStudentPopup(); this.loadProfiles(); }
    });
  }

  viewCommitment(): void {
    const s = this.selectedStudent();
    if (!s) return;
    this.closeStudentPopup();
    this.router.navigate(['/portalAdmin/students', s.id, 'commitment']);
  }

  /* ── Helpers ─────────────────────────────────────────────────────────── */
  getCarerData(s: StudentProfile): CarerData[] {
    const raw = s.admission_record?.carers ?? [];
    return raw.map(c => {
      try { return JSON.parse(c) as CarerData; } catch { return null; }
    }).filter((c): c is CarerData => c !== null);
  }

  getActiveConditions(s: StudentProfile): string[] {
    const detail = s.medical_record?.conditions_detail;
    if (!detail) return [];
    return (Object.keys(detail) as MedicalConditionKey[])
      .filter(k => detail[k])
      .map(k => CONDITION_LABELS[k]);
  }

  getInitials(name: string): string {
    if (!name?.trim()) return '?';
    return name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getAvatarClass(gender: string | undefined | null): string {
    if (gender === 'MALE') return 'avatar male';
    if (gender === 'FEMALE') return 'avatar female';
    return 'avatar other';
  }

  getClassName(s: StudentProfile): string {
    return s?.enrollments?.length ? s.enrollments[0].classroom_name : '—';
  }

  getEnrollmentStatus(s: StudentProfile): string {
    return s?.enrollments?.length ? s.enrollments[0].status : 'INACTIVE';
  }

  onHeroImageError():                  void { this.heroImageSrc = ''; }
  onRowPhotoError(e: Event, s: StudentProfile): void { (e.target as HTMLImageElement).style.display = 'none'; }
  onPopupPhotoError(e: Event):         void { (e.target as HTMLImageElement).style.display = 'none'; }
}
