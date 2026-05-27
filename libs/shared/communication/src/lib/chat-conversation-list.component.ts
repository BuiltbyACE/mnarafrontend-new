import { Component, inject, output, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { ChatService } from './chat.service';
import { PresenceService } from './presence.service';
import { Conversation } from './communication.models';

@Component({
  selector: 'app-chat-conversation-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatRippleModule],
  template: `
    <div class="conv-list">
      <div class="conv-search">
        <mat-icon class="search-icon">search</mat-icon>
        <input
          type="text"
          [(ngModel)]="searchQuery"
          placeholder="Search conversations..."
          class="search-input"
        />
      </div>

      <div class="conv-items">
        @for (conv of filteredConversations(); track conv.id) {
          <div
            class="conv-item"
            [class.active]="conv.id === chatService.activeConversationId()"
            matRipple
            (click)="selectConv(conv)"
          >
            <div class="conv-avatar" [style.background]="conv.type === 'GROUP' ? '#3b82f6' : '#8b5cf6'">
              <mat-icon>{{ conv.type === 'GROUP' ? 'groups' : 'person' }}</mat-icon>
            </div>
            <div class="conv-info">
              <div class="conv-top">
                <span class="conv-title">{{ conv.title }}</span>
                <span class="conv-time">{{ formatTime(conv.last_message_at) }}</span>
              </div>
              <div class="conv-bottom">
                <span class="conv-preview">{{ conv.last_message_preview || 'No messages yet' }}</span>
                <div class="conv-meta">
                  @if (conv.online_count > 0 && conv.type === 'GROUP') {
                    <span class="online-badge" title="{{ conv.online_count }} online">{{ conv.online_count }}</span>
                  }
                  @if (conv.unread_count > 0) {
                    <span class="unread-badge">{{ conv.unread_count > 99 ? '99+' : conv.unread_count }}</span>
                  }
                </div>
              </div>
            </div>
          </div>
        } @empty {
          <div class="empty-state">
            <mat-icon>chat</mat-icon>
            <p>No conversations yet</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .conv-list { display: flex; flex-direction: column; height: 100%; background: #f8fafc; border-right: 1px solid #e2e8f0; }
    .conv-search { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-bottom: 1px solid #e2e8f0; }
    .search-icon { font-size: 20px; width: 20px; height: 20px; color: #94a3b8; flex-shrink: 0; }
    .search-input { border: none; outline: none; font-size: 14px; flex: 1; background: transparent; color: #1e293b; font-family: inherit; }
    .search-input::placeholder { color: #94a3b8; }
    .conv-items { flex: 1; overflow-y: auto; }
    .conv-item { display: flex; gap: 12px; padding: 12px 16px; cursor: pointer; transition: background 0.15s; border-bottom: 1px solid #f1f5f9; }
    .conv-item:hover { background: #f1f5f9; }
    .conv-item.active { background: #eff6ff; }
    .conv-avatar { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .conv-avatar mat-icon { color: #fff; font-size: 20px; width: 20px; height: 20px; }
    .conv-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
    .conv-top { display: flex; justify-content: space-between; align-items: center; }
    .conv-title { font-size: 14px; font-weight: 600; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .conv-time { font-size: 11px; color: #94a3b8; white-space: nowrap; flex-shrink: 0; }
    .conv-bottom { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
    .conv-preview { font-size: 13px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }
    .conv-meta { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
    .online-badge { font-size: 11px; font-weight: 600; color: #10b981; background: #d1fae5; padding: 1px 6px; border-radius: 8px; }
    .unread-badge { font-size: 11px; font-weight: 700; color: #fff; background: #2563eb; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 999px; display: flex; align-items: center; justify-content: center; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 48px 16px; color: #94a3b8; }
    .empty-state mat-icon { font-size: 40px; width: 40px; height: 40px; }
    .empty-state p { font-size: 14px; margin: 0; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatConversationListComponent {
  readonly chatService = inject(ChatService);
  readonly presenceService = inject(PresenceService);
  readonly conversationSelected = output<Conversation>();

  readonly searchQuery = signal('');

  readonly filteredConversations = () => {
    const q = this.searchQuery().toLowerCase();
    return this.chatService.conversations().filter((c) =>
      !q || c.title.toLowerCase().includes(q) || c.participant_names.some((n) => n.toLowerCase().includes(q)),
    );
  };

  selectConv(conv: Conversation): void {
    this.chatService.selectConversation(conv.id);
    this.conversationSelected.emit(conv);
  }

  formatTime(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    if (diffHours < 48) return 'yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
