import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommunicationService, ActionItem } from '../../services/communication.service';

@Component({
  selector: 'app-meeting-manager',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatChipsModule,
    MatCheckboxModule,
    MatDividerModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="meetings-page">
      <header class="page-header">
        <div class="title-section">
          <h1>Meetings & Tasks</h1>
          <p class="subtitle">Schedule meetings and track action items</p>
        </div>
        <button mat-raised-button color="primary">
          <mat-icon>add</mat-icon>
          Schedule Meeting
        </button>
      </header>

      <div class="two-col">
        <!-- LEFT COLUMN: Meeting Ledger -->
        <mat-card class="ledger-card">
          <mat-card-header>
            <mat-card-title>Meeting Ledger</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (isLoadingMeetings()) {
              <div class="loading-row"><mat-spinner diameter="32" /></div>
            } @else if (meetings().length > 0) {
              <div class="table-container">
                <table mat-table [dataSource]="meetings()">
                  <ng-container matColumnDef="date_time">
                    <th mat-header-cell *matHeaderCellDef>Date / Time</th>
                    <td mat-cell *matCellDef="let m">{{ m.date | date:'MMM d, y' }}<br><span class="time">{{ m.time }}</span></td>
                  </ng-container>
                  <ng-container matColumnDef="title">
                    <th mat-header-cell *matHeaderCellDef>Meeting</th>
                    <td mat-cell *matCellDef="let m">
                      <span class="meeting-title">{{ m.title }}</span>
                      <span class="participants">{{ m.participant_count }} participants</span>
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="type">
                    <th mat-header-cell *matHeaderCellDef>Type</th>
                    <td mat-cell *matCellDef="let m">
                      <div class="type-cell">
                        <mat-icon>{{ m.type === 'VIRTUAL' ? 'videocam' : 'groups' }}</mat-icon>
                        <span>{{ m.type === 'VIRTUAL' ? 'Virtual' : 'In-Person' }}</span>
                      </div>
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Status</th>
                    <td mat-cell *matCellDef="let m">
                      <mat-chip [class]="m.status.toLowerCase()">{{ m.status }}</mat-chip>
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>Actions</th>
                    <td mat-cell *matCellDef="let m">
                      <div class="action-btns">
                        <button mat-stroked-button size="small">Edit</button>
                        <button mat-stroked-button size="small">Minutes</button>
                      </div>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="meetingColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: meetingColumns;"></tr>
                </table>
              </div>
            } @else {
              <div class="empty-state">
                <mat-icon>event</mat-icon>
                <p>No meetings scheduled</p>
              </div>
            }
          </mat-card-content>
        </mat-card>

        <!-- RIGHT COLUMN: Action Items -->
        <mat-card class="action-card">
          <mat-card-header>
            <mat-card-title>Pending Action Items</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (actionItems().length > 0) {
              <div class="action-list">
                @for (item of actionItems(); track item.id) {
                  <div class="action-row">
                    <mat-checkbox
                      [checked]="item.status === 'COMPLETED'"
                      (change)="toggleAction(item)"
                      [disabled]="item.status === 'COMPLETED'">
                    </mat-checkbox>
                    <div class="action-body">
                      <span class="action-task">{{ item.task_description }}</span>
                      <span class="action-assignee">
                        <mat-icon>person</mat-icon>
                        {{ item.assigned_to_name }}
                      </span>
                    </div>
                    <span
                      class="due-badge"
                      [class.overdue]="isOverdue(item)">
                      {{ item.due_date | date:'MMM d' }}
                    </span>
                  </div>
                  @if (!$last) {
                    <mat-divider />
                  }
                }
              </div>
            } @else {
              <div class="empty-state">
                <mat-icon>checklist</mat-icon>
                <p>No action items</p>
              </div>
            }
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .meetings-page { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
    }
    .title-section h1 { margin: 0 0 2px; font-size: 24px; font-weight: 700; color: #111827; }
    .subtitle { margin: 0; color: #6b7280; font-size: 0.9rem; }

    .two-col { display: grid; grid-template-columns: 3fr 2fr; gap: 20px; align-items: start; }
    @media (max-width: 960px) { .two-col { grid-template-columns: 1fr; } }

    .ledger-card, .action-card { border-radius: 12px; }

    .table-container { overflow-x: auto; }
    table { width: 100%; }
    .time { font-size: 0.78rem; color: #6b7280; }
    .meeting-title { display: block; font-weight: 600; font-size: 0.9rem; }
    .participants { display: block; font-size: 0.76rem; color: #9ca3af; margin-top: 2px; }
    .type-cell { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; }
    .type-cell mat-icon { font-size: 20px; width: 20px; height: 20px; color: #6b7280; }
    .action-btns { display: flex; gap: 6px; }
    .action-btns button { font-size: 0.75rem; line-height: 28px; }

    .mat-mdc-chip { font-size: 0.72rem; }
    .mat-mdc-chip.scheduled { background: #fef3c7; color: #b45309; }
    .mat-mdc-chip.completed { background: #d1fae5; color: #059669; }
    .mat-mdc-chip.cancelled { background: #fee2e2; color: #dc2626; }

    .action-list { display: flex; flex-direction: column; }
    .action-row {
      display: flex; align-items: center; gap: 12px; padding: 12px 0;
    }
    .action-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .action-task { font-size: 0.88rem; font-weight: 500; color: #1f2937; }
    .action-assignee { display: flex; align-items: center; gap: 4px; font-size: 0.78rem; color: #6b7280; }
    .action-assignee mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .due-badge {
      flex-shrink: 0; padding: 3px 10px; border-radius: 999px;
      font-size: 0.75rem; font-weight: 600;
      background: #f3f4f6; color: #374151;
    }
    .due-badge.overdue { background: #fee2e2; color: #dc2626; }

    .loading-row { display: flex; justify-content: center; padding: 32px 0; }

    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      gap: 12px; padding: 48px; color: #9ca3af;
    }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
  `],
})
export class MeetingManagerComponent implements OnInit {
  private communicationService = inject(CommunicationService);

  readonly meetings = this.communicationService.meetings.asReadonly();
  readonly actionItems = this.communicationService.actionItems.asReadonly();
  readonly isLoadingMeetings = this.communicationService.isMeetingsLoading.asReadonly();

  readonly meetingColumns = ['date_time', 'title', 'type', 'status', 'actions'];

  ngOnInit(): void {
    this.communicationService.loadMeetings();
    this.communicationService.loadActionItems();
  }

  isOverdue(item: ActionItem): boolean {
    if (item.status === 'COMPLETED') return false;
    return new Date(item.due_date) < new Date();
  }

  toggleAction(item: ActionItem): void {
    if (item.status === 'COMPLETED') return;
    this.communicationService.actionItems.update((list) =>
      list.map((a) =>
        a.id === item.id
          ? { ...a, status: a.status === 'IN_PROGRESS' ? 'COMPLETED' : 'IN_PROGRESS' as const }
          : a
      )
    );
  }
}
