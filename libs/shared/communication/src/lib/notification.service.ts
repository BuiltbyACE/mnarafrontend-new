import { Injectable, inject, signal } from '@angular/core';
import { RealtimeService } from './realtime.service';
import { TokenStorageService } from '@sms/core/auth';
import { NotificationAudioService } from './notification-audio.service';

export interface AnnouncementEvent extends Record<string, unknown> {
  id: number;
  title: string;
  content: string;
  category: string;
  pinned: boolean;
  published_at: string | null;
  audience: string;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly realtime = inject(RealtimeService);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly audio = inject(NotificationAudioService);

  private readonly announcementsSig = signal<AnnouncementEvent[]>([]);
  readonly announcements = this.announcementsSig.asReadonly();
  readonly unreadCount = signal(0);

  private started = false;

  start(): void {
    if (this.started) return;
    this.started = true;

    this.audio.init();

    const token = this.tokenStorage.getAccessToken();
    if (token) {
      this.realtime.connect(token);
    }

    this.realtime.onMessage<AnnouncementEvent>('announcement').subscribe((event) => {
      this.announcementsSig.update((list) => [event, ...list]);
      this.unreadCount.update((c) => c + 1);

      if (event.category === 'URGENT') {
        this.audio.playCriticalAlert();
      } else {
        this.audio.playAlert();
      }
    });
  }

  markAllRead(): void {
    this.unreadCount.set(0);
  }
}
