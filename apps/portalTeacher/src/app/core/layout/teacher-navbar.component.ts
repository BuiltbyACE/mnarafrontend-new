import { Component, computed, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { AuthStore } from '@sms/core/auth';
import { TeacherAssignmentService } from '../services/teacher-assignment.service';
import { RealtimeService } from '../services/realtime.service';

@Component({
  selector: 'app-teacher-navbar',
  imports: [MatIconModule, MatMenuModule, MatDividerModule, MatButtonModule],
  template: `
    <header class="navbar">
      <div class="navbar-left">
        <span class="greeting">{{ greeting() }}</span>
      </div>
      <div class="navbar-right">
        <button class="icon-btn" aria-label="Search" (click)="focusSearch()">
          <mat-icon>search</mat-icon>
          <span class="shortcut-hint">Ctrl+K</span>
        </button>
        <button class="icon-btn" aria-label="Notifications" [matMenuTriggerFor]="notifMenu">
          <mat-icon>notifications</mat-icon>
          @if (unreadCount() > 0) {
            <span class="badge">{{ unreadCount() }}</span>
          }
        </button>
        <button class="icon-btn" aria-label="Messages">
          <mat-icon>chat</mat-icon>
          <span class="badge badge-green">2</span>
        </button>
        <div class="ws-indicator" [title]="realtime.isConnected() ? 'Connected' : 'Disconnected'">
          <span class="ws-dot" [class.online]="realtime.isConnected()"></span>
        </div>
        <div class="divider"></div>
        <div class="theme-toggle">
          <mat-icon class="theme-icon">light_mode</mat-icon>
          <span class="toggle-track" (click)="toggleTheme()"></span>
          <mat-icon class="theme-icon">dark_mode</mat-icon>
        </div>
        <div class="divider"></div>
        <button class="user-block" [matMenuTriggerFor]="userMenu">
          @if (authStore.avatarUrl(); as avatarUrl) {
            <img [src]="avatarUrl" class="avatar-img" alt="" />
          }
          @if (!authStore.avatarUrl()) {
            <div class="avatar">{{ initials() }}</div>
          }
          <div class="user-info">
            <span class="user-name">{{ fullName() }}</span>
            <span class="user-meta">{{ roleName() }}</span>
          </div>
          <mat-icon class="chevron">expand_more</mat-icon>
        </button>

        <mat-menu #userMenu="matMenu" class="teacher-menu" xPosition="before">
          <div class="menu-header">
            @if (authStore.avatarUrl(); as avatarUrl) {
              <img [src]="avatarUrl" class="menu-avatar-img" alt="" />
            }
            @if (!authStore.avatarUrl()) {
              <div class="menu-avatar">{{ initials() }}</div>
            }
            <div class="menu-details">
              <span class="menu-name">{{ fullName() }}</span>
              <span class="menu-id">{{ identifier() }}</span>
              <span class="menu-email">{{ email() }}</span>
            </div>
          </div>
          <mat-divider />
          <button mat-menu-item (click)="goToProfile()"><mat-icon>person</mat-icon> My Profile</button>
          <button mat-menu-item (click)="changePassword()"><mat-icon>lock</mat-icon> Change Password</button>
          <button mat-menu-item (click)="goToSettings()"><mat-icon>settings</mat-icon> Settings</button>
          <mat-divider />
          <button mat-menu-item (click)="logout()"><mat-icon>logout</mat-icon> Logout</button>
        </mat-menu>

        <mat-menu #notifMenu="matMenu" class="teacher-menu" xPosition="before">
          <div style="padding: 12px 16px; font-weight: 600; font-size: 0.875rem;">Notifications</div>
          <mat-divider />
          @for (n of recentNotifications(); track n.id) {
            <button mat-menu-item>
              <div style="display:flex;flex-direction:column;gap:2px;padding:4px 0;">
                <span style="font-size:0.8125rem;font-weight:500;">{{ n.content }}</span>
                <span style="font-size:0.6875rem;color:#64748b;">{{ n.time }}</span>
              </div>
            </button>
          }
          @empty {
            <button mat-menu-item disabled>
              <span style="font-size:0.8125rem;color:#94a3b8;padding:4px 0;">No new notifications</span>
            </button>
          }
        </mat-menu>
      </div>
    </header>
  `,
  styles: [`
    :host { display: block; }
    .navbar {
      display: flex; align-items: center; justify-content: space-between;
      height: 64px; padding: 0 24px;
      background: white; border-bottom: 1px solid #e2e8f0;
      flex-shrink: 0; font-family: 'Inter', sans-serif;
      position: sticky; top: 0; z-index: 40;
    }
    .navbar-left { display: flex; align-items: center; gap: 12px; }
    .greeting { font-size: 0.9375rem; font-weight: 600; color: #1e293b; }
    .navbar-right { display: flex; align-items: center; gap: 8px; }
    .icon-btn {
      position: relative; display: flex; align-items: center; gap: 6px;
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;
      padding: 8px 12px; cursor: pointer; color: #64748b;
      transition: all 0.15s ease; font-family: 'Inter', sans-serif;
    }
    .icon-btn:hover { background: #eff6ff; border-color: #2563eb; color: #2563eb; }
    .icon-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .shortcut-hint {
      font-size: 0.6875rem; color: #94a3b8; background: #f1f5f9;
      padding: 1px 5px; border-radius: 4px; font-weight: 500;
    }
    .badge {
      position: absolute; top: 4px; right: 4px;
      min-width: 16px; height: 16px; padding: 0 4px;
      border-radius: 8px; background: #ef4444; color: white;
      font-size: 0.625rem; font-weight: 700; display: flex;
      align-items: center; justify-content: center;
    }
    .badge-green { background: #10b981; }
    .divider { width: 1px; height: 28px; background: #e2e8f0; margin: 0 4px; }
    .ws-indicator { display: flex; align-items: center; padding: 0 4px; }
    .ws-dot { width: 8px; height: 8px; border-radius: 50%; background: #ef4444; transition: background .3s; }
    .ws-dot.online { background: #10b981; }
    .theme-toggle { display: flex; align-items: center; gap: 6px; cursor: pointer; }
    .theme-icon { font-size: 18px; width: 18px; height: 18px; color: #94a3b8; }
    .toggle-track { width: 32px; height: 18px; border-radius: 10px; background: #e2e8f0; position: relative; cursor: pointer; transition: background .2s; }
    .toggle-track.dark { background: #475569; }
    .user-block {
      display: flex; align-items: center; gap: 10px;
      padding: 6px 10px; border-radius: 8px; border: none;
      background: transparent; cursor: pointer; font-family: 'Inter', sans-serif;
      transition: background 0.15s ease;
    }
    .user-block:hover { background: #f1f5f9; }
    .avatar-img {
      width: 36px; height: 36px; border-radius: 50%; object-fit: cover;
    }
    .avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: white; display: flex; align-items: center; justify-content: center;
      font-size: 0.8125rem; font-weight: 700; flex-shrink: 0;
    }
    .user-info { display: flex; flex-direction: column; align-items: flex-start; }
    .user-name { font-size: 0.875rem; font-weight: 600; color: #1e293b; }
    .user-meta { font-size: 0.6875rem; color: #64748b; }
    .chevron { font-size: 18px; width: 18px; height: 18px; color: #94a3b8; }
    .menu-header {
      display: flex; align-items: center; gap: 12px; padding: 16px;
    }
    .menu-avatar-img {
      width: 40px; height: 40px; border-radius: 50%; object-fit: cover;
    }
    .menu-avatar {
      width: 40px; height: 40px; border-radius: 50%;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: white; display: flex; align-items: center; justify-content: center;
      font-size: 0.9375rem; font-weight: 700;
    }
    .menu-details { display: flex; flex-direction: column; }
    .menu-name { font-size: 0.875rem; font-weight: 600; color: #0f172a; }
    .menu-id { font-size: 0.75rem; color: #64748b; }
    .menu-email { font-size: 0.6875rem; color: #94a3b8; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherNavbarComponent implements OnInit {
  private router = inject(Router);
  readonly authStore = inject(AuthStore);
  private assignmentService = inject(TeacherAssignmentService);
  readonly realtime = inject(RealtimeService);
  readonly unreadCount = this.assignmentService.unreadCount;

  readonly recentNotifications = signal<{ id: string; content: string; time: string }[]>([]);

  ngOnInit(): void {
    this.authStore.restoreFromStorage();
    this.assignmentService.fetchUnreadCount();
    this.realtime.connect();

    this.realtime.newMessages$.subscribe(msg => {
      this.recentNotifications.update(list => [
        { id: msg.id, content: `New message from ${msg.sender_name}`, time: 'Just now' },
        ...list.slice(0, 4),
      ]);
    });

    this.realtime.announcements$.subscribe(msg => {
      this.recentNotifications.update(list => [
        { id: msg.id, content: `Announcement: ${msg.title}`, time: 'Just now' },
        ...list.slice(0, 4),
      ]);
    });

    this.realtime.broadcasts$.subscribe(msg => {
      this.recentNotifications.update(list => [
        { id: msg.id, content: `Broadcast: ${msg.title}`, time: 'Just now' },
        ...list.slice(0, 4),
      ]);
    });
  }

  toggleTheme(): void {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    html.setAttribute('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem('mnara-theme', isDark ? 'light' : 'dark');
  }

  readonly fullName = this.authStore.fullName;
  readonly identifier = this.authStore.identifier;
  readonly roleName = this.authStore.roleName;
  readonly email = computed(() => this.authStore.user()?.user?.email ?? '');
  readonly initials = computed(() =>
    this.fullName().split(' ').filter(n => n.length > 0).map(n => n[0]).join('').toUpperCase()
  );
  readonly firstName = computed(() =>
    this.fullName().split(' ').filter(n => n.length > 0)[0] || 'there'
  );
  readonly greeting = computed(() => {
    const h = new Date().getHours();
    if (h < 12) return `Good morning, ${this.firstName()}`;
    if (h < 17) return `Good afternoon, ${this.firstName()}`;
    return `Good evening, ${this.firstName()}`;
  });

  focusSearch() {}
  goToProfile() { this.router.navigate(['/teacher/settings']); }
  goToSettings() { this.router.navigate(['/teacher/settings']); }
  changePassword() {}
  logout() { this.authStore.logout(); this.router.navigate(['/login']); }
}
