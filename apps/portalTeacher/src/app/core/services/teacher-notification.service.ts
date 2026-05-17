import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize, map } from 'rxjs';
import { getApiUrl } from '@sms/core/config';
import { Notification } from '../../shared/models/teacher.models';

interface ApiNotification {
  id: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  title: string;
  message: string;
  timestamp: string;
  is_read: boolean;
}

@Injectable({ providedIn: 'root' })
export class TeacherNotificationService {
  private http = inject(HttpClient);
  readonly notifications = signal<Notification[]>([]);
  readonly unreadCount = signal(0);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  private mapNotification(n: ApiNotification): Notification {
    return {
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      timestamp: n.timestamp,
      read: n.is_read,
    };
  }

  fetchNotifications(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get<ApiNotification[]>(getApiUrl('/notifications/'))
      .pipe(
        map((list) => list.map((n) => this.mapNotification(n))),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (data) => {
          this.notifications.set(data);
          this.unreadCount.set(data.filter((n) => !n.read).length);
        },
        error: () => this.error.set('Failed to load notifications'),
      });
  }

  markRead(id: string): void {
    this.http.post(getApiUrl(`/notifications/${id}/read/`), {}).subscribe({
      next: () => {
        this.notifications.update((list) =>
          list.map((n) => (n.id === id ? { ...n, read: true } : n)),
        );
        this.unreadCount.update((c) => Math.max(0, c - 1));
      },
    });
  }

  markAllRead(): void {
    this.http.post(getApiUrl('/notifications/read-all/'), {}).subscribe({
      next: () => {
        this.notifications.update((list) => list.map((n) => ({ ...n, read: true })));
        this.unreadCount.set(0);
      },
    });
  }

  fetchUnreadCount(): void {
    this.http.get<{ count: number }>(getApiUrl('/notifications/unread-count/'))
      .subscribe({
        next: (data) => this.unreadCount.set(data.count),
      });
  }
}
