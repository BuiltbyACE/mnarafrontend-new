import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, filter, map, timer, Subscription } from 'rxjs';
import { environment } from '@sms/core/config';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected';

export interface WsMessage {
  type: string;
  [key: string]: unknown;
}

const MAX_RECONNECT_DELAY = 30_000;
const INITIAL_RECONNECT_DELAY = 1_000;

@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private readonly http = inject(HttpClient);

  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly messageSubject = new Subject<WsMessage>();
  private readonly _reconnected$ = new Subject<void>();
  readonly reconnected$ = this._reconnected$.asObservable();
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  private currentToken: string | null = null;
  private reconnectAttempts = 0;
  private intentionalClose = false;

  readonly connectionState = signal<ConnectionState>('disconnected');

  readonly messages$ = this.messageSubject.asObservable();

  readonly onMessage = <T extends Record<string, unknown>>(type: string): Observable<T & { type: string }> =>
    this.messageSubject.pipe(
      filter((msg): msg is T & { type: string } => msg.type === type),
      map((msg) => msg as T & { type: string }),
    );

  connect(token: string): void {
    this.currentToken = token;
    this.intentionalClose = false;

    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
      return;
    }

    this.connectionState.set('connecting');
    const wsBase = environment.apiBaseUrl.replace(/^http/, 'ws');
    const url = `${wsBase}/ws/communication/?token=${token}`;

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.connectionState.set('connected');
      this.reconnectAttempts = 0;
      this._reconnected$.next();
      this.startPing();
    };

    this.ws.onmessage = (event) => {
      try {
        const data: WsMessage = JSON.parse(event.data);
        this.messageSubject.next(data);
      } catch { /* ignore malformed */ }
    };

    this.ws.onclose = () => {
      this.connectionState.set('disconnected');
      this.stopPing();
      this.ws = null;
      if (!this.intentionalClose && this.currentToken) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  disconnect(): void {
    this.intentionalClose = true;
    this.stopPing();
    this.stopReconnect();
    this.ws?.close();
    this.ws = null;
    this.connectionState.set('disconnected');
  }

  send(type: string, payload: Record<string, unknown> = {}): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, ...payload }));
    }
  }

  refreshToken(newToken: string): void {
    this.currentToken = newToken;
    const wasConnected = this.connectionState() === 'connected';
    this.intentionalClose = true;
    this.ws?.close();
    this.ws = null;
    this.intentionalClose = false;
    if (wasConnected) {
      this.connect(newToken);
    }
  }

  private scheduleReconnect(): void {
    this.stopReconnect();
    const delay = Math.min(
      INITIAL_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts),
      MAX_RECONNECT_DELAY,
    );
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      if (this.currentToken) {
        this.connect(this.currentToken);
      }
    }, delay);
  }

  private stopReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private startPing(): void {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      this.send('presence_ping');
    }, 25000);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}
