import { Injectable, signal } from '@angular/core';

export interface BadgeCounts {
  assignments: number;
  announcements: number;
  messages: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly badges = signal<BadgeCounts>({
    assignments: 3,
    announcements: 2,
    messages: 0,
  });

  readonly badgeCounts = this.badges.asReadonly();

  getBadge(route: string): number {
    const counts = this.badges();
    switch (route) {
      case '/assignments':
        return counts.assignments;
      case '/announcements':
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
}
