import { Component, signal, computed, inject } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TeacherMessageService, Thread, Message } from '../../core/services/teacher-message.service';

@Component({
  selector: 'app-teacher-messages',
  standalone: true,
  imports: [
    DatePipe, NgClass, FormsModule,
    MatCardModule, MatIconModule, MatButtonModule, MatDividerModule,
    MatFormFieldModule, MatInputModule
  ],
  template: `
    <div class="messages-container">
      <div class="header">
        <h1 class="page-title">Messages</h1>
        <p class="page-subtitle">Communicate with staff, parents, and administration</p>
      </div>

      <div class="messages-layout">
        <aside class="threads-sidebar">
          <div class="sidebar-header">
            <h3>Threads</h3>
            <span class="thread-count">{{ threads().length }}</span>
          </div>
          <div class="thread-list">
            @for (thread of threads(); track thread.id) {
              <div
                class="thread-item"
                [class.active]="activeThreadId() === thread.id"
                (click)="selectThread(thread.id)"
              >
                <div class="thread-avatar">{{ getInitials(thread.participants) }}</div>
                <div class="thread-content">
                  <div class="thread-top">
                    <span class="thread-participants">{{ thread.participants.join(', ') }}</span>
                    <span class="thread-time">{{ thread.lastTimestamp }}</span>
                  </div>
                  <div class="thread-bottom">
                    <span class="thread-preview">{{ thread.lastMessagePreview }}</span>
                    @if (thread.unread) {
                      <span class="unread-dot"></span>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        </aside>

        <main class="chat-area">
          @if (activeThread(); as thread) {
            <div class="chat-header">
              <div class="chat-header-info">
                <h3>{{ thread.subject }}</h3>
                <span class="chat-participants">{{ thread.participants.join(', ') }}</span>
              </div>
            </div>

            <mat-divider></mat-divider>

            <div class="messages-list">
              @for (msg of thread.messages; track msg.id) {
                <div class="message-row" [class.mine]="msg.isMine" [class.theirs]="!msg.isMine">
                  <div class="message-bubble" [class.sent]="msg.isMine" [class.received]="!msg.isMine">
                    <div class="message-content">{{ msg.content }}</div>
                    <div class="message-time">{{ msg.timestamp }}</div>
                  </div>
                </div>
              }
            </div>

            <div class="message-input-area">
              <div class="input-wrapper">
                <input
                  type="text"
                  class="message-input"
                  placeholder="Type your message..."
                  [(ngModel)]="newMessage"
                  (keydown.enter)="sendMessage()"
                />
                <button class="send-btn" (click)="sendMessage()" [disabled]="!newMessage().trim()">
                  <mat-icon>send</mat-icon>
                </button>
              </div>
            </div>
          } @else {
            <div class="no-chat-selected">
              <mat-icon>chat</mat-icon>
              <p>Select a thread to start messaging</p>
            </div>
          }
        </main>
      </div>
    </div>
  `,
  styles: [`
    .messages-container {
      padding: 24px;
      font-family: 'Segoe UI', Roboto, sans-serif;
      color: #1e293b;
      height: calc(100vh - 120px);
      display: flex;
      flex-direction: column;
    }
    .header {
      margin-bottom: 20px;
      flex-shrink: 0;
    }
    .page-title {
      font-size: 28px;
      font-weight: 700;
      color: #1e3a8a;
      margin: 0 0 4px 0;
    }
    .page-subtitle {
      font-size: 14px;
      color: #64748b;
      margin: 0;
    }
    .messages-layout {
      display: flex;
      flex: 1;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
      overflow: hidden;
      min-height: 0;
    }
    .threads-sidebar {
      width: 300px;
      border-right: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }
    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #e2e8f0;
    }
    .sidebar-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
    }
    .thread-count {
      background: #e0e7ff;
      color: #1e3a8a;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    .thread-list {
      flex: 1;
      overflow-y: auto;
    }
    .thread-item {
      display: flex;
      gap: 12px;
      padding: 14px 20px;
      cursor: pointer;
      transition: background 0.15s;
      border-bottom: 1px solid #f1f5f9;
    }
    .thread-item:hover {
      background: #f8fafc;
    }
    .thread-item.active {
      background: #e0e7ff;
    }
    .thread-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2563eb, #1e3a8a);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      flex-shrink: 0;
    }
    .thread-content {
      flex: 1;
      min-width: 0;
    }
    .thread-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    .thread-participants {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .thread-time {
      font-size: 11px;
      color: #94a3b8;
      flex-shrink: 0;
    }
    .thread-bottom {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .thread-preview {
      font-size: 13px;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }
    .unread-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #2563eb;
      flex-shrink: 0;
    }
    .chat-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .chat-header {
      padding: 16px 24px;
    }
    .chat-header-info h3 {
      margin: 0;
      font-size: 17px;
      font-weight: 700;
      color: #1e293b;
    }
    .chat-participants {
      font-size: 13px;
      color: #64748b;
      margin-top: 2px;
    }
    .messages-list {
      flex: 1;
      overflow-y: auto;
      padding: 16px 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .message-row {
      display: flex;
    }
    .message-row.mine {
      justify-content: flex-end;
    }
    .message-row.theirs {
      justify-content: flex-start;
    }
    .message-bubble {
      max-width: 70%;
      padding: 10px 16px;
      border-radius: 16px;
      position: relative;
    }
    .message-bubble.sent {
      background: #2563eb;
      color: #fff;
      border-bottom-right-radius: 4px;
    }
    .message-bubble.received {
      background: #f1f5f9;
      color: #1e293b;
      border-bottom-left-radius: 4px;
    }
    .message-content {
      font-size: 14px;
      line-height: 1.5;
      word-wrap: break-word;
    }
    .message-time {
      font-size: 11px;
      margin-top: 4px;
      opacity: 0.7;
      text-align: right;
    }
    .message-input-area {
      padding: 16px 24px;
      border-top: 1px solid #e2e8f0;
    }
    .input-wrapper {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 4px 4px 4px 16px;
    }
    .message-input {
      flex: 1;
      border: none;
      outline: none;
      height: 42px;
      font-size: 14px;
      color: #1e293b;
      background: transparent;
    }
    .message-input::placeholder {
      color: #94a3b8;
    }
    .send-btn {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      border: none;
      background: #2563eb;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.2s;
    }
    .send-btn:hover:not(:disabled) {
      background: #1e40af;
    }
    .send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .send-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .no-chat-selected {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #94a3b8;
    }
    .no-chat-selected mat-icon {
      font-size: 56px;
      width: 56px;
      height: 56px;
      margin-bottom: 16px;
    }
    .no-chat-selected p {
      font-size: 15px;
      margin: 0;
    }
  `]
})
export class MessagesComponent {
  private messageService = inject(TeacherMessageService);

  readonly newMessage = signal('');

  readonly threads = this.messageService.threads;
  readonly activeThreadId = this.messageService.activeThreadId;
  readonly activeThread = this.messageService.activeThread;

  getInitials(participants: string[]): string {
    return participants.map(p => p.charAt(0)).join('');
  }

  selectThread(id: string) {
    this.messageService.selectThread(id);
  }

  sendMessage() {
    const content = this.newMessage().trim();
    if (!content) return;
    const thread = this.activeThread();
    if (!thread) return;
    this.messageService.sendMessage(thread.id, content);
    this.newMessage.set('');
  }
}
