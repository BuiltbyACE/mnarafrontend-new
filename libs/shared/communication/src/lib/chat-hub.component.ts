import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterOutlet } from '@angular/router';
import { environment } from '@sms/core/config';
import { TokenStorageService } from '@sms/core/auth';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRippleModule } from '@angular/material/core';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { ChatService } from './chat.service';
import { PresenceService } from './presence.service';
import { RealtimeService } from './realtime.service';
import { ChatConversationListComponent } from './chat-conversation-list.component';
import { ChatMessageAreaComponent } from './chat-message-area.component';
import { RecipientGroup } from './communication.models';

@Component({
  selector: 'app-chat-hub',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatRippleModule,
    ChatConversationListComponent, ChatMessageAreaComponent,
  ],
  template: `
    <div class="chat-hub">
      <div class="chat-sidebar">
        <div class="sidebar-header">
          @if (canBroadcast()) {
            <button mat-flat-button color="primary" class="new-msg-btn" (click)="showNewMessage.set(true)">
              <mat-icon>edit</mat-icon>
              New Message
            </button>
          }
        </div>
        <app-chat-conversation-list />
      </div>
      <div class="chat-main">
        <app-chat-message-area />
      </div>
    </div>

    @if (showNewMessage()) {
      <div class="new-msg-overlay" (click)="closeNewMessage()"></div>
      <div class="new-msg-panel">
        <div class="panel-header">
          <h2>New Message</h2>
          <button mat-icon-button (click)="closeNewMessage()"><mat-icon>close</mat-icon></button>
        </div>

        <div class="panel-body">
          @if (canBroadcast()) {
            <label class="panel-label">Send to a group</label>
            <div class="group-list">
            @for (group of groups(); track group.type) {
              <button
                class="group-btn"
                [class.selected]="selectedGroup() === group.type"
                (click)="selectGroup(group.type)"
                matRipple
              >
                <span class="group-btn-label">{{ group.label }}</span>
                <span class="group-btn-count">{{ group.count }} members</span>
              </button>
            } @empty {
              <div class="loading-groups">
                <mat-spinner diameter="20" />
                <span>Loading groups...</span>
              </div>
            }
          </div>

          <div class="divider">
            <span>OR</span>
          </div>
          }

          <label class="panel-label">Search for an individual</label>
          <div class="user-search">
            <mat-icon class="user-search-icon">search</mat-icon>
            <input
              type="text"
              [(ngModel)]="userSearchQuery"
              (input)="searchUsers()"
              placeholder="Search by name..."
              class="user-search-input"
            />
          </div>
          @if (searchResults().length > 0) {
            <div class="search-results">
              @for (user of searchResults(); track user.id) {
                <button class="user-result" (click)="selectUser(user)" matRipple>
                  <div class="user-result-avatar">{{ user.name.charAt(0) }}</div>
                  <div class="user-result-info">
                    <span class="user-result-name">{{ user.name }}</span>
                    <span class="user-result-role">{{ user.role }}</span>
                  </div>
                </button>
              }
            </div>
          }
        </div>

        <div class="panel-footer">
          <button mat-stroked-button (click)="closeNewMessage()">Cancel</button>
          <button
            mat-flat-button
            color="primary"
            [disabled]="!selectedGroup() && selectedUserIds().length === 0"
            (click)="createAndOpen()"
          >
            Start Conversation
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .chat-hub { display: flex; height: calc(100vh - 140px); border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
    .chat-sidebar { width: 340px; flex-shrink: 0; display: flex; flex-direction: column; }
    .sidebar-header { padding: 16px; border-bottom: 1px solid #e2e8f0; }
    .new-msg-btn { width: 100%; display: flex; align-items: center; gap: 8px; }
    .chat-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }

    .new-msg-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 1000; }
    .new-msg-panel { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 480px; max-height: 80vh; background: #fff; border-radius: 16px; z-index: 1001; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    .panel-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #e2e8f0; }
    .panel-header h2 { margin: 0; font-size: 18px; font-weight: 600; }
    .panel-body { padding: 20px 24px; overflow-y: auto; flex: 1; }
    .panel-label { display: block; font-size: 13px; font-weight: 600; color: #64748b; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
    .group-list { display: flex; flex-direction: column; gap: 6px; }
    .group-btn { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 10px; background: #fff; cursor: pointer; transition: all 0.15s; text-align: left; width: 100%; font-family: inherit; }
    .group-btn:hover { border-color: #93c5fd; background: #eff6ff; }
    .group-btn.selected { border-color: #2563eb; background: #eff6ff; }
    .group-btn-label { font-size: 14px; font-weight: 600; color: #1e293b; }
    .group-btn-count { font-size: 12px; color: #94a3b8; }
    .loading-groups { display: flex; align-items: center; gap: 8px; padding: 12px; color: #94a3b8; font-size: 14px; }
    .divider { display: flex; align-items: center; gap: 12px; margin: 20px 0; }
    .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: #e2e8f0; }
    .divider span { font-size: 12px; color: #94a3b8; font-weight: 500; }
    .user-search { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 10px; }
    .user-search-icon { font-size: 20px; width: 20px; height: 20px; color: #94a3b8; }
    .user-search-input { border: none; outline: none; flex: 1; font-size: 14px; font-family: inherit; background: transparent; color: #1e293b; }
    .search-results { margin-top: 8px; display: flex; flex-direction: column; gap: 4px; max-height: 200px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 10px; }
    .user-result { display: flex; align-items: center; gap: 10px; padding: 10px 14px; cursor: pointer; border: none; background: none; width: 100%; text-align: left; font-family: inherit; }
    .user-result:hover { background: #f1f5f9; }
    .user-result-avatar { width: 32px; height: 32px; border-radius: 50%; background: #3b82f6; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; flex-shrink: 0; }
    .user-result-info { display: flex; flex-direction: column; }
    .user-result-name { font-size: 14px; font-weight: 500; color: #1e293b; }
    .user-result-role { font-size: 12px; color: #64748b; text-transform: capitalize; }
    .panel-footer { display: flex; gap: 8px; justify-content: flex-end; padding: 16px 24px; border-top: 1px solid #e2e8f0; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatHubComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly chatService = inject(ChatService);
  private readonly presenceService = inject(PresenceService);
  private readonly realtimeService = inject(RealtimeService);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly baseUrl = `${environment.apiBaseUrl}/communication`;

  readonly showNewMessage = signal(false);
  readonly canBroadcast = signal(false);
  readonly groups = signal<RecipientGroup[]>([]);
  readonly selectedGroup = signal<string | null>(null);
  readonly selectedUserIds = signal<number[]>([]);
  readonly userSearchQuery = signal('');
  readonly searchResults = signal<{ id: number; name: string; role: string }[]>([]);

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    const role = this.tokenStorage.getUserContext()?.portalKey;
    if (role === 'ADMIN' || role === 'TEACHER' || role === 'STAFF') {
      this.canBroadcast.set(true);
      this.fetchGroups();
    }
    this.chatService.fetchConversations().subscribe();
    this.connectWebSocket();
  }

  private connectWebSocket(): void {
    const token = this.tokenStorage.getAccessToken();
    if (token) {
      this.realtimeService.connect(token);
      this.presenceService.fetchStatuses();
    }
  }

  private fetchGroups(): void {
    this.http.get<RecipientGroup[]>(`${this.baseUrl}/groups/`).subscribe({
      next: (res) => this.groups.set(res),
      error: () => {
        this.groups.set([
          { type: 'ALL', label: 'Everyone', count: 850 },
          { type: 'TEACHING_STAFF', label: 'Teaching Staff', count: 45 },
          { type: 'NON_TEACHING_STAFF', label: 'Non-Teaching Staff', count: 12 },
          { type: 'STUDENTS', label: 'Students', count: 700 },
          { type: 'PARENTS', label: 'Parents', count: 93 },
        ]);
      },
    });
  }

  selectGroup(type: string): void {
    this.selectedGroup.set(type);
    this.selectedUserIds.set([]);
  }

  selectUser(user: { id: number; name: string; role: string }): void {
    this.selectedGroup.set(null);
    this.selectedUserIds.set([user.id]);
    this.createAndOpen();
  }

  searchUsers(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    const q = this.userSearchQuery().trim();
    if (q.length < 2) { this.searchResults.set([]); return; }
    this.searchTimer = setTimeout(() => {
      this.http.get<{ id: number; name: string; role: string }[]>(
        `${this.baseUrl}/users/`, { params: { search: q } },
      ).subscribe((res) => this.searchResults.set(res));
    }, 300);
  }

  createAndOpen(): void {
    const groupType = this.selectedGroup();
    const userIds = this.selectedUserIds();

    const payload: Record<string, unknown> = {};
    if (groupType) {
      payload['recipient_type'] = groupType;
      payload['title'] = this.groups().find((g) => g.type === groupType)?.label || groupType;
    } else if (userIds.length > 0) {
      payload['recipient_ids'] = userIds;
    }

    this.chatService.createConversation(payload).subscribe({
      next: (conv) => {
        this.chatService.selectConversation(conv.id);
        this.closeNewMessage();
      },
    });
  }

  closeNewMessage(): void {
    this.showNewMessage.set(false);
    this.selectedGroup.set(null);
    this.selectedUserIds.set([]);
    this.userSearchQuery.set('');
    this.searchResults.set([]);
  }
}
