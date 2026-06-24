import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AcademicsService, Subject } from '../../services/academics.service';
import { SubjectDialogComponent } from './subject-dialog.component';

@Component({
  selector: 'app-subjects-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatSnackBarModule, MatTooltipModule],
  template: `
<div class="subj-page">

  <!-- ── Header ───────────────────────────────────────────────────────── -->
  <div class="subj-header">
    <div class="header-lead">
      <div class="page-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
          <circle cx="7" cy="7" r="1" fill="currentColor"/>
        </svg>
      </div>
      <div class="header-text">
        <nav class="breadcrumb">
          <span>Academics</span>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="6 3 10 8 6 13"/></svg>
          <span class="bc-active">Subjects</span>
        </nav>
        <h1 class="page-title">Subjects</h1>
        <p class="page-sub">{{ service.subjects().length }} subject{{ service.subjects().length !== 1 ? 's' : '' }} across {{ deptCount() }} department{{ deptCount() !== 1 ? 's' : '' }}</p>
      </div>
    </div>
    <button class="add-btn" (click)="openCreateDialog()">
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
        <line x1="10" y1="4" x2="10" y2="16"/><line x1="4" y1="10" x2="16" y2="10"/>
      </svg>
      Add Subject
    </button>
  </div>

  <!-- ── Stats ────────────────────────────────────────────────────────── -->
  <div class="stats-row">
    <div class="stat-card">
      <div class="stat-icon stat-icon--slate">
        <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/></svg>
      </div>
      <div class="stat-body">
        <span class="stat-value">{{ totalCount() }}</span>
        <span class="stat-label">Total Subjects</span>
      </div>
    </div>
    <div class="stat-card stat-card--green">
      <div class="stat-icon stat-icon--green">
        <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
      </div>
      <div class="stat-body">
        <span class="stat-value">{{ activeCount() }}</span>
        <span class="stat-label">Active</span>
      </div>
    </div>
    <div class="stat-card stat-card--red">
      <div class="stat-icon stat-icon--red">
        <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
      </div>
      <div class="stat-body">
        <span class="stat-value">{{ inactiveCount() }}</span>
        <span class="stat-label">Inactive</span>
      </div>
    </div>
    <div class="stat-card stat-card--blue">
      <div class="stat-icon stat-icon--blue">
        <svg viewBox="0 0 20 20" fill="currentColor"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zm-2 4a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"/></svg>
      </div>
      <div class="stat-body">
        <span class="stat-value">{{ deptCount() }}</span>
        <span class="stat-label">Departments</span>
      </div>
    </div>
  </div>

  <!-- ── Content Card ──────────────────────────────────────────────────── -->
  <div class="content-card">

    <!-- Filter bar -->
    <div class="filter-bar">
      <div class="filter-search">
        <svg class="search-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
          <circle cx="8.5" cy="8.5" r="5.5"/><line x1="13.5" y1="13.5" x2="17" y2="17"/>
        </svg>
        <input class="search-input" type="text" placeholder="Search by name, code, department…"
               [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)" />
      </div>

      <div class="filter-select-wrap">
        <select class="filter-select" [ngModel]="filterDept()" (ngModelChange)="filterDept.set($event)">
          <option value="">All Departments</option>
          @for (d of service.departments(); track d.id) {
            <option [value]="d.id.toString()">{{ d.name }}</option>
          }
        </select>
        <svg class="fchev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </div>

      <div class="filter-select-wrap">
        <select class="filter-select" [ngModel]="filterStatus()" (ngModelChange)="filterStatus.set($event)">
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <svg class="fchev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </div>

      @if (activeFilterCount() > 0) {
        <div class="filter-badge">
          <span class="badge-dot"></span>
          {{ activeFilterCount() }} filter{{ activeFilterCount() !== 1 ? 's' : '' }}
        </div>
        <button class="clear-btn" (click)="clearFilters()">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="4" y1="4" x2="12" y2="12"/><line x1="12" y1="4" x2="4" y2="12"/></svg>
          Clear
        </button>
      }

      <span class="result-count">
        {{ filteredSubjects().length }}&nbsp;result{{ filteredSubjects().length !== 1 ? 's' : '' }}
      </span>
    </div>

    <!-- Loading skeletons -->
    @if (service.isLoading()) {
      <div class="grid-scroll">
        <div class="subjects-grid">
          @for (sk of skeletons; track sk) {
            <div class="sk-card">
              <div class="sk-row"><div class="sk-circle"></div><div class="sk-line sk-line--short" style="width:40%"></div></div>
              <div class="sk-line sk-line--title"></div>
              <div class="sk-line sk-line--mid"></div>
              <div class="sk-row" style="gap:6px; margin-top:4px">
                <div class="sk-line sk-line--pill"></div>
                <div class="sk-line sk-line--pill" style="width:55px"></div>
              </div>
              <div class="sk-divider"></div>
              <div class="sk-line sk-line--short" style="width:50%; height:28px; border-radius:8px"></div>
            </div>
          }
        </div>
      </div>

    <!-- Empty state -->
    } @else if (filteredSubjects().length === 0) {
      <div class="empty-state">
        <div class="empty-icon">
          <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M44 24l-8.1 8.1a4 4 0 01-5.65 0L4 6v-2 h22l18 18z"/><circle cx="8" cy="8" r="2" fill="currentColor" stroke="none"/>
          </svg>
        </div>
        @if (activeFilterCount() > 0) {
          <h3 class="empty-title">No subjects match your filters</h3>
          <p class="empty-sub">Try a different search term or clear the active filters</p>
          <button class="empty-btn" (click)="clearFilters()">Clear Filters</button>
        } @else {
          <h3 class="empty-title">No subjects yet</h3>
          <p class="empty-sub">Create your first subject to build the curriculum</p>
          <button class="add-btn" style="margin-top:8px" (click)="openCreateDialog()">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
              <line x1="10" y1="4" x2="10" y2="16"/><line x1="4" y1="10" x2="16" y2="10"/>
            </svg>
            Add First Subject
          </button>
        }
      </div>

    <!-- Grid -->
    } @else {
      <div class="grid-scroll">
        <div class="subjects-grid">
          @for (s of filteredSubjects(); track s.id) {
            <div class="subject-card">

              <!-- Dept radial glow (top-left corner) -->
              <div class="card-glow"
                   [style.background]="'radial-gradient(ellipse at 0% 0%, ' + getDeptColorSet(s).glow + ' 0%, transparent 68%)'">
              </div>

              <!-- Watermark code (bottom-right, decorative) -->
              <span class="card-watermark" [style.color]="getDeptColorSet(s).text">
                {{ getWatermark(s) }}
              </span>

              <!-- Top row: avatar + status badge -->
              <div class="card-top">
                <div class="dept-avatar" [style.background]="getDeptColorSet(s).gradient">
                  {{ getInitial(s.name) }}
                </div>
                <span class="status-badge" [class.status-badge--active]="s.is_active"
                      [class.status-badge--inactive]="!s.is_active">
                  <span class="status-dot" [class.status-dot--active]="s.is_active"></span>
                  {{ s.is_active ? 'Active' : 'Inactive' }}
                </span>
              </div>

              <!-- Name -->
              <h3 class="card-name">{{ s.name }}</h3>

              <!-- Code + dept chips -->
              <div class="card-chips">
                @if (s.code) {
                  <span class="code-chip">{{ s.code }}</span>
                }
                <span class="dept-chip"
                      [style.background]="getDeptColorSet(s).bg"
                      [style.color]="getDeptColorSet(s).text">
                  {{ getDeptName(s) }}
                </span>
              </div>

              <!-- Divider -->
              <div class="card-divider"></div>

              <!-- Actions (revealed on hover) -->
              <div class="card-actions">
                <button class="ca-btn ca-btn--edit" (click)="openEditDialog(s)"
                        matTooltip="Edit subject" matTooltipPosition="above">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11.5 2.5a1.414 1.414 0 012 2L5 13H2v-3L11.5 2.5z"/>
                  </svg>
                  Edit
                </button>
                <button class="ca-btn ca-btn--delete" (click)="confirmDelete(s)"
                        matTooltip="Delete subject" matTooltipPosition="above">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="2 4 14 4"/>
                    <path d="M5 4V2h6v2"/><path d="M6 7v5m4-5v5"/>
                    <rect x="3" y="4" width="10" height="10" rx="1"/>
                  </svg>
                  Delete
                </button>
              </div>

            </div>
          }
        </div>
      </div>
    }

  </div>

</div>
  `,
  styles: [`
    /* ── Page ─────────────────────────────────────────────────────────── */
    .subj-page {
      padding: 28px 32px;
      max-width: 1440px;
      margin: 0 auto;
      display: flex; flex-direction: column; gap: 20px;
      font-family: 'Inter', system-ui, sans-serif;
    }

    /* ── Header ───────────────────────────────────────────────────────── */
    .subj-header {
      display: flex; align-items: flex-end; justify-content: space-between; gap: 16px;
    }

    .header-lead { display: flex; align-items: center; gap: 16px; }

    .page-icon {
      width: 52px; height: 52px; flex-shrink: 0;
      background: linear-gradient(135deg, #2563eb 0%, #3b82f6 55%, #818cf8 100%);
      border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 6px 20px rgba(37,99,235,0.28);
      svg { width: 24px; height: 24px; stroke: #fff; }
    }

    .header-text { display: flex; flex-direction: column; gap: 2px; }

    .breadcrumb {
      display: flex; align-items: center; gap: 5px;
      font-size: 12px; color: #94a3b8;
      svg { width: 11px; height: 11px; stroke: #cbd5e1; }
    }
    .bc-active { color: #64748b; font-weight: 500; }

    .page-title {
      font-size: 22px; font-weight: 800; color: #0f172a;
      letter-spacing: -0.03em; margin: 0; line-height: 1.1;
    }

    .page-sub { font-size: 13px; color: #94a3b8; margin: 0; }

    .add-btn {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 11px 20px;
      background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
      color: #fff; border: none; border-radius: 11px;
      font-size: 14px; font-weight: 600; font-family: inherit;
      cursor: pointer; white-space: nowrap;
      box-shadow: 0 3px 12px rgba(37,99,235,0.30);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      svg { width: 16px; height: 16px; flex-shrink: 0; }
      &:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(37,99,235,0.40); }
      &:active { transform: translateY(0); }
    }

    /* ── Stats ────────────────────────────────────────────────────────── */
    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }

    .stat-card {
      background: #fff; border: 1px solid #f1f5f9; border-radius: 14px;
      padding: 16px 18px; display: flex; align-items: center; gap: 14px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.04);
      transition: box-shadow 0.2s ease;
      &:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.07); }
    }

    .stat-icon {
      width: 42px; height: 42px; border-radius: 11px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      svg { width: 20px; height: 20px; }
    }
    .stat-icon--slate  { background: #f1f5f9; svg { fill: #64748b; } }
    .stat-icon--green  { background: #f0fdf4; svg { fill: #16a34a; } }
    .stat-icon--red    { background: #fef2f2; svg { fill: #dc2626; } }
    .stat-icon--blue   { background: #eff6ff; svg { fill: #2563eb; } }

    .stat-body { display: flex; flex-direction: column; gap: 1px; }
    .stat-value { font-size: 26px; font-weight: 800; color: #0f172a; letter-spacing: -0.04em; line-height: 1; }
    .stat-label { font-size: 12px; font-weight: 500; color: #94a3b8; }

    .stat-card--green .stat-value { color: #16a34a; }
    .stat-card--red   .stat-value { color: #dc2626; }
    .stat-card--blue  .stat-value { color: #2563eb; }

    /* ── Content Card ─────────────────────────────────────────────────── */
    .content-card {
      background: #fff; border: 1px solid #f1f5f9; border-radius: 16px;
      box-shadow: 0 1px 6px rgba(0,0,0,0.05); overflow: hidden;
    }

    /* ── Filter Bar ───────────────────────────────────────────────────── */
    .filter-bar {
      display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
      padding: 16px 20px; border-bottom: 1px solid #f8fafc;
    }

    .filter-search {
      position: relative; flex: 1; min-width: 200px; max-width: 320px;
    }
    .search-icon {
      position: absolute; left: 11px; top: 50%; transform: translateY(-50%);
      width: 15px; height: 15px; stroke: #94a3b8; pointer-events: none;
    }
    .search-input {
      width: 100%; box-sizing: border-box;
      padding: 9px 13px 9px 34px;
      border: 1.5px solid #e2e8f0; border-radius: 10px;
      font-size: 13.5px; font-family: inherit; color: #1e293b; background: #fafbfc;
      transition: all 0.15s ease;
      &::placeholder { color: #c4cad4; }
      &:focus { outline: none; border-color: #2563eb; background: #fff; box-shadow: 0 0 0 3px rgba(37,99,235,0.10); }
    }

    .filter-select-wrap { position: relative; flex-shrink: 0; }
    .filter-select {
      padding: 9px 34px 9px 12px;
      border: 1.5px solid #e2e8f0; border-radius: 10px;
      font-size: 13px; font-family: inherit; color: #374151; background: #fafbfc;
      appearance: none; -webkit-appearance: none; cursor: pointer;
      transition: all 0.15s ease;
      &:focus { outline: none; border-color: #2563eb; background: #fff; box-shadow: 0 0 0 3px rgba(37,99,235,0.10); }
    }
    .fchev {
      position: absolute; right: 9px; top: 50%; transform: translateY(-50%);
      width: 14px; height: 14px; stroke: #9ca3af; pointer-events: none;
      transition: transform 0.2s ease, stroke 0.15s ease;
    }
    .filter-select:focus ~ .fchev { stroke: #2563eb; transform: translateY(-50%) rotate(180deg); }

    .filter-badge {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 12px; background: #eff6ff; color: #2563eb;
      border-radius: 20px; font-size: 12px; font-weight: 600;
    }
    .badge-dot { width: 6px; height: 6px; background: #2563eb; border-radius: 50%; }

    .clear-btn {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 6px 12px; background: #fff; color: #ef4444;
      border: 1.5px solid #fecaca; border-radius: 8px;
      font-size: 12px; font-weight: 600; font-family: inherit; cursor: pointer;
      transition: all 0.15s ease;
      svg { width: 11px; height: 11px; stroke: #ef4444; }
      &:hover { background: #fef2f2; border-color: #f87171; }
    }

    .result-count {
      margin-left: auto; font-size: 12.5px; color: #94a3b8; font-weight: 500;
    }

    /* ── Scroll container ─────────────────────────────────────────────── */
    .grid-scroll {
      height: calc(100vh - 380px);
      min-height: 440px;
      overflow-y: auto; overflow-x: hidden;
      scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent;
      &::-webkit-scrollbar { width: 5px; }
      &::-webkit-scrollbar-track { background: transparent; }
      &::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }
    }

    /* ── Grid ─────────────────────────────────────────────────────────── */
    .subjects-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      padding: 20px;
    }

    /* ── Subject Card ─────────────────────────────────────────────────── */
    .subject-card {
      position: relative; overflow: hidden;
      background: #fff;
      border: 1px solid rgba(15, 23, 42, 0.07);
      border-radius: 16px;
      padding: 18px 18px 14px;
      display: flex; flex-direction: column; gap: 8px;
      cursor: default;

      /* Spring hover — the iPhone feel */
      transition:
        transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
        box-shadow 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
        border-color 0.22s ease;

      box-shadow:
        0 1px 3px rgba(0,0,0,0.05),
        0 1px 2px rgba(0,0,0,0.03);

      /* Shimmer sweep layer */
      &::after {
        content: '';
        position: absolute; top: 0; left: -120%;
        width: 55%; height: 100%;
        background: linear-gradient(to right, transparent, rgba(255,255,255,0.48), transparent);
        transform: skewX(-18deg);
        pointer-events: none;
      }

      &:hover {
        transform: translateY(-5px);
        border-color: rgba(37, 99, 235, 0.14);
        box-shadow:
          0 16px 48px rgba(0,0,0,0.10),
          0 4px 16px rgba(0,0,0,0.06),
          0 0 0 1px rgba(37,99,235,0.05);

        &::after { left: 160%; transition: left 0.5s ease; }
        .card-actions { opacity: 1; transform: translateY(0); }
      }
    }

    /* Dept radial glow - top-left corner */
    .card-glow {
      position: absolute; top: 0; left: 0;
      width: 160px; height: 130px;
      pointer-events: none;
      border-radius: 16px 0 0 0;
    }

    /* Watermark - bottom-right, decorative faded code */
    .card-watermark {
      position: absolute;
      right: 10px; bottom: 42px;
      font-size: 62px; font-weight: 900;
      font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
      letter-spacing: -0.06em;
      line-height: 1;
      opacity: 0.065;
      pointer-events: none; user-select: none;
    }

    /* Top row: avatar + status */
    .card-top {
      display: flex; align-items: center; justify-content: space-between;
      position: relative; z-index: 1;
    }

    .dept-avatar {
      width: 40px; height: 40px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 17px; font-weight: 800; color: #fff;
      letter-spacing: -0.01em;
      box-shadow: 0 3px 10px rgba(0,0,0,0.18);
      flex-shrink: 0;
    }

    .status-badge {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 4px 9px; border-radius: 20px;
      font-size: 11px; font-weight: 600;
      &--active   { background: #f0fdf4; color: #16a34a; }
      &--inactive { background: #f8fafc; color: #94a3b8; }
    }

    @keyframes pulse-dot {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.35; }
    }

    .status-dot {
      width: 5px; height: 5px; border-radius: 50%; background: #94a3b8; flex-shrink: 0;
      &--active { background: #22c55e; animation: pulse-dot 2.4s ease-in-out infinite; }
    }

    /* Subject name */
    .card-name {
      font-size: 15.5px; font-weight: 700; color: #0f172a;
      letter-spacing: -0.025em; line-height: 1.3; margin: 0;
      position: relative; z-index: 1;
    }

    /* Chips row */
    .card-chips {
      display: flex; flex-wrap: wrap; gap: 5px;
      position: relative; z-index: 1;
    }

    .code-chip {
      font-size: 10.5px; font-weight: 700;
      font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
      color: #2563eb; background: #eff6ff;
      padding: 3px 8px; border-radius: 5px;
      letter-spacing: 0.06em;
    }

    .dept-chip {
      font-size: 11px; font-weight: 600;
      padding: 3px 9px; border-radius: 6px;
      max-width: 160px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }

    /* Divider */
    .card-divider { height: 1px; background: #f1f5f9; margin: 2px 0; }

    /* Actions — revealed on hover */
    .card-actions {
      display: flex; gap: 6px;
      opacity: 0; transform: translateY(5px);
      transition: opacity 0.2s ease, transform 0.2s ease;
    }

    .ca-btn {
      flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 5px;
      padding: 7px 10px;
      border: 1.5px solid transparent; border-radius: 9px;
      font-size: 12.5px; font-weight: 600; font-family: inherit; cursor: pointer;
      transition: all 0.15s ease;
      svg { width: 13px; height: 13px; flex-shrink: 0; }

      &--edit {
        background: #f8fafc; color: #374151; border-color: #e8ecf3;
        svg { stroke: #64748b; }
        &:hover { background: #eff6ff; border-color: #bfdbfe; color: #2563eb; svg { stroke: #2563eb; } }
      }

      &--delete {
        background: #f8fafc; color: #374151; border-color: #e8ecf3;
        svg { stroke: #64748b; }
        &:hover { background: #fef2f2; border-color: #fecaca; color: #ef4444; svg { stroke: #ef4444; } }
      }
    }

    /* ── Skeleton ─────────────────────────────────────────────────────── */
    .sk-card {
      border-radius: 16px; border: 1px solid #f1f5f9; padding: 18px;
      display: flex; flex-direction: column; gap: 10px; background: #fff;
    }

    @keyframes shimmer {
      0%   { background-position: -200% 0; }
      100% { background-position:  200% 0; }
    }

    .sk-row { display: flex; align-items: center; gap: 10px; }

    .sk-circle {
      width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
      background: linear-gradient(90deg, #f1f5f9 25%, #e8ecf0 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s ease-in-out infinite;
    }

    .sk-line {
      border-radius: 6px;
      background: linear-gradient(90deg, #f1f5f9 25%, #e8ecf0 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s ease-in-out infinite;
      &--short  { height: 12px; width: 35%; }
      &--mid    { height: 12px; width: 60%; }
      &--title  { height: 18px; width: 80%; border-radius: 7px; }
      &--pill   { height: 22px; width: 70px; border-radius: 6px; }
    }

    .sk-divider { height: 1px; background: #f1f5f9; }

    /* ── Empty State ──────────────────────────────────────────────────── */
    .empty-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 72px 24px; gap: 10px; text-align: center;
    }
    .empty-icon {
      width: 72px; height: 72px; border-radius: 20px; background: #f8fafc;
      display: flex; align-items: center; justify-content: center; margin-bottom: 6px;
      svg { width: 40px; height: 40px; stroke: #c8d4e3; }
    }
    .empty-title { font-size: 17px; font-weight: 700; color: #1e293b; margin: 0; }
    .empty-sub   { font-size: 13px; color: #94a3b8; margin: 0; }
    .empty-btn {
      margin-top: 6px; padding: 9px 20px;
      background: #fff; color: #2563eb; border: 1.5px solid #bfdbfe;
      border-radius: 9px; font-size: 13.5px; font-weight: 600; font-family: inherit; cursor: pointer;
      transition: all 0.15s ease;
      &:hover { background: #eff6ff; }
    }

    /* ── Responsive ───────────────────────────────────────────────────── */
    @media (max-width: 1200px) { .subjects-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 900px)  { .subjects-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 640px)  {
      .subj-page { padding: 16px; }
      .subj-header { flex-direction: column; align-items: flex-start; }
      .stats-row { grid-template-columns: repeat(2, 1fr); }
      .subjects-grid { grid-template-columns: 1fr; }
      .filter-search { max-width: 100%; }
      .grid-scroll { height: calc(100vh - 420px); min-height: 320px; }
    }
  `],
})
export class SubjectsListComponent implements OnInit {
  readonly service = inject(AcademicsService);
  private dialog   = inject(MatDialog);
  private snack    = inject(MatSnackBar);

  readonly skeletons = [1, 2, 3, 4, 5, 6, 7, 8];

  searchQuery   = signal('');
  filterDept    = signal('');
  filterStatus  = signal('');

  readonly totalCount    = computed(() => this.service.subjects().length);
  readonly activeCount   = computed(() => this.service.subjects().filter(s => s.is_active).length);
  readonly inactiveCount = computed(() => this.service.subjects().filter(s => !s.is_active).length);

  readonly deptCount = computed(() => {
    const seen = new Set<string>();
    this.service.subjects().forEach(s => seen.add(this.getDeptName(s)));
    seen.delete('—');
    return seen.size;
  });

  readonly uniqueDepts = computed(() => {
    const seen = new Map<number, string>();
    this.service.subjects().forEach(s => {
      if (typeof s.department === 'object' && s.department?.id) {
        seen.set(s.department.id, s.department.name);
      }
    });
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  });

  readonly activeFilterCount = computed(() =>
    [this.searchQuery(), this.filterDept(), this.filterStatus()].filter(v => v !== '').length
  );

  readonly filteredSubjects = computed(() => {
    let subs = this.service.subjects();
    const q = this.searchQuery().toLowerCase().trim();
    if (q) subs = subs.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.code || '').toLowerCase().includes(q) ||
      this.getDeptName(s).toLowerCase().includes(q)
    );
    const dId = this.filterDept();
    if (dId) subs = subs.filter(s => {
      const id = typeof s.department === 'object' && s.department !== null
        ? s.department.id
        : typeof s.department === 'number'
          ? s.department
          : 0;
      return id.toString() === dId;
    });
    const st = this.filterStatus();
    if (st === 'active')   subs = subs.filter(s => s.is_active);
    if (st === 'inactive') subs = subs.filter(s => !s.is_active);
    return subs;
  });

  private readonly deptColorPalette = [
    { gradient: 'linear-gradient(135deg, #2563eb, #3b82f6)', bg: '#eff6ff', text: '#2563eb', glow: 'rgba(37,99,235,0.09)' },
    { gradient: 'linear-gradient(135deg, #7c3aed, #8b5cf6)', bg: '#f5f3ff', text: '#7c3aed', glow: 'rgba(124,58,237,0.09)' },
    { gradient: 'linear-gradient(135deg, #0891b2, #06b6d4)', bg: '#ecfeff', text: '#0891b2', glow: 'rgba(8,145,178,0.09)' },
    { gradient: 'linear-gradient(135deg, #059669, #10b981)', bg: '#f0fdf4', text: '#059669', glow: 'rgba(5,150,105,0.09)' },
    { gradient: 'linear-gradient(135deg, #d97706, #f59e0b)', bg: '#fffbeb', text: '#d97706', glow: 'rgba(217,119,6,0.09)' },
    { gradient: 'linear-gradient(135deg, #ea580c, #f97316)', bg: '#fff7ed', text: '#ea580c', glow: 'rgba(234,88,12,0.09)' },
    { gradient: 'linear-gradient(135deg, #db2777, #ec4899)', bg: '#fdf2f8', text: '#db2777', glow: 'rgba(219,39,119,0.09)' },
    { gradient: 'linear-gradient(135deg, #0369a1, #0284c7)', bg: '#f0f9ff', text: '#0369a1', glow: 'rgba(3,105,161,0.09)' },
  ];

  getDeptColorSet(s: Subject) {
    const id = typeof s.department === 'object' && s.department !== null
      ? s.department.id
      : typeof s.department === 'number'
        ? s.department
        : 0;
    return this.deptColorPalette[Math.abs(id) % this.deptColorPalette.length];
  }

  getDeptName(s: Subject): string {
    if (typeof s.department === 'object' && s.department?.name) return s.department.name;
    return s.department_name || '—';
  }

  getInitial(name: string): string {
    return name.trim()[0]?.toUpperCase() || '?';
  }

  getWatermark(s: Subject): string {
    if (s.code) return s.code.toUpperCase();
    return s.name.replace(/\s+/g, '').toUpperCase().slice(0, 5);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.filterDept.set('');
    this.filterStatus.set('');
  }

  ngOnInit(): void {
    this.service.getSubjects().subscribe();
    this.service.getDepartments().subscribe();
  }

  openCreateDialog(): void {
    this.dialog.open(SubjectDialogComponent, {
      width: '520px',
      data: { isEdit: false },
    }).afterClosed().subscribe(result => {
      if (!result) return;
      this.service.createSubject(result).subscribe({
        next: () => this.snack.open('Subject created successfully', 'Dismiss', { duration: 3000 }),
        error: () => this.snack.open('Failed to create subject', 'Dismiss', { duration: 3500 }),
      });
    });
  }

  openEditDialog(subject: Subject): void {
    this.dialog.open(SubjectDialogComponent, {
      width: '520px',
      data: { isEdit: true, subject },
    }).afterClosed().subscribe(result => {
      if (!result) return;
      this.service.updateSubject(subject.id, result).subscribe({
        next: () => this.snack.open('Subject updated', 'Dismiss', { duration: 3000 }),
        error: () => this.snack.open('Failed to update subject', 'Dismiss', { duration: 3500 }),
      });
    });
  }

  confirmDelete(subject: Subject): void {
    if (!confirm(`Delete "${subject.name}"? This cannot be undone.`)) return;
    this.service.deleteSubject(subject.id).subscribe({
      next: () => this.snack.open(`"${subject.name}" deleted`, 'Dismiss', { duration: 3000 }),
      error: () => this.snack.open('Failed to delete subject', 'Dismiss', { duration: 3500 }),
    });
  }
}
