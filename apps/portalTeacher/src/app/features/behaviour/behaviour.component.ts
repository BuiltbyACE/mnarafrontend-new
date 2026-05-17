import { Component, signal, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TeacherBehaviourService, BehaviourRecordData } from '../../core/services/teacher-behaviour.service';

@Component({
  selector: 'app-teacher-behaviour',
  standalone: true,
  imports: [
    DatePipe,
    MatCardModule, MatIconModule, MatButtonModule, MatChipsModule,
    MatTableModule, MatTabsModule, MatTooltipModule
  ],
  template: `
    <div class="behaviour-container">
      <div class="header">
        <h1 class="page-title">Behaviour & Discipline</h1>
        <p class="page-subtitle">Track commendations, incidents, and follow-ups</p>
      </div>

      <div class="summary-cards">
        <mat-card class="summary-card total">
          <mat-icon>receipt_long</mat-icon>
          <div class="summary-info">
            <span class="summary-value">{{ totalRecords() }}</span>
            <span class="summary-label">Total Records</span>
          </div>
        </mat-card>
        <mat-card class="summary-card commendation">
          <mat-icon>emoji_events</mat-icon>
          <div class="summary-info">
            <span class="summary-value">{{ commendationsCount() }}</span>
            <span class="summary-label">Commendations</span>
          </div>
        </mat-card>
        <mat-card class="summary-card incident">
          <mat-icon>warning</mat-icon>
          <div class="summary-info">
            <span class="summary-value">{{ incidentsCount() }}</span>
            <span class="summary-label">Incidents</span>
          </div>
        </mat-card>
        <mat-card class="summary-card followup">
          <mat-icon>pending_actions</mat-icon>
          <div class="summary-info">
            <span class="summary-value">{{ pendingFollowUps() }}</span>
            <span class="summary-label">Pending Follow-ups</span>
          </div>
        </mat-card>
      </div>

      <mat-tab-group class="filter-tabs" (selectedTabChange)="onTabChange($event.index)">
        <mat-tab label="All Records"></mat-tab>
        <mat-tab label="Commendations"></mat-tab>
        <mat-tab label="Incidents"></mat-tab>
      </mat-tab-group>

      <div class="table-wrapper">
        <table mat-table [dataSource]="filteredRecords()" class="behaviour-table">

          <ng-container matColumnDef="studentName">
            <th mat-header-cell *matHeaderCellDef> Student Name </th>
            <td mat-cell *matCellDef="let record">
              <div class="student-cell">
                <div class="avatar">{{ record.studentName.charAt(0) }}</div>
                <span>{{ record.studentName }}</span>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="type">
            <th mat-header-cell *matHeaderCellDef> Type </th>
            <td mat-cell *matCellDef="let record">
              <span class="type-badge" [class.commendation]="record.type === 'COMMENDATION'" [class.incident]="record.type === 'INCIDENT'">
                <mat-icon class="type-icon">{{ record.type === 'COMMENDATION' ? 'thumb_up' : 'gpp_bad' }}</mat-icon>
                {{ record.type === 'COMMENDATION' ? 'Commendation' : 'Incident' }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="severity">
            <th mat-header-cell *matHeaderCellDef> Severity </th>
            <td mat-cell *matCellDef="let record">
              <span class="severity-badge" [class]="record.severity.toLowerCase()">
                {{ record.severity }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="description">
            <th mat-header-cell *matHeaderCellDef> Description </th>
            <td mat-cell *matCellDef="let record">
              <span class="description-text" [matTooltip]="record.description">{{ record.description }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef> Date </th>
            <td mat-cell *matCellDef="let record"> {{ record.date }} </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef> Status </th>
            <td mat-cell *matCellDef="let record">
              <span class="status-badge" [class]="record.status.toLowerCase()">
                {{ record.status === 'FOLLOW_UP' ? 'Follow Up' : record.status }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="reportedBy">
            <th mat-header-cell *matHeaderCellDef> Reported By </th>
            <td mat-cell *matCellDef="let record"> {{ record.reportedBy }} </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="behaviour-row"></tr>
        </table>

        @if (filteredRecords().length === 0) {
          <div class="empty-state">
            <mat-icon>inbox</mat-icon>
            <p>No behaviour records match the current filter</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .behaviour-container {
      padding: 24px;
      font-family: 'Segoe UI', Roboto, sans-serif;
      color: #1e293b;
    }
    .header {
      margin-bottom: 24px;
    }
    .page-title {
      font-size: 28px;
      font-weight: 700;
      color: #1e3a8a;
      margin: 0 0 4px 0;
    }
    .page-subtitle {
      font-size: 14px;
      color: #64748b;
      margin: 0;
    }
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .summary-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px !important;
      border-radius: 12px !important;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06) !important;
      border-left: 4px solid transparent;
    }
    .summary-card.total {
      border-left-color: #2563eb;
    }
    .summary-card.total mat-icon {
      color: #2563eb;
    }
    .summary-card.commendation {
      border-left-color: #22c55e;
    }
    .summary-card.commendation mat-icon {
      color: #22c55e;
    }
    .summary-card.incident {
      border-left-color: #ef4444;
    }
    .summary-card.incident mat-icon {
      color: #ef4444;
    }
    .summary-card.followup {
      border-left-color: #f59e0b;
    }
    .summary-card.followup mat-icon {
      color: #f59e0b;
    }
    .summary-card mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }
    .summary-info {
      display: flex;
      flex-direction: column;
    }
    .summary-value {
      font-size: 28px;
      font-weight: 700;
      color: #1e293b;
      line-height: 1.2;
    }
    .summary-label {
      font-size: 13px;
      color: #64748b;
      font-weight: 500;
    }
    .filter-tabs {
      margin-bottom: 20px;
    }
    .filter-tabs ::ng-deep .mdc-tab__text-label {
      font-weight: 500;
    }
    .filter-tabs ::ng-deep .mdc-tab-indicator--active .mdc-tab-indicator__content {
      border-color: #2563eb;
    }
    .table-wrapper {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
      overflow: hidden;
    }
    .behaviour-table {
      width: 100%;
    }
    th.mat-header-cell {
      font-weight: 600;
      color: #475569;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: #f8fafc;
      padding: 14px 16px;
    }
    td.mat-cell {
      padding: 12px 16px;
      font-size: 14px;
    }
    .student-cell {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2563eb, #1e3a8a);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 600;
    }
    .type-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 600;
    }
    .type-badge.commendation {
      background: #dcfce7;
      color: #166534;
    }
    .type-badge.incident {
      background: #fce4ec;
      color: #c62828;
    }
    .type-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }
    .severity-badge {
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    .severity-badge.low {
      background: #e2e8f0;
      color: #475569;
    }
    .severity-badge.medium {
      background: #fef3c7;
      color: #92400e;
    }
    .severity-badge.high {
      background: #ffedd5;
      color: #c2410c;
    }
    .severity-badge.critical {
      background: #fce4ec;
      color: #c62828;
    }
    .description-text {
      max-width: 240px;
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .status-badge {
      padding: 3px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    .status-badge.open {
      background: #fce4ec;
      color: #c62828;
    }
    .status-badge.resolved {
      background: #dcfce7;
      color: #166534;
    }
    .status-badge.follow_up {
      background: #fef3c7;
      color: #92400e;
    }
    .behaviour-row:hover {
      background: #f1f5f9;
    }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      color: #94a3b8;
    }
    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 12px;
    }
    .empty-state p {
      font-size: 15px;
      margin: 0;
    }
  `]
})
export class BehaviourComponent {
  private behaviourService = inject(TeacherBehaviourService);

  readonly displayedColumns = ['studentName', 'type', 'severity', 'description', 'date', 'status', 'reportedBy'];

  readonly activeTabIndex = signal(0);

  readonly allRecords = this.behaviourService.records;
  readonly stats = this.behaviourService.stats;

  readonly totalRecords = computed(() => this.allRecords().length);
  readonly commendationsCount = computed(() => this.allRecords().filter(r => r.type === 'COMMENDATION').length);
  readonly incidentsCount = computed(() => this.allRecords().filter(r => r.type === 'INCIDENT').length);
  readonly pendingFollowUps = computed(() => this.allRecords().filter(r => r.status === 'FOLLOW_UP' || r.status === 'OPEN').length);

  readonly filteredRecords = computed(() => {
    const tab = this.activeTabIndex();
    if (tab === 1) return this.allRecords().filter(r => r.type === 'COMMENDATION');
    if (tab === 2) return this.allRecords().filter(r => r.type === 'INCIDENT');
    return this.allRecords();
  });

  constructor() {
    this.behaviourService.fetchRecords();
    this.behaviourService.fetchStats();
  }

  onTabChange(index: number) {
    this.activeTabIndex.set(index);
  }
}
