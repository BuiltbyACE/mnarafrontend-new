import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AcademicsService, SubjectOffering } from '../../services/academics.service';
import { SubjectOfferingDialogComponent } from './subject-offering-dialog.component';

@Component({
  selector: 'app-subject-offerings-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  template: `
<div class="so-page">

  <!-- ── Page Header ──────────────────────────────────────────────────── -->
  <div class="so-header">
    <div class="header-lead">
      <div class="page-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
          <line x1="9" y1="7" x2="15" y2="7"/>
          <line x1="9" y1="11" x2="15" y2="11"/>
        </svg>
      </div>
      <div class="header-text">
        <nav class="breadcrumb">
          <span>Academics</span>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="6 3 10 8 6 13"/></svg>
          <span class="bc-active">Subject Offerings</span>
        </nav>
        <h1 class="page-title">Subject Offerings</h1>
        <p class="page-sub">{{ service.subjectOfferings().length }} total offering{{ service.subjectOfferings().length !== 1 ? 's' : '' }}</p>
      </div>
    </div>
    <button class="add-btn" (click)="openCreateDialog()">
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
        <line x1="10" y1="4" x2="10" y2="16"/><line x1="4" y1="10" x2="16" y2="10"/>
      </svg>
      Add Offering
    </button>
  </div>

  <!-- ── Stats Row ────────────────────────────────────────────────────── -->
  <div class="stats-row">
    <div class="stat-card">
      <div class="stat-icon stat-icon--slate">
        <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm11 1H6v8l4-2 4 2V6z" clip-rule="evenodd"/></svg>
      </div>
      <div class="stat-body">
        <span class="stat-value">{{ totalCount() }}</span>
        <span class="stat-label">Total Offerings</span>
      </div>
    </div>
    <div class="stat-card stat-card--blue">
      <div class="stat-icon stat-icon--blue">
        <svg viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
      </div>
      <div class="stat-body">
        <span class="stat-value">{{ coreCount() }}</span>
        <span class="stat-label">Core Subjects</span>
      </div>
    </div>
    <div class="stat-card stat-card--violet">
      <div class="stat-icon stat-icon--violet">
        <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M2 4.5A2.5 2.5 0 014.5 2h11A2.5 2.5 0 0118 4.5v11a2.5 2.5 0 01-2.5 2.5h-11A2.5 2.5 0 012 15.5v-11zM15 5H5v9l5-2.5L15 14V5z" clip-rule="evenodd"/></svg>
      </div>
      <div class="stat-body">
        <span class="stat-value">{{ electiveCount() }}</span>
        <span class="stat-label">Electives</span>
      </div>
    </div>
    <div class="stat-card stat-card--amber">
      <div class="stat-icon stat-icon--amber">
        <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/></svg>
      </div>
      <div class="stat-body">
        <span class="stat-value">{{ unassignedCount() }}</span>
        <span class="stat-label">No Teacher</span>
      </div>
    </div>
  </div>

  <!-- ── Data Card ────────────────────────────────────────────────────── -->
  <div class="data-card">

    <!-- Filter Bar -->
    <div class="filter-bar">
      <div class="filter-search">
        <svg class="search-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
          <circle cx="8.5" cy="8.5" r="5.5"/><line x1="13.5" y1="13.5" x2="17" y2="17"/>
        </svg>
        <input class="search-input" type="text" placeholder="Search subjects, teachers…"
               [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)" />
      </div>

      <div class="filter-select-wrap">
        <select class="filter-select" [ngModel]="filterYearLevel()" (ngModelChange)="filterYearLevel.set($event)">
          <option value="">All Year Levels</option>
          @for (yl of uniqueYearLevels(); track yl.id) {
            <option [value]="yl.id.toString()">{{ yl.name }}</option>
          }
        </select>
        <svg class="filter-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      <div class="filter-select-wrap">
        <select class="filter-select" [ngModel]="filterType()" (ngModelChange)="filterType.set($event)">
          <option value="">All Types</option>
          <option value="core">Core</option>
          <option value="elective">Elective</option>
        </select>
        <svg class="filter-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      <div class="filter-select-wrap">
        <select class="filter-select" [ngModel]="filterAcYear()" (ngModelChange)="filterAcYear.set($event)">
          <option value="">All Academic Years</option>
          @for (ay of uniqueAcademicYears(); track ay) {
            <option [value]="ay">{{ ay }}</option>
          }
        </select>
        <svg class="filter-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      @if (activeFilterCount() > 0) {
        <div class="filter-active-badge">
          <span class="active-dot"></span>
          {{ activeFilterCount() }} filter{{ activeFilterCount() !== 1 ? 's' : '' }}
        </div>
        <button class="filter-clear-btn" (click)="clearFilters()">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
            <line x1="4" y1="4" x2="12" y2="12"/><line x1="12" y1="4" x2="4" y2="12"/>
          </svg>
          Clear
        </button>
      }
    </div>

    <!-- Loading skeletons -->
    @if (service.isLoading()) {
      <div class="cards-scroll">
        <div class="cards-grid">
          @for (sk of skeletons; track sk) {
            <div class="skeleton-card">
              <div class="sk-row">
                <div class="sk-line sk-line--short"></div>
                <div class="sk-line sk-line--short"></div>
              </div>
              <div class="sk-line sk-line--long sk-line--title"></div>
              <div class="sk-row">
                <div class="sk-line sk-line--pill"></div>
                <div class="sk-line sk-line--pill"></div>
                <div class="sk-line sk-line--pill"></div>
              </div>
              <div class="sk-divider"></div>
              <div class="sk-row">
                <div class="sk-circle"></div>
                <div class="sk-line sk-line--mid"></div>
              </div>
            </div>
          }
        </div>
      </div>

    <!-- Empty state -->
    } @else if (filteredOfferings().length === 0) {
      <div class="empty-state">
        <div class="empty-icon">
          <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 39A5 5 0 0113 34H40"/><path d="M13 4H40v40H13A5 5 0 018 39V9A5 5 0 0113 4z"/>
            <line x1="18" y1="14" x2="30" y2="14"/><line x1="18" y1="22" x2="30" y2="22"/><line x1="18" y1="30" x2="24" y2="30"/>
          </svg>
        </div>
        @if (activeFilterCount() > 0) {
          <h3 class="empty-title">No offerings match your filters</h3>
          <p class="empty-sub">Try adjusting your search or filter criteria</p>
          <button class="empty-action-btn" (click)="clearFilters()">Clear All Filters</button>
        } @else {
          <h3 class="empty-title">No subject offerings yet</h3>
          <p class="empty-sub">Create your first offering to assign subjects to year levels</p>
          <button class="add-btn" style="margin-top:4px" (click)="openCreateDialog()">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
              <line x1="10" y1="4" x2="10" y2="16"/><line x1="4" y1="10" x2="16" y2="10"/>
            </svg>
            Add First Offering
          </button>
        }
      </div>

    <!-- Cards grid -->
    } @else {
      <div class="cards-scroll">
        <div class="cards-grid">
          @for (o of filteredOfferings(); track o.id) {
            <div class="offering-card" [class.offering-card--elective]="!o.is_compulsory">

              <!-- Card head: chips + actions -->
              <div class="card-head">
                <div class="card-chips">
                  <span class="code-chip">{{ o.subject_code }}</span>
                  <span class="type-pill" [class.type-pill--elective]="!o.is_compulsory">
                    @if (o.is_compulsory) {
                      <svg viewBox="0 0 12 12" fill="currentColor"><path d="M6 .5l1.33 2.7 2.98.43-2.16 2.1.51 2.96L6 7.27 3.34 8.69l.51-2.96L1.69 3.63l2.98-.43z"/></svg>
                      Core
                    } @else {
                      <svg viewBox="0 0 12 12" fill="currentColor"><path d="M2 1h8v10L6 8 2 11V1z"/></svg>
                      Elective
                    }
                  </span>
                </div>
                <div class="card-actions">
                  <button class="card-btn card-btn--edit" (click)="openEditDialog(o)"
                          matTooltip="Edit" matTooltipPosition="above">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11.5 2.5a1.414 1.414 0 012 2L5 13H2v-3L11.5 2.5z"/>
                    </svg>
                  </button>
                  <button class="card-btn card-btn--delete" (click)="confirmDelete(o)"
                          matTooltip="Delete" matTooltipPosition="above">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="2 4 14 4"/>
                      <path d="M5 4V2h6v2"/>
                      <path d="M6 7v5m4-5v5"/>
                      <rect x="3" y="4" width="10" height="10" rx="1"/>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Subject name -->
              <h3 class="card-subject">{{ o.subject_name }}</h3>

              <!-- Meta tags -->
              <div class="card-meta">
                <span class="meta-tag meta-tag--year">
                  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="1" y="2" width="10" height="9" rx="1"/><line x1="1" y1="5" x2="11" y2="5"/><line x1="4" y1="1" x2="4" y2="3"/><line x1="8" y1="1" x2="8" y2="3"/></svg>
                  {{ o.year_level_name }}
                </span>
                @if (o.academic_year) {
                  <span class="meta-tag">
                    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="6" cy="6" r="5"/><polyline points="6 3 6 6 8 7"/></svg>
                    {{ o.academic_year }}
                  </span>
                }
                @if (o.credit_hours) {
                  <span class="meta-tag">
                    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><polygon points="6 1 7.5 4.5 11 5 8.5 7.5 9 11 6 9.5 3 11 3.5 7.5 1 5 4.5 4.5"/></svg>
                    {{ o.credit_hours }} hrs
                  </span>
                }
                @if (o.key_stage_name) {
                  <span class="meta-tag meta-tag--ks" [matTooltip]="o.key_stage_name">
                    {{ o.key_stage_name.length > 10 ? o.key_stage_name.slice(0, 10) + '…' : o.key_stage_name }}
                  </span>
                }
              </div>

              <!-- Divider -->
              <div class="card-divider"></div>

              <!-- Teacher row -->
              <div class="card-teacher">
                @if (o.teacher_name) {
                  <div class="teacher-avatar" [style.background]="getAvatarColor(o.teacher_name)">
                    {{ getInitials(o.teacher_name) }}
                  </div>
                  <span class="teacher-name">{{ o.teacher_name }}</span>
                } @else {
                  <div class="teacher-avatar teacher-avatar--ghost">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M8 8a3 3 0 100-6 3 3 0 000 6zm-5 7a5 5 0 0110 0H3z"/></svg>
                  </div>
                  <span class="teacher-unassigned">Unassigned</span>
                }
                @if (o.selection_group) {
                  <span class="sg-tag" [matTooltip]="'Group: ' + o.selection_group">
                    {{ o.selection_group.length > 12 ? o.selection_group.slice(0, 12) + '…' : o.selection_group }}
                  </span>
                }
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
    .so-page {
      padding: 28px 32px;
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
      font-family: 'Inter', system-ui, sans-serif;
    }

    /* ── Header ───────────────────────────────────────────────────────── */
    .so-header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 16px;
    }

    .header-lead { display: flex; align-items: center; gap: 16px; }

    .page-icon {
      width: 52px; height: 52px; flex-shrink: 0;
      background: linear-gradient(135deg, #2563eb 0%, #3b82f6 60%, #818cf8 100%);
      border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 6px 18px rgba(37,99,235,0.28);
      svg { width: 26px; height: 26px; stroke: #fff; }
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
      &:hover { transform: translateY(-1px); box-shadow: 0 6px 22px rgba(37,99,235,0.40); }
      &:active { transform: translateY(0); }
    }

    /* ── Stats Row ────────────────────────────────────────────────────── */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
    }

    .stat-card {
      background: #fff;
      border: 1px solid #f1f5f9;
      border-radius: 14px;
      padding: 16px 18px;
      display: flex; align-items: center; gap: 14px;
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
    .stat-icon--blue   { background: #eff6ff; svg { fill: #2563eb; } }
    .stat-icon--violet { background: #f5f3ff; svg { fill: #7c3aed; } }
    .stat-icon--amber  { background: #fffbeb; svg { fill: #d97706; } }

    .stat-body { display: flex; flex-direction: column; gap: 1px; min-width: 0; }

    .stat-value {
      font-size: 26px; font-weight: 800; color: #0f172a;
      letter-spacing: -0.04em; line-height: 1;
    }

    .stat-label { font-size: 12px; font-weight: 500; color: #94a3b8; white-space: nowrap; }

    .stat-card--blue   .stat-value { color: #2563eb; }
    .stat-card--violet .stat-value { color: #7c3aed; }
    .stat-card--amber  .stat-value { color: #d97706; }

    /* ── Data Card ────────────────────────────────────────────────────── */
    .data-card {
      background: #fff;
      border: 1px solid #f1f5f9;
      border-radius: 16px;
      box-shadow: 0 1px 6px rgba(0,0,0,0.05);
      overflow: hidden;
    }

    /* ── Filter Bar ───────────────────────────────────────────────────── */
    .filter-bar {
      display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
      padding: 16px 20px;
      border-bottom: 1px solid #f8fafc;
    }

    .filter-search {
      position: relative;
      flex: 1; min-width: 200px; max-width: 300px;
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

    .filter-chevron {
      position: absolute; right: 9px; top: 50%; transform: translateY(-50%);
      width: 14px; height: 14px; stroke: #9ca3af; pointer-events: none;
      transition: transform 0.2s ease, stroke 0.15s ease;
    }

    .filter-select:focus ~ .filter-chevron {
      stroke: #2563eb;
      transform: translateY(-50%) rotate(180deg);
    }

    .filter-active-badge {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 12px;
      background: #eff6ff; color: #2563eb;
      border-radius: 20px; font-size: 12px; font-weight: 600;
    }

    .active-dot { width: 6px; height: 6px; background: #2563eb; border-radius: 50%; }

    .filter-clear-btn {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 6px 12px;
      background: #fff; color: #ef4444;
      border: 1.5px solid #fecaca; border-radius: 8px;
      font-size: 12px; font-weight: 600; font-family: inherit; cursor: pointer;
      transition: all 0.15s ease;
      svg { width: 11px; height: 11px; stroke: #ef4444; }
      &:hover { background: #fef2f2; border-color: #f87171; }
    }

    /* ── Scroll Container ─────────────────────────────────────────────── */
    .cards-scroll {
      height: calc(100vh - 390px);
      min-height: 420px;
      overflow-y: auto; overflow-x: hidden;
      scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent;
      &::-webkit-scrollbar { width: 5px; }
      &::-webkit-scrollbar-track { background: transparent; }
      &::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }
    }

    /* ── Cards Grid ───────────────────────────────────────────────────── */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      padding: 20px;
    }

    /* ── Offering Card ────────────────────────────────────────────────── */
    .offering-card {
      position: relative; overflow: hidden;
      background: #fff;
      border: 1px solid #eef2f7;
      border-left: 4px solid #2563eb;
      border-radius: 12px;
      padding: 16px;
      display: flex; flex-direction: column; gap: 10px;
      box-shadow: 0 1px 5px rgba(0,0,0,0.04);
      transition: transform 0.22s ease, box-shadow 0.22s ease;
      cursor: default;

      &::before {
        content: '';
        position: absolute; top: 0; left: -120%;
        width: 55%; height: 100%;
        background: linear-gradient(to right, transparent, rgba(255,255,255,0.52), transparent);
        transform: skewX(-18deg);
        pointer-events: none;
      }

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 30px rgba(37,99,235,0.10);
        &::before { left: 160%; transition: left 0.55s ease; }
      }

      &--elective {
        border-left-color: #7c3aed;
        &:hover { box-shadow: 0 8px 30px rgba(124,58,237,0.10); }
      }
    }

    /* Card head */
    .card-head {
      display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;
    }

    .card-chips { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

    .code-chip {
      font-size: 10.5px; font-weight: 700;
      font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
      color: #2563eb; background: #eff6ff;
      padding: 3px 8px; border-radius: 5px;
      letter-spacing: 0.05em;
    }

    .type-pill {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 10.5px; font-weight: 600;
      padding: 3px 8px; border-radius: 20px;
      background: #eff6ff; color: #2563eb;
      svg { width: 9px; height: 9px; fill: #2563eb; flex-shrink: 0; }

      &--elective {
        background: #f5f3ff; color: #7c3aed;
        svg { fill: #7c3aed; }
      }
    }

    .card-actions {
      display: flex; align-items: center; gap: 3px;
      flex-shrink: 0;
      opacity: 0; transition: opacity 0.18s ease;
    }
    .offering-card:hover .card-actions { opacity: 1; }

    .card-btn {
      width: 28px; height: 28px; border-radius: 7px;
      border: 1px solid transparent; background: transparent;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.15s ease;
      svg { width: 13px; height: 13px; }

      &--edit {
        svg { stroke: #94a3b8; }
        &:hover { background: #eff6ff; border-color: #bfdbfe; svg { stroke: #2563eb; } }
      }

      &--delete {
        svg { stroke: #94a3b8; }
        &:hover { background: #fef2f2; border-color: #fecaca; svg { stroke: #ef4444; } }
      }
    }

    /* Subject name */
    .card-subject {
      font-size: 15.5px; font-weight: 700; color: #0f172a;
      letter-spacing: -0.02em; line-height: 1.25; margin: 0;
    }

    /* Meta tags */
    .card-meta { display: flex; flex-wrap: wrap; gap: 5px; }

    .meta-tag {
      display: inline-flex; align-items: center; gap: 3px;
      font-size: 11px; font-weight: 500; color: #64748b;
      background: #f8fafc; border: 1px solid #e8edf3;
      padding: 3px 7px; border-radius: 6px;
      svg { width: 9px; height: 9px; flex-shrink: 0; }

      &--year  { color: #2563eb; background: #f0f7ff; border-color: #bfdbfe; svg { stroke: #2563eb; } }
      &--ks    { color: #7c3aed; background: #f5f3ff; border-color: #ddd6fe; cursor: default; }
    }

    /* Divider */
    .card-divider { height: 1px; background: #f1f5f9; margin: 1px 0; }

    /* Teacher row */
    .card-teacher { display: flex; align-items: center; gap: 8px; }

    .teacher-avatar {
      width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 9.5px; font-weight: 700; color: #fff; letter-spacing: 0.03em;

      &--ghost {
        background: #f1f5f9;
        border: 1.5px dashed #cbd5e1;
        svg { width: 13px; height: 13px; stroke: #94a3b8; }
      }
    }

    .teacher-name {
      font-size: 12.5px; font-weight: 500; color: #374151;
      flex: 1; min-width: 0;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }

    .teacher-unassigned { font-size: 12.5px; font-style: italic; color: #94a3b8; flex: 1; }

    .sg-tag {
      font-size: 10px; font-weight: 600; color: #7c3aed;
      background: #f5f3ff; padding: 2px 7px; border-radius: 4px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      max-width: 90px; cursor: default;
    }

    /* ── Skeleton ─────────────────────────────────────────────────────── */
    .skeleton-card {
      border-radius: 12px; border: 1px solid #f1f5f9; padding: 16px;
      display: flex; flex-direction: column; gap: 10px; background: #fff;
    }

    @keyframes shimmer {
      0%   { background-position: -200% 0; }
      100% { background-position:  200% 0; }
    }

    .sk-row { display: flex; align-items: center; gap: 8px; }

    .sk-line {
      height: 11px; border-radius: 5px;
      background: linear-gradient(90deg, #f1f5f9 25%, #e8ecf0 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s ease-in-out infinite;
      &--short  { width: 32%; }
      &--mid    { width: 55%; }
      &--long   { width: 80%; }
      &--pill   { width: 24%; height: 22px; border-radius: 6px; }
      &--title  { height: 17px; border-radius: 7px; }
    }

    .sk-divider { height: 1px; background: #f1f5f9; }

    .sk-circle {
      width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(90deg, #f1f5f9 25%, #e8ecf0 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s ease-in-out infinite;
    }

    /* ── Empty State ──────────────────────────────────────────────────── */
    .empty-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 68px 24px; gap: 10px; text-align: center;
    }

    .empty-icon {
      width: 72px; height: 72px; border-radius: 20px; background: #f8fafc;
      display: flex; align-items: center; justify-content: center; margin-bottom: 6px;
      svg { width: 38px; height: 38px; stroke: #c8d4e3; }
    }

    .empty-title { font-size: 17px; font-weight: 700; color: #1e293b; margin: 0; }
    .empty-sub   { font-size: 13px; color: #94a3b8; margin: 0; }

    .empty-action-btn {
      margin-top: 6px; padding: 9px 20px;
      background: #fff; color: #2563eb;
      border: 1.5px solid #bfdbfe; border-radius: 9px;
      font-size: 13.5px; font-weight: 600; font-family: inherit; cursor: pointer;
      transition: all 0.15s ease;
      &:hover { background: #eff6ff; }
    }

    /* ── Responsive ───────────────────────────────────────────────────── */
    @media (max-width: 1100px) {
      .cards-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 768px) {
      .so-page { padding: 16px; }
      .so-header { flex-direction: column; align-items: flex-start; }
      .stats-row { grid-template-columns: repeat(2, 1fr); }
      .cards-grid { grid-template-columns: 1fr; }
      .filter-search { max-width: 100%; }
      .cards-scroll { height: calc(100vh - 440px); min-height: 320px; }
    }
  `],
})
export class SubjectOfferingsListComponent implements OnInit {
  readonly service = inject(AcademicsService);
  private dialog   = inject(MatDialog);
  private snack    = inject(MatSnackBar);

  readonly skeletons = [1, 2, 3, 4, 5, 6];

  searchQuery     = signal('');
  filterYearLevel = signal('');
  filterType      = signal('');
  filterAcYear    = signal('');

  readonly totalCount      = computed(() => this.service.subjectOfferings().length);
  readonly coreCount       = computed(() => this.service.subjectOfferings().filter(o => o.is_compulsory).length);
  readonly electiveCount   = computed(() => this.service.subjectOfferings().filter(o => !o.is_compulsory).length);
  readonly unassignedCount = computed(() => this.service.subjectOfferings().filter(o => !o.teacher_name).length);

  readonly uniqueYearLevels = computed(() => {
    const seen = new Set<number>();
    return this.service.subjectOfferings()
      .filter(o => { if (seen.has(o.year_level)) return false; seen.add(o.year_level); return true; })
      .map(o => ({ id: o.year_level, name: o.year_level_name }));
  });

  readonly uniqueAcademicYears = computed(() => {
    const seen = new Set<string>();
    return this.service.subjectOfferings().filter(o => {
      if (!o.academic_year || seen.has(o.academic_year)) return false;
      seen.add(o.academic_year);
      return true;
    }).map(o => o.academic_year);
  });

  readonly activeFilterCount = computed(() =>
    [this.searchQuery(), this.filterYearLevel(), this.filterType(), this.filterAcYear()]
      .filter(v => v !== '').length
  );

  readonly filteredOfferings = computed(() => {
    let offs = this.service.subjectOfferings();
    const q = this.searchQuery().toLowerCase().trim();
    if (q) offs = offs.filter(o =>
      o.subject_name.toLowerCase().includes(q) ||
      o.subject_code.toLowerCase().includes(q) ||
      (o.year_level_name || '').toLowerCase().includes(q) ||
      (o.teacher_name || '').toLowerCase().includes(q) ||
      (o.academic_year || '').toLowerCase().includes(q)
    );
    const yl = this.filterYearLevel();
    if (yl) offs = offs.filter(o => o.year_level.toString() === yl);
    const t = this.filterType();
    if (t === 'core')     offs = offs.filter(o => o.is_compulsory);
    if (t === 'elective') offs = offs.filter(o => !o.is_compulsory);
    const ay = this.filterAcYear();
    if (ay) offs = offs.filter(o => o.academic_year === ay);
    return offs;
  });

  ngOnInit(): void { this.service.getSubjectOfferings().subscribe(); }

  clearFilters(): void {
    this.searchQuery.set('');
    this.filterYearLevel.set('');
    this.filterType.set('');
    this.filterAcYear.set('');
  }

  getInitials(name: string | null): string {
    if (!name) return '?';
    return name.split(' ').filter(Boolean).map(p => p[0]).join('').toUpperCase().slice(0, 2);
  }

  getAvatarColor(name: string | null): string {
    if (!name) return '#94a3b8';
    const palette = ['#2563eb','#7c3aed','#0891b2','#059669','#d97706','#dc2626','#db2777','#0369a1'];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) & 0xffff;
    return palette[h % palette.length];
  }

  openCreateDialog(): void {
    this.dialog.open(SubjectOfferingDialogComponent, {
      width: '560px',
      data: { isEdit: false },
    }).afterClosed().subscribe(result => {
      if (!result) return;
      this.service.createSubjectOffering(result).subscribe({
        next: () => this.snack.open('Subject offering created', 'Dismiss', { duration: 3000 }),
        error: () => this.snack.open('Failed to create offering', 'Dismiss', { duration: 3500 }),
      });
    });
  }

  openEditDialog(offering: SubjectOffering): void {
    this.dialog.open(SubjectOfferingDialogComponent, {
      width: '560px',
      data: { isEdit: true, offering },
    }).afterClosed().subscribe(result => {
      if (!result) return;
      this.service.updateSubjectOffering(offering.id, result).subscribe({
        next: () => this.snack.open('Offering updated', 'Dismiss', { duration: 3000 }),
        error: () => this.snack.open('Failed to update offering', 'Dismiss', { duration: 3500 }),
      });
    });
  }

  confirmDelete(offering: SubjectOffering): void {
    if (!confirm(`Delete "${offering.subject_name}" offering for ${offering.year_level_name}?`)) return;
    this.service.deleteSubjectOffering(offering.id).subscribe({
      next: () => this.snack.open(`"${offering.subject_name}" deleted`, 'Dismiss', { duration: 3000 }),
      error: () => this.snack.open('Failed to delete offering', 'Dismiss', { duration: 3500 }),
    });
  }
}
