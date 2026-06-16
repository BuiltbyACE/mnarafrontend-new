import { Injectable, inject, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RealtimeService } from './realtime.service';

export type BroadcastMessage = {
  type: string;
  id: string;
  title: string;
  body: string;
  audience_type?: string;
  created_at?: string;
};

/**
 * Listens for real-time `broadcast` events pushed by the backend when an admin
 * dispatches a broadcast/announcement, and surfaces them instantly (toast +
 * a reactive feed) without the receiving portal needing to poll.
 *
 * Intended to be started once after authentication (e.g. from the shell host).
 */
@Injectable({ providedIn: 'root' })
export class BroadcastListenerService {
  private readonly realtime = inject(RealtimeService);
  private readonly snackBar = inject(MatSnackBar);

  private started = false;

  readonly broadcasts = signal<BroadcastMessage[]>([]);
  readonly latest = signal<BroadcastMessage | null>(null);

  /** Idempotently connect the realtime socket and begin listening for broadcasts. */
  start(token: string): void {
    if (this.started || !token) return;
    this.started = true;

    this.realtime.connect(token);

    this.realtime.onMessage<BroadcastMessage>('broadcast').subscribe((b) => {
      this.broadcasts.update((list) => [b, ...list]);
      this.latest.set(b);
      this.snackBar.open(
        b.title ? `📢 ${b.title}` : 'New announcement',
        'Dismiss',
        { duration: 6000, horizontalPosition: 'end', verticalPosition: 'top' },
      );
    });
  }

  stop(): void {
    this.realtime.disconnect();
    this.started = false;
  }
}
