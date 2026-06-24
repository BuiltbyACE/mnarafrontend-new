import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AcademicsService, KeyStage } from '../../services/academics.service';
import { KeyStageDialogComponent } from './key-stage-dialog.component';

@Component({
  selector: 'app-key-stages-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
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
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <nav class="breadcrumb">
                <span>Academics</span>
                <span class="sep">›</span>
                <span class="crumb-current">Key Stages</span>
              </nav>
              <h1 class="page-title">Key Stages</h1>
              <p class="page-subtitle">Define the academic framework that groups year levels into stages</p>
            </div>
          </div>
          <div class="header-actions">
            <button class="btn btn--primary" (click)="openCreateDialog()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Key Stage
            </button>
          </div>
        </div>
      </header>

      <!-- ── Stats Row ─────────────────────────────────────────────────────── -->
      <div class="stats-grid">

        <div class="stat-card stat-card--emerald">
          <div class="stat-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div class="stat-body">
            <span class="stat-num">{{ allKeyStages().length }}</span>
            <span class="stat-lbl">Total Key Stages</span>
          </div>
          <div class="stat-bg-shape"></div>
        </div>

        <div class="stat-card stat-card--green">
          <div class="stat-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div class="stat-body">
            <span class="stat-num">{{ activeCount() }}</span>
            <span class="stat-lbl">Active Stages</span>
          </div>
          <div class="stat-bg-shape"></div>
        </div>

        <div class="stat-card stat-card--violet">
          <div class="stat-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </div>
          <div class="stat-body">
            <span class="stat-num">{{ totalYearLevels() }}</span>
            <span class="stat-lbl">Year Levels Mapped</span>
          </div>
          <div class="stat-bg-shape"></div>
        </div>

        <div class="stat-card stat-card--amber">
          <div class="stat-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <div class="stat-body">
            <span class="stat-num">{{ documentedCount() }}</span>
            <span class="stat-lbl">Documented</span>
          </div>
          <div class="stat-bg-shape"></div>
        </div>

      </div>

      <!-- ── Data Card ──────────────────────────────────────────────────────── -->
      <div class="data-card">

        <!-- Toolbar -->
        <div class="data-toolbar">
          <div class="toolbar-left">
            <span class="data-title">All Key Stages</span>
            <span class="data-count-badge">{{ filteredKeyStages().length }}</span>
          </div>
          <div class="toolbar-right">
            <div class="search-wrap">
              <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                class="search-input"
                placeholder="Search by name, code, or level…"
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
              <span>Loading key stages…</span>
            </div>
          } @else {
            <table mat-table [dataSource]="filteredKeyStages()" class="ks-table">

              <!-- ─ Name & Code ─ -->
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Stage</th>
                <td mat-cell *matCellDef="let ks">
                  <div class="cell-stage">
                    <div class="stage-avatar" [style.background]="getAvatarColor(ks.name)">
                      {{ ks.code ? ks.code.slice(0,2).toUpperCase() : ks.name.charAt(0).toUpperCase() }}
                    </div>
                    <div class="stage-meta">
                      <span class="stage-name">{{ ks.name }}</span>
                      <div class="stage-tags">
                        @if (ks.code) {
                          <span class="stage-code">{{ ks.code }}</span>
                        }
                        @if (ks.level) {
                          <span class="stage-level">{{ ks.level }}</span>
                        }
                        @if (ks.order != null) {
                          <span class="stage-order">#{{ ks.order }}</span>
                        }
                      </div>
                    </div>
                  </div>
                </td>
              </ng-container>

              <!-- ─ Description ─ -->
              <ng-container matColumnDef="description">
                <th mat-header-cell *matHeaderCellDef>Description</th>
                <td mat-cell *matCellDef="let ks">
                  @if (ks.description) {
                    <p class="cell-desc" [matTooltip]="ks.description.length > 80 ? ks.description : ''" matTooltipClass="desc-tooltip">
                      {{ ks.description | slice:0:80 }}{{ ks.description.length > 80 ? '…' : '' }}
                    </p>
                  } @else {
                    <span class="no-desc">No description added</span>
                  }
                </td>
              </ng-container>

              <!-- ─ Year Levels ─ -->
              <ng-container matColumnDef="levels">
                <th mat-header-cell *matHeaderCellDef>Year Levels</th>
                <td mat-cell *matCellDef="let ks">
                  @if (ks.year_levels && ks.year_levels.length > 0) {
                    <div class="levels-wrap">
                      @for (lvl of ks.year_levels.slice(0, 4); track lvl) {
                        <span class="level-pill">{{ lvl }}</span>
                      }
                      @if (ks.year_levels.length > 4) {
                        <span class="level-pill level-pill--more" [matTooltip]="ks.year_levels.slice(4).join(', ')">
                          +{{ ks.year_levels.length - 4 }}
                        </span>
                      }
                    </div>
                  } @else {
                    <span class="no-levels">
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                        <circle cx="8" cy="8" r="6"/><line x1="8" y1="5" x2="8" y2="8"/><line x1="8" y1="11" x2="8.01" y2="11"/>
                      </svg>
                      None assigned
                    </span>
                  }
                </td>
              </ng-container>

              <!-- ─ Status ─ -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let ks">
                  <span class="status-chip"
                        [class.chip--active]="ks.is_active !== false"
                        [class.chip--inactive]="ks.is_active === false">
                    <span class="chip-dot"></span>
                    {{ ks.is_active === false ? 'Inactive' : 'Active' }}
                  </span>
                </td>
              </ng-container>

              <!-- ─ Actions ─ -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="col-actions">Actions</th>
                <td mat-cell *matCellDef="let ks" class="col-actions">
                  <div class="action-group">
                    <button class="act-btn act-btn--edit" (click)="openEditDialog(ks)" matTooltip="Edit key stage">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button class="act-btn act-btn--delete" (click)="confirmDelete(ks)" matTooltip="Delete key stage">
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
                        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                        <path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                      </svg>
                    </div>
                    <p class="empty-title">{{ searchQuery() ? 'No matches found' : 'No key stages yet' }}</p>
                    <p class="empty-sub">{{ searchQuery() ? 'Try searching by name, code, or level' : 'Key stages group year levels into a structured academic framework' }}</p>
                    @if (!searchQuery()) {
                      <button class="btn btn--primary btn--sm" (click)="openCreateDialog()">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Add First Key Stage
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

    .header-left { display: flex; align-items: flex-start; gap: 16px; }

    .page-icon {
      width: 52px;
      height: 52px;
      background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.32);
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
      .crumb-current { color: #2563eb; font-weight: 500; }
    }

    .page-title {
      font-size: 23px;
      font-weight: 700;
      color: #111827;
      letter-spacing: -0.025em;
      margin: 0 0 3px;
    }

    .page-subtitle { font-size: 13.5px; color: #6b7280; margin: 0; }

    .header-actions { display: flex; gap: 10px; align-items: center; flex-shrink: 0; }

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

    .stat-card--emerald {
      .stat-icon-wrap { background: #eff6ff; svg { stroke: #2563eb; } }
      .stat-bg-shape  { background: #2563eb; }
    }
    .stat-card--green {
      .stat-icon-wrap { background: #dbeafe; svg { stroke: #3b82f6; } }
      .stat-bg-shape  { background: #3b82f6; }
    }
    .stat-card--violet {
      .stat-icon-wrap { background: #f5f3ff; svg { stroke: #7c3aed; } }
      .stat-bg-shape  { background: #7c3aed; }
    }
    .stat-card--amber {
      .stat-icon-wrap { background: #fffbeb; svg { stroke: #d97706; } }
      .stat-bg-shape  { background: #d97706; }
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
      background: #eff6ff;
      color: #2563eb;
      font-size: 11.5px;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 99px;
      border: 1px solid #bfdbfe;
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
      width: 260px;
      transition: border-color 0.15s, box-shadow 0.15s;
      &::placeholder { color: #9ca3af; }
      &:focus {
        outline: none;
        border-color: #2563eb;
        background: #fff;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
      }
    }

    /* ── Table ───────────────────────────────────────────────────────────── */
    .table-scroll { overflow-x: auto; }

    .ks-table {
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

    /* ── Cell: Stage ─────────────────────────────────────────────────────── */
    .cell-stage { display: flex; align-items: center; gap: 12px; }

    .stage-avatar {
      width: 42px;
      height: 42px;
      border-radius: 11px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 800;
      color: #fff;
      flex-shrink: 0;
      font-family: 'Fira Code', monospace;
      letter-spacing: 0.02em;
    }

    .stage-meta { display: flex; flex-direction: column; gap: 4px; }

    .stage-name { font-weight: 600; color: #111827; font-size: 14px; }

    .stage-tags {
      display: flex;
      align-items: center;
      gap: 5px;
      flex-wrap: wrap;
    }

    .stage-code {
      font-family: 'Fira Code', 'Consolas', monospace;
      font-size: 11px;
      font-weight: 600;
      color: #2563eb;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 2px 7px;
      border-radius: 5px;
      letter-spacing: 0.04em;
    }

    .stage-level {
      font-size: 11px;
      color: #7c3aed;
      background: #f5f3ff;
      border: 1px solid #ede9fe;
      padding: 2px 7px;
      border-radius: 5px;
      font-weight: 500;
    }

    .stage-order {
      font-size: 11px;
      color: #9ca3af;
      background: #f9fafb;
      border: 1px solid #f3f4f6;
      padding: 2px 7px;
      border-radius: 5px;
      font-weight: 500;
    }

    /* ── Cell: Description ───────────────────────────────────────────────── */
    .cell-desc {
      font-size: 13px;
      color: #4b5563;
      line-height: 1.5;
      margin: 0;
      max-width: 280px;
    }

    .no-desc {
      font-size: 12.5px;
      color: #d1d5db;
      font-style: italic;
    }

    /* ── Cell: Year Levels ───────────────────────────────────────────────── */
    .levels-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
    }

    .level-pill {
      display: inline-block;
      padding: 3px 9px;
      background: #ede9fe;
      color: #5b21b6;
      border-radius: 6px;
      font-size: 11.5px;
      font-weight: 600;
      border: 1px solid #ddd6fe;
      white-space: nowrap;

      &--more {
        background: #f5f3ff;
        color: #7c3aed;
        cursor: help;
      }
    }

    .no-levels {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12.5px;
      color: #d1d5db;
      font-style: italic;
      svg { width: 13px; height: 13px; }
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
    .empty-sub   { font-size: 13.5px; color: #9ca3af; margin: 0 0 12px; max-width: 340px; text-align: center; }

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
export class KeyStagesListComponent implements OnInit {
  readonly service  = inject(AcademicsService);
  readonly dialog   = inject(MatDialog);
  private snackBar  = inject(MatSnackBar);

  searchQuery      = signal('');
  displayedColumns = ['name', 'description', 'levels', 'status', 'actions'];

  readonly allKeyStages = this.service.keyStages;

  readonly filteredKeyStages = computed(() => {
    const list = this.service.keyStages();
    if (!this.searchQuery()) return list;
    const q = this.searchQuery().toLowerCase();
    return list.filter(ks =>
      ks.name.toLowerCase().includes(q) ||
      (ks.code ?? '').toLowerCase().includes(q) ||
      (ks.description ?? '').toLowerCase().includes(q) ||
      (ks.level ?? '').toLowerCase().includes(q) ||
      ks.year_levels.some(l => l.toLowerCase().includes(q))
    );
  });

  readonly activeCount      = computed(() => this.service.keyStages().filter(ks => ks.is_active !== false).length);
  readonly totalYearLevels  = computed(() => this.service.keyStages().reduce((s, ks) => s + ks.year_levels.length, 0));
  readonly documentedCount  = computed(() => this.service.keyStages().filter(ks => ks.description && ks.description.trim().length > 0).length);

  private readonly avatarColors = [
    '#0ea5e9', '#0891b2', '#2563eb', '#6366f1',
    '#7c3aed', '#d97706', '#dc2626', '#db2777',
  ];

  ngOnInit(): void {
    this.service.getKeyStages().subscribe();
  }

  getAvatarColor(name: string): string {
    return this.avatarColors[name.charCodeAt(0) % this.avatarColors.length];
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(KeyStageDialogComponent, {
      width: '560px',
      maxHeight: '90vh',
      disableClose: false,
      data: { isEdit: false },
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.service.createKeyStage(result).subscribe({
          next: () => {
            this.snackBar.open('Key stage created successfully', 'Close', { duration: 3000, panelClass: 'success-snackbar' });
            this.service.getKeyStages().subscribe();
          },
          error: () => this.snackBar.open('Failed to create key stage', 'Close', { duration: 4000, panelClass: 'error-snackbar' }),
        });
      }
    });
  }

  openEditDialog(keyStage: KeyStage): void {
    const ref = this.dialog.open(KeyStageDialogComponent, {
      width: '560px',
      maxHeight: '90vh',
      disableClose: false,
      data: { isEdit: true, keyStage },
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.service.updateKeyStage(keyStage.id, result).subscribe({
          next: () => {
            this.snackBar.open('Key stage updated', 'Close', { duration: 3000, panelClass: 'success-snackbar' });
            this.service.getKeyStages().subscribe();
          },
          error: () => this.snackBar.open('Failed to update key stage', 'Close', { duration: 4000, panelClass: 'error-snackbar' }),
        });
      }
    });
  }

  confirmDelete(keyStage: KeyStage): void {
    if (confirm(`Delete "${keyStage.name}"?\n\nThis cannot be undone. Year levels assigned to this stage will be unaffected.`)) {
      this.service.deleteKeyStage(keyStage.id).subscribe({
        next: () => this.snackBar.open(`"${keyStage.name}" deleted`, 'Close', { duration: 3000, panelClass: 'success-snackbar' }),
        error: () => this.snackBar.open('Failed to delete key stage', 'Close', { duration: 4000, panelClass: 'error-snackbar' }),
      });
    }
  }
}
