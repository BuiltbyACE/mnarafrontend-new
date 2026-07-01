import { Component, inject, OnInit, OnDestroy, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { StudentsService } from '../../services/students.service';
import { Admission } from 'apps/portalAdmin/src/app/shared/models/students.models';
import { AdmissionWizardComponent } from '../admission-wizard/admission-wizard';
import { BiometricEnrollDialogComponent } from '../../../../shared/components/biometric-enroll-dialog/biometric-enroll-dialog';

@Component({
  selector: 'app-admissions-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatDialogModule,
    AdmissionWizardComponent,
    BiometricEnrollDialogComponent,
  ],
  template: `
    <div class="adm-page">

      <!-- ── Overview Card ───────────────────────────────────────────── -->
      <div class="overview-card">
        <div class="ov-top">
          <div class="ov-lead">
            <div class="ov-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
                   stroke-linecap="round" stroke-linejoin="round" width="22" height="22">
                <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <line x1="19" y1="8" x2="19" y2="14"/>
                <line x1="22" y1="11" x2="16" y2="11"/>
              </svg>
            </div>
            <div class="ov-text">
              <span class="ov-crumb">Students</span>
              <h1 class="ov-title">Admissions Register</h1>
              <p class="ov-sub">Review, manage and enroll all incoming student applications</p>
            </div>
          </div>
          <button class="add-adm-btn" (click)="openWizard()">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" width="14" height="14">
              <line x1="8" y1="2" x2="8" y2="14"/><line x1="2" y1="8" x2="14" y2="8"/>
            </svg>
            New Admission
          </button>
        </div>

        <div class="ov-divider"></div>

        <div class="ov-stats">
          <div class="ostat-chip ostat-chip--blue">
            <span class="ostat-val">{{ studentsService.totalCount() }}</span>
            <span class="ostat-lbl">Total Admissions</span>
          </div>
          <div class="ostat-chip ostat-chip--amber">
            <span class="ostat-val">{{ summary()?.pending_review_count ?? 0 }}</span>
            <span class="ostat-lbl">Pending Review</span>
          </div>
          <div class="ostat-chip ostat-chip--violet">
            <span class="ostat-val">{{ summary()?.waitlisted_count ?? 0 }}</span>
            <span class="ostat-lbl">Waitlisted</span>
          </div>
          <div class="ostat-chip ostat-chip--teal">
            <span class="ostat-val">{{ transportCount() }}</span>
            <span class="ostat-lbl">On Transport</span>
          </div>
          <div class="ostat-chip ostat-chip--green">
            <span class="ostat-val">{{ lunchCount() }}</span>
            <span class="ostat-lbl">Lunch Enrolled</span>
          </div>
        </div>
      </div>

      <!-- ── Table Card ──────────────────────────────────────────────── -->
      <div class="table-card">

        <!-- Filter bar -->
        <div class="filter-bar">
          <div class="search-wrap">
            <svg class="search-ico" viewBox="0 0 16 16" fill="none" stroke="#94a3b8"
                 stroke-width="1.8" stroke-linecap="round" width="14" height="14">
              <circle cx="7" cy="7" r="5"/><line x1="11" y1="11" x2="15" y2="15"/>
            </svg>
            <input class="search-input" placeholder="Search by name or ID…" [formControl]="searchControl" />
          </div>

          <div class="flt-group">
            <label class="flt-label">Pathway</label>
            <div class="select-wrap">
              <select [(ngModel)]="filterPathway" (ngModelChange)="applyFilters()">
                <option value="">All Pathways</option>
                <option value="REGULAR_SCHOOL">Regular School</option>
                <option value="REGULAR_SCHOOL_INTERRUPTED">Interrupted</option>
                <option value="HOMESCHOOL">Homeschool</option>
                <option value="NONE">No Education</option>
              </select>
              <svg class="sel-chev" viewBox="0 0 10 6" fill="none" stroke="currentColor"
                   stroke-width="1.8" stroke-linecap="round" width="10" height="6">
                <polyline points="1 1 5 5 9 1"/>
              </svg>
            </div>
          </div>

          <div class="flt-group">
            <label class="flt-label">Status</label>
            <div class="select-wrap">
              <select [(ngModel)]="filterStatus" (ngModelChange)="applyFilters()">
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="WAITLISTED">Waitlisted</option>
                <option value="REJECTED">Rejected</option>
              </select>
              <svg class="sel-chev" viewBox="0 0 10 6" fill="none" stroke="currentColor"
                   stroke-width="1.8" stroke-linecap="round" width="10" height="6">
                <polyline points="1 1 5 5 9 1"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Table -->
        <div class="table-wrap" [class.loading]="studentsService.isLoading()">
          @if (studentsService.isLoading()) {
            <div class="load-overlay">
              <div class="spinner-ring"></div>
            </div>
          }

          <div class="table-scroll">
            <table mat-table [dataSource]="filteredAdmissions()">

              <!-- Student -->
              <ng-container matColumnDef="student">
                <th mat-header-cell *matHeaderCellDef>Student</th>
                <td mat-cell *matCellDef="let row">
                  <div class="stu-cell">
                    <div class="adm-avatar" [class.gender-f]="row.gender === 'F' || row.gender === 'FEMALE'">
                      {{ getInitials(row.student_first_name, row.student_last_name) }}
                    </div>
                    <div class="stu-info">
                      <span class="stu-name">{{ row.student_first_name }} {{ row.student_last_name }}</span>
                      <span class="stu-id">{{ row.student_school_id || 'Pending ID' }}</span>
                    </div>
                  </div>
                </td>
              </ng-container>

              <!-- Class Sought -->
              <ng-container matColumnDef="year_level">
                <th mat-header-cell *matHeaderCellDef>Class Sought</th>
                <td mat-cell *matCellDef="let row">
                  <span class="class-label">{{ row.class_sought_name || '—' }}</span>
                </td>
              </ng-container>

              <!-- Pathway -->
              <ng-container matColumnDef="pathway">
                <th mat-header-cell *matHeaderCellDef>Pathway</th>
                <td mat-cell *matCellDef="let row">
                  <span class="pathway-pill" [class]="'pathway-pill--' + getPathwayClass(row)">
                    {{ getPathwayLabel(row) }}
                  </span>
                </td>
              </ng-container>

              <!-- Logistics -->
              <ng-container matColumnDef="logistics">
                <th mat-header-cell *matHeaderCellDef>Logistics</th>
                <td mat-cell *matCellDef="let row">
                  <div class="logistics-col">
                    @if (row.transport_options && row.transport_options !== 'NONE') {
                      <span class="log-pill log-pill--transport">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"
                             stroke-linecap="round" stroke-linejoin="round" width="11" height="11">
                          <rect x="1" y="4" width="14" height="8" rx="2"/>
                          <line x1="1" y1="8" x2="15" y2="8"/>
                          <circle cx="4.5" cy="13" r="1.2" fill="currentColor" stroke="none"/>
                          <circle cx="11.5" cy="13" r="1.2" fill="currentColor" stroke="none"/>
                          <line x1="5" y1="4" x2="5" y2="2"/>
                          <line x1="11" y1="4" x2="11" y2="2"/>
                        </svg>
                        {{ getTransportLabel(row.transport_options) }}
                      </span>
                    }
                    @if (row.lunch_option) {
                      <span class="log-pill log-pill--lunch">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"
                             stroke-linecap="round" stroke-linejoin="round" width="11" height="11">
                          <path d="M3 2v5a3 3 0 006 0V2"/>
                          <line x1="6" y1="2" x2="6" y2="7"/>
                          <line x1="13" y1="2" x2="13" y2="14"/>
                        </svg>
                        Lunch
                      </span>
                    }
                    @if ((!row.transport_options || row.transport_options === 'NONE') && !row.lunch_option) {
                      <span class="log-none">—</span>
                    }
                  </div>
                </td>
              </ng-container>

              <!-- Medical -->
              <ng-container matColumnDef="medical">
                <th mat-header-cell *matHeaderCellDef>Medical</th>
                <td mat-cell *matCellDef="let row">
                  <span class="med-badge"
                        [class.med-badge--ok]="row.medical_record?.status === 'Complete'"
                        [class.med-badge--missing]="!row.medical_record || row.medical_record?.status !== 'Complete'">
                    {{ row.medical_record?.status || 'Missing' }}
                  </span>
                </td>
              </ng-container>

              <!-- Commitment -->
              <ng-container matColumnDef="commitment">
                <th mat-header-cell *matHeaderCellDef>Commitment</th>
                <td mat-cell *matCellDef="let row">
                  <span class="commit-badge"
                        [class.commit-badge--submitted]="row.commitment_status === 'SUBMITTED'"
                        [class.commit-badge--ack]="row.commitment_status === 'ACKNOWLEDGED'">
                    {{ getCommitmentLabel(row.commitment_status) }}
                  </span>
                </td>
              </ng-container>

              <!-- Applied -->
              <ng-container matColumnDef="applied">
                <th mat-header-cell *matHeaderCellDef>Applied</th>
                <td mat-cell *matCellDef="let row">
                  <div class="date-col">
                    <span class="date-val">{{ row.date_of_admission | date:'MMM d, y' }}</span>
                    <span class="status-chip" [class]="'status-chip--' + getStatusClass(row.status)">
                      {{ row.status || 'Pending' }}
                    </span>
                  </div>
                </td>
              </ng-container>

              <!-- Biometrics -->
              <ng-container matColumnDef="biometric">
                <th mat-header-cell *matHeaderCellDef>Biometrics</th>
                <td mat-cell *matCellDef="let row">
                  <button class="bio-btn" (click)="openBiometricEnroll(row); $event.stopPropagation()"
                          matTooltip="Manage biometric enrollment">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                         stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
                      <path d="M12 2a6 6 0 00-6 6c0 3.5 2.5 6 6 6s6-2.5 6-6a6 6 0 00-6-6z"/>
                      <path d="M5 20c0-2.5 2.5-5 7-5s7 2.5 7 5"/>
                      <circle cx="12" cy="16" r="1"/>
                      <line x1="12" y1="10" x2="12" y2="13"/>
                    </svg>
                  </button>
                </td>
              </ng-container>

              <!-- Actions -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let row">
                  <div class="action-group">
                    <button class="act-btn act-btn--view" (click)="viewAdmission(row)" matTooltip="View Full Record">
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"
                           stroke-linecap="round" stroke-linejoin="round" width="13" height="13">
                        <circle cx="8" cy="8" r="3"/>
                        <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/>
                      </svg>
                      View
                    </button>
                    <button class="act-btn act-btn--enroll" (click)="approveAdmission(row)" matTooltip="Enroll Student">
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"
                           stroke-linecap="round" stroke-linejoin="round" width="13" height="13">
                        <polyline points="2 8 6 12 14 4"/>
                      </svg>
                      Enroll
                    </button>
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="adm-row"
                  (click)="viewAdmission(row)"></tr>

              <tr class="mat-row" *matNoDataRow>
                <td class="mat-cell no-data-cell" [attr.colspan]="displayedColumns.length">
                  <div class="empty-state">
                    <svg viewBox="0 0 40 40" fill="none" stroke="#cbd5e1" stroke-width="1.4"
                         stroke-linecap="round" width="40" height="40">
                      <rect x="8" y="6" width="24" height="30" rx="3"/>
                      <line x1="14" y1="14" x2="26" y2="14"/>
                      <line x1="14" y1="20" x2="26" y2="20"/>
                      <line x1="14" y1="26" x2="20" y2="26"/>
                    </svg>
                    <span>No admissions found</span>
                    <button class="empty-add-btn" (click)="openWizard()">Add First Admission</button>
                  </div>
                </td>
              </tr>
            </table>
          </div>

          <mat-paginator
            [length]="studentsService.totalCount()"
            [pageSize]="pageSize"
            [pageSizeOptions]="[10, 25, 50]"
            (page)="onPageChange($event)"
            showFirstLastButtons>
          </mat-paginator>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════════ -->
    <!-- New Admission Popup (Blur Backdrop)                           -->
    <!-- ══════════════════════════════════════════════════════════════ -->
    @if (isWizardOpen()) {
      <div class="adm-backdrop" (click)="closeWizard()">
        <div class="adm-popup" (click)="$event.stopPropagation()">

          <!-- Popup header bar -->
          <div class="adm-popup-header">
            <div class="adm-popup-title-wrap">
              <div class="adm-popup-icon">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"
                     stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
                  <path d="M13 17v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <line x1="17" y1="7" x2="17" y2="13"/>
                  <line x1="20" y1="10" x2="14" y2="10"/>
                </svg>
              </div>
              <div>
                <h2 class="adm-popup-title">New Student Admission</h2>
                <p class="adm-popup-sub">Complete all steps to register a new student</p>
              </div>
            </div>
            <button class="adm-popup-close" (click)="closeWizard()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                   stroke-linecap="round" width="16" height="16">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <!-- Wizard rendered inside the popup -->
          <div class="adm-popup-body">
            <app-admission-wizard
              [inDialog]="true"
              (wizardClosed)="onWizardClosed($event)" />
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; font-family: 'Inter', sans-serif; }
    .adm-page { padding: 0 0 32px; }

    /* ── Overview Card ──────────────────────────────────────────────── */
    .overview-card {
      position: relative;
      background: #ffffff;
      border: 1px solid #e0e9ff;
      border-radius: 20px;
      box-shadow: 0 1px 3px rgba(37,99,235,0.06), 0 4px 20px rgba(37,99,235,0.05);
      overflow: hidden;
      margin-bottom: 20px;
      &::before {
        content: '';
        position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
        background: linear-gradient(180deg, #2563eb 0%, #7c3aed 100%);
      }
      &::after {
        content: '';
        position: absolute; top: -30px; left: -30px; width: 300px; height: 240px;
        background: radial-gradient(ellipse at 0% 0%, rgba(37,99,235,0.07), transparent 65%);
        pointer-events: none;
      }
    }

    .ov-top {
      display: flex; align-items: center; justify-content: space-between;
      padding: 22px 24px 18px 28px; gap: 16px;
    }
    .ov-lead { display: flex; align-items: center; gap: 16px; }
    .ov-icon {
      width: 46px; height: 46px; border-radius: 14px; flex-shrink: 0;
      background: linear-gradient(135deg, #2563eb, #3b82f6);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 12px rgba(37,99,235,0.28);
      svg { stroke: #fff; }
    }
    .ov-text { display: flex; flex-direction: column; gap: 2px; }
    .ov-crumb { font-size: 10.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.07em; }
    .ov-title { font-size: 1.35rem; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.01em; }
    .ov-sub   { font-size: 0.8125rem; color: #64748b; margin: 0; }

    .add-adm-btn {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 10px 20px; border-radius: 10px; flex-shrink: 0;
      background: linear-gradient(135deg, #2563eb, #3b82f6);
      border: none; color: #fff;
      font-size: 13.5px; font-weight: 700; font-family: inherit;
      cursor: pointer; white-space: nowrap;
      box-shadow: 0 3px 10px rgba(37,99,235,0.3);
      transition: all 0.18s;
      svg { stroke: #fff; }
      &:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(37,99,235,0.38); }
    }

    .ov-divider {
      height: 1px; background: linear-gradient(90deg, #e0e9ff, #f0e8ff, #e0e9ff);
      margin: 0 24px 0 28px;
    }

    .ov-stats {
      display: flex; gap: 12px; padding: 16px 24px 20px 28px;
      flex-wrap: wrap;
    }
    .ostat-chip {
      --chip-color: #2563eb;
      position: relative; background: #fff;
      border: 1px solid color-mix(in srgb, var(--chip-color) 18%, #e8f0fe);
      border-radius: 12px; padding: 12px 16px 12px 16px;
      display: flex; flex-direction: column; gap: 3px;
      min-width: 120px; overflow: hidden; cursor: default;
      transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s;
      &::before {
        content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
        background: var(--chip-color);
      }
      &::after {
        content: ''; position: absolute; top: -8px; left: -8px;
        width: 80px; height: 60px;
        background: radial-gradient(ellipse at 0% 0%, var(--chip-color), transparent 70%);
        opacity: 0.06; pointer-events: none;
      }
      &:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,0.08); }
      &--blue   { --chip-color: #2563eb; }
      &--amber  { --chip-color: #d97706; }
      &--violet { --chip-color: #7c3aed; }
      &--teal   { --chip-color: #0891b2; }
      &--green  { --chip-color: #059669; }
    }
    .ostat-val {
      font-size: 1.6rem; font-weight: 800; color: #0f172a;
      line-height: 1; letter-spacing: -0.02em;
    }
    .ostat-lbl { font-size: 11px; font-weight: 600; color: #64748b; letter-spacing: 0.01em; }

    /* ── Table Card ─────────────────────────────────────────────────── */
    .table-card {
      background: #fff; border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04);
      overflow: hidden;
    }

    /* Filter bar */
    .filter-bar {
      display: flex; align-items: flex-end; gap: 12px;
      padding: 16px 20px; border-bottom: 1px solid #f1f5f9; flex-wrap: wrap;
    }
    .search-wrap {
      position: relative; flex: 1; min-width: 220px;
    }
    .search-ico {
      position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
      pointer-events: none;
    }
    .search-input {
      width: 100%; padding: 9px 14px 9px 34px;
      border: 1px solid #e2e8f0; border-radius: 9px;
      font-size: 13.5px; color: #1e293b; font-family: inherit;
      background: #f8fafc; box-sizing: border-box; transition: all 0.15s;
      &:focus { outline: none; border-color: #93c5fd; background: #fff; box-shadow: 0 0 0 3px rgba(59,130,246,0.12); }
      &::placeholder { color: #94a3b8; }
    }

    .flt-group { display: flex; flex-direction: column; gap: 4px; }
    .flt-label { font-size: 10.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; }
    .select-wrap { position: relative; }
    .select-wrap select {
      appearance: none; -webkit-appearance: none;
      padding: 9px 30px 9px 12px; min-width: 150px;
      border: 1px solid #e2e8f0; border-radius: 9px;
      font-size: 13.5px; color: #1e293b; font-family: inherit;
      background: #f8fafc; cursor: pointer; transition: all 0.15s;
      &:focus { outline: none; border-color: #93c5fd; background: #fff; box-shadow: 0 0 0 3px rgba(59,130,246,0.12); }
    }
    .sel-chev {
      position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
      pointer-events: none; stroke: #94a3b8;
    }

    /* Table wrapper */
    .table-wrap { position: relative; }
    .load-overlay {
      position: absolute; inset: 0; z-index: 10;
      background: rgba(255,255,255,0.72);
      display: flex; align-items: center; justify-content: center;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spinner-ring {
      width: 36px; height: 36px;
      border: 3px solid #e2e8f0; border-top-color: #2563eb;
      border-radius: 50%; animation: spin 0.8s linear infinite;
    }

    /* Scrollable table body */
    .table-scroll {
      overflow-y: auto;
      max-height: calc(100vh - 460px); min-height: 280px;
      scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent;
      &::-webkit-scrollbar       { width: 5px; }
      &::-webkit-scrollbar-track { background: transparent; }
      &::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px;
        &:hover { background: #cbd5e1; }
      }
    }

    table { width: 100%; }

    .mat-mdc-header-row th {
      position: sticky; top: 0; z-index: 2; background: #fff;
      border-bottom: 1px solid #f1f5f9;
    }
    .mat-mdc-header-cell {
      font-size: 0.7rem; font-weight: 700; color: #64748b;
      text-transform: uppercase; letter-spacing: 0.06em;
    }
    .mat-mdc-cell { font-size: 0.875rem; color: #334155; }

    .adm-row {
      cursor: pointer; transition: background 0.12s;
      &:hover { background: #f8fafc; }
    }

    /* Student cell */
    .stu-cell { display: flex; align-items: center; gap: 12px; padding: 6px 0; }
    .adm-avatar {
      width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, #2563eb, #3b82f6);
      display: flex; align-items: center; justify-content: center;
      font-size: 12.5px; font-weight: 800; color: #fff;
      &.gender-f { background: linear-gradient(135deg, #db2777, #ec4899); }
    }
    .stu-info { display: flex; flex-direction: column; gap: 1px; }
    .stu-name { font-weight: 600; color: #1e293b; font-size: 0.875rem; }
    .stu-id   { font-size: 0.72rem; color: #94a3b8; font-family: monospace; }

    .class-label { font-size: 0.875rem; font-weight: 500; color: #334155; }

    /* Pathway pills */
    .pathway-pill {
      display: inline-block; padding: 3px 10px; border-radius: 20px;
      font-size: 11px; font-weight: 700; white-space: nowrap;
      background: #f1f5f9; color: #475569;
      &--regular     { background: #dcfce7; color: #166534; }
      &--interrupted { background: #fef3c7; color: #92400e; }
      &--homeschool  { background: #e0e7ff; color: #3730a3; }
      &--none        { background: #f1f5f9; color: #475569; }
    }

    /* Logistics */
    .logistics-col { display: flex; flex-direction: column; gap: 4px; }
    .log-pill {
      display: inline-flex; align-items: center; gap: 4px; width: fit-content;
      padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 700;
      &--transport { background: #dbeafe; color: #1d4ed8; }
      &--lunch     { background: #d1fae5; color: #065f46; }
    }
    .log-none { color: #cbd5e1; font-size: 16px; line-height: 1; }

    /* Medical badge */
    .med-badge {
      display: inline-block; padding: 3px 10px; border-radius: 20px;
      font-size: 11px; font-weight: 700;
      background: #fee2e2; color: #991b1b;
      &--ok      { background: #dcfce7; color: #166534; }
      &--missing { background: #fee2e2; color: #991b1b; }
    }

    /* Commitment badge */
    .commit-badge {
      display: inline-block; padding: 3px 10px; border-radius: 20px;
      font-size: 11px; font-weight: 700;
      background: #fef3c7; color: #92400e;
      &--submitted { background: #dcfce7; color: #166534; }
      &--ack       { background: #dbeafe; color: #1d4ed8; }
    }

    /* Applied date + status */
    .date-col { display: flex; flex-direction: column; gap: 4px; }
    .date-val { font-size: 0.8125rem; font-weight: 500; color: #334155; }
    .status-chip {
      display: inline-block; padding: 2px 8px; border-radius: 20px;
      font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;
      width: fit-content;
      &--pending    { background: #fef3c7; color: #92400e; }
      &--approved   { background: #dcfce7; color: #166534; }
      &--waitlisted { background: #ede9fe; color: #4c1d95; }
      &--rejected   { background: #fee2e2; color: #991b1b; }
    }

    /* Action buttons */
    .action-group { display: flex; gap: 6px; flex-wrap: nowrap; }
    .act-btn {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 6px 11px; border-radius: 8px;
      font-size: 12px; font-weight: 600; font-family: inherit; cursor: pointer;
      border: 1.5px solid; transition: all 0.15s; white-space: nowrap;
      &--view {
        background: #f8fafc; border-color: #e2e8f0; color: #374151;
        &:hover { background: #eff6ff; border-color: #bfdbfe; color: #2563eb; }
      }
      &--enroll {
        background: #fff; border-color: #bbf7d0; color: #065f46;
        &:hover { background: #f0fdf4; border-color: #86efac; }
      }
    }

    /* Empty state */
    .no-data-cell { text-align: center; padding: 48px; }
    .empty-state {
      display: flex; flex-direction: column; align-items: center; gap: 12px; color: #94a3b8;
      span { font-size: 14px; }
    }
    .empty-add-btn {
      margin-top: 4px; padding: 9px 20px;
      background: linear-gradient(135deg, #2563eb, #3b82f6);
      border: none; border-radius: 9px; color: #fff;
      font-size: 13px; font-weight: 700; font-family: inherit; cursor: pointer;
      box-shadow: 0 2px 8px rgba(37,99,235,0.25);
      transition: all 0.15s;
      &:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(37,99,235,0.35); }
    }

    /* ══════════════════════════════════════════════════════════════════ */
    /* ADMISSION WIZARD POPUP                                            */
    /* ══════════════════════════════════════════════════════════════════ */

    @keyframes backdropIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes popupIn {
      from { opacity: 0; transform: translateY(32px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    .adm-backdrop {
      position: fixed; inset: 0;
      background: rgba(15, 23, 42, 0.58);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 1000;
      display: flex; align-items: center; justify-content: center;
      padding: 16px;
      animation: backdropIn 0.22s ease;
    }

    .adm-popup {
      background: #ffffff;
      border-radius: 20px;
      width: min(98vw, 980px);
      height: min(94vh, 860px);
      display: flex; flex-direction: column;
      overflow: hidden;
      box-shadow: 0 40px 100px rgba(0,0,0,0.28), 0 10px 40px rgba(0,0,0,0.12);
      animation: popupIn 0.32s cubic-bezier(0.22, 1, 0.36, 1) both;
    }

    /* Popup header bar */
    .adm-popup-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 18px 24px;
      background: linear-gradient(135deg, #f0f6ff 0%, #fafbff 60%, #f3f0ff 100%);
      border-bottom: 1px solid #e8f0fe;
      flex-shrink: 0;
    }
    .adm-popup-title-wrap { display: flex; align-items: center; gap: 14px; }
    .adm-popup-icon {
      width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0;
      background: linear-gradient(135deg, #2563eb, #3b82f6);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 12px rgba(37,99,235,0.28);
      svg { stroke: #fff; }
    }
    .adm-popup-title {
      font-size: 17px; font-weight: 800; color: #0f172a;
      margin: 0; letter-spacing: -0.01em;
    }
    .adm-popup-sub { font-size: 12px; color: #64748b; margin: 2px 0 0; }
    .adm-popup-close {
      width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
      border: 1px solid #e2e8f0; background: #fff;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.15s;
      svg { stroke: #64748b; }
      &:hover { background: #fef2f2; border-color: #fecaca; svg { stroke: #ef4444; } }
    }

    /* Wizard body (scrollable) */
    .adm-popup-body {
      flex: 1; overflow-y: auto;
      scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent;
      &::-webkit-scrollbar       { width: 5px; }
      &::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
    }

    .bio-btn {
      width: 32px; height: 32px; border-radius: 8px; border: 1px solid #e2e8f0;
      background: #fff; cursor: pointer; display: inline-flex;
      align-items: center; justify-content: center;
      transition: all 0.15s;
      svg { stroke: #94a3b8; }
      &:hover { background: #eff6ff; border-color: #93c5fd; svg { stroke: #2563eb; } }
    }

    @media (max-width: 768px) {
      .ov-top { flex-direction: column; align-items: flex-start; }
      .add-adm-btn { width: 100%; justify-content: center; }
      .ostat-chip { min-width: calc(50% - 6px); }
      .filter-bar { flex-direction: column; }
      .search-wrap { width: 100%; }
    }
  `],
})
export class AdmissionsListComponent implements OnInit, OnDestroy {
  readonly studentsService = inject(StudentsService);
  private snackBar = inject(MatSnackBar);
  private router   = inject(Router);
  private dialog   = inject(MatDialog);
  private destroy$ = new Subject<void>();

  readonly admissions = this.studentsService.admissions;
  readonly summary    = this.studentsService.admissionsSummary;

  isWizardOpen  = signal(false);
  searchControl = new FormControl('');
  searchQuery   = '';
  filterPathway = '';
  filterStatus  = '';
  currentPage   = 0;
  pageSize      = 25;

  readonly displayedColumns = ['student', 'year_level', 'pathway', 'logistics', 'medical', 'commitment', 'applied', 'biometric', 'actions'];

  readonly transportCount = computed(() =>
    this.admissions().filter(a => a.transport_options && a.transport_options !== 'NONE').length
  );
  readonly lunchCount = computed(() =>
    this.admissions().filter(a => a.lunch_option).length
  );

  readonly filteredAdmissions = computed(() => {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.admissions();
    return this.admissions().filter(a =>
      `${a.student_first_name} ${a.student_last_name}`.toLowerCase().includes(q) ||
      (a.student_school_id || '').toLowerCase().includes(q)
    );
  });

  ngOnInit(): void {
    this.loadAdmissions();
    this.studentsService.loadAdmissionsSummary();
    this.searchControl.valueChanges.pipe(
      debounceTime(350), distinctUntilChanged(), takeUntil(this.destroy$)
    ).subscribe(term => { this.searchQuery = term || ''; });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  loadAdmissions(): void {
    const filters: { status?: string } = {};
    if (this.filterStatus) filters.status = this.filterStatus;
    this.studentsService.getAdmissions(this.currentPage + 1, this.pageSize, filters).subscribe();
  }

  applyFilters(): void { this.currentPage = 0; this.loadAdmissions(); }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize    = event.pageSize;
    this.loadAdmissions();
  }

  openWizard():  void { this.isWizardOpen.set(true); }
  closeWizard(): void { this.isWizardOpen.set(false); }

  onWizardClosed(success: boolean): void {
    this.isWizardOpen.set(false);
    if (success) this.loadAdmissions();
  }

  getInitials(firstName?: string, lastName?: string): string {
    const f = (firstName ?? '')[0] ?? '';
    const l = (lastName  ?? '')[0] ?? '';
    return (f + l).toUpperCase() || '??';
  }

  getPathwayLabel(row: Admission): string {
    const labels: Record<string, string> = {
      REGULAR_SCHOOL: 'Regular', REGULAR_SCHOOL_INTERRUPTED: 'Interrupted',
      HOMESCHOOL: 'Homeschool', NONE: 'None',
    };
    return labels[row.pathway || ''] || '—';
  }

  getPathwayClass(row: Admission): string {
    const map: Record<string, string> = {
      REGULAR_SCHOOL: 'regular', REGULAR_SCHOOL_INTERRUPTED: 'interrupted',
      HOMESCHOOL: 'homeschool', NONE: 'none',
    };
    return map[row.pathway || ''] || 'none';
  }

  getTransportLabel(val: string): string {
    if (!val || val === 'NONE') return '';
    return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
  }

  getCommitmentLabel(status?: string): string {
    const map: Record<string, string> = {
      PENDING: 'Pending', SUBMITTED: 'Submitted', ACKNOWLEDGED: 'Acknowledged',
    };
    return map[status || ''] || 'Pending';
  }

  getStatusClass(status: string): string {
    return (status || 'pending').toLowerCase();
  }

  viewAdmission(admission: Admission): void {
    this.router.navigate(['/portalAdmin/students', admission.id]);
  }

  approveAdmission(admission: Admission): void {
    this.snackBar.open(
      `Processing enrollment for ${admission.student_first_name} ${admission.student_last_name}`,
      'Close', { duration: 2500 }
    );
  }

  openBiometricEnroll(admission: Admission): void {
    const userId = (admission as any).user_id;
    if (!userId) {
      this.snackBar.open('Student account not fully created yet', 'Close', { duration: 3000 });
      return;
    }
    this.dialog.open(BiometricEnrollDialogComponent, {
      width: '480px',
      maxWidth: '95vw',
      panelClass: 'bio-enroll-panel',
      data: {
        userId,
        userName: `${admission.student_first_name} ${admission.student_last_name}`,
        schoolId: admission.student_school_id,
        role: 'STUDENT',
      },
    });
  }
}
