import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AcademicsService, Department } from '../../services/academics.service';
import { DepartmentDialogComponent } from './department-dialog.component';

@Component({
  selector: 'app-departments-list',
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
                <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
              </svg>
            </div>
            <div>
              <nav class="breadcrumb">
                <span>Academics</span>
                <span class="sep">›</span>
                <span class="crumb-current">Departments</span>
              </nav>
              <h1 class="page-title">Departments</h1>
              <p class="page-subtitle">Manage academic departments and heads of department</p>
            </div>
          </div>
          <div class="header-actions">
            <button class="btn btn--primary" (click)="openCreateDialog()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Department
            </button>
          </div>
        </div>
      </header>

      <!-- ── Stats Row ─────────────────────────────────────────────────────── -->
      <div class="stats-grid">

        <div class="stat-card stat-card--teal">
          <div class="stat-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
            </svg>
          </div>
          <div class="stat-body">
            <span class="stat-num">{{ allDepartments().length }}</span>
            <span class="stat-lbl">Total Departments</span>
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
            <span class="stat-lbl">Active</span>
          </div>
          <div class="stat-bg-shape"></div>
        </div>

        <div class="stat-card stat-card--violet">
          <div class="stat-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
            </svg>
          </div>
          <div class="stat-body">
            <span class="stat-num">{{ totalSubjects() }}</span>
            <span class="stat-lbl">Total Subjects</span>
          </div>
          <div class="stat-bg-shape"></div>
        </div>

        <div class="stat-card stat-card--blue">
          <div class="stat-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div class="stat-body">
            <span class="stat-num">{{ withHodCount() }}</span>
            <span class="stat-lbl">HODs Assigned</span>
          </div>
          <div class="stat-bg-shape"></div>
        </div>

      </div>

      <!-- ── Data Card ──────────────────────────────────────────────────────── -->
      <div class="data-card">

        <!-- Toolbar -->
        <div class="data-toolbar">
          <div class="toolbar-left">
            <span class="data-title">All Departments</span>
            <span class="data-count-badge">{{ filteredDepartments().length }}</span>
          </div>
          <div class="toolbar-right">
            <div class="search-wrap">
              <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                class="search-input"
                placeholder="Search departments..."
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
              <span>Loading departments…</span>
            </div>
          } @else {
            <table mat-table [dataSource]="filteredDepartments()" class="departments-table">

              <!-- ─ Department ─ -->
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Department</th>
                <td mat-cell *matCellDef="let d">
                  <div class="cell-department">
                    <div class="dept-avatar" [style.background]="getAvatarColor(d.name)">
                      {{ d.name.charAt(0).toUpperCase() }}
                    </div>
                    <div class="dept-meta">
                      <span class="dept-name">{{ d.name }}</span>
                      @if (d.subject_count) {
                        <span class="dept-subjects">
                          <svg viewBox="0 0 16 16" fill="currentColor">
                            <path d="M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v16H6.5A2.5 2.5 0 014 4.5v-2A2.5 2.5 0 016.5 0z" transform="scale(0.67)"/>
                          </svg>
                          {{ d.subject_count }} subject{{ d.subject_count !== 1 ? 's' : '' }}
                        </span>
                      }
                    </div>
                  </div>
                </td>
              </ng-container>

              <!-- ─ Code ─ -->
              <ng-container matColumnDef="code">
                <th mat-header-cell *matHeaderCellDef>Code</th>
                <td mat-cell *matCellDef="let d">
                  @if (d.code) {
                    <span class="code-chip">{{ d.code }}</span>
                  } @else {
                    <span class="text-faint">—</span>
                  }
                </td>
              </ng-container>

              <!-- ─ HOD ─ -->
              <ng-container matColumnDef="head_of_department">
                <th mat-header-cell *matHeaderCellDef>Head of Department</th>
                <td mat-cell *matCellDef="let d">
                  @if (getHodName(d)) {
                    <div class="cell-hod">
                      <div class="hod-avatar">{{ getInitials(getHodName(d)!) }}</div>
                      <span class="hod-name">{{ getHodName(d) }}</span>
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
              <ng-container matColumnDef="is_active">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let d">
                  <span class="status-chip"
                        [class.chip--active]="d.is_active !== false"
                        [class.chip--inactive]="d.is_active === false">
                    <span class="chip-dot"></span>
                    {{ d.is_active === false ? 'Inactive' : 'Active' }}
                  </span>
                </td>
              </ng-container>

              <!-- ─ Actions ─ -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="col-actions">Actions</th>
                <td mat-cell *matCellDef="let d" class="col-actions">
                  <div class="action-group">
                    <button class="act-btn act-btn--edit" (click)="openEditDialog(d)" matTooltip="Edit department">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button class="act-btn act-btn--delete" (click)="deleteDepartment(d)" matTooltip="Delete department">
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
                        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/>
                        <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
                      </svg>
                    </div>
                    <p class="empty-title">No departments found</p>
                    <p class="empty-sub">{{ searchQuery() ? 'Try a different search term' : 'Add your first department to get started' }}</p>
                    @if (!searchQuery()) {
                      <button class="btn btn--primary btn--sm" (click)="openCreateDialog()">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Add Department
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
      background: linear-gradient(135deg, #0891b2 0%, #6366f1 100%);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 14px rgba(8, 145, 178, 0.35);
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
      .crumb-current { color: #0891b2; font-weight: 500; }
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
        background: linear-gradient(135deg, #0891b2 0%, #0ea5e9 100%);
        color: #fff;
        box-shadow: 0 2px 8px rgba(8, 145, 178, 0.32);
        &:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(8, 145, 178, 0.42); }
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
      &:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.06), 0 10px 28px rgba(0,0,0,0.06); }
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

    .stat-body { display: flex; flex-direction: column; gap: 3px; z-index: 1; }

    .stat-num {
      font-size: 30px;
      font-weight: 700;
      line-height: 1;
      letter-spacing: -0.03em;
      color: #111827;
    }

    .stat-lbl { font-size: 12.5px; color: #6b7280; font-weight: 500; }

    .stat-bg-shape {
      position: absolute;
      right: -18px;
      top: -18px;
      width: 96px;
      height: 96px;
      border-radius: 50%;
      opacity: 0.07;
    }

    .stat-card--teal {
      .stat-icon-wrap { background: #ecfeff; svg { stroke: #0891b2; } }
      .stat-bg-shape  { background: #0891b2; }
    }
    .stat-card--emerald {
      .stat-icon-wrap { background: #f0fdf4; svg { stroke: #16a34a; } }
      .stat-bg-shape  { background: #16a34a; }
    }
    .stat-card--violet {
      .stat-icon-wrap { background: #f5f3ff; svg { stroke: #7c3aed; } }
      .stat-bg-shape  { background: #7c3aed; }
    }
    .stat-card--blue {
      .stat-icon-wrap { background: #eff6ff; svg { stroke: #2563eb; } }
      .stat-bg-shape  { background: #2563eb; }
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

    .toolbar-left { display: flex; align-items: center; gap: 10px; }
    .toolbar-right { display: flex; align-items: center; gap: 10px; }

    .data-title { font-size: 15px; font-weight: 600; color: #111827; }

    .data-count-badge {
      background: #ecfeff;
      color: #0891b2;
      font-size: 11.5px;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 99px;
      border: 1px solid #a5f3fc;
    }

    /* ── Search ──────────────────────────────────────────────────────────── */
    .search-wrap { position: relative; display: flex; align-items: center; }

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
        border-color: #0891b2;
        background: #fff;
        box-shadow: 0 0 0 3px rgba(8, 145, 178, 0.12);
      }
    }

    /* ── Table ───────────────────────────────────────────────────────────── */
    .table-scroll { overflow-x: auto; }

    .departments-table {
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
        &:hover { background: #f8fffe !important; }

        .mat-mdc-cell {
          border-bottom: 1px solid #f8fafc !important;
          padding: 14px 16px !important;
          font-size: 13.5px;
          vertical-align: middle;
        }
      }
    }

    /* ── Cell: Department ────────────────────────────────────────────────── */
    .cell-department { display: flex; align-items: center; gap: 12px; }

    .dept-avatar {
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

    .dept-meta { display: flex; flex-direction: column; gap: 3px; }

    .dept-name { font-weight: 600; color: #111827; font-size: 14px; }

    .dept-subjects {
      display: flex;
      align-items: center;
      gap: 3px;
      font-size: 11.5px;
      color: #9ca3af;
    }

    /* ── Cell: Code ──────────────────────────────────────────────────────── */
    .code-chip {
      display: inline-block;
      padding: 4px 10px;
      background: #f0f4ff;
      color: #4338ca;
      border-radius: 7px;
      font-size: 12px;
      font-weight: 600;
      font-family: 'Fira Code', 'Courier New', monospace;
      letter-spacing: 0.04em;
      border: 1px solid #e0e7ff;
    }

    .text-faint { color: #d1d5db; }

    /* ── Cell: HOD ───────────────────────────────────────────────────────── */
    .cell-hod { display: flex; align-items: center; gap: 9px; }

    .hod-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0891b2, #6366f1);
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      letter-spacing: 0.03em;
    }

    .hod-name { font-size: 13.5px; color: #374151; font-weight: 500; }

    .unassigned-label {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 12.5px;
      color: #d1d5db;
      font-style: italic;
      svg { width: 14px; height: 14px; stroke: #d1d5db; }
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

    .chip-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

    .chip--active {
      background: #f0fdf4;
      color: #15803d;
      border: 1px solid #bbf7d0;
      .chip-dot { background: #22c55e; box-shadow: 0 0 0 2.5px rgba(34,197,94,0.18); }
    }

    .chip--inactive {
      background: #fef2f2;
      color: #b91c1c;
      border: 1px solid #fecaca;
      .chip-dot { background: #ef4444; }
    }

    /* ── Cell: Actions ───────────────────────────────────────────────────── */
    .col-actions { width: 100px; text-align: right !important; }

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
        color: #0891b2;
        &:hover { background: #ecfeff; border-color: #a5f3fc; }
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
export class DepartmentsListComponent implements OnInit {
  readonly service = inject(AcademicsService);
  readonly dialog  = inject(MatDialog);

  searchQuery      = signal('');
  displayedColumns = ['name', 'code', 'head_of_department', 'is_active', 'actions'];

  readonly allDepartments = this.service.departments;

  readonly filteredDepartments = computed(() => {
    const list = this.service.departments();
    if (!this.searchQuery()) return list;
    const q = this.searchQuery().toLowerCase();
    return list.filter(d =>
      d.name.toLowerCase().includes(q) ||
      (d.code ?? '').toLowerCase().includes(q) ||
      (d.head_of_department?.name ?? '').toLowerCase().includes(q) ||
      (d.hod_name ?? '').toLowerCase().includes(q)
    );
  });

  readonly activeCount  = computed(() => this.service.departments().filter(d => d.is_active !== false).length);
  readonly totalSubjects = computed(() => this.service.departments().reduce((s, d) => s + (d.subject_count ?? 0), 0));
  readonly withHodCount = computed(() => this.service.departments().filter(d => this.getHodName(d)).length);

  private readonly avatarColors = [
    '#0891b2', '#2563eb', '#6366f1', '#059669',
    '#d97706', '#dc2626', '#7c3aed', '#db2777',
  ];

  ngOnInit(): void {
    this.service.getDepartments().subscribe();
  }

  getHodName(d: Department): string | null {
    return d.head_of_department?.name ?? d.hod_name ?? d.head_of_department_name ?? null;
  }

  getInitials(name: string): string {
    return name.trim().split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }

  getAvatarColor(name: string): string {
    return this.avatarColors[name.charCodeAt(0) % this.avatarColors.length];
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(DepartmentDialogComponent, { width: '500px', data: { isEdit: false } });
    ref.afterClosed().subscribe(result => {
      if (result && typeof result === 'object') {
        this.service.createDepartment(result).subscribe({ next: () => this.service.getDepartments().subscribe() });
      }
    });
  }

  openEditDialog(department: Department): void {
    const ref = this.dialog.open(DepartmentDialogComponent, { width: '500px', data: { isEdit: true, department } });
    ref.afterClosed().subscribe(result => {
      if (result && typeof result === 'object') {
        this.service.updateDepartment(department.id, result).subscribe({ next: () => this.service.getDepartments().subscribe() });
      }
    });
  }

  deleteDepartment(department: Department): void {
    if (confirm(`Delete ${department.name}?`)) {
      this.service.deleteDepartment(department.id).subscribe({ next: () => this.service.getDepartments().subscribe() });
    }
  }
}
