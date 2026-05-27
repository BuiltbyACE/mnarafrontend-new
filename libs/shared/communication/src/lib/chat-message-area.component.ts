import { Component, inject, signal, AfterViewChecked, viewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthStore } from '@sms/core/auth';
import { ChatService } from './chat.service';
import { PresenceService } from './presence.service';

@Component({
  selector: 'app-chat-message-area',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="message-area">
      @if (chatService.activeConversationId(); as convId) {
        @let conv = chatService.conversations().find(c => c.id === convId);
        <div class="msg-header">
          <div class="msg-header-left">
            <span class="msg-header-title">{{ conv?.title || 'Chat' }}</span>
            @if (conv?.type === 'GROUP' && conv && presenceService.isOnline(-1)) {
              <span class="msg-header-status">{{ conv.online_count }} online</span>
            }
          </div>
        </div>

        <div class="msg-body" #scrollContainer>
          @if (chatService.messagesLoading()) {
            <div class="loading-spinner"><mat-spinner diameter="24" /></div>
          }
          @for (msg of chatService.messages(); track msg.id) {
            <div class="msg-row" [class.msg-row--own]="msg.sender_id === currentUserId">
              <div class="msg-bubble" [class.msg-bubble--own]="msg.sender_id === currentUserId">
                @if (msg.sender_id !== currentUserId) {
                  <div class="msg-sender">{{ msg.sender_name }}</div>
                }
                <div class="msg-content">{{ msg.content }}</div>
                <div class="msg-footer">
                  <span class="msg-time">{{ formatTime(msg.created_at) }}</span>
                  @if (msg.sender_id === currentUserId) {
                    <span class="msg-read-status">
                      @if (msg.read_by.length > 0) {
                        <mat-icon class="read-icon read">done_all</mat-icon>
                      } @else {
                        <mat-icon class="read-icon sent">done</mat-icon>
                      }
                    </span>
                  }
                </div>
              </div>
            </div>
          } @empty {
            <div class="empty-msg">
              <p>No messages yet. Send a message to start the conversation.</p>
            </div>
          }
          <div #scrollAnchor></div>
        </div>

        <div class="compose-bar">
          <input
            type="text"
            [ngModel]="messageText()"
            (ngModelChange)="messageText.set($event)"
            (keydown.enter)="send()"
            (input)="onTyping()"
            placeholder="Type a message..."
            class="compose-input"
            [disabled]="chatService.messagesLoading()"
          />
          <button
            mat-icon-button
            class="send-btn"
            [disabled]="!messageText().trim()"
            (click)="send()"
          >
            <mat-icon>send</mat-icon>
          </button>
        </div>
      } @else {
        <div class="no-selection">
          <mat-icon class="no-selection-icon">chat</mat-icon>
          <h3>Select a conversation</h3>
          <p>Choose a conversation from the left to start chatting</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .message-area { display: flex; flex-direction: column; height: 100%; background: #fff; }
    .msg-header { padding: 12px 20px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; }
    .msg-header-left { display: flex; align-items: center; gap: 8px; }
    .msg-header-title { font-size: 16px; font-weight: 600; color: #1e293b; }
    .msg-header-status { font-size: 12px; color: #10b981; }
    .msg-body { flex: 1; overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 4px; }
    .loading-spinner { display: flex; justify-content: center; padding: 24px; }
    .msg-row { display: flex; }
    .msg-row--own { justify-content: flex-end; }
    .msg-bubble { max-width: 70%; padding: 8px 14px; border-radius: 12px; background: #f1f5f9; border-bottom-left-radius: 4px; }
    .msg-bubble--own { background: #2563eb; color: #fff; border-bottom-right-radius: 4px; border-bottom-left-radius: 12px; }
    .msg-sender { font-size: 12px; font-weight: 600; color: #3b82f6; margin-bottom: 2px; }
    .msg-bubble--own .msg-sender { color: rgba(255,255,255,0.8); }
    .msg-content { font-size: 14px; line-height: 1.4; white-space: pre-wrap; word-break: break-word; }
    .msg-footer { display: flex; align-items: center; gap: 4px; margin-top: 4px; justify-content: flex-end; }
    .msg-time { font-size: 11px; color: #94a3b8; }
    .msg-bubble--own .msg-time { color: rgba(255,255,255,0.7); }
    .read-icon { font-size: 14px; width: 14px; height: 14px; }
    .read-icon.sent { color: rgba(255,255,255,0.6); }
    .read-icon.read { color: #60a5fa; }
    .no-selection { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #94a3b8; }
    .no-selection-icon { font-size: 64px; width: 64px; height: 64px; margin-bottom: 16px; }
    .no-selection h3 { font-size: 18px; margin: 0 0 8px; color: #475569; }
    .no-selection p { font-size: 14px; margin: 0; }
    .compose-bar { display: flex; align-items: center; gap: 8px; padding: 12px 20px; border-top: 1px solid #e2e8f0; background: #fff; }
    .compose-input { flex: 1; border: 1px solid #e2e8f0; border-radius: 24px; padding: 10px 16px; font-size: 14px; outline: none; font-family: inherit; transition: border-color 0.15s; }
    .compose-input:focus { border-color: #2563eb; }
    .compose-input::placeholder { color: #94a3b8; }
    .send-btn { color: #2563eb; }
    .send-btn:disabled { color: #cbd5e1; }
    .empty-msg { display: flex; justify-content: center; padding: 48px 16px; }
    .empty-msg p { font-size: 14px; color: #94a3b8; margin: 0; text-align: center; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatMessageAreaComponent implements AfterViewChecked {
  readonly chatService = inject(ChatService);
  readonly presenceService = inject(PresenceService);
  private readonly authStore = inject(AuthStore);

  readonly messageText = signal('');
  get currentUserId(): number {
    const id = this.authStore.user()?.user?.id;
    return id ? Number(id) : 0;
  }
  readonly scrollAnchor = viewChild<ElementRef<HTMLDivElement>>('scrollAnchor');

  private typingTimer: ReturnType<typeof setTimeout> | null = null;

  send(): void {
    const text = this.messageText();
    if (!text.trim()) return;
    this.chatService.sendMessage(text);
    this.messageText.set('');
  }

  onTyping(): void {
    this.chatService.sendTyping();
    if (this.typingTimer) clearTimeout(this.typingTimer);
    this.typingTimer = setTimeout(() => { this.typingTimer = null; }, 2000);
  }

  ngAfterViewChecked(): void {
    const anchor = this.scrollAnchor()?.nativeElement;
    if (anchor) {
      anchor.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }

  formatTime(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
}
