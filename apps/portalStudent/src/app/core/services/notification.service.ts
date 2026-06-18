import { Injectable, inject, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@sms/core/config';
import { ChatService } from '@sms/shared/communication';

export interface BadgeCounts {
  assignments: number;
  announcements: number;
  messages: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly chatService = inject(ChatService);
  private readonly apiBase = environment.apiBaseUrl;

  private readonly badges = signal<BadgeCounts>({
    assignments: 0,
    announcements: 0,
    messages: 0,
  });

  readonly badgeCounts = this.badges.asReadonly();

  constructor() {
    effect(() => {
      const total = this.chatService.unreadTotal();
      this.badges.update((b) => ({ ...b, messages: total }));
    });
  }

  getBadge(route: string): number {
    const counts = this.badges();
    switch (route) {
      case '/student/elearning':
        return counts.assignments;
      case '/student/announcements':
        return counts.announcements;
      default:
        return 0;
    }
  }

  setBadge(route: keyof BadgeCounts, count: number): void {
    this.badges.update((b) => ({ ...b, [route]: count }));
  }

  clearBadge(route: keyof BadgeCounts): void {
    this.setBadge(route, 0);
  }

  fetchAll(): void {
    this.http.get<unknown[]>(`${this.apiBase}/lms/announcements/`).subscribe({
      next: (res) => this.badges.update((b) => ({ ...b, announcements: res.length })),
    });

    this.http.get<{ kpis: { pending_assignments: number } }>(`${this.apiBase}/lms/elearning/dashboard/`).subscribe({
      next: (res) => this.badges.update((b) => ({ ...b, assignments: res.kpis.pending_assignments })),
    });
  }
}
