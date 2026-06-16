import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { finalize } from 'rxjs';
import { getApiUrl } from '@sms/core/config';
import { TokenStorageService } from '@sms/core/auth';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isMine: boolean;
}

export interface Thread {
  id: string;
  participants: string[];
  subject: string;
  messages: Message[];
  lastMessagePreview: string;
  lastTimestamp: string;
  unread: boolean;
}

interface RawConversation {
  id: number;
  title: string;
  participant_names: string[];
  last_message_preview: string;
  last_message_at: string | null;
  unread_count: number;
}

interface RawMessage {
  id: number;
  sender_id: number;
  sender_name: string;
  content: string;
  created_at: string;
}

interface Paginated<T> { results?: T[]; }

@Injectable({ providedIn: 'root' })
export class TeacherMessageService {
  private readonly http = inject(HttpClient);
  private readonly tokenStorage = inject(TokenStorageService);

  readonly threads = signal<Thread[]>([]);
  readonly activeThreadId = signal<string | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  readonly activeThread = computed(() => {
    const id = this.activeThreadId();
    if (!id) return null;
    return this.threads().find(t => t.id === id) ?? null;
  });

  loadThreads(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get<Paginated<RawConversation> | RawConversation[]>(getApiUrl('/communication/conversations/'))
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          const rows = Array.isArray(res) ? res : (res.results ?? []);
          this.threads.set(rows.map(c => this.mapThread(c)));
        },
        error: () => {
          this.threads.set([]);
          this.error.set('Failed to load conversations');
        },
      });
  }

  selectThread(id: string): void {
    this.activeThreadId.set(id);
    this.threads.update(threads => threads.map(t => t.id === id ? { ...t, unread: false } : t));
    this.loadMessages(id);
    this.http.post(getApiUrl(`/communication/conversations/${id}/read/`), {}).subscribe({ error: () => {} });
  }

  private loadMessages(threadId: string): void {
    const params = new HttpParams().set('page', '1').set('page_size', '50');
    this.http.get<Paginated<RawMessage> | RawMessage[]>(
      getApiUrl(`/communication/conversations/${threadId}/messages/`), { params },
    ).subscribe({
      next: (res) => {
        const rows = Array.isArray(res) ? res : (res.results ?? []);
        // Backend returns newest-first; show oldest-first in the thread.
        const mapped = rows.map(m => this.mapMessage(m)).reverse();
        this.threads.update(threads => threads.map(t =>
          t.id === threadId ? { ...t, messages: mapped } : t,
        ));
      },
      error: () => this.error.set('Failed to load messages'),
    });
  }

  sendMessage(threadId: string, content: string): void {
    const trimmed = content.trim();
    if (!trimmed) return;
    this.http.post<RawMessage>(
      getApiUrl(`/communication/conversations/${threadId}/messages/`),
      { content: trimmed },
    ).subscribe({
      next: (msg) => {
        const mapped = this.mapMessage(msg);
        this.threads.update(threads => threads.map(t => {
          if (t.id !== threadId) return t;
          return {
            ...t,
            messages: [...t.messages, mapped],
            lastMessagePreview: mapped.content,
            lastTimestamp: mapped.timestamp,
          };
        }));
      },
      error: () => this.error.set('Failed to send message'),
    });
  }

  private mapThread(c: RawConversation): Thread {
    return {
      id: String(c.id),
      participants: c.participant_names?.length ? c.participant_names : ['Conversation'],
      subject: c.title || (c.participant_names ?? []).join(', ') || 'Conversation',
      messages: [],
      lastMessagePreview: c.last_message_preview || '',
      lastTimestamp: c.last_message_at ? new Date(c.last_message_at).toLocaleDateString('en-CA') : '',
      unread: (c.unread_count ?? 0) > 0,
    };
  }

  private mapMessage(m: RawMessage): Message {
    const myId = this.currentUserId();
    return {
      id: String(m.id),
      senderId: String(m.sender_id),
      senderName: m.sender_name,
      content: m.content,
      timestamp: m.created_at ? new Date(m.created_at).toLocaleString() : '',
      isMine: myId != null && Number(m.sender_id) === myId,
    };
  }

  private currentUserId(): number | null {
    const token = this.tokenStorage.getAccessToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return typeof payload.user_id === 'number' ? payload.user_id : Number(payload.user_id) || null;
    } catch {
      return null;
    }
  }
}
