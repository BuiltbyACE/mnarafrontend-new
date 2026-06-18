import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '@sms/core/config';
import { TokenStorageService } from '@sms/core/auth';
import { portalKeyToPortalType } from '@sms/shared/models';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRippleModule } from '@angular/material/core';
import { ChatService } from './chat.service';
import { PresenceService } from './presence.service';
import { RealtimeService } from './realtime.service';
import { ChatConversationListComponent } from './chat-conversation-list.component';
import { ChatMessageAreaComponent } from './chat-message-area.component';
import { RecipientGroup } from './communication.models';

interface UserItem {
  id: number;
  name: string;
  role: string;
}

const ROLE_FOR_GROUP: Record<string, string> = {
  ALL: 'all',
  TEACHING_STAFF: 'teaching_staff',
  NON_TEACHING_STAFF: 'non_teaching_staff',
  STUDENTS: 'students',
  PARENTS: 'parents',
};

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
          <label class="panel-label">Select a group to browse members</label>
          <div class="group-list">
          @for (group of groups(); track group.type) {
            <button
              class="group-btn"
              [class.selected]="selectedGroupType() === group.type"
              (click)="loadGroupMembers(group.type)"
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

          @if (selectedGroupType()) {
            <div class="divider"></div>

            <label class="panel-label">{{ selectedGroupLabel() }} members</label>

            <div class="user-search">
              <mat-icon class="user-search-icon">search</mat-icon>
              <input
                type="text"
                [ngModel]="localSearch()"
                (ngModelChange)="localSearch.set($event)"
                placeholder="Filter by name..."
                class="user-search-input"
              />
            </div>

            @if (groupMembersLoading()) {
              <div class="loading-groups">
                <mat-spinner diameter="20" />
                <span>Loading members...</span>
              </div>
            }

            @if (filteredMembers().length > 0) {
              <div class="member-list">
                @for (user of filteredMembers(); track user.id) {
                  <button
                    class="user-result"
                    [class.selected]="selectedUserIds().includes(user.id)"
                    (click)="toggleUser(user)"
                    matRipple
                  >
                    <mat-icon class="check-icon">
                      {{ selectedUserIds().includes(user.id) ? 'check_box' : 'check_box_outline_blank' }}
                    </mat-icon>
                    <div class="user-result-avatar">{{ user.name.charAt(0) }}</div>
                    <div class="user-result-info">
                      <span class="user-result-name">{{ user.name }}</span>
                      <span class="user-result-role">{{ user.role }}</span>
                    </div>
                  </button>
                }
              </div>
            } @else if (!groupMembersLoading() && selectedGroupType()) {
              <div class="empty-members">
                <mat-icon>people_outline</mat-icon>
                <p>No members match this filter</p>
              </div>
            }
          }

          @if (!selectedGroupType()) {
            <div class="divider">
              <span>OR</span>
            </div>

            <label class="panel-label">Search all users</label>
            <div class="user-search">
              <mat-icon class="user-search-icon">search</mat-icon>
              <input
                type="text"
                [ngModel]="globalSearchQuery()"
                (ngModelChange)="globalSearchQuery.set($event); searchAllUsers()"
                placeholder="Search by name or ID..."
                class="user-search-input"
              />
            </div>
            @if (globalSearchResults().length > 0) {
              <div class="member-list">
                @for (user of globalSearchResults(); track user.id) {
                  <button
                    class="user-result"
                    [class.selected]="selectedUserIds().includes(user.id)"
                    (click)="toggleUser(user)"
                    matRipple
                  >
                    <mat-icon class="check-icon">
                      {{ selectedUserIds().includes(user.id) ? 'check_box' : 'check_box_outline_blank' }}
                    </mat-icon>
                    <div class="user-result-avatar">{{ user.name.charAt(0) }}</div>
                    <div class="user-result-info">
                      <span class="user-result-name">{{ user.name }}</span>
                      <span class="user-result-role">{{ user.role }}</span>
                    </div>
                  </button>
                }
              </div>
            }
          }
        </div>

        <div class="panel-footer">
          <div class="panel-footer-left">
            @if (selectedUserIds().length > 0) {
              <span class="selection-count">{{ selectedUserIds().length }} user(s) selected</span>
            }
          </div>
          <div class="panel-footer-right">
            <button mat-stroked-button (click)="closeNewMessage()">Cancel</button>
            <button
              mat-flat-button
              color="primary"
              [disabled]="selectedUserIds().length === 0"
              (click)="createConversation()"
            >
              Start Conversation
            </button>
          </div>
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
    .new-msg-panel { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 520px; max-height: 85vh; background: #fff; border-radius: 16px; z-index: 1001; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    .panel-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #e2e8f0; flex-shrink: 0; }
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
    .divider { display: flex; align-items: center; gap: 12px; margin: 16px 0; }
    .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: #e2e8f0; }
    .divider span { font-size: 12px; color: #94a3b8; font-weight: 500; }
    .user-search { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 8px; }
    .user-search-icon { font-size: 20px; width: 20px; height: 20px; color: #94a3b8; }
    .user-search-input { border: none; outline: none; flex: 1; font-size: 14px; font-family: inherit; background: transparent; color: #1e293b; }
    .member-list { display: flex; flex-direction: column; gap: 6px; max-height: 320px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 6px 0; }
    .user-result { display: flex; align-items: center; gap: 12px; padding: 12px 16px; cursor: pointer; border: none; background: none; width: 100%; text-align: left; font-family: inherit; transition: background 0.15s; min-height: 48px; }
    .user-result:hover { background: #f1f5f9; }
    .user-result.selected { background: #eff6ff; }
    .check-icon { font-size: 22px; width: 22px; height: 22px; color: #94a3b8; flex-shrink: 0; }
    .user-result.selected .check-icon { color: #2563eb; }
    .user-result-avatar { width: 36px; height: 36px; border-radius: 50%; background: #3b82f6; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 600; flex-shrink: 0; }
    .user-result-info { display: flex; flex-direction: column; gap: 2px; }
    .user-result-name { font-size: 14px; font-weight: 600; color: #1e293b; }
    .user-result-role { font-size: 13px; color: #64748b; text-transform: capitalize; }
    .empty-members { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 24px; color: #94a3b8; }
    .empty-members mat-icon { font-size: 32px; width: 32px; height: 32px; }
    .panel-footer { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-top: 1px solid #e2e8f0; flex-shrink: 0; }
    .panel-footer-left { flex: 1; }
    .selection-count { font-size: 13px; color: #2563eb; font-weight: 500; }
    .panel-footer-right { display: flex; gap: 8px; }
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
  readonly selectedGroupType = signal<string | null>(null);
  readonly groupMembers = signal<UserItem[]>([]);
  readonly groupMembersLoading = signal(false);
  readonly localSearch = signal('');
  readonly selectedUserIds = signal<number[]>([]);

  readonly globalSearchQuery = signal('');
  readonly globalSearchResults = signal<UserItem[]>([]);

  readonly selectedGroupLabel = computed(() => {
    const type = this.selectedGroupType();
    if (!type) return '';
    return this.groups().find(g => g.type === type)?.label || type;
  });

  readonly filteredMembers = computed(() => {
    const q = this.localSearch().toLowerCase().trim();
    const members = this.groupMembers();
    if (!q) return members;
    return members.filter(m => m.name.toLowerCase().includes(q));
  });

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    const portalKey = this.tokenStorage.getUserContext()?.portalKey;
    const role = portalKey ? portalKeyToPortalType(portalKey) : null;
    if (role === 'ADMIN' || role === 'STAFF') {
      this.canBroadcast.set(true);
      this.fetchGroups();
    }
    this.chatService.fetchConversations().subscribe();
    this.chatService.startRefreshPump();
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

  loadGroupMembers(type: string): void {
    this.selectedGroupType.set(type);
    this.localSearch.set('');
    this.globalSearchQuery.set('');
    this.globalSearchResults.set([]);
    this.groupMembersLoading.set(true);

    const roleParam = ROLE_FOR_GROUP[type];
    const params: Record<string, string> = {};
    if (roleParam && roleParam !== 'all') {
      params['role'] = roleParam;
    }

    this.http.get<UserItem[]>(`${this.baseUrl}/users/`, { params }).subscribe({
      next: (res) => {
        this.groupMembers.set(res);
        this.groupMembersLoading.set(false);
      },
      error: () => {
        this.groupMembers.set([]);
        this.groupMembersLoading.set(false);
      },
    });
  }

  toggleUser(user: UserItem): void {
    this.selectedUserIds.update((ids) => {
      if (ids.includes(user.id)) {
        return ids.filter(id => id !== user.id);
      }
      return [...ids, user.id];
    });
  }

  searchAllUsers(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    const q = this.globalSearchQuery().trim();
    if (q.length < 2) { this.globalSearchResults.set([]); return; }
    this.searchTimer = setTimeout(() => {
      this.http.get<UserItem[]>(
        `${this.baseUrl}/users/`, { params: { name: q } },
      ).subscribe((res) => this.globalSearchResults.set(res));
    }, 300);
  }

  createConversation(): void {
    const userIds = this.selectedUserIds();
    if (userIds.length === 0) return;

    const payload: Record<string, unknown> = {
      recipient_ids: userIds,
    };

    this.chatService.createConversation(payload).subscribe({
      next: (conv) => {
        this.chatService.selectConversation(conv.id);
        this.closeNewMessage();
      },
    });
  }

  closeNewMessage(): void {
    this.showNewMessage.set(false);
    this.selectedGroupType.set(null);
    this.groupMembers.set([]);
    this.localSearch.set('');
    this.selectedUserIds.set([]);
    this.globalSearchQuery.set('');
    this.globalSearchResults.set([]);
  }
}
