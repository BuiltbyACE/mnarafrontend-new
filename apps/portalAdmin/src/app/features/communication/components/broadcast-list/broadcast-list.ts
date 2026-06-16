import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CommunicationService, Broadcast } from '../../services/communication.service';
import { OmnichannelComposerComponent } from '@sms/shared/ui';

@Component({
  selector: 'app-broadcast-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    OmnichannelComposerComponent,
  ],
  template: `
    <div class="broadcast-container">
      <header class="page-header">
        <div class="title-section">
          <h1>Broadcasts</h1>
          <p class="subtitle">Create, dispatch, and monitor mass communications</p>
        </div>
        <button mat-raised-button color="primary" (click)="showComposer.set(true)">
          <mat-icon>add</mat-icon>
          New Message
        </button>
      </header>

      @if (showComposer()) {
        <ss-omnichannel-composer (closed)="showComposer.set(false)" />
      }

      @if (service.error(); as err) {
        <div class="error-alert" role="alert">
          <mat-icon>error</mat-icon>
          <span>{{ err }}</span>
        </div>
      }

      @if (service.broadcasts().length > 0) {
        <mat-card class="content-card">
          <mat-card-content>
            <div class="table-container">
              <table mat-table [dataSource]="service.broadcasts()">

              <ng-container matColumnDef="title">
                <th mat-header-cell *matHeaderCellDef>Title</th>
                <td mat-cell *matCellDef="let b">
                  <div class="title-cell">
                    <span class="title-text">{{ b.title }}</span>
                    <span class="author-text">by {{ b.author_name }}</span>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="audience">
                <th mat-header-cell *matHeaderCellDef>Audience</th>
                <td mat-cell *matCellDef="let b">
                  <span class="audience-label">{{ b.audience }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let b">
                  <span class="status-chip" [class]="b.status.toLowerCase()">{{ b.status }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="delivery">
                <th mat-header-cell *matHeaderCellDef>Delivery Stats</th>
                <td mat-cell *matCellDef="let b">
                  <div class="delivery-cell">
                    <div class="delivery-bar">
                      <div
                        class="delivery-fill"
                        [style.width.%]="getDeliveryPercent(b)"
                        [class.completed]="b.status === 'COMPLETED'">
                      </div>
                    </div>
                    <span class="delivery-text">
                      {{ b.delivered_count }} / {{ b.total_recipients }} Delivered
                    </span>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let b">
                  @if (b.status === 'DRAFT' || b.status === 'SCHEDULED') {
                    <button
                      mat-stroked-button
                      color="primary"
                      (click)="dispatch(b)">
                      <mat-icon>send</mat-icon>
                      Dispatch
                    </button>
                  } @else {
                    <span class="no-action">&mdash;</span>
                  }
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

              <tr class="mat-row no-data-row" *matNoDataRow>
                <td class="mat-cell" [attr.colspan]="displayedColumns.length">
                  <div class="no-data-message">
                    @if (service.isLoading()) {
                      <mat-spinner diameter="40"></mat-spinner>
                      <p>Loading broadcasts...</p>
                    } @else {
                      <mat-icon>campaign</mat-icon>
                      <p>No broadcasts found</p>
                    }
                  </div>
                </td>
              </tr>
            </table>
            </div>
          </mat-card-content>
        </mat-card>
      } @else {
        <div class="empty-state">
          @if (service.isLoading()) {
            <mat-spinner diameter="40"></mat-spinner>
            <p>Loading broadcasts...</p>
          } @else {
            <mat-icon>campaign</mat-icon>
            <p>No broadcasts found</p>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .broadcast-container { padding: 24px; }

    .page-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 24px;
    }
    .page-header h1 { font-size: 24px; font-weight: 600; margin: 0 0 4px; }
    .page-header .subtitle { color: #6b7280; margin: 0; }

    .error-alert {
      display: flex; align-items: center; gap: 8px;
      padding: 16px; background: #fee2e2; border-radius: 8px;
      color: #dc2626; margin-bottom: 24px;
    }

    .content-card { border-radius: 12px; }
    .table-container { overflow-x: auto; }
    table { width: 100%; }
    .mat-mdc-header-cell { font-weight: 600; color: #374151; background: #f9fafb; }

    .title-cell { display: flex; flex-direction: column; }
    .title-text { font-weight: 500; color: #1f2937; }
    .author-text { font-size: 0.75rem; color: #9ca3af; }

    .audience-label {
      display: inline-block; padding: 2px 10px; border-radius: 12px;
      background: #f3f4f6; font-size: 0.8rem; font-weight: 500; color: #374151;
    }

    .status-chip {
      display: inline-block; padding: 4px 12px; border-radius: 16px;
      font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .status-chip.draft { background: #f3f4f6; color: #6b7280; }
    .status-chip.scheduled { background: #dbeafe; color: #1d4ed8; }
    .status-chip.sending { background: #fef3c7; color: #d97706; }
    .status-chip.completed { background: #d1fae5; color: #059669; }
    .status-chip.failed { background: #fee2e2; color: #dc2626; }

    .delivery-cell { display: flex; flex-direction: column; gap: 4px; min-width: 160px; }
    .delivery-bar {
      width: 100%; height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden;
    }
    .delivery-fill {
      height: 100%; background: #f59e0b; border-radius: 3px; transition: width 0.4s ease;
    }
    .delivery-fill.completed { background: #059669; }
    .delivery-text { font-size: 0.78rem; color: #6b7280; }

    .no-action { color: #d1d5db; }

    .empty-state {
      display: flex; flex-direction: column; align-items: center; gap: 16px;
      padding: 64px 24px; color: #9ca3af;
    }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }

    .no-data-row .mat-cell { padding: 48px 24px; text-align: center; }
    .no-data-message {
      display: flex; flex-direction: column; align-items: center; gap: 12px; color: #9ca3af;
    }
    .no-data-message mat-icon { font-size: 48px; width: 48px; height: 48px; }
  `],
})
export class BroadcastListComponent implements OnInit {
  readonly service = inject(CommunicationService);
  private readonly snackBar = inject(MatSnackBar);

  readonly displayedColumns = ['title', 'audience', 'status', 'delivery', 'actions'];
  readonly showComposer = signal(false);

  ngOnInit(): void {
    this.loadBroadcasts();
  }

  loadBroadcasts(): void {
    this.service.getBroadcasts().subscribe({
      next: (response) => this.service.broadcasts.set(response.results || []),
    });
  }

  getDeliveryPercent(b: Broadcast): number {
    if (!b.total_recipients) return 0;
    return Math.round((b.delivered_count / b.total_recipients) * 100);
  }

  dispatch(b: Broadcast): void {
    this.service.dispatchBroadcast(b.id).subscribe({
      next: () => {
        this.snackBar.open('Dispatch initiated in the background', 'Close', { duration: 4000 });
        this.loadBroadcasts();
      },
      error: (err) => {
        this.snackBar.open(`Failed: ${err.message}`, 'Close', { duration: 5000 });
      },
    });
  }
}
