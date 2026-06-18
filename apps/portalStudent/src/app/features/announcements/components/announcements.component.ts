import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { environment } from '@sms/core/config';
import { ChatHubComponent, NotificationService as SharedNotificationService } from '@sms/shared/communication';
import { NotificationService } from '../../../core/services/notification.service';

interface Announcement {
  id: number;
  title: string;
  content: string;
  published_at: string;
  pinned?: boolean;
  category?: string;
}

@Component({
  selector: 'app-student-announcements',
  imports: [
    DatePipe,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatBadgeModule,
    ChatHubComponent,
  ],
  template: `
    <div class="announcements-page">
      <mat-tab-group animationDuration="0ms" (selectedTabChange)="onTabChange($event.index)">
        <mat-tab label="Messages & Broadcasts">
          <div class="chat-wrapper">
            <app-chat-hub />
          </div>
        </mat-tab>
        <mat-tab>
          <ng-template mat-tab-label>
            Noticeboard
            @if (unreadLive() > 0) {
              <span class="live-badge">{{ unreadLive() }}</span>
            }
          </ng-template>
          <div class="noticeboard-wrapper">
            @if (loading()) {
              <div class="loading-wrap"><mat-spinner diameter="28" /></div>
            } @else if (displayItems().length > 0) {
              <div class="announcements-list">
                @for (a of displayItems(); track a.id) {
                  <mat-card class="announcement-card" [class.pinned]="a.pinned" [class.urgent]="a.category === 'URGENT'" [class.live]="a._live">
                    <mat-card-header>
                      <mat-icon mat-card-avatar [style.color]="a.category === 'URGENT' ? '#e11d48' : '#2563eb'">campaign</mat-icon>
                      <mat-card-title>{{ a.title }}</mat-card-title>
                      <mat-card-subtitle>
                        {{ a.published_at | date:'mediumDate' }}
                        @if (a._live) { <span class="live-dot"></span> }
                        @if (a.pinned) { <span class="pinned-badge">Pinned</span> }
                      </mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      <p>{{ a.content }}</p>
                    </mat-card-content>
                  </mat-card>
                }
              </div>
            } @else {
              <div class="no-data">
                <mat-icon>campaign</mat-icon>
                <p>No announcements yet</p>
              </div>
            }
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .announcements-page { padding: 16px 0; }
    .chat-wrapper { padding: 16px 0; }
    .noticeboard-wrapper { padding: 16px 0; }
    .loading-wrap { display: flex; justify-content: center; padding: 48px; }
    .announcements-list { display: flex; flex-direction: column; gap: 12px; }
    .announcement-card.pinned { border-left: 4px solid #2563eb; }
    .announcement-card.urgent { border-left: 4px solid #e11d48; }
    .announcement-card.live { animation: fadeSlideIn 0.4s ease-out; }
    @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
    .pinned-badge { display: inline-block; background: #dbeafe; color: #1e40af; font-size: 0.625rem; padding: 1px 6px; border-radius: 4px; margin-left: 6px; font-weight: 600; }
    .live-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #22c55e; margin-left: 6px; vertical-align: middle; }
    .live-badge { display: inline-flex; align-items: center; justify-content: center; min-width: 20px; height: 20px; border-radius: 10px; background: #ef4444; color: #fff; font-size: 11px; font-weight: 700; padding: 0 6px; margin-left: 6px; }
    mat-card-content p { color: #475569; font-size: 0.8125rem; margin: 0; white-space: pre-line; }
    .no-data { padding: 48px; text-align: center; color: #94a3b8; }
    .no-data mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 8px; color: #cbd5e1; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnouncementsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly sharedNotif = inject(SharedNotificationService);
  private readonly portalNotif = inject(NotificationService);

  readonly serverItems = signal<Announcement[]>([]);
  readonly loading = signal(true);
  readonly unreadLive = this.sharedNotif.unreadCount;

  readonly displayItems = computed(() => {
    const live = this.sharedNotif.announcements();
    const server = this.serverItems();
    const existingIds = new Set(live.map((a) => a.id));
    return [
      ...live.map((a) => ({ ...a, _live: true as const })),
      ...server
        .filter((a) => !existingIds.has(a.id))
        .map((a) => ({ ...a, _live: false as const })),
    ];
  });

  ngOnInit(): void {
    this.sharedNotif.start();
    this.portalNotif.clearBadge('announcements');
    this.http.get<Announcement[]>(`${environment.apiBaseUrl}/lms/announcements/`).subscribe({
      next: (res) => this.serverItems.set(res),
      error: () => this.serverItems.set([]),
      complete: () => this.loading.set(false),
    });
  }

  onTabChange(index: number): void {
    if (index === 1) {
      this.sharedNotif.markAllRead();
      this.portalNotif.clearBadge('announcements');
    }
    if (index === 0) {
      this.portalNotif.clearBadge('messages');
    }
  }
}
