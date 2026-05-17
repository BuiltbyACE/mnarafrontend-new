import { Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe, LowerCasePipe, NgClass } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { Notification } from '../../shared/models/teacher.models';
import { TeacherNotificationService } from '../../core/services/teacher-notification.service';

@Component({
  selector: 'app-teacher-notifications',
  standalone: true,
  imports: [
    DatePipe,
    LowerCasePipe,
    NgClass,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatDividerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="notifications-container">
      <header class="page-header">
        <div class="header-left">
          <h1>Notifications</h1>
          <span class="unread-count">{{ unreadCount() }} unread</span>
        </div>
        <button
          mat-stroked-button
          color="primary"
          [disabled]="unreadCount() === 0"
          (click)="markAllRead()"
        >
          <mat-icon>done_all</mat-icon>
          Mark all as read
        </button>
      </header>

      <div class="filter-tabs">
        @for (tab of filterTabs; track tab.value) {
          <button
            class="filter-tab"
            [class.active]="activeFilter() === tab.value"
            (click)="activeFilter.set(tab.value)"
          >
            {{ tab.label }}
            @if (tab.value === 'unread') {
              <span class="tab-count">{{ unreadCount() }}</span>
            }
          </button>
        }
      </div>

      <div class="notification-groups">
        @for (group of groupedNotifications(); track group.label) {
          <div class="group">
            <h3 class="group-label">{{ group.label }}</h3>
            <div class="group-items">
              @for (item of group.items; track item.id) {
                <mat-card
                  class="notification-item"
                  [class.unread]="!item.read"
                  appearance="outlined"
                  (click)="markRead(item)"
                >
                  <mat-card-content class="item-content">
                    <div class="item-icon" [ngClass]="'type-' + (item.type | lowercase)">
                      @if (item.type === 'INFO') { <mat-icon>info</mat-icon> }
                      @if (item.type === 'WARNING') { <mat-icon>warning</mat-icon> }
                      @if (item.type === 'ERROR') { <mat-icon>error</mat-icon> }
                      @if (item.type === 'SUCCESS') { <mat-icon>check_circle</mat-icon> }
                    </div>
                    <div class="item-body">
                      <div class="item-header">
                        <span class="item-title">{{ item.title }}</span>
                        <span class="item-time">{{ item.timestamp | date:'MMM d, h:mm a' }}</span>
                      </div>
                      <p class="item-message">{{ item.message }}</p>
                    </div>
                    @if (!item.read) {
                      <span class="unread-dot"></span>
                    }
                  </mat-card-content>
                </mat-card>
              }
            </div>
          </div>
        }
        @if (filteredNotifications().length === 0) {
          <div class="empty-state">
            <mat-icon>notifications_off</mat-icon>
            <p>No notifications</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    :host {
      --mnara-primary: #2563eb;
      --mnara-primary-dark: #1d4ed8;
      --mnara-primary-light: #dbeafe;
      --mnara-surface: #ffffff;
      --mnara-surface-hover: #f1f5f9;
      --mnara-background: #f0f4ff;
      --mnara-text: #1e293b;
      --mnara-text-secondary: #64748b;
      --mnara-border: #e2e8f0;
      --mnara-success: #16a34a;
      --mnara-warning: #d97706;
      --mnara-error: #dc2626;
      --mnara-info: #2563eb;
      display: block;
      min-height: 100vh;
      background: var(--mnara-background);
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      color: var(--mnara-text);
    }
    .notifications-container { max-width: 800px; margin: 0 auto; padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .header-left { display: flex; align-items: center; gap: 12px; }
    .header-left h1 { font-size: 28px; font-weight: 600; margin: 0; }
    .unread-count { font-size: 13px; color: var(--mnara-text-secondary); background: var(--mnara-surface); padding: 2px 10px; border-radius: 100px; border: 1px solid var(--mnara-border); }
    .filter-tabs { display: flex; gap: 4px; margin-bottom: 24px; background: var(--mnara-surface); border-radius: 10px; padding: 4px; border: 1px solid var(--mnara-border); }
    .filter-tab {
      flex: 1; padding: 8px 16px; border: none; background: transparent;
      border-radius: 8px; font-size: 14px; font-weight: 500;
      color: var(--mnara-text-secondary); cursor: pointer;
      font-family: inherit; transition: all 0.15s;
      display: flex; align-items: center; justify-content: center; gap: 6px;
    }
    .filter-tab:hover { background: var(--mnara-surface-hover); color: var(--mnara-text); }
    .filter-tab.active { background: var(--mnara-primary); color: #fff; }
    .tab-count { font-size: 11px; background: var(--mnara-primary-dark); color: #fff; padding: 1px 6px; border-radius: 100px; }
    .filter-tab.active .tab-count { background: rgba(255,255,255,0.2); }
    .group { margin-bottom: 24px; }
    .group-label { font-size: 13px; font-weight: 600; color: var(--mnara-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; padding-left: 4px; }
    .group-items { display: flex; flex-direction: column; gap: 6px; }
    .notification-item { background: var(--mnara-surface); cursor: pointer; transition: background 0.15s; }
    .notification-item:hover { background: var(--mnara-surface-hover); }
    .notification-item.unread { border-left: 4px solid var(--mnara-primary) !important; }
    .item-content { display: flex; align-items: flex-start; gap: 14px; padding: 12px 16px !important; }
    .item-icon { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .item-icon mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .item-icon.type-info { background: #dbeafe; color: #1d4ed8; }
    .item-icon.type-warning { background: #fef3c7; color: #d97706; }
    .item-icon.type-error { background: #fee2e2; color: #dc2626; }
    .item-icon.type-success { background: #d1fae5; color: #16a34a; }
    .item-body { flex: 1; min-width: 0; }
    .item-header { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; margin-bottom: 2px; }
    .item-title { font-size: 14px; font-weight: 600; color: var(--mnara-text); }
    .item-time { font-size: 11px; color: var(--mnara-text-secondary); white-space: nowrap; }
    .item-message { font-size: 13px; color: var(--mnara-text-secondary); margin: 0; line-height: 1.4; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
    .unread-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--mnara-primary); flex-shrink: 0; margin-top: 4px; }
    .empty-state { text-align: center; padding: 64px 24px; color: var(--mnara-text-secondary); }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 12px; opacity: 0.4; }
    .empty-state p { font-size: 16px; margin: 0; }
  `,
})
export class NotificationsComponent {
  private notificationService = inject(TeacherNotificationService);

  filterTabs = [
    { label: 'All', value: 'all' as const },
    { label: 'Unread', value: 'unread' as const },
    { label: 'Read', value: 'read' as const },
  ];

  activeFilter = signal<'all' | 'unread' | 'read'>('all');

  private allNotifications = this.notificationService.notifications;
  readonly unreadCount = this.notificationService.unreadCount;

  filteredNotifications = computed(() => {
    const filter = this.activeFilter();
    if (filter === 'all') return this.allNotifications();
    return this.allNotifications().filter(n => filter === 'unread' ? !n.read : n.read);
  });

  groupedNotifications = computed(() => {
    const items = this.filteredNotifications();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const weekAgo = new Date(today.getTime() - 6 * 86400000);

    const groups: { label: string; items: Notification[] }[] = [
      { label: 'Today', items: [] },
      { label: 'Yesterday', items: [] },
      { label: 'This Week', items: [] },
      { label: 'Earlier', items: [] },
    ];

    for (const item of items) {
      const d = new Date(item.timestamp);
      const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      if (dDate.getTime() === today.getTime()) {
        groups[0].items.push(item);
      } else if (dDate.getTime() === yesterday.getTime()) {
        groups[1].items.push(item);
      } else if (dDate >= weekAgo) {
        groups[2].items.push(item);
      } else {
        groups[3].items.push(item);
      }
    }

    return groups.filter(g => g.items.length > 0);
  });

  constructor() {
    this.notificationService.fetchNotifications();
  }

  markRead(item: Notification): void {
    if (!item.read) {
      this.notificationService.markRead(item.id);
    }
  }

  markAllRead(): void {
    this.notificationService.markAllRead();
  }
}
