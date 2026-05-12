import { Component, inject, OnInit, ChangeDetectionStrategy, ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CommunicationService, ConversationThread } from '../../services/communication.service';
import { ComposeDialogComponent } from './compose-dialog';

@Component({
  selector: 'app-conversation-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatDividerModule,
    MatBadgeModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  template: `
    <div class="conv-page">
      <header class="conv-header">
        <h1>Conversations</h1>
        <p class="subtitle">Direct messages and group channels</p>
      </header>

      <mat-card class="conv-shell">
        <!-- Left Sidebar: Thread List -->
        <aside class="thread-panel">
          <div class="thread-panel-header">
            <span class="thread-count">{{ service.threads().length }} conversations</span>
            <button mat-icon-button class="compose-btn" (click)="openComposeDialog()"
                    aria-label="New conversation">
              <mat-icon>edit_square</mat-icon>
            </button>
          </div>
          <div class="thread-scroll">
            @for (thread of service.threads(); track thread.id) {
              <button
                class="thread-tile"
                [class.active]="thread.id === service.activeThreadId()"
                (click)="selectThread(thread)">
                <div class="tile-avatar" [matBadge]="thread.unread_count" matBadgeOverlap="false"
                     [matBadgeHidden]="thread.unread_count === 0">
                  {{ getInitials(thread) }}
                </div>
                <div class="tile-content">
                  <span class="tile-title">{{ thread.subject || thread.participant_names.join(', ') }}</span>
                  <span class="tile-snippet">{{ thread.last_message }}</span>
                </div>
              </button>
            } @empty {
              <div class="empty-threads">
                <mat-icon>forum</mat-icon>
                <p>No conversations yet</p>
              </div>
            }
          </div>
        </aside>

        <!-- Right Pane: Chat Window -->
        <main class="chat-pane">
          @if (service.activeThreadId(); as tid) {
            <!-- Active Chat Header -->
            <div class="chat-header">
              <span class="chat-title">{{ getActiveThreadTitle() }}</span>
            </div>

            <!-- Messages -->
            <div class="message-scroll" #messageScroll>
              @for (msg of service.activeMessages(); track msg.id) {
                <div class="msg-row" [class.own]="msg.sender_name === 'Admin'">
                  <div class="msg-bubble" [class.own-bubble]="msg.sender_name === 'Admin'">
                    <div class="msg-sender">{{ msg.sender_name }}</div>
                    <div class="msg-body">{{ msg.body }}</div>
                    <div class="msg-time">{{ msg.created_at | date:'short' }}</div>
                  </div>
                </div>
              } @empty {
                <div class="empty-messages">
                  <mat-icon>chat</mat-icon>
                  <p>No messages in this thread yet</p>
                </div>
              }
            </div>

            <!-- Chat Input -->
            <div class="chat-footer">
              <mat-form-field appearance="outline" class="chat-input-field">
                <input
                  matInput
                  [formControl]="messageControl"
                  placeholder="Type a message..."
                  (keydown.enter)="$event.preventDefault(); sendMessage(tid)">
              </mat-form-field>
              <button
                mat-icon-button
                color="primary"
                class="send-btn"
                [disabled]="!messageControl.value?.trim()"
                (click)="sendMessage(tid)">
                <mat-icon>send</mat-icon>
              </button>
            </div>
          } @else {
            <!-- Empty State -->
            <div class="no-chat-selected">
              <mat-icon class="no-chat-icon">forum</mat-icon>
              <h2>Select a conversation</h2>
              <p>Choose a thread from the left to start messaging</p>
            </div>
          }
        </main>
      </mat-card>
    </div>
  `,
  styles: [`
    .conv-page { padding: 24px; display: flex; flex-direction: column; height: 100%; }

    .conv-header { margin-bottom: 16px; flex-shrink: 0; }
    .conv-header h1 { font-size: 24px; font-weight: 700; margin: 0 0 2px; color: #111827; }
    .conv-header .subtitle { color: #6b7280; margin: 0; font-size: 0.9rem; }

    .conv-shell {
      display: flex; flex: 1; border-radius: 12px; overflow: hidden;
      min-height: 0; height: calc(100vh - 260px);
    }

    /* ── Left Sidebar ── */
    .thread-panel {
      width: 30%; min-width: 260px; max-width: 340px;
      display: flex; flex-direction: column;
      border-right: 1px solid #e5e7eb; background: #fafafa;
    }
    .thread-panel-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 8px 8px 8px 16px; font-size: 0.8rem; font-weight: 600;
      color: #6b7280; border-bottom: 1px solid #e5e7eb; flex-shrink: 0;
    }
    .compose-btn { color: #2563eb; }
    .compose-btn:hover { background: #eff6ff; }
    .thread-scroll { flex: 1; overflow-y: auto; }

    .thread-tile {
      display: flex; align-items: center; gap: 12px; width: 100%;
      padding: 12px 16px; border: none; background: transparent;
      cursor: pointer; text-align: left; transition: background 0.15s;
      border-bottom: 1px solid #f3f4f6;
    }
    .thread-tile:hover { background: #f3f4f6; }
    .thread-tile.active { background: #eff6ff; }

    .tile-avatar {
      width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      color: #fff; display: flex; align-items: center; justify-content: center;
      font-size: 0.8rem; font-weight: 700;
    }
    .tile-content { display: flex; flex-direction: column; min-width: 0; flex: 1; }
    .tile-title { font-weight: 600; font-size: 0.85rem; color: #1f2937; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .tile-snippet { font-size: 0.75rem; color: #9ca3af; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .empty-threads { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 48px 16px; color: #9ca3af; }
    .empty-threads mat-icon { font-size: 36px; width: 36px; height: 36px; }

    /* ── Right Chat Pane ── */
    .chat-pane { flex: 1; display: flex; flex-direction: column; background: #fff; min-width: 0; }

    .chat-header {
      padding: 14px 20px; font-weight: 600; font-size: 1rem;
      border-bottom: 1px solid #e5e7eb; flex-shrink: 0; color: #1f2937;
    }

    .message-scroll { flex: 1; overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 8px; }

    .msg-row { display: flex; }
    .msg-row.own { justify-content: flex-end; }

    .msg-bubble {
      max-width: 70%; padding: 10px 14px; border-radius: 12px;
      background: #f3f4f6; color: #1f2937;
      border-bottom-left-radius: 4px;
    }
    .msg-bubble.own-bubble {
      background: #2563eb; color: #fff;
      border-bottom-left-radius: 12px; border-bottom-right-radius: 4px;
    }
    .msg-sender { font-size: 0.72rem; font-weight: 600; margin-bottom: 2px; opacity: 0.7; }
    .msg-body { font-size: 0.88rem; line-height: 1.4; }
    .msg-time { font-size: 0.65rem; margin-top: 4px; opacity: 0.6; text-align: right; }

    .empty-messages { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 48px 16px; color: #9ca3af; }
    .empty-messages mat-icon { font-size: 36px; width: 36px; height: 36px; }

    /* ── Chat Footer ── */
    .chat-footer {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 16px; border-top: 1px solid #e5e7eb; flex-shrink: 0; background: #fff;
    }
    .chat-input-field { flex: 1; margin: 0; }
    .chat-input-field .mat-mdc-form-field-subscript-wrapper { display: none; }
    .send-btn { flex-shrink: 0; }

    /* ── No Chat Selected ── */
    .no-chat-selected {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 8px;
      color: #9ca3af; padding: 48px;
    }
    .no-chat-icon { font-size: 64px; width: 64px; height: 64px; margin-bottom: 8px; }
    .no-chat-selected h2 { margin: 0; font-weight: 600; color: #6b7280; font-size: 1.2rem; }
    .no-chat-selected p { margin: 0; font-size: 0.9rem; }
  `],
})
export class ConversationListComponent implements OnInit {
  readonly service = inject(CommunicationService);
  readonly dialog = inject(MatDialog);
  readonly viewContainerRef = inject(ViewContainerRef);
  readonly messageControl = new FormControl('');

  ngOnInit(): void {
    this.service.getThreads();
  }

  openComposeDialog(): void {
    const ref = this.dialog.open(ComposeDialogComponent, {
      width: '600px',
      panelClass: 'compose-dialog-panel',
      viewContainerRef: this.viewContainerRef,
    });
    ref.afterClosed().subscribe((result) => {
      if (result?.success && result.threadId) {
        this.service.getThreads();
        this.service.activeThreadId.set(result.threadId);
        this.service.getMessages(result.threadId);
      }
    });
  }

  selectThread(thread: ConversationThread): void {
    this.service.activeThreadId.set(thread.id);
    this.service.getMessages(thread.id);
  }

  getInitials(thread: ConversationThread): string {
    const name = thread.subject || thread.participant_names?.join(', ') || '??';
    const parts = name.trim().split(' ');
    return parts.length > 1
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  }

  getActiveThreadTitle(): string {
    const tid = this.service.activeThreadId();
    if (!tid) return '';
    const thread = this.service.threads().find((t: ConversationThread) => t.id === tid);
    if (!thread) return '';
    return thread.subject || thread.participant_names.join(', ');
  }

  sendMessage(threadId: string): void {
    const body = this.messageControl.value?.trim();
    if (!body) return;
    this.messageControl.disable();
    this.service.sendMessage(threadId, body).subscribe({
      next: () => {
        this.messageControl.setValue('');
        this.messageControl.enable();
        this.service.getMessages(threadId);
      },
      error: () => this.messageControl.enable(),
    });
  }
}
