import { Component, signal, computed } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isMine: boolean;
}

interface Thread {
  id: string;
  participants: string[];
  subject: string;
  messages: Message[];
  lastMessagePreview: string;
  lastTimestamp: string;
  unread: boolean;
}

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
  readonly activeThreadId = signal<string | null>(null);
  readonly newMessage = signal('');

  readonly threads = signal<Thread[]>([
    {
      id: 'T1',
      participants: ['School Admin'],
      subject: 'Staff Meeting Agenda',
      lastMessagePreview: 'Please find the agenda for tomorrow\'s staff meeting attached.',
      lastTimestamp: '2026-05-17',
      unread: true,
      messages: [
        { id: 'M1', senderId: 'admin', senderName: 'School Admin', content: 'Good morning, please find the agenda for tomorrow\'s staff meeting attached.', timestamp: '2026-05-17 08:30', isMine: false },
        { id: 'M2', senderId: 'teacher', senderName: 'You', content: 'Thank you, I will review it before the meeting.', timestamp: '2026-05-17 08:45', isMine: true },
        { id: 'M3', senderId: 'admin', senderName: 'School Admin', content: 'Also, please prepare your termly progress report for discussion.', timestamp: '2026-05-17 09:00', isMine: false }
      ]
    },
    {
      id: 'T2',
      participants: ['Mrs. Wanjiku (HOD)'],
      subject: 'Curriculum Review',
      lastMessagePreview: 'The department heads have approved the new scheme of work.',
      lastTimestamp: '2026-05-16',
      unread: true,
      messages: [
        { id: 'M4', senderId: 'hod', senderName: 'Mrs. Wanjiku (HOD)', content: 'The department heads have approved the new scheme of work.', timestamp: '2026-05-16 14:00', isMine: false },
        { id: 'M5', senderId: 'teacher', senderName: 'You', content: 'That\'s great news. When should we start implementing?', timestamp: '2026-05-16 14:15', isMine: true },
        { id: 'M6', senderId: 'hod', senderName: 'Mrs. Wanjiku (HOD)', content: 'Starting next term. I will share the rollout plan shortly.', timestamp: '2026-05-16 14:30', isMine: false },
        { id: 'M7', senderId: 'teacher', senderName: 'You', content: 'Noted. Looking forward to the plan.', timestamp: '2026-05-16 14:45', isMine: true }
      ]
    },
    {
      id: 'T3',
      participants: ['Mr. & Mrs. Kamau (Parent)'],
      subject: 'Brian\'s Academic Progress',
      lastMessagePreview: 'Thank you for the update. We will work with Brian at home.',
      lastTimestamp: '2026-05-15',
      unread: false,
      messages: [
        { id: 'M8', senderId: 'teacher', senderName: 'You', content: 'Hello Mr. & Mrs. Kamau, I wanted to discuss Brian\'s recent performance in Mathematics.', timestamp: '2026-05-15 10:00', isMine: true },
        { id: 'M9', senderId: 'parent', senderName: 'Mr. & Mrs. Kamau (Parent)', content: 'Hello, thank you for reaching out. We have noticed he has been struggling.', timestamp: '2026-05-15 10:30', isMine: false },
        { id: 'M10', senderId: 'teacher', senderName: 'You', content: 'I recommend some extra tutoring sessions after school on Tuesdays and Thursdays.', timestamp: '2026-05-15 10:45', isMine: true },
        { id: 'M11', senderId: 'parent', senderName: 'Mr. & Mrs. Kamau (Parent)', content: 'That sounds like a good plan. We will make sure he attends.', timestamp: '2026-05-15 11:15', isMine: false },
        { id: 'M12', senderId: 'teacher', senderName: 'You', content: 'Perfect. I will start next Tuesday. I\'ll keep you updated on his progress.', timestamp: '2026-05-15 11:30', isMine: true }
      ]
    },
    {
      id: 'T4',
      participants: ['Sports Department'],
      subject: 'Inter-School Sports Tournament',
      lastMessagePreview: 'We need your class list for the athletics trials tomorrow.',
      lastTimestamp: '2026-05-14',
      unread: false,
      messages: [
        { id: 'M13', senderId: 'sports', senderName: 'Sports Department', content: 'We need your class list for the athletics trials tomorrow.', timestamp: '2026-05-14 09:00', isMine: false },
        { id: 'M14', senderId: 'teacher', senderName: 'You', content: 'I will send the list by end of day. How many students per event?', timestamp: '2026-05-14 09:30', isMine: true },
        { id: 'M15', senderId: 'sports', senderName: 'Sports Department', content: 'Maximum 3 per event. The trials start at 8 AM on the main field.', timestamp: '2026-05-14 10:00', isMine: false },
        { id: 'M16', senderId: 'teacher', senderName: 'You', content: 'Got it. Sending the list shortly.', timestamp: '2026-05-14 10:15', isMine: true }
      ]
    },
    {
      id: 'T5',
      participants: ['Lab Technician'],
      subject: 'Chemistry Lab Equipment',
      lastMessagePreview: 'The Bunsen burners have been serviced and are ready for use.',
      lastTimestamp: '2026-05-13',
      unread: false,
      messages: [
        { id: 'M17', senderId: 'lab', senderName: 'Lab Technician', content: 'The Bunsen burners have been serviced and are ready for use.', timestamp: '2026-05-13 11:00', isMine: false },
        { id: 'M18', senderId: 'teacher', senderName: 'You', content: 'Excellent. Can we also get the titration kits for next week\'s practical?', timestamp: '2026-05-13 11:30', isMine: true },
        { id: 'M19', senderId: 'lab', senderName: 'Lab Technician', content: 'Yes, I have already prepared them. They are in the prep room.', timestamp: '2026-05-13 12:00', isMine: false },
        { id: 'M20', senderId: 'teacher', senderName: 'You', content: 'Thank you. I will pick them up on Monday morning.', timestamp: '2026-05-13 12:15', isMine: true }
      ]
    }
  ]);

  readonly activeThread = computed(() => {
    const id = this.activeThreadId();
    if (!id) return null;
    return this.threads().find(t => t.id === id) ?? null;
  });

  getInitials(participants: string[]): string {
    return participants.map(p => p.charAt(0)).join('');
  }

  selectThread(id: string) {
    this.activeThreadId.set(id);
    this.threads.update(threads => threads.map(t => t.id === id ? { ...t, unread: false } : t));
  }

  sendMessage() {
    const content = this.newMessage().trim();
    if (!content) return;
    const thread = this.activeThread();
    if (!thread) return;
    const newMsg: Message = {
      id: 'M' + Date.now(),
      senderId: 'teacher',
      senderName: 'You',
      content,
      timestamp: new Date().toLocaleDateString('en-CA'),
      isMine: true
    };
    this.threads.update(threads => threads.map(t => {
      if (t.id !== thread.id) return t;
      return {
        ...t,
        messages: [...t.messages, newMsg],
        lastMessagePreview: content,
        lastTimestamp: newMsg.timestamp
      };
    }));
    this.newMessage.set('');
  }
}
