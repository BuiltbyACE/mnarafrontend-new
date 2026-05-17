import { Injectable, signal } from '@angular/core';

export interface BadgeCounts {
  assignments: number;
  announcements: number;
  messages: number;
  grading: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly badges = signal<BadgeCounts>({
    assignments: 0,
    announcements: 0,
    messages: 0,
    grading: 0,
  });

  readonly badgeCounts = this.badges.asReadonly();

  getBadge(route: string): number {
    const b = this.badges();
    switch (route) {
      case '/teacher/assignments': return b.assignments;
      case '/teacher/announcements': return b.announcements;
      case '/teacher/messages': return b.messages;
      case '/teacher/grading': return b.grading;
      default: return 0;
    }
  }

  setBadge(route: keyof BadgeCounts, count: number): void {
    this.badges.update(b => ({ ...b, [route]: count }));
  }

  clearBadge(route: keyof BadgeCounts): void {
    this.badges.update(b => ({ ...b, [route]: 0 }));
  }
}
