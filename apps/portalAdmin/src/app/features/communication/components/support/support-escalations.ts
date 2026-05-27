import { Component, inject, OnInit, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommunicationService, SupportTicket } from '../../services/communication.service';

@Component({
  selector: 'app-support-escalations',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="support-page">
      <header class="page-header">
        <div class="title-section">
          <h1>Support & Escalations</h1>
          <p class="subtitle">Manage complaints, incidents, and safeguarding alerts</p>
        </div>
        <button mat-raised-button color="primary">
          <mat-icon>add</mat-icon>
          New Ticket
        </button>
      </header>

      @if (isLoading()) {
        <div class="loading-row"><mat-spinner diameter="40" /></div>
      }

      <section class="kpi-row">
        <mat-card class="kpi-card">
          <mat-card-content>
            <div class="kpi-value">{{ openCount() }}</div>
            <div class="kpi-label">Open Tickets</div>
            <mat-icon class="kpi-icon">support</mat-icon>
          </mat-card-content>
        </mat-card>
        <mat-card class="kpi-card" [class.warn]="criticalCount() > 0">
          <mat-card-content>
            <div class="kpi-value">{{ criticalCount() }}</div>
            <div class="kpi-label">Critical Escalations</div>
            @if (criticalCount() > 0) {
              <mat-icon class="kpi-icon" style="color:#dc2626">warning</mat-icon>
            } @else {
              <mat-icon class="kpi-icon">check_circle</mat-icon>
            }
          </mat-card-content>
        </mat-card>
        <mat-card class="kpi-card">
          <mat-card-content>
            <div class="kpi-value">{{ unassignedCount() }}</div>
            <div class="kpi-label">Unassigned Tickets</div>
            <mat-icon class="kpi-icon">person_off</mat-icon>
          </mat-card-content>
        </mat-card>
      </section>

      <mat-card class="table-card">
        <mat-card-content>
          <div class="filter-bar">
            <div class="form-field">
              <label class="input-label">Search</label>
              <input placeholder="Search tickets..." [value]="searchQuery()"
                     (input)="searchQuery.set($any($event.target).value)" />
            </div>
            <div class="form-field">
              <label class="input-label">Status</label>
              <select [value]="statusFilter()" (change)="statusFilter.set($any($event.target).value)">
                <option value="ALL">All</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="ESCALATED">Escalated</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="table-card">
        <mat-card-content>
          @if (tickets().length > 0) {
            <div class="table-container">
              <table mat-table [dataSource]="tickets()" multiTemplateDataRows>
                <ng-container matColumnDef="ticket">
                  <th mat-header-cell *matHeaderCellDef>Ticket</th>
                  <td mat-cell *matCellDef="let t">
                    <span class="ticket-num">{{ t.ticket_number }}</span>
                    <span class="ticket-date">{{ t.created_at | date:'MMM d, y' }}</span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="details">
                  <th mat-header-cell *matHeaderCellDef>Details</th>
                  <td mat-cell *matCellDef="let t">
                    <span class="detail-subject">{{ t.subject }}</span>
                    <span class="detail-reporter">
                      <mat-icon>person</mat-icon>
                      {{ t.reporter_name }}
                    </span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="category">
                  <th mat-header-cell *matHeaderCellDef>Category</th>
                  <td mat-cell *matCellDef="let t">
                    <mat-chip [class]="t.category.toLowerCase()">{{ t.category }}</mat-chip>
                  </td>
                </ng-container>
                <ng-container matColumnDef="priority">
                  <th mat-header-cell *matHeaderCellDef>Priority</th>
                  <td mat-cell *matCellDef="let t">
                    <mat-chip [class]="t.priority.toLowerCase()">{{ t.priority }}</mat-chip>
                  </td>
                </ng-container>
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let t">
                    <mat-chip [class]="t.status.toLowerCase()">{{ t.status }}</mat-chip>
                  </td>
                </ng-container>
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let t">
                    <div class="action-btns">
                      <button mat-icon-button matTooltip="View Details" aria-label="View details">
                        <mat-icon>visibility</mat-icon>
                      </button>
                      <button mat-icon-button matTooltip="Reassign" aria-label="Reassign">
                        <mat-icon>person</mat-icon>
                      </button>
                    </div>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
                <tr class="mat-row no-data-row">
                  <td class="mat-cell" [attr.colspan]="displayedColumns.length">
                    <div class="no-data-message">
                      <mat-icon>support_agent</mat-icon>
                      <p>No tickets match your filters</p>
                    </div>
                  </td>
                </tr>
              </table>
            </div>
          } @else {
            <div class="empty-state">
              <mat-icon>support_agent</mat-icon>
              <p>No support tickets yet</p>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .support-page { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
    }
    .title-section h1 { margin: 0 0 2px; font-size: 24px; font-weight: 700; color: #111827; }
    .subtitle { margin: 0; color: #6b7280; font-size: 0.9rem; }

    .loading-row { display: flex; justify-content: center; padding: 32px 0; }

    .kpi-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .kpi-card { border-radius: 12px; }
    .kpi-card.warn { background: #fef2f2; border-color: #fecaca; }
    .kpi-card mat-card-content {
      display: flex; flex-direction: column; align-items: center;
      padding: 20px; text-align: center; position: relative;
    }
    .kpi-value { font-size: 2rem; font-weight: 800; color: #111827; }
    .kpi-label { font-size: 0.85rem; color: #6b7280; margin-top: 2px; }
    .kpi-icon { position: absolute; top: 12px; right: 12px; font-size: 22px; color: #9ca3af; }

    .filter-bar {
      display: flex; gap: 16px; align-items: center; padding: 4px 0;
    }
    .filter-bar .form-field { min-width: 220px; }

    .table-card { border-radius: 12px; }
    .table-container { overflow-x: auto; }
    table { width: 100%; }
    .ticket-num { display: block; font-weight: 700; font-size: 0.85rem; color: #2563eb; }
    .ticket-date { display: block; font-size: 0.75rem; color: #9ca3af; margin-top: 2px; }
    .detail-subject { display: block; font-weight: 500; font-size: 0.88rem; max-width: 280px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .detail-reporter { display: flex; align-items: center; gap: 4px; font-size: 0.76rem; color: #6b7280; margin-top: 2px; }
    .detail-reporter mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .action-btns { display: flex; gap: 2px; }

    .mat-mdc-chip { font-size: 0.72rem; }
    .mat-mdc-chip.complaint { background: #f3e8ff; color: #7c3aed; }
    .mat-mdc-chip.incident { background: #dbeafe; color: #1d4ed8; }
    .mat-mdc-chip.discipline { background: #fef3c7; color: #b45309; }
    .mat-mdc-chip.safeguarding { background: #fee2e2; color: #dc2626; }
    .mat-mdc-chip.it_support { background: #d1fae5; color: #059669; }
    .mat-mdc-chip.critical { background: #dc2626; color: #fff; }
    .mat-mdc-chip.high { background: #f97316; color: #fff; }
    .mat-mdc-chip.medium { background: #fef3c7; color: #b45309; }
    .mat-mdc-chip.low { background: #f3f4f6; color: #6b7280; }
    .mat-mdc-chip.open { background: #dbeafe; color: #1d4ed8; }
    .mat-mdc-chip.in_progress { background: #f3e8ff; color: #7c3aed; }
    .mat-mdc-chip.escalated { background: #fee2e2; color: #dc2626; }
    .mat-mdc-chip.resolved { background: #d1fae5; color: #059669; }

    .no-data-row { display: none; }
    table:empty + .no-data-row { display: table-row; }
    .no-data-message {
      display: flex; flex-direction: column; align-items: center;
      gap: 12px; padding: 48px; color: #9ca3af;
    }
    .no-data-message mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      gap: 12px; padding: 48px; color: #9ca3af;
    }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
  `,
  `
    .form-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      width: 100%;
    }
    .form-field input,
    .form-field select,
    .form-field textarea {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      color: #1f2937;
      background: #fff;
      transition: border-color 0.15s;
      box-sizing: border-box;
      font-family: inherit;
    }
    .form-field input:focus,
    .form-field select:focus,
    .form-field textarea:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59,130,246,0.2);
    }
    .form-field select {
      cursor: pointer;
    }
    .input-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 2px;
    }
    .error-text {
      font-size: 0.75rem;
      color: #dc2626;
      margin-top: 4px;
    }
  `],
})
export class SupportEscalationsComponent implements OnInit {
  private communicationService = inject(CommunicationService);

  readonly isLoading = this.communicationService.isSupportLoading.asReadonly();
  readonly tickets = this.communicationService.supportTickets.asReadonly();

  readonly searchQuery = signal('');
  readonly statusFilter = signal('ALL');

  readonly displayedColumns = ['ticket', 'details', 'category', 'priority', 'status', 'actions'];

  readonly openCount = computed(() => this.tickets().filter((t) => t.status !== 'RESOLVED').length);
  readonly criticalCount = computed(() => this.tickets().filter((t) => t.priority === 'CRITICAL' && t.status !== 'RESOLVED').length);
  readonly unassignedCount = computed(() => this.tickets().filter((t) => t.assigned_to === null).length);

  ngOnInit(): void {
    this.communicationService.loadSupportTickets();
  }
}
