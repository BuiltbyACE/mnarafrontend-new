import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AcademicsService, Classroom } from '../../services/academics.service';
import { ClassroomDialogComponent } from './classroom-dialog.component';

@Component({
  selector: 'app-classrooms-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
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
              <p class="page-subtitle">Manage academic spaces, capacity &amp; enrollment</p>
            </div>
          </div>
          <div class="header-actions">
            <button class="btn btn--primary" (click)="openCreateDialog()">
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
            <span class="stat-num">{{ allClassrooms().length }}</span>
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
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div class="stat-body">
            <span class="stat-num">{{ availableSeats() }}</span>
            <span class="stat-lbl">Available Seats</span>
          </div>
          <div class="stat-bg-shape"></div>
        </div>

      </div>

      <!-- ── Data Card ──────────────────────────────────────────────────────── -->
      <div class="data-card">

        <!-- Toolbar -->
        <div class="data-toolbar">
          <div class="toolbar-left">
            <span class="data-title">All Classrooms</span>
            <span class="data-count-badge">{{ filteredClassrooms().length }}</span>
          </div>
          <div class="toolbar-right">
            <div class="search-wrap">
              <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                class="search-input"
                placeholder="Search classrooms..."
                [ngModel]="searchQuery()"
                (ngModelChange)="searchQuery.set($event)"
              />
            </div>
          </div>
        </div>

        <!-- Table -->
        <div class="table-scroll">
          @if (service.isLoading()) {
            <div class="loading-wrap">
              <mat-spinner diameter="36"></mat-spinner>
              <span>Loading classrooms…</span>
            </div>
          } @else {
            <table mat-table [dataSource]="filteredClassrooms()" class="classrooms-table">

              <!-- ─ Classroom ─ -->
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Classroom</th>
                <td mat-cell *matCellDef="let c">
                  <div class="cell-classroom">
                    <div class="cls-avatar" [style.background]="getAvatarColor(c.name)">
                      {{ c.name.charAt(0).toUpperCase() }}
                    </div>
                    <div class="cls-meta">
                      <span class="cls-name">{{ c.name }}</span>
                      @if (c.class_teacher?.full_name) {
                        <span class="cls-teacher">
                          <svg viewBox="0 0 16 16" fill="currentColor">
                            <path d="M8 8a3 3 0 100-6 3 3 0 000 6zm-5 5s-.5-3 5-3 5 3 5 3H3z"/>
                          </svg>
                          {{ c.class_teacher!.full_name }}
                        </span>
                      }
                    </div>
                  </div>
                </td>
              </ng-container>

              <!-- ─ Year Level ─ -->
              <ng-container matColumnDef="year_level">
                <th mat-header-cell *matHeaderCellDef>Year Level</th>
                <td mat-cell *matCellDef="let c">
                  @if (c.year_level_name) {
                    <span class="year-badge">{{ c.year_level_name }}</span>
                  } @else {
                    <span class="text-faint">—</span>
                  }
                </td>
              </ng-container>

              <!-- ─ Room ─ -->
              <ng-container matColumnDef="room_number">
                <th mat-header-cell *matHeaderCellDef>Room</th>
                <td mat-cell *matCellDef="let c">
                  @if (c.room_number) {
                    <span class="room-chip">
                      <svg viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 0C4.686 0 2 2.686 2 6c0 4.5 6 10 6 10s6-5.5 6-10c0-3.314-2.686-6-6-6zm0 8a2 2 0 110-4 2 2 0 010 4z"/>
                      </svg>
                      {{ c.room_number }}
                    </span>
                  } @else {
                    <span class="text-faint">—</span>
                  }
                </td>
              </ng-container>

              <!-- ─ Capacity ─ -->
              <ng-container matColumnDef="capacity">
                <th mat-header-cell *matHeaderCellDef>Capacity</th>
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
                    <button class="act-btn act-btn--edit" (click)="openEditDialog(c)" matTooltip="Edit classroom">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button class="act-btn act-btn--delete" (click)="deleteClassroom(c)" matTooltip="Delete classroom">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                        <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="data-row"></tr>

              <!-- No data -->
              <tr class="mat-row" *matNoDataRow>
                <td [attr.colspan]="displayedColumns.length">
                  <div class="empty-state">
                    <div class="empty-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                      </svg>
                    </div>
                    <p class="empty-title">No classrooms found</p>
                    <p class="empty-sub">{{ searchQuery() ? 'Try a different search term' : 'Add your first classroom to get started' }}</p>
                    @if (!searchQuery()) {
                      <button class="btn btn--primary btn--sm" (click)="openCreateDialog()">
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
          }
        </div>
      </div>

    </div>
  `,
  styles: [`
    /* ── Layout ──────────────────────────────────────────────────────────── */
    .page-container { padding: 28px; }

    /* ── Header ──────────────────────────────────────────────────────────── */
    .page-header { margin-bottom: 28px; }

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
      svg { width: 26px; height: 26px; stroke: #fff; }
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
        &:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(37, 99, 235, 0.42); }
        &:active { transform: translateY(0); }
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
      padding: 18px 24px;
      border-bottom: 1px solid #f3f4f6;
      gap: 16px;
      flex-wrap: wrap;
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

    .toolbar-right { display: flex; align-items: center; gap: 10px; }

    /* ── Search ──────────────────────────────────────────────────────────── */
    .search-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 11px;
      width: 15px;
      height: 15px;
      stroke: #9ca3af;
      pointer-events: none;
    }

    .search-input {
      padding: 8px 14px 8px 34px;
      border: 1.5px solid #e5e7eb;
      border-radius: 10px;
      font-size: 13.5px;
      font-family: inherit;
      color: #111827;
      background: #fafafa;
      width: 240px;
      transition: border-color 0.15s, box-shadow 0.15s;

      &::placeholder { color: #9ca3af; }

      &:focus {
        outline: none;
        border-color: #6366f1;
        background: #fff;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
      }
    }

    /* ── Table ───────────────────────────────────────────────────────────── */
    .table-scroll { overflow-x: auto; }

    .classrooms-table {
      width: 100%;
      background: #fff !important;

      .mat-mdc-header-row { background: #f8fafc !important; }

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

    .cls-teacher {
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

    /* ── Cell: Room ──────────────────────────────────────────────────────── */
    .room-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 5px 11px;
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      color: #374151;
      svg { width: 11px; height: 11px; fill: #9ca3af; }
    }

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

    /* ── Cell: Status ────────────────────────────────────────────────────── */
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
      width: 100px;
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

      &--edit {
        color: #2563eb;
        &:hover { background: #eff6ff; border-color: #bfdbfe; }
      }

      &--delete {
        color: #ef4444;
        &:hover { background: #fef2f2; border-color: #fecaca; }
      }
    }

    /* ── Loading ─────────────────────────────────────────────────────────── */
    .loading-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 72px 24px;
      color: #9ca3af;
      font-size: 14px;
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

    .empty-title { font-size: 16px; font-weight: 600; color: #374151; margin: 0; }
    .empty-sub   { font-size: 13.5px; color: #9ca3af; margin: 0 0 12px; }

    /* ── Responsive ──────────────────────────────────────────────────────── */
    @media (max-width: 1100px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }

    @media (max-width: 640px) {
      .page-container  { padding: 16px; }
      .stats-grid      { grid-template-columns: 1fr; }
      .header-inner    { flex-direction: column; align-items: stretch; }
      .header-actions  { justify-content: flex-end; }
      .search-input    { width: 100%; }
    }
  `],
})
export class ClassroomsListComponent implements OnInit {
  readonly service = inject(AcademicsService);
  readonly dialog  = inject(MatDialog);

  searchQuery = signal('');
  displayedColumns = ['name', 'year_level', 'room_number', 'capacity', 'status', 'actions'];

  readonly allClassrooms = this.service.classrooms;

  readonly filteredClassrooms = computed(() => {
    const list = this.service.classrooms();
    if (!this.searchQuery()) return list;
    const q = this.searchQuery().toLowerCase();
    return list.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.room_number ?? '').toLowerCase().includes(q) ||
      (c.year_level_name ?? '').toLowerCase().includes(q)
    );
  });

  readonly activeCount   = computed(() => this.service.classrooms().filter(c => c.is_active).length);
  readonly totalEnrolled = computed(() => this.service.classrooms().reduce((s, c) => s + (c.current_enrollment || 0), 0));
  readonly availableSeats = computed(() => this.service.classrooms().reduce((s, c) => s + Math.max(0, c.capacity - (c.current_enrollment || 0)), 0));

  private readonly avatarColors = [
    '#2563eb', '#6366f1', '#0891b2', '#059669',
    '#d97706', '#dc2626', '#7c3aed', '#db2777',
  ];

  ngOnInit(): void {
    this.service.getClassrooms().subscribe();
  }

  getEnrollmentPct(c: Classroom): number {
    if (!c.capacity) return 0;
    return Math.min(100, Math.round(((c.current_enrollment || 0) / c.capacity) * 100));
  }

  getAvatarColor(name: string): string {
    return this.avatarColors[name.charCodeAt(0) % this.avatarColors.length];
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(ClassroomDialogComponent, { width: '500px', data: { isEdit: false } });
    ref.afterClosed().subscribe(result => {
      if (result && typeof result === 'object') {
        this.service.createClassroom(result).subscribe({ next: () => this.service.getClassrooms().subscribe() });
      }
    });
  }

  openEditDialog(classroom: Classroom): void {
    const ref = this.dialog.open(ClassroomDialogComponent, { width: '500px', data: { isEdit: true, classroom } });
    ref.afterClosed().subscribe(result => {
      if (result && typeof result === 'object') {
        this.service.updateClassroom(classroom.id, result).subscribe({ next: () => this.service.getClassrooms().subscribe() });
      }
    });
  }

  deleteClassroom(classroom: Classroom): void {
    if (confirm(`Delete classroom ${classroom.name}?`)) {
      this.service.deleteClassroom(classroom.id).subscribe({ next: () => this.service.getClassrooms().subscribe() });
    }
  }
}
