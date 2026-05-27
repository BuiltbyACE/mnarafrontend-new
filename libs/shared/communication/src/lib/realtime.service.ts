import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, filter, map } from 'rxjs';
import { environment } from '@sms/core/config';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected';

export interface WsMessage {
  type: string;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private readonly http = inject(HttpClient);

  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly messageSubject = new Subject<WsMessage>();
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  readonly connectionState = signal<ConnectionState>('disconnected');

  readonly messages$ = this.messageSubject.asObservable();

  readonly onMessage = <T extends Record<string, unknown>>(type: string): Observable<T & { type: string }> =>
    this.messageSubject.pipe(
      filter((msg): msg is T & { type: string } => msg.type === type),
      map((msg) => msg as T & { type: string }),
    );

  connect(token: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.connectionState.set('connecting');
    const wsBase = environment.apiBaseUrl.replace(/^http/, 'ws');
    const url = `${wsBase}/ws/communication/?token=${token}`;

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.connectionState.set('connected');
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
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  disconnect(): void {
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

  private stopReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  refreshToken(newToken: string): void {
    const wasConnected = this.connectionState() === 'connected';
    this.disconnect();
    if (wasConnected) {
      this.connect(newToken);
    }
  }
}
