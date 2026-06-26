import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { retry, filter, share, tap } from 'rxjs/operators';
import { Observable, Subject, Subscription, timer } from 'rxjs';
import { environment } from '@sms/core/config';
import { TokenStorageService } from '@sms/core/auth';

export interface WsMessage {
  type: string;
  [key: string]: unknown;
}

export type WsNewMessage = WsMessage & {
  type: 'new_message';
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
};

export type WsNewResource = WsMessage & {
  type: 'new_resource';
  resource: {
    id: string;
    title: string;
    resource_type: 'video' | 'textbook' | 'coursebook' | 'past-paper';
    description: string;
    file_size_mb: number;
    created_at: string;
    subject: string;
    external_url: string;
  };
};

export type WsBroadcast = WsMessage & {
  type: 'broadcast';
  id: string;
  title: string;
  body: string;
  audience_type: string;
  created_at: string;
};

export type WsAnnouncement = WsMessage & {
  type: 'announcement';
  id: string;
  title: string;
  content: string;
  category: string;
  pinned: boolean;
  published_at: string;
  audience: string;
  created_at: string;
};

export type WsPresenceUpdate = WsMessage & {
  type: 'presence_update';
  user_id: string;
  status: 'online' | 'offline';
  last_seen: string;
};

export type WsTyping = WsMessage & {
  type: 'typing';
  conversation_id: string;
  user_id: string;
};

@Injectable({ providedIn: 'root' })
export class RealtimeService implements OnDestroy {
  private tokenStorage = inject(TokenStorageService);

  readonly isConnected = signal(false);
  readonly connectionError = signal<string | null>(null);

  private wsSubject: WebSocketSubject<WsMessage> | null = null;
  private connectionSub: Subscription | null = null;
  private reconnectTimer: Subscription | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  private readonly messageSubject = new Subject<WsMessage>();
  readonly messages$ = this.messageSubject.asObservable();
  readonly newMessages$ = this.messages$.pipe(filter((m): m is WsNewMessage => m.type === 'new_message'));
  readonly broadcasts$ = this.messages$.pipe(filter((m): m is WsBroadcast => m.type === 'broadcast'));
  readonly announcements$ = this.messages$.pipe(filter((m): m is WsAnnouncement => m.type === 'announcement'));
  readonly presenceUpdates$ = this.messages$.pipe(filter((m): m is WsPresenceUpdate => m.type === 'presence_update'));
  readonly typingIndicators$ = this.messages$.pipe(filter((m): m is WsTyping => m.type === 'typing'));
  readonly newResources$ = this.messages$.pipe(filter((m): m is WsNewResource => m.type === 'new_resource'));

  connect(): void {
    if (this.isConnected()) return;
    this.connectionError.set(null);

    const token = this.tokenStorage.getAccessToken();
    if (!token) {
      this.connectionError.set('No auth token available');
      return;
    }

    const wsBase = environment.apiBaseUrl.replace(/^http/, 'ws').replace(/\/api\/v1\/?$/, '');
    const url = `${wsBase}/api/v1/ws/communication/?token=${token}`;

    try {
      this.wsSubject = webSocket<WsMessage>({
        url,
        openObserver: { next: () => this.onOpen() },
        closeObserver: { next: (e) => this.onClose(e) },
      });

      this.connectionSub = this.wsSubject.pipe(
        retry({ count: 5, delay: (err) => timer(2000) }),
        tap({
          next: (msg) => this.messageSubject.next(msg),
          error: (err) => this.onError(err),
        }),
        share(),
      ).subscribe();
    } catch (err) {
      this.connectionError.set('Failed to create WebSocket connection');
    }
  }

  private onOpen(): void {
    this.isConnected.set(true);
    this.connectionError.set(null);
    this.startPing();
  }

  private onClose(event: CloseEvent): void {
    this.isConnected.set(false);
    this.stopPing();
    if (event.code !== 1000) {
      this.connectionError.set(`Connection lost (code: ${event.code})`);
      this.scheduleReconnect();
    }
  }

  private onError(err: unknown): void {
    this.isConnected.set(false);
    this.connectionError.set('WebSocket connection error');
    this.scheduleReconnect();
  }

  private startPing(): void {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      this.send({ type: 'presence_ping' });
    }, 30000);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private scheduleReconnect(): void {
    this.reconnectTimer?.unsubscribe();
    this.reconnectTimer = timer(5000).subscribe(() => {
      this.stopPing();
      this.wsSubject?.complete();
      this.connect();
    });
  }

  send(message: WsMessage): void {
    if (this.wsSubject) {
      this.wsSubject.next(message);
    }
  }

  sendMessage(conversationId: string | number, content: string): void {
    this.send({ type: 'send_message', conversation_id: String(conversationId), content });
  }

  sendTyping(conversationId: string | number): void {
    this.send({ type: 'typing', conversation_id: String(conversationId) });
  }

  disconnect(): void {
    this.stopPing();
    this.reconnectTimer?.unsubscribe();
    this.connectionSub?.unsubscribe();
    this.wsSubject?.complete();
    this.wsSubject = null;
    this.isConnected.set(false);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
