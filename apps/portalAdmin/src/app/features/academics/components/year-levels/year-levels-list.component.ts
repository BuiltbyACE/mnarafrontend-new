import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AcademicsService, YearLevel } from '../../services/academics.service';
import { YearLevelDialogComponent } from './year-level-dialog.component';

// ── Local view-model (extends API data with UI-only display fields) ────────
interface YearLevelDisplay {
  id: number;
  name: string;
  shortLabel: string;   // e.g. "Y7", "Y12"
  keyStage: string;     // "Key Stage 3"
  keyStageCode: string; // "KS3"
  order: number;
  // mocked stats (would come from analytics API in production)
  totalStudents: number;
  streams: number;
  classrooms: number;
  // theming
  color: string;        // accent hex
  gradient: string;     // CSS gradient for avatar
  shadowColor: string;  // rgba for hover shadow
  raw: YearLevel | null;
}

@Component({
  selector: 'app-year-levels-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatSnackBarModule, MatTooltipModule],
  template: `
<div class="yl-page">

  <!-- ── Overview card: header + nested stat chips ────────────────────── -->
  <div class="overview-card">

    <!-- Top: icon / breadcrumb / title / add button -->
    <div class="ov-top">
      <div class="ov-lead">
        <div class="ov-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
               stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2"/>
            <polyline points="2 17 12 22 22 17"/>
            <polyline points="2 12 12 17 22 12"/>
          </svg>
        </div>
        <div class="ov-text">
          <nav class="breadcrumb">
            <span>Academics</span>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"
                 width="11" height="11">
              <polyline points="6 3 10 8 6 13"/>
            </svg>
            <span class="bc-active">Year Levels</span>
          </nav>
          <h1 class="page-title">Year Levels Directory</h1>
          <p class="page-sub">
            {{ displayLevels().length }} year level{{ displayLevels().length !== 1 ? 's' : '' }}
            &nbsp;·&nbsp;{{ uniqueKsCount() }} key stage{{ uniqueKsCount() !== 1 ? 's' : '' }}
            &nbsp;·&nbsp;{{ totalStudentsSum() | number }} students
          </p>
        </div>
      </div>
      <button class="add-btn" (click)="openCreateDialog()">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
          <line x1="10" y1="4" x2="10" y2="16"/><line x1="4" y1="10" x2="16" y2="10"/>
        </svg>
        Add Year Level
      </button>
    </div>

    <!-- Divider -->
    <div class="ov-divider"></div>

    <!-- Bottom: nested stat chips (card-within-card) -->
    <div class="ov-stats">

      <div class="ostat-chip ostat-chip--blue">
        <div class="ostat-icon">
          <svg viewBox="0 0 20 20" fill="currentColor" width="17" height="17">
            <path fill-rule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm11 1H6v8l4-2 4 2V6z" clip-rule="evenodd"/>
          </svg>
        </div>
        <span class="ostat-val">{{ displayLevels().length }}</span>
        <span class="ostat-lbl">Total Levels</span>
      </div>

      <div class="ostat-chip ostat-chip--violet">
        <div class="ostat-icon">
          <svg viewBox="0 0 20 20" fill="currentColor" width="17" height="17">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zm8 0a3 3 0 11-6 0 3 3 0 016 0zm-4.07 11c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
          </svg>
        </div>
        <span class="ostat-val">{{ totalStudentsSum() | number }}</span>
        <span class="ostat-lbl">Total Students</span>
      </div>

      <div class="ostat-chip ostat-chip--teal">
        <div class="ostat-icon">
          <svg viewBox="0 0 20 20" fill="currentColor" width="17" height="17">
            <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clip-rule="evenodd"/>
          </svg>
        </div>
        <span class="ostat-val">{{ totalStreamsSum() }}</span>
        <span class="ostat-lbl">Total Streams</span>
      </div>

      <div class="ostat-chip ostat-chip--amber">
        <div class="ostat-icon">
          <svg viewBox="0 0 20 20" fill="currentColor" width="17" height="17">
            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838l-2.727 1.17 1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zm5.99 7.176A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
          </svg>
        </div>
        <span class="ostat-val">{{ uniqueKsCount() }}</span>
        <span class="ostat-lbl">Key Stages</span>
      </div>

    </div>
  </div>

  <!-- ── Content shell ────────────────────────────────────────────────── -->
  <div class="content-shell">

    <!-- Filter strip -->
    <div class="filter-strip">
      <div class="search-wrap">
        <svg class="search-ico" viewBox="0 0 20 20" fill="none" stroke="currentColor"
             stroke-width="1.8" stroke-linecap="round">
          <circle cx="8.5" cy="8.5" r="5.5"/><line x1="13.5" y1="13.5" x2="17" y2="17"/>
        </svg>
        <input class="search-inp" type="text" placeholder="Search year levels…"
               [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)" />
      </div>

      <div class="ks-tabs">
        <button class="ks-tab" [class.ks-tab--active]="filterKs() === ''"
                (click)="filterKs.set('')">All</button>
        @for (ks of uniqueKsList(); track ks) {
          <button class="ks-tab" [class.ks-tab--active]="filterKs() === ks"
                  (click)="filterKs.set(ks)">{{ ks }}</button>
        }
      </div>

      <span class="result-tag">{{ filteredLevels().length }} result{{ filteredLevels().length !== 1 ? 's' : '' }}</span>
    </div>

    <!-- ── Scrollable grid viewport ─────────────────────────────────── -->
    <div class="grid-scroll">

    <!-- ── Loading skeletons ─────────────────────────────────────────── -->
    @if (service.isLoading() && displayLevels().length === 0) {
      <div class="card-grid">
        @for (sk of skeletons; track sk) {
          <div class="sk-card">
            <div class="flex items-start justify-between">
              <div class="sk-circle" style="width:50px;height:50px;border-radius:14px"></div>
              <div class="sk-line" style="width:48px;height:22px;border-radius:20px"></div>
            </div>
            <div class="sk-line" style="width:55%;height:20px;border-radius:7px;margin-top:12px"></div>
            <div class="sk-line" style="width:75%;height:13px;border-radius:5px"></div>
            <div class="flex flex-col gap-2.5 mt-3">
              <div class="sk-line" style="height:14px;border-radius:6px"></div>
              <div class="sk-line" style="height:14px;border-radius:6px"></div>
              <div class="sk-line" style="height:14px;border-radius:6px"></div>
            </div>
            <div class="sk-line" style="height:40px;border-radius:10px;margin-top:6px"></div>
          </div>
        }
      </div>

    <!-- ── Empty state ───────────────────────────────────────────────── -->
    } @else if (filteredLevels().length === 0) {
      <div class="empty-state">
        <div class="empty-icon">
          <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4"
               stroke-linecap="round" stroke-linejoin="round">
            <rect x="6" y="6" width="14" height="14" rx="2"/>
            <rect x="28" y="6" width="14" height="14" rx="2"/>
            <rect x="6" y="28" width="14" height="14" rx="2"/>
            <rect x="28" y="28" width="14" height="14" rx="2"/>
          </svg>
        </div>
        @if (searchQuery() || filterKs()) {
          <h3 class="empty-title">No year levels match your filter</h3>
          <p class="empty-sub">Try a different search term or key stage</p>
          <button class="empty-btn" (click)="clearFilters()">Clear Filters</button>
        } @else {
          <h3 class="empty-title">No year levels yet</h3>
          <p class="empty-sub">Add your first year level to build the academic structure</p>
          <button class="add-btn" style="margin-top:8px" (click)="openCreateDialog()">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
              <line x1="10" y1="4" x2="10" y2="16"/><line x1="4" y1="10" x2="16" y2="10"/>
            </svg>
            Add Year Level
          </button>
        }
      </div>

    <!-- ── Card grid (Tailwind responsive) ──────────────────────────── -->
    } @else {
      <div class="card-grid">
        @for (yl of filteredLevels(); track yl.id) {
          <div class="yl-card"
               [style.--accent]="yl.color"
               [style.--shadow]="yl.shadowColor">

            <!-- Decorative top-left glow (rendered via ::before in SCSS) -->

            <!-- ── Top row: avatar + badges ────────────────────────── -->
            <div class="flex items-start justify-between gap-3">
              <div class="yr-avatar" [style.background]="yl.gradient">
                {{ yl.shortLabel }}
              </div>
              <div class="flex flex-col items-end gap-1.5">
                <span class="ks-pill">{{ yl.keyStageCode }}</span>
                <span class="order-dot">#{{ yl.order }}</span>
              </div>
            </div>

            <!-- ── Year name + key stage ───────────────────────────── -->
            <div class="card-ident">
              <h3 class="yr-name">{{ yl.name }}</h3>
              <p class="ks-sub">{{ yl.keyStage }}</p>
            </div>

            <!-- ── Metrics stack (vertical rows, label / value) ─────── -->
            <div class="metrics-stack">
              <div class="metric-row">
                <span class="metric-label">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"
                       stroke-linecap="round" stroke-linejoin="round" width="13" height="13">
                    <path d="M7 7A3 3 0 107 1a3 3 0 000 6zm-5 8a5 5 0 0110 0"/>
                  </svg>
                  Students
                </span>
                <span class="metric-value">{{ yl.totalStudents }}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"
                       stroke-linecap="round" stroke-linejoin="round" width="13" height="13">
                    <polygon points="8 1 1 5 8 9 15 5 8 1"/>
                    <polyline points="1 11 8 15 15 11"/>
                    <polyline points="1 8 8 12 15 8"/>
                  </svg>
                  Streams
                </span>
                <span class="metric-value">{{ yl.streams }}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"
                       stroke-linecap="round" stroke-linejoin="round" width="13" height="13">
                    <rect x="1" y="1" width="6" height="6" rx="1"/>
                    <rect x="9" y="1" width="6" height="6" rx="1"/>
                    <rect x="1" y="9" width="6" height="6" rx="1"/>
                    <rect x="9" y="9" width="6" height="6" rx="1"/>
                  </svg>
                  Classes
                </span>
                <span class="metric-value">{{ yl.classrooms }}</span>
              </div>
            </div>

            <!-- ── Card footer ─────────────────────────────────────── -->
            <div class="card-foot">
              <button class="view-btn" (click)="viewDetails(yl)">
                View Details
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor"
                     stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="3" y1="8" x2="13" y2="8"/>
                  <polyline points="9 4 13 8 9 12"/>
                </svg>
              </button>
              <div class="mini-acts">
                <button class="mini-btn mini-edit" (click)="openEditDialog(yl)"
                        matTooltip="Edit" matTooltipPosition="above">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor"
                       stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11.5 2.5a1.414 1.414 0 012 2L5 13H2v-3L11.5 2.5z"/>
                  </svg>
                </button>
                <button class="mini-btn mini-del" (click)="confirmDelete(yl)"
                        matTooltip="Delete" matTooltipPosition="above">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor"
                       stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="2 4 14 4"/>
                    <path d="M5 4V2h6v2"/><path d="M6 7v5m4-5v5"/>
                    <rect x="3" y="4" width="10" height="10" rx="1"/>
                  </svg>
                </button>
              </div>
            </div>

          </div>
        }
      </div>
    }

    </div><!-- /grid-scroll -->

  </div>

</div>
  `,
  styles: [`
    /* ── Page wrapper ─────────────────────────────────────────────────── */
    .yl-page {
      padding: 28px 32px;
      max-width: 1440px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
      font-family: 'Inter', system-ui, sans-serif;
    }

    /* ── Overview card (header + nested stat chips) ──────────────────── */
    .overview-card {
      position: relative;
      background: #ffffff;
      border: 1px solid #e0e9ff;
      border-radius: 20px;
      box-shadow:
        0 1px 3px rgba(37,99,235,0.06),
        0 4px 20px rgba(37,99,235,0.05);
      overflow: hidden;

      /* Blue→violet gradient left accent rail */
      &::before {
        content: '';
        position: absolute;
        left: 0; top: 0; bottom: 0;
        width: 4px;
        background: linear-gradient(180deg, #2563eb 0%, #7c3aed 100%);
        border-radius: 20px 0 0 20px;
      }

      /* Radial glow top-left corner */
      &::after {
        content: '';
        position: absolute;
        top: -30px; left: -30px;
        width: 280px; height: 220px;
        background: radial-gradient(ellipse at 0% 0%, rgba(37,99,235,0.07), transparent 65%);
        pointer-events: none;
      }
    }

    /* Top row: icon + text + Add button */
    .ov-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      padding: 22px 28px 22px 32px;
      position: relative; z-index: 1;
    }

    .ov-lead {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .ov-icon {
      flex-shrink: 0;
      width: 52px; height: 52px;
      background: linear-gradient(135deg, #2563eb 0%, #4f80f0 55%, #818cf8 100%);
      border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 6px 20px rgba(37,99,235,0.28);
      svg { width: 24px; height: 24px; stroke: #fff; }
    }

    .ov-text { display: flex; flex-direction: column; gap: 2px; }

    .breadcrumb {
      display: flex; align-items: center; gap: 5px;
      font-size: 12px; color: #94a3b8;
    }
    .bc-active { color: #64748b; font-weight: 500; }

    .page-title {
      font-size: 22px; font-weight: 800; color: #0f172a;
      letter-spacing: -0.03em; margin: 0; line-height: 1.15;
    }

    .page-sub { font-size: 13px; color: #94a3b8; margin: 0; }

    .add-btn {
      flex-shrink: 0;
      display: inline-flex; align-items: center; gap: 7px;
      padding: 11px 20px;
      background: linear-gradient(135deg, #2563eb, #3b82f6);
      color: #fff; border: none; border-radius: 11px;
      font-size: 14px; font-weight: 600; font-family: inherit;
      cursor: pointer; white-space: nowrap;
      box-shadow: 0 3px 12px rgba(37,99,235,0.30);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      svg { width: 16px; height: 16px; flex-shrink: 0; }
      &:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(37,99,235,0.40); }
      &:active { transform: translateY(0); }
    }

    /* Divider between header and stat chips */
    .ov-divider {
      height: 1px;
      background: linear-gradient(90deg, transparent 0%, #e0e9ff 15%, #e0e9ff 85%, transparent 100%);
      margin: 0 28px;
    }

    /* Stat chips row — cards within the overview card */
    .ov-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      padding: 16px 28px 20px 28px;
      background: linear-gradient(135deg, #f5f8ff 0%, #f8faff 100%);
      position: relative; z-index: 1;

      @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
      @media (max-width: 480px) { grid-template-columns: 1fr; }
    }

    /* Individual stat chip */
    .ostat-chip {
      --chip-color: #2563eb;
      --chip-bg:    #eff6ff;

      position: relative;
      background: #ffffff;
      border: 1px solid color-mix(in srgb, var(--chip-color) 15%, #e8f0fe);
      border-radius: 14px;
      padding: 14px 16px 14px 18px;
      display: flex;
      flex-direction: column;
      gap: 5px;
      overflow: hidden;
      cursor: default;
      transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.18s ease;

      /* Colored left accent bar */
      &::before {
        content: '';
        position: absolute;
        left: 0; top: 0; bottom: 0;
        width: 3px;
        background: var(--chip-color);
        border-radius: 14px 0 0 14px;
      }

      /* Subtle inner glow top-left */
      &::after {
        content: '';
        position: absolute;
        top: -10px; left: -10px;
        width: 90px; height: 70px;
        background: radial-gradient(ellipse at 0% 0%, var(--chip-color), transparent 70%);
        opacity: 0.06;
        pointer-events: none;
      }

      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 24px rgba(0,0,0,0.08);
        border-color: color-mix(in srgb, var(--chip-color) 30%, #dce8ff);
      }

      &--blue   { --chip-color: #2563eb; --chip-bg: #eff6ff; }
      &--violet { --chip-color: #7c3aed; --chip-bg: #f5f3ff; }
      &--teal   { --chip-color: #0891b2; --chip-bg: #ecfeff; }
      &--amber  { --chip-color: #d97706; --chip-bg: #fffbeb; }
    }

    .ostat-icon {
      width: 32px; height: 32px;
      background: var(--chip-bg);
      border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 4px;
      svg { fill: var(--chip-color); }
    }

    .ostat-val {
      font-size: 28px; font-weight: 800; color: #0f172a;
      letter-spacing: -0.04em; line-height: 1;
    }

    .ostat-lbl {
      font-size: 12px; font-weight: 500; color: #94a3b8;
    }

    /* ── Content shell ────────────────────────────────────────────────── */
    .content-shell {
      background: #fff;
      border: 1px solid #f1f5f9;
      border-radius: 16px;
      box-shadow: 0 1px 6px rgba(0,0,0,0.05);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* ── Responsive card grid (explicit SCSS — no Tailwind dependency) ── */
    .card-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;

      @media (min-width: 768px)  { grid-template-columns: repeat(2, 1fr); }
      @media (min-width: 1280px) { grid-template-columns: repeat(3, 1fr); }
    }

    /* ── Scrollable grid viewport ─────────────────────────────────────── */
    .grid-scroll {
      overflow-y: auto;
      overflow-x: hidden;
      height: calc(100vh - 320px);
      min-height: 300px;
      /* padding absorbs the hover lift + shadow so they aren't clipped */
      padding: 14px 14px 70px;

      scrollbar-width: thin;
      scrollbar-color: #e2e8f0 transparent;

      &::-webkit-scrollbar       { width: 5px; }
      &::-webkit-scrollbar-track { background: transparent; }
      &::-webkit-scrollbar-thumb {
        background: #e2e8f0;
        border-radius: 4px;
        &:hover { background: #cbd5e1; }
      }
    }

    /* ── Filter strip ─────────────────────────────────────────────────── */
    .filter-strip {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 20px;
      border-bottom: 1px solid #f8fafc;
      flex-wrap: wrap;
    }

    .search-wrap {
      position: relative;
      flex: 1; min-width: 180px; max-width: 280px;
    }
    .search-ico {
      position: absolute; left: 11px; top: 50%; transform: translateY(-50%);
      width: 15px; height: 15px; stroke: #94a3b8; pointer-events: none;
    }
    .search-inp {
      width: 100%; box-sizing: border-box;
      padding: 8px 12px 8px 33px;
      border: 1.5px solid #e2e8f0; border-radius: 9px;
      font-size: 13.5px; font-family: inherit; color: #1e293b; background: #fafbfc;
      transition: all 0.15s ease;
      &::placeholder { color: #c4cad4; }
      &:focus { outline: none; border-color: #2563eb; background: #fff; box-shadow: 0 0 0 3px rgba(37,99,235,0.10); }
    }

    /* Key stage tab pills */
    .ks-tabs { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }

    .ks-tab {
      padding: 6px 13px;
      border: 1.5px solid #e2e8f0; border-radius: 20px;
      font-size: 12.5px; font-weight: 600; font-family: inherit;
      color: #64748b; background: #fff; cursor: pointer;
      transition: all 0.15s ease;
      &:hover { border-color: #bfdbfe; color: #2563eb; background: #f0f7ff; }
      &--active { background: #2563eb; border-color: #2563eb; color: #fff; }
    }

    .result-tag {
      margin-left: auto;
      font-size: 12px; font-weight: 500; color: #94a3b8;
    }

    /* ── Year level card ──────────────────────────────────────────────── */
    .yl-card {
      --accent: #2563eb;
      --shadow: rgba(37,99,235,0.18);

      position: relative;
      overflow: hidden;
      background: #fff;
      border: 1px solid rgba(15,23,42,0.07);
      border-radius: 20px;
      padding: 22px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      cursor: default;

      /* Accent glow: top-left radial, colour changes per card via var(--accent) */
      &::before {
        content: '';
        position: absolute; top: 0; left: 0;
        width: 180px; height: 150px;
        background: radial-gradient(ellipse at 0% 0%, var(--accent), transparent 68%);
        opacity: 0.06;
        border-radius: 20px 0 0 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
      }

      /* Shimmer sweep */
      &::after {
        content: '';
        position: absolute; top: 0; left: -120%;
        width: 55%; height: 100%;
        background: linear-gradient(to right, transparent, rgba(255,255,255,0.5), transparent);
        transform: skewX(-18deg);
        pointer-events: none;
      }

      /* Left accent stripe — hidden by default */
      .accent-stripe {
        position: absolute; left: 0; top: 18%; bottom: 18%;
        width: 3px; background: var(--accent); border-radius: 0 3px 3px 0;
        opacity: 0;
        transition: opacity 0.22s ease;
      }

      box-shadow: 0 1px 4px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03);

      /* ── Spring hover ──────────────────────────────────────────────── */
      transition:
        transform 0.24s cubic-bezier(0.34, 1.56, 0.64, 1),
        box-shadow 0.24s cubic-bezier(0.34, 1.56, 0.64, 1),
        border-color 0.2s ease;

      &:hover {
        transform: translateY(-7px);
        box-shadow:
          0 22px 56px var(--shadow),
          0 6px 18px rgba(0,0,0,0.06),
          0 0 0 1px rgba(37,99,235,0.04);
        border-color: rgba(37,99,235,0.10);

        &::before { opacity: 0.10; }
        &::after  { left: 160%; transition: left 0.52s ease; }

        .accent-stripe { opacity: 1; }
        .metric-value  { transform: scale(1.07); color: var(--accent); }
        .view-btn      { background: var(--accent); color: #fff; box-shadow: 0 4px 16px var(--shadow); }
        .view-btn svg  { stroke: #fff; }
        .mini-acts     { opacity: 1; transform: translateY(0); }
      }
    }

    /* Year avatar */
    .yr-avatar {
      width: 50px; height: 50px; flex-shrink: 0;
      border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 900; color: #fff;
      letter-spacing: -0.02em;
      box-shadow: 0 4px 14px rgba(0,0,0,0.20);
      position: relative; z-index: 1;
    }

    /* KS pill + order dot */
    .ks-pill {
      display: inline-block;
      padding: 4px 10px;
      background: rgba(37,99,235,0.10);
      color: var(--accent);
      border: 1px solid rgba(37,99,235,0.18);
      border-radius: 20px;
      font-size: 11px; font-weight: 700;
      letter-spacing: 0.04em;
      position: relative; z-index: 1;
    }

    .order-dot {
      font-size: 11px; font-weight: 600; color: #94a3b8;
      position: relative; z-index: 1;
    }

    /* Year name + key stage sub */
    .card-ident { position: relative; z-index: 1; }

    .yr-name {
      font-size: 22px; font-weight: 800; color: #0f172a;
      letter-spacing: -0.03em; margin: 0 0 3px; line-height: 1.1;
    }

    .ks-sub {
      font-size: 12.5px; font-weight: 500; color: #94a3b8; margin: 0;
    }

    /* Metrics stack — vertical rows */
    .metrics-stack {
      display: flex;
      flex-direction: column;
      background: #f8fafc;
      border: 1px solid #f1f5f9;
      border-radius: 12px;
      overflow: hidden;
      position: relative; z-index: 1;
    }

    .metric-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 9px 14px;

      & + & { border-top: 1px solid #f1f5f9; }
    }

    .metric-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11.5px;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      svg { flex-shrink: 0; }
    }

    .metric-value {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
      line-height: 1;
      transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1), color 0.22s ease;
    }

    /* Card footer */
    .card-foot {
      display: flex;
      align-items: center;
      gap: 8px;
      position: relative; z-index: 1;
    }

    .view-btn {
      flex: 1;
      display: inline-flex; align-items: center; justify-content: center; gap: 7px;
      padding: 10px 16px;
      background: #f8fafc; color: #374151;
      border: 1.5px solid #e2e8f0; border-radius: 11px;
      font-size: 13.5px; font-weight: 600; font-family: inherit; cursor: pointer;
      transition: all 0.22s ease;
      svg { width: 14px; height: 14px; stroke: #64748b; transition: stroke 0.22s ease; }
    }

    .mini-acts {
      display: flex; gap: 5px;
      opacity: 0; transform: translateY(4px);
      transition: opacity 0.2s ease, transform 0.2s ease;
    }

    .mini-btn {
      width: 36px; height: 36px; border-radius: 9px;
      border: 1.5px solid #e8ecf3; background: #f8fafc;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.15s ease;
      svg { width: 13px; height: 13px; }

      &.mini-edit {
        svg { stroke: #94a3b8; }
        &:hover { background: #eff6ff; border-color: #bfdbfe; svg { stroke: #2563eb; } }
      }

      &.mini-del {
        svg { stroke: #94a3b8; }
        &:hover { background: #fef2f2; border-color: #fecaca; svg { stroke: #ef4444; } }
      }
    }

    /* ── Skeleton cards ───────────────────────────────────────────────── */
    .sk-card {
      border-radius: 20px; border: 1px solid #f1f5f9; padding: 22px;
      display: flex; flex-direction: column; gap: 12px; background: #fff;
    }

    @keyframes shimmer {
      0%   { background-position: -200% 0; }
      100% { background-position:  200% 0; }
    }

    .sk-circle, .sk-line {
      background: linear-gradient(90deg, #f1f5f9 25%, #e8ecf0 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s ease-in-out infinite;
    }

    /* ── Empty state ──────────────────────────────────────────────────── */
    .empty-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 72px 24px; gap: 10px; text-align: center;
    }
    .empty-icon {
      width: 72px; height: 72px; border-radius: 20px; background: #f8fafc;
      display: flex; align-items: center; justify-content: center; margin-bottom: 6px;
      svg { width: 38px; height: 38px; stroke: #c8d4e3; }
    }
    .empty-title { font-size: 17px; font-weight: 700; color: #1e293b; margin: 0; }
    .empty-sub   { font-size: 13px; color: #94a3b8; margin: 0; }
    .empty-btn {
      margin-top: 6px; padding: 9px 20px;
      background: #fff; color: #2563eb; border: 1.5px solid #bfdbfe;
      border-radius: 9px; font-size: 13.5px; font-weight: 600; font-family: inherit;
      cursor: pointer; transition: all 0.15s ease;
      &:hover { background: #eff6ff; }
    }

    /* ── Responsive overrides ─────────────────────────────────────────── */
    @media (max-width: 640px) {
      .yl-page      { padding: 16px; }
      .ov-top       { flex-direction: column; align-items: flex-start; }
      .filter-strip { gap: 8px; }
      .search-wrap  { max-width: 100%; }
    }
  `],
})
export class YearLevelsListComponent implements OnInit {
  readonly service = inject(AcademicsService);
  private dialog   = inject(MatDialog);
  private snack    = inject(MatSnackBar);

  readonly skeletons = [1, 2, 3, 4, 5, 6];

  searchQuery = signal('');
  filterKs    = signal('');

  // ── Mock dataset — 6 year levels with rich display fields ────────────
  private readonly MOCK: YearLevelDisplay[] = [
    {
      id: 1, name: 'Year 7',  shortLabel: 'Y7',
      keyStage: 'Key Stage 3', keyStageCode: 'KS3', order: 1,
      totalStudents: 127, streams: 4, classrooms: 4,
      color: '#2563eb',
      gradient: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
      shadowColor: 'rgba(37,99,235,0.22)',
      raw: null,
    },
    {
      id: 2, name: 'Year 8',  shortLabel: 'Y8',
      keyStage: 'Key Stage 3', keyStageCode: 'KS3', order: 2,
      totalStudents: 118, streams: 4, classrooms: 4,
      color: '#7c3aed',
      gradient: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
      shadowColor: 'rgba(124,58,237,0.22)',
      raw: null,
    },
    {
      id: 3, name: 'Year 9',  shortLabel: 'Y9',
      keyStage: 'Key Stage 3', keyStageCode: 'KS3', order: 3,
      totalStudents: 135, streams: 5, classrooms: 5,
      color: '#0891b2',
      gradient: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
      shadowColor: 'rgba(8,145,178,0.22)',
      raw: null,
    },
    {
      id: 4, name: 'Year 10', shortLabel: 'Y10',
      keyStage: 'Key Stage 4', keyStageCode: 'KS4', order: 4,
      totalStudents: 142, streams: 5, classrooms: 5,
      color: '#059669',
      gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
      shadowColor: 'rgba(5,150,105,0.22)',
      raw: null,
    },
    {
      id: 5, name: 'Year 11', shortLabel: 'Y11',
      keyStage: 'Key Stage 4', keyStageCode: 'KS4', order: 5,
      totalStudents: 138, streams: 5, classrooms: 5,
      color: '#d97706',
      gradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
      shadowColor: 'rgba(217,119,6,0.22)',
      raw: null,
    },
    {
      id: 6, name: 'Year 12', shortLabel: 'Y12',
      keyStage: 'Key Stage 5', keyStageCode: 'KS5', order: 6,
      totalStudents: 84, streams: 3, classrooms: 3,
      color: '#e11d48',
      gradient: 'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)',
      shadowColor: 'rgba(225,29,72,0.22)',
      raw: null,
    },
  ];

  // ── Merge real API data with mock display fields ──────────────────────
  readonly displayLevels = computed<YearLevelDisplay[]>(() => {
    const real = this.service.yearLevels();
    if (real.length === 0) return this.MOCK;

    return real.map((yl, i) => {
      const template = this.MOCK[i % this.MOCK.length];
      const rawLabel = yl.name.replace(/[^0-9]/g, '');
      return {
        id:            yl.id,
        name:          yl.name,
        shortLabel:    rawLabel ? 'Y' + rawLabel.slice(-2) : yl.name.slice(0, 2).toUpperCase(),
        keyStage:      yl.key_stage?.name || yl.key_stage_name || '—',
        keyStageCode:  this.extractKsCode(yl),
        order:         yl.order,
        totalStudents: template.totalStudents,
        streams:       template.streams,
        classrooms:    template.classrooms,
        color:         template.color,
        gradient:      template.gradient,
        shadowColor:   template.shadowColor,
        raw:           yl,
      };
    }).sort((a, b) => a.order - b.order);
  });

  // ── Filtered view ─────────────────────────────────────────────────────
  readonly filteredLevels = computed(() => {
    let list = this.displayLevels();
    const q = this.searchQuery().toLowerCase().trim();
    if (q) list = list.filter(yl =>
      yl.name.toLowerCase().includes(q) ||
      yl.keyStage.toLowerCase().includes(q) ||
      yl.keyStageCode.toLowerCase().includes(q)
    );
    const ks = this.filterKs();
    if (ks) list = list.filter(yl => yl.keyStageCode === ks);
    return list;
  });

  // ── Aggregates ────────────────────────────────────────────────────────
  readonly uniqueKsList = computed(() => {
    const seen = new Set<string>();
    this.displayLevels().forEach(yl => seen.add(yl.keyStageCode));
    return Array.from(seen).sort();
  });

  readonly uniqueKsCount    = computed(() => this.uniqueKsList().length);
  readonly totalStudentsSum = computed(() => this.displayLevels().reduce((s, yl) => s + yl.totalStudents, 0));
  readonly totalStreamsSum   = computed(() => this.displayLevels().reduce((s, yl) => s + yl.streams, 0));

  // ── Helpers ───────────────────────────────────────────────────────────
  private extractKsCode(yl: YearLevel): string {
    const name = yl.key_stage?.name || yl.key_stage_name || '';
    const m = name.match(/ks\s*(\d)/i) || name.match(/key\s+stage\s+(\d)/i);
    return m ? `KS${m[1]}` : name.slice(0, 3).toUpperCase() || 'KS';
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.filterKs.set('');
  }

  ngOnInit(): void { this.service.getYearLevels().subscribe(); }

  // ── CRUD ──────────────────────────────────────────────────────────────
  viewDetails(yl: YearLevelDisplay): void {
    if (!yl.raw) {
      this.snack.open('Connect the API to manage this year level', 'OK', { duration: 2500 });
      return;
    }
    this.openEditDialog(yl);
  }

  openCreateDialog(): void {
    this.dialog.open(YearLevelDialogComponent, {
      width: '520px',
      data: { isEdit: false },
    }).afterClosed().subscribe(result => {
      if (!result) return;
      this.service.createYearLevel(result).subscribe({
        next: () => this.snack.open('Year level created', 'Dismiss', { duration: 3000 }),
        error: () => this.snack.open('Failed to create year level', 'Dismiss', { duration: 3500 }),
      });
    });
  }

  openEditDialog(yl: YearLevelDisplay): void {
    if (!yl.raw) {
      this.snack.open('Connect the API to edit this year level', 'OK', { duration: 2500 });
      return;
    }
    this.dialog.open(YearLevelDialogComponent, {
      width: '520px',
      data: { isEdit: true, yearLevel: yl.raw },
    }).afterClosed().subscribe(result => {
      if (!result) return;
      this.service.updateYearLevel(yl.id, result).subscribe({
        next: () => this.snack.open('Year level updated', 'Dismiss', { duration: 3000 }),
        error: () => this.snack.open('Failed to update year level', 'Dismiss', { duration: 3500 }),
      });
    });
  }

  confirmDelete(yl: YearLevelDisplay): void {
    if (!yl.raw) {
      this.snack.open('Connect the API to delete this year level', 'OK', { duration: 2500 });
      return;
    }
    if (!confirm(`Delete "${yl.name}"? This cannot be undone.`)) return;
    this.service.deleteYearLevel(yl.id).subscribe({
      next: () => this.snack.open(`"${yl.name}" deleted`, 'Dismiss', { duration: 3000 }),
      error: () => this.snack.open('Failed to delete year level', 'Dismiss', { duration: 3500 }),
    });
  }
}
