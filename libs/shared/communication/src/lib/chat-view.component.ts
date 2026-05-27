import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TokenStorageService } from '@sms/core/auth';
import { ChatService } from './chat.service';
import { PresenceService } from './presence.service';
import { RealtimeService } from './realtime.service';
import { ChatConversationListComponent } from './chat-conversation-list.component';
import { ChatMessageAreaComponent } from './chat-message-area.component';

@Component({
  selector: 'app-chat-view',
  standalone: true,
  imports: [
    CommonModule, MatProgressSpinnerModule,
    ChatConversationListComponent, ChatMessageAreaComponent,
  ],
  template: `
    <div class="chat-view">
      <div class="chat-sidebar">
        <div class="sidebar-header">
          <h3>Messages</h3>
        </div>
        <app-chat-conversation-list />
      </div>
      <div class="chat-main">
        <app-chat-message-area />
      </div>
    </div>
  `,
  styles: [`
    .chat-view { display: flex; height: calc(100vh - 140px); border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
    .chat-sidebar { width: 340px; flex-shrink: 0; display: flex; flex-direction: column; }
    .sidebar-header { padding: 16px 20px; border-bottom: 1px solid #e2e8f0; }
    .sidebar-header h3 { margin: 0; font-size: 16px; font-weight: 600; color: #1e293b; }
    .chat-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatViewComponent implements OnInit {
  private readonly chatService = inject(ChatService);
  private readonly presenceService = inject(PresenceService);
  private readonly realtimeService = inject(RealtimeService);
  private readonly tokenStorage = inject(TokenStorageService);

  ngOnInit(): void {
    this.chatService.fetchConversations().subscribe();
    const token = this.tokenStorage.getAccessToken();
    if (token) {
      this.realtimeService.connect(token);
      this.presenceService.fetchStatuses();
    }
  }
}
