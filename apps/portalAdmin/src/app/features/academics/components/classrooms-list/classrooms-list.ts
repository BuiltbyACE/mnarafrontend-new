import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AcademicsService } from '../../services/academics.service';
import { Classroom } from '../../../../shared/models/academics.models';
import { BulkPromotionDialogComponent } from '../bulk-promotion-dialog/bulk-promotion-dialog';
import { CreateClassroomDialogComponent } from '../create-classroom-dialog/create-classroom-dialog';
import { EditClassroomDialogComponent } from '../edit-classroom-dialog/edit-classroom-dialog';

@Component({
  selector: 'app-classrooms-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="page-container page-fade-in">

      <!-- ── Page Header ──────────────────────────────────────────────────── -->
      <header class="page-header">
        <div class="header-inner">
          <div class="header-left">
            <div class="page-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <div>
              <nav class="breadcrumb">
                <span>Academics</span>
                <span class="sep">›</span>
                <span class="crumb-current">Classrooms</span>
              </nav>
              <h1 class="page-title">Classrooms</h1>
              <p class="page-subtitle">Manage academic spaces, enrollment &amp; assignments</p>
            </div>
          </div>
          <div class="header-actions">
            <button class="btn btn--ghost" (click)="openBulkPromotion()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="17 11 12 6 7 11"/><polyline points="17 18 12 13 7 18"/>
              </svg>
              Bulk Promote
            </button>
            <button class="btn btn--primary" (click)="addClassroom()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Classroom
            </button>
          </div>
        </div>
      </header>

      <!-- ── Stats Row ─────────────────────────────────────────────────────── -->
      <div class="stats-grid">

        <div class="stat-card stat-card--blue">
          <div class="stat-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
          </div>
          <div class="stat-body">
            <span class="stat-num">{{ totalCount() }}</span>
            <span class="stat-lbl">Total Classrooms</span>
          </div>
          <div class="stat-bg-shape"></div>
        </div>

        <div class="stat-card stat-card--emerald">
          <div class="stat-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div class="stat-body">
            <span class="stat-num">{{ activeCount() }}</span>
            <span class="stat-lbl">Active Classrooms</span>
          </div>
          <div class="stat-bg-shape"></div>
        </div>

        <div class="stat-card stat-card--violet">
          <div class="stat-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
          </div>
          <div class="stat-body">
            <span class="stat-num">{{ totalEnrolled() }}</span>
            <span class="stat-lbl">Students Enrolled</span>
          </div>
          <div class="stat-bg-shape"></div>
        </div>

        <div class="stat-card stat-card--amber">
          <div class="stat-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div class="stat-body">
            <span class="stat-num">{{ availableSeats() }}</span>
            <span class="stat-lbl">Available Seats</span>
          </div>
          <div class="stat-bg-shape"></div>
        </div>

      </div>

      <!-- ── Error Alert ────────────────────────────────────────────────────── -->
      @if (academicsService.error()) {
        <div class="alert alert--error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{{ academicsService.error() }}</span>
        </div>
      }

      <!-- ── Data Card ──────────────────────────────────────────────────────── -->
      <div class="data-card">

        <!-- Toolbar -->
        <div class="data-toolbar">
          <div class="toolbar-left">
            <span class="data-title">All Classrooms</span>
            <span class="data-count-badge">{{ totalCount() }}</span>
          </div>
        </div>

        <!-- Table -->
        <div class="table-scroll">
          <table mat-table [dataSource]="classrooms()" matSort (matSortChange)="onSort($event)" class="classrooms-table">

            <!-- ─ Classroom ─ -->
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Classroom</th>
              <td mat-cell *matCellDef="let c">
                <div class="cell-classroom">
                  <div class="cls-avatar" [style.background]="getAvatarColor(c.name)">
                    {{ c.name.charAt(0).toUpperCase() }}
                  </div>
                  <div class="cls-meta">
                    <span class="cls-name">{{ c.name }}</span>
                    @if (c.room_number) {
                      <span class="cls-room">
                        <svg viewBox="0 0 16 16" fill="currentColor">
                          <path d="M8 0C4.686 0 2 2.686 2 6c0 4.5 6 10 6 10s6-5.5 6-10c0-3.314-2.686-6-6-6zm0 8a2 2 0 110-4 2 2 0 010 4z"/>
                        </svg>
                        {{ c.room_number }}
                      </span>
                    }
                  </div>
                </div>
              </td>
            </ng-container>

            <!-- ─ Year Level ─ -->
            <ng-container matColumnDef="year_level">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Year Level</th>
              <td mat-cell *matCellDef="let c">
                @if (c.year_level_name) {
                  <span class="year-badge">{{ c.year_level_name }}</span>
                } @else {
                  <span class="text-faint">—</span>
                }
              </td>
            </ng-container>

            <!-- ─ Enrollment ─ -->
            <ng-container matColumnDef="enrollment">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Enrollment</th>
              <td mat-cell *matCellDef="let c">
                <div class="cell-enrollment">
                  <div class="enroll-row">
                    <span class="enroll-nums">
                      <strong>{{ c.current_enrollment || 0 }}</strong> / {{ c.capacity }}
                    </span>
                    <span class="enroll-pct"
                          [class.pct--full]="getEnrollmentPct(c) >= 100"
                          [class.pct--high]="getEnrollmentPct(c) >= 85 && getEnrollmentPct(c) < 100">
                      {{ getEnrollmentPct(c) }}%
                    </span>
                  </div>
                  <div class="enroll-track">
                    <div class="enroll-fill"
                         [style.width.%]="getEnrollmentPct(c)"
                         [class.fill--low]="getEnrollmentPct(c) < 60"
                         [class.fill--mid]="getEnrollmentPct(c) >= 60 && getEnrollmentPct(c) < 85"
                         [class.fill--high]="getEnrollmentPct(c) >= 85">
                    </div>
                  </div>
                </div>
              </td>
            </ng-container>

            <!-- ─ Class Teacher ─ -->
            <ng-container matColumnDef="teacher">
              <th mat-header-cell *matHeaderCellDef>Class Teacher</th>
              <td mat-cell *matCellDef="let c">
                @if (c.class_teacher?.full_name) {
                  <div class="cell-teacher">
                    <div class="teacher-avatar">{{ getInitials(c.class_teacher!.full_name) }}</div>
                    <span class="teacher-name">{{ c.class_teacher!.full_name }}</span>
                  </div>
                } @else {
                  <span class="unassigned-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
                    </svg>
                    Unassigned
                  </span>
                }
              </td>
            </ng-container>

            <!-- ─ Status ─ -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let c">
                <span class="status-chip"
                      [class.chip--active]="c.is_active"
                      [class.chip--archived]="!c.is_active">
                  <span class="chip-dot"></span>
                  {{ c.is_active ? 'Active' : 'Archived' }}
                </span>
              </td>
            </ng-container>

            <!-- ─ Actions ─ -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="col-actions">Actions</th>
              <td mat-cell *matCellDef="let c" class="col-actions">
                <div class="action-group">
                  <button class="act-btn act-btn--view" (click)="viewClassroom(c)" matTooltip="View details">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                  <button class="act-btn act-btn--edit" (click)="editClassroom(c)" matTooltip="Edit classroom">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  @if (c.is_active) {
                    <button class="act-btn act-btn--archive" (click)="archiveClassroom(c)" matTooltip="Archive classroom">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="21 8 21 21 3 21 3 8"/>
                        <rect x="1" y="3" width="22" height="5"/>
                        <line x1="10" y1="12" x2="14" y2="12"/>
                      </svg>
                    </button>
                  }
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="data-row"></tr>

            <!-- No data -->
            <tr class="mat-row" *matNoDataRow>
              <td [attr.colspan]="displayedColumns.length">
                <div class="empty-state">
                  @if (academicsService.isLoading()) {
                    <div class="loading-wrap">
                      <mat-spinner diameter="36"></mat-spinner>
                      <span>Loading classrooms…</span>
                    </div>
                  } @else {
                    <div class="empty-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                      </svg>
                    </div>
                    <p class="empty-title">No classrooms yet</p>
                    <p class="empty-sub">Create your first classroom to get started</p>
                    <button class="btn btn--primary btn--sm" (click)="addClassroom()">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Add Classroom
                    </button>
                  }
                </div>
              </td>
            </tr>

          </table>
        </div>

        <mat-paginator
          [length]="totalCount()"
          [pageSize]="pageSize"
          [pageSizeOptions]="[10, 25, 50, 100]"
          [pageIndex]="currentPage"
          (page)="onPageChange($event)"
          aria-label="Select page of classrooms"
          class="classrooms-paginator">
        </mat-paginator>

      </div>
    </div>
  `,
  styles: [`
    /* ── Layout ──────────────────────────────────────────────────────────── */
    .page-container {
      padding: 28px;
    }

    /* ── Header ──────────────────────────────────────────────────────────── */
    .page-header {
      margin-bottom: 28px;
    }

    .header-inner {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 20px;
    }

    .header-left {
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }

    .page-icon {
      width: 52px;
      height: 52px;
      background: linear-gradient(135deg, #2563eb 0%, #6366f1 100%);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
      svg {
        width: 26px;
        height: 26px;
        stroke: #fff;
      }
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #9ca3af;
      margin-bottom: 5px;
      .sep { color: #d1d5db; }
      .crumb-current { color: #6366f1; font-weight: 500; }
    }

    .page-title {
      font-size: 23px;
      font-weight: 700;
      color: #111827;
      letter-spacing: -0.025em;
      margin: 0 0 3px;
    }

    .page-subtitle {
      font-size: 13.5px;
      color: #6b7280;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 10px;
      align-items: center;
      flex-shrink: 0;
    }

    /* ── Buttons ─────────────────────────────────────────────────────────── */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 9px 18px;
      border-radius: 10px;
      font-size: 13.5px;
      font-weight: 500;
      border: none;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.18s ease;
      line-height: 1;

      svg { width: 15px; height: 15px; flex-shrink: 0; }

      &--primary {
        background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
        color: #fff;
        box-shadow: 0 2px 8px rgba(37, 99, 235, 0.32);
        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(37, 99, 235, 0.42);
        }
        &:active { transform: translateY(0); }
      }

      &--ghost {
        background: #fff;
        color: #374151;
        border: 1.5px solid #e5e7eb;
        &:hover { background: #f9fafb; border-color: #d1d5db; }
      }

      &--sm { padding: 7px 14px; font-size: 13px; }
    }

    /* ── Stats Grid ──────────────────────────────────────────────────────── */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      position: relative;
      background: #fff;
      border-radius: 16px;
      padding: 20px 22px;
      display: flex;
      align-items: center;
      gap: 16px;
      overflow: hidden;
      border: 1px solid #f1f5f9;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      cursor: default;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.06), 0 10px 28px rgba(0,0,0,0.06);
      }
    }

    .stat-icon-wrap {
      width: 50px;
      height: 50px;
      border-radius: 13px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      z-index: 1;
      svg { width: 22px; height: 22px; }
    }

    .stat-body {
      display: flex;
      flex-direction: column;
      gap: 3px;
      z-index: 1;
    }

    .stat-num {
      font-size: 30px;
      font-weight: 700;
      line-height: 1;
      letter-spacing: -0.03em;
      color: #111827;
    }

    .stat-lbl {
      font-size: 12.5px;
      color: #6b7280;
      font-weight: 500;
    }

    .stat-bg-shape {
      position: absolute;
      right: -18px;
      top: -18px;
      width: 96px;
      height: 96px;
      border-radius: 50%;
      opacity: 0.07;
    }

    .stat-card--blue {
      .stat-icon-wrap { background: #eff6ff; svg { stroke: #2563eb; } }
      .stat-bg-shape { background: #2563eb; }
    }

    .stat-card--emerald {
      .stat-icon-wrap { background: #f0fdf4; svg { stroke: #16a34a; } }
      .stat-bg-shape { background: #16a34a; }
    }

    .stat-card--violet {
      .stat-icon-wrap { background: #f5f3ff; svg { stroke: #7c3aed; } }
      .stat-bg-shape { background: #7c3aed; }
    }

    .stat-card--amber {
      .stat-icon-wrap { background: #fffbeb; svg { stroke: #d97706; } }
      .stat-bg-shape { background: #d97706; }
    }

    /* ── Error Alert ─────────────────────────────────────────────────────── */
    .alert {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 18px;
      border-radius: 12px;
      font-size: 14px;
      margin-bottom: 20px;

      svg { width: 18px; height: 18px; flex-shrink: 0; }

      &--error {
        background: #fef2f2;
        color: #b91c1c;
        border: 1px solid #fecaca;
      }
    }

    /* ── Data Card ───────────────────────────────────────────────────────── */
    .data-card {
      background: #fff;
      border-radius: 20px;
      border: 1px solid #f1f5f9;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 18px rgba(0,0,0,0.04);
      overflow: hidden;
    }

    .data-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid #f3f4f6;
    }

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .data-title {
      font-size: 15px;
      font-weight: 600;
      color: #111827;
    }

    .data-count-badge {
      background: #eff6ff;
      color: #2563eb;
      font-size: 11.5px;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 99px;
      border: 1px solid #bfdbfe;
    }

    /* ── Table ───────────────────────────────────────────────────────────── */
    .table-scroll { overflow-x: auto; }

    .classrooms-table {
      width: 100%;
      background: #fff !important;

      .mat-mdc-header-row {
        background: #f8fafc !important;
      }

      .mat-mdc-header-cell {
        font-size: 11px !important;
        font-weight: 600 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.07em !important;
        color: #9ca3af !important;
        border-bottom: 1px solid #f1f5f9 !important;
        padding: 14px 16px !important;
      }

      .data-row {
        transition: background 0.12s ease;

        &:hover { background: #fafbff !important; }

        .mat-mdc-cell {
          border-bottom: 1px solid #f8fafc !important;
          padding: 14px 16px !important;
          color: #374151;
          font-size: 13.5px;
          vertical-align: middle;
        }
      }
    }

    /* ── Cell: Classroom ─────────────────────────────────────────────────── */
    .cell-classroom {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .cls-avatar {
      width: 40px;
      height: 40px;
      border-radius: 11px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 17px;
      font-weight: 700;
      color: #fff;
      flex-shrink: 0;
      letter-spacing: -0.02em;
    }

    .cls-meta {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .cls-name {
      font-weight: 600;
      color: #111827;
      font-size: 14px;
    }

    .cls-room {
      display: flex;
      align-items: center;
      gap: 3px;
      font-size: 11.5px;
      color: #9ca3af;

      svg { width: 11px; height: 11px; flex-shrink: 0; }
    }

    /* ── Cell: Year Level ────────────────────────────────────────────────── */
    .year-badge {
      display: inline-block;
      padding: 4px 11px;
      background: #f0f4ff;
      color: #4338ca;
      border-radius: 8px;
      font-size: 12.5px;
      font-weight: 500;
      border: 1px solid #e0e7ff;
    }

    .text-faint { color: #d1d5db; }

    /* ── Cell: Enrollment ────────────────────────────────────────────────── */
    .cell-enrollment {
      min-width: 130px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .enroll-row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 8px;
    }

    .enroll-nums {
      font-size: 13px;
      color: #4b5563;
      strong { font-weight: 600; color: #111827; }
    }

    .enroll-pct {
      font-size: 11.5px;
      font-weight: 600;
      color: #16a34a;
      &.pct--high { color: #d97706; }
      &.pct--full { color: #dc2626; }
    }

    .enroll-track {
      height: 5px;
      background: #f3f4f6;
      border-radius: 3px;
      overflow: hidden;
    }

    .enroll-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.4s ease;
      &.fill--low  { background: linear-gradient(90deg, #34d399, #10b981); }
      &.fill--mid  { background: linear-gradient(90deg, #fbbf24, #f59e0b); }
      &.fill--high { background: linear-gradient(90deg, #f87171, #ef4444); }
    }

    /* ── Cell: Teacher ───────────────────────────────────────────────────── */
    .cell-teacher {
      display: flex;
      align-items: center;
      gap: 9px;
    }

    .teacher-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      letter-spacing: 0.03em;
    }

    .teacher-name {
      font-size: 13.5px;
      color: #374151;
      font-weight: 500;
    }

    .unassigned-label {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 12.5px;
      color: #d1d5db;
      font-style: italic;
      svg { width: 14px; height: 14px; stroke: #d1d5db; }
    }

    /* ── Cell: Status Chip ───────────────────────────────────────────────── */
    .status-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px 5px 9px;
      border-radius: 99px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.01em;
      white-space: nowrap;
    }

    .chip-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .chip--active {
      background: #f0fdf4;
      color: #15803d;
      border: 1px solid #bbf7d0;
      .chip-dot { background: #22c55e; box-shadow: 0 0 0 2.5px rgba(34,197,94,0.18); }
    }

    .chip--archived {
      background: #f9fafb;
      color: #9ca3af;
      border: 1px solid #e5e7eb;
      .chip-dot { background: #d1d5db; }
    }

    /* ── Cell: Actions ───────────────────────────────────────────────────── */
    .col-actions {
      width: 120px;
      text-align: right !important;
    }

    .action-group {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 3px;
    }

    .act-btn {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: 1px solid transparent;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.14s ease;
      svg { width: 15px; height: 15px; }

      &--view {
        color: #6366f1;
        &:hover { background: #f0f4ff; border-color: #e0e7ff; }
      }

      &--edit {
        color: #2563eb;
        &:hover { background: #eff6ff; border-color: #bfdbfe; }
      }

      &--archive {
        color: #ef4444;
        &:hover { background: #fef2f2; border-color: #fecaca; }
      }
    }

    /* ── Empty State ─────────────────────────────────────────────────────── */
    .empty-state {
      padding: 72px 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      text-align: center;
    }

    .empty-icon {
      width: 76px;
      height: 76px;
      background: #f8fafc;
      border-radius: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 4px;
      border: 1.5px solid #f1f5f9;
      svg { width: 38px; height: 38px; stroke: #d1d5db; }
    }

    .empty-title {
      font-size: 16px;
      font-weight: 600;
      color: #374151;
      margin: 0;
    }

    .empty-sub {
      font-size: 13.5px;
      color: #9ca3af;
      margin: 0 0 12px;
    }

    .loading-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      color: #9ca3af;
      font-size: 14px;
    }

    /* ── Paginator ───────────────────────────────────────────────────────── */
    .classrooms-paginator {
      border-top: 1px solid #f3f4f6 !important;
      background: #fafafa !important;
    }

    /* ── Responsive ──────────────────────────────────────────────────────── */
    @media (max-width: 1100px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 640px) {
      .page-container { padding: 16px; }
      .stats-grid { grid-template-columns: 1fr; }
      .header-inner { flex-direction: column; align-items: stretch; }
      .header-actions { justify-content: flex-end; }
    }
  `],
})
export class ClassroomsListComponent implements OnInit {
  readonly academicsService = inject(AcademicsService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  readonly classrooms = this.academicsService.classrooms;
  readonly displayedColumns = ['name', 'year_level', 'enrollment', 'teacher', 'status', 'actions'];
  readonly totalCount = signal(0);

  readonly activeCount = computed(() => this.classrooms().filter(c => c.is_active).length);
  readonly totalEnrolled = computed(() => this.classrooms().reduce((sum, c) => sum + (c.current_enrollment || 0), 0));
  readonly availableSeats = computed(() => this.classrooms().reduce((sum, c) => sum + Math.max(0, c.capacity - (c.current_enrollment || 0)), 0));

  currentPage = 0;
  pageSize = 25;
  sortField = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  private readonly avatarColors = [
    '#2563eb', '#6366f1', '#0891b2', '#059669',
    '#d97706', '#dc2626', '#7c3aed', '#db2777',
  ];

  ngOnInit(): void {
    this.loadClassrooms();
  }

  loadClassrooms(): void {
    this.academicsService.getClassrooms(this.currentPage + 1, this.pageSize)
      .subscribe((response: any) => {
        this.academicsService.setClassrooms(response.results || response, response.count || 0);
        this.totalCount.set(response.count || 0);
      });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadClassrooms();
  }

  onSort(sort: Sort): void {
    this.sortField = sort.active;
    this.sortDirection = sort.direction as 'asc' | 'desc' || 'asc';
    this.loadClassrooms();
  }

  getEnrollmentPct(classroom: Classroom): number {
    if (!classroom.capacity) return 0;
    return Math.min(100, Math.round(((classroom.current_enrollment || 0) / classroom.capacity) * 100));
  }

  getInitials(name: string): string {
    return name.trim().split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }

  getAvatarColor(name: string): string {
    const idx = name.charCodeAt(0) % this.avatarColors.length;
    return this.avatarColors[idx];
  }

  addClassroom(): void {
    const ref = this.dialog.open(CreateClassroomDialogComponent, { width: '520px', disableClose: true });
    ref.afterClosed().subscribe((created: any) => { if (created) this.loadClassrooms(); });
  }

  viewClassroom(classroom: Classroom): void {
    this.snackBar.open(`Viewing ${classroom.name}`, 'Close', { duration: 3000 });
  }

  editClassroom(classroom: Classroom): void {
    const ref = this.dialog.open(EditClassroomDialogComponent, {
      width: '520px',
      disableClose: true,
      data: { classroom },
    });
    ref.afterClosed().subscribe((updated: any) => { if (updated) this.loadClassrooms(); });
  }

  manageStudents(classroom: Classroom): void {
    this.snackBar.open(`Managing students in ${classroom.name}`, 'Close', { duration: 3000 });
  }

  archiveClassroom(classroom: Classroom): void {
    if (confirm(`Are you sure you want to archive ${classroom.name}?`)) {
      this.academicsService.archiveClassroom(classroom.id).subscribe({
        next: () => {
          this.snackBar.open(`${classroom.name} archived successfully`, 'Close', { duration: 3000 });
          this.loadClassrooms();
        },
        error: (err: any) => {
          this.snackBar.open(`Failed to archive: ${err.message}`, 'Close', { duration: 5000 });
        }
      });
    }
  }

  openBulkPromotion(): void {
    const dialogRef = this.dialog.open(BulkPromotionDialogComponent, {
      width: '600px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result?.success) {
        this.snackBar.open(result.message, 'Close', { duration: 5000 });
        this.loadClassrooms();
      }
    });
  }
}
