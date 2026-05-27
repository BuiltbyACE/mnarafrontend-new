import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DatePipe } from '@angular/common';
import { ParentApiService } from '../../services/parent-api.service';
import { AppNotification } from '../../models/parent.models';

@Component({
  selector: 'app-notifications',
  imports: [MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, DatePipe],
  template: `
    <div class="notifications-page">
      <div class="header-row">
        <h2>Notifications</h2>
        @if (unreadCount() > 0) {
          <button mat-stroked-button color="primary" (click)="markAllRead()">
            <mat-icon>done_all</mat-icon>
            Mark All Read
          </button>
        }
      </div>
      @if (loading()) { <div class="loading-wrap"><mat-spinner diameter="28"></mat-spinner></div> }
      @else if (notifications().length > 0) {
        <div class="notif-list">
          @for (n of notifications(); track n.id) {
            <div class="notif-card" [class.unread]="!n.is_read">
              @if (!n.is_read) { <div class="notif-indicator"></div> }
              <mat-icon class="notif-icon" [style.color]="n.type === 'URGENT' ? '#e11d48' : n.type === 'WARNING' ? '#d97706' : '#2563eb'">
                {{ n.type === 'URGENT' ? 'priority_high' : n.type === 'WARNING' ? 'warning' : 'info' }}
              </mat-icon>
              <div class="notif-body">
                <span class="notif-title">{{ n.title }}</span>
                <p class="notif-message">{{ n.message }}</p>
                <span class="notif-date">{{ n.created_at | date:'medium' }}</span>
              </div>
              @if (!n.is_read) {
                <button mat-icon-button (click)="markRead(n)" title="Mark as read">
                  <mat-icon>check_circle</mat-icon>
                </button>
              }
            </div>
          }
        </div>
      } @else { <div class="no-data">No notifications</div> }
    </div>
  `,
  styles: [`
    .notifications-page { padding: 16px 0; }
    .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    h2 { font-size: 1.125rem; margin: 0; color: #1e293b; }
    .loading-wrap { display: flex; justify-content: center; padding: 48px; }
    .notif-list { display: flex; flex-direction: column; gap: 8px; }
    .notif-card { display: flex; align-items: flex-start; gap: 12px; padding: 14px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; position: relative; transition: background 0.15s; }
    .notif-card.unread { background: #f8faff; border-color: #bfdbfe; }
    .notif-indicator { position: absolute; top: 14px; left: 14px; width: 8px; height: 8px; border-radius: 50%; background: #2563eb; }
    .notif-icon { font-size: 22px; width: 22px; height: 22px; flex-shrink: 0; margin-top: 2px; }
    .notif-body { flex: 1; }
    .notif-title { display: block; font-size: 0.875rem; font-weight: 600; color: #1e293b; }
    .notif-message { font-size: 0.8125rem; color: #64748b; margin: 4px 0; }
    .notif-date { font-size: 0.6875rem; color: #94a3b8; }
    .no-data { padding: 48px; text-align: center; color: #94a3b8; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsComponent implements OnInit {
  private readonly api = inject(ParentApiService);

  readonly notifications = signal<AppNotification[]>([]);
  readonly unreadCount = signal(0);
  readonly loading = signal(true);

  ngOnInit() {
    this.api.getNotifications().subscribe({
      next: (n) => this.notifications.set(n),
      complete: () => this.loading.set(false),
    });
    this.api.getUnreadCount().subscribe({
      next: (c) => this.unreadCount.set(c.count),
    });
  }

  markRead(n: AppNotification): void {
    this.api.markNotificationRead(n.id).subscribe(() => {
      this.notifications.update((list) =>
        list.map((item) => (item.id === n.id ? { ...item, is_read: true } : item))
      );
      this.unreadCount.update((c) => Math.max(0, c - 1));
    });
  }

  markAllRead(): void {
    this.api.markAllNotificationsRead().subscribe(() => {
      this.notifications.update((list) =>
        list.map((item) => ({ ...item, is_read: true }))
      );
      this.unreadCount.set(0);
    });
  }
}
