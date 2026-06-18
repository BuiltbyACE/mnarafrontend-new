import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject, tap, interval, Subscription } from 'rxjs';
import { environment } from '@sms/core/config';
import { Conversation, Message, CreateConversationPayload } from './communication.models';
import { RealtimeService } from './realtime.service';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

const REFRESH_INTERVAL_MS = 30_000;

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly realtime = inject(RealtimeService);
  private readonly baseUrl = `${environment.apiBaseUrl}/communication`;

  readonly conversations = signal<Conversation[]>([]);
  readonly activeConversationId = signal<number | null>(null);
  readonly messages = signal<Message[]>([]);
  readonly conversationsLoading = signal(false);
  readonly messagesLoading = signal(false);
  readonly unreadTotal = signal(0);

  private readonly _newMessage$ = new Subject<Message>();
  readonly newMessage$ = this._newMessage$.asObservable();

  private refreshSub: Subscription | null = null;

  constructor() {
    this.realtime.onMessage<{ id: number; conversation_id: number; sender_id: number; sender_name: string; content: string; created_at: string }>('new_message')
      .subscribe((msg) => {
        const mapped: Message = {
          id: msg.id,
          sender_id: msg.sender_id,
          sender_name: msg.sender_name,
          content: msg.content,
          created_at: msg.created_at,
          read_by: [],
        };
        if (msg.conversation_id === this.activeConversationId()) {
          this.messages.update((msgs) => [...msgs, mapped]);
        }
        this.bumpConversation(msg.conversation_id, mapped.content, msg.created_at);
        this._newMessage$.next(mapped);
      });

    this.realtime.onMessage<{ message_id: string; recipient_id: string; status: string; timestamp: string }>('delivery_receipt')
      .subscribe((receipt) => {
        if (receipt.status === 'READ' && receipt.recipient_id) {
          this.messages.update((msgs) =>
            msgs.map((m) =>
              m.id === Number(receipt.message_id)
                ? { ...m, read_by: [...m.read_by, { user_id: Number(receipt.recipient_id), read_at: receipt.timestamp }] }
                : m,
            ),
          );
        }
      });

    this.realtime.reconnected$.subscribe(() => {
      this.refreshConversations();
    });
  }

  startRefreshPump(): void {
    if (!this.refreshSub) {
      this.refreshSub = interval(REFRESH_INTERVAL_MS).subscribe(() => {
        this.refreshConversations();
      });
    }
  }

  stopRefreshPump(): void {
    this.refreshSub?.unsubscribe();
    this.refreshSub = null;
  }

  refreshConversations(): void {
    this.http.get<PaginatedResponse<Conversation>>(`${this.baseUrl}/conversations/`, {
      params: new HttpParams().set('page', '1').set('page_size', '25'),
    }).subscribe({
      next: (res) => {
        const existing = this.conversations();
        const merged = res.results.map((fresh) => {
          const old = existing.find((c) => c.id === fresh.id);
          if (!old) return fresh;
          const wasActive = old.id === this.activeConversationId();
          return {
            ...fresh,
            unread_count: wasActive ? 0 : fresh.unread_count,
          };
        });
        this.conversations.set(merged);
        this.unreadTotal.set(merged.reduce((sum, c) => sum + c.unread_count, 0));
      },
    });
  }

  fetchConversations(page = 1): Observable<PaginatedResponse<Conversation>> {
    this.conversationsLoading.set(true);
    const params = new HttpParams().set('page', String(page)).set('page_size', '25');
    return this.http.get<PaginatedResponse<Conversation>>(`${this.baseUrl}/conversations/`, { params }).pipe(
      tap({
        next: (res) => {
          this.conversations.set(page === 1 ? res.results : [...this.conversations(), ...res.results]);
          this.unreadTotal.set(res.results.reduce((sum, c) => sum + c.unread_count, 0));
          this.conversationsLoading.set(false);
        },
        error: () => this.conversationsLoading.set(false),
      }),
    );
  }

  createConversation(payload: CreateConversationPayload): Observable<Conversation> {
    return this.http.post<Conversation>(`${this.baseUrl}/conversations/`, payload).pipe(
      tap((conv) => {
        this.conversations.update((list) => [conv, ...list]);
      }),
    );
  }

  selectConversation(id: number): void {
    this.activeConversationId.set(id);
    this.messages.set([]);
    this.fetchMessages(id).subscribe();
    this.markAsRead(id).subscribe();
    this.conversations.update((list) =>
      list.map((c) => (c.id === id ? { ...c, unread_count: 0 } : c)),
    );
  }

  fetchMessages(conversationId: number, page = 1): Observable<PaginatedResponse<Message>> {
    this.messagesLoading.set(true);
    const params = new HttpParams().set('page', String(page)).set('page_size', '50');
    return this.http.get<PaginatedResponse<Message>>(`${this.baseUrl}/conversations/${conversationId}/messages/`, { params }).pipe(
      tap({
        next: (res) => {
          this.messages.set(page === 1 ? res.results.reverse() : [...res.results.reverse(), ...this.messages()]);
          this.messagesLoading.set(false);
        },
        error: () => this.messagesLoading.set(false),
      }),
    );
  }

  sendMessage(content: string): void {
    const convId = this.activeConversationId();
    if (!convId || !content.trim()) return;

    this.realtime.send('send_message', { conversation_id: convId, content });
  }

  sendTyping(): void {
    const convId = this.activeConversationId();
    if (convId) {
      this.realtime.send('typing', { conversation_id: convId });
    }
  }

  markAsRead(conversationId: number): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(`${this.baseUrl}/conversations/${conversationId}/read/`, {});
  }

  private bumpConversation(conversationId: number, preview: string, timestamp: string): void {
    this.conversations.update((list) => {
      const idx = list.findIndex((c) => c.id === conversationId);
      if (idx === -1) return list;
      const conv = list[idx];
      const updated = { ...conv, last_message_preview: preview, last_message_at: timestamp };
      if (conversationId !== this.activeConversationId()) {
        updated.unread_count += 1;
        this.unreadTotal.update((t) => t + 1);
      }
      const filtered = list.filter((_, i) => i !== idx);
      return [updated, ...filtered];
    });
  }
}
