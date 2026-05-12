import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-communication-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatTabsModule,
    MatIconModule,
  ],
  template: `
    <div class="comm-layout-container">
      <nav class="sub-navigation" aria-label="Communication section navigation">
        <a routerLink="dashboard"     routerLinkActive="active" class="nav-link"><mat-icon>dashboard</mat-icon>Dashboard</a>
        <a routerLink="broadcasts"    routerLinkActive="active" class="nav-link"><mat-icon>campaign</mat-icon>Broadcasts</a>
        <a routerLink="conversations" routerLinkActive="active" class="nav-link"><mat-icon>chat</mat-icon>Conversations</a>
        <a routerLink="engagement"    routerLinkActive="active" class="nav-link"><mat-icon>trending_up</mat-icon>Engagement</a>
        <a routerLink="meetings"      routerLinkActive="active" class="nav-link"><mat-icon>groups</mat-icon>Meetings</a>
        <a routerLink="support"       routerLinkActive="active" class="nav-link"><mat-icon>support_agent</mat-icon>Support</a>
        <a routerLink="analytics"     routerLinkActive="active" class="nav-link"><mat-icon>analytics</mat-icon>Analytics</a>
        <a routerLink="settings"      routerLinkActive="active" class="nav-link"><mat-icon>settings</mat-icon>Settings</a>
      </nav>

      <div class="outlet-wrapper">
        <router-outlet />
      </div>
    </div>
  `,
  styles: [`
    .comm-layout-container { display: flex; flex-direction: column; height: 100%; }

    .sub-navigation {
      display: flex;
      align-items: center;
      gap: 2px;
      padding: 8px 24px;
      background: #ffffff;
      border-bottom: 1px solid #e5e7eb;
      overflow-x: auto;
      flex-shrink: 0;
    }

    .nav-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 500;
      color: #6b7280;
      text-decoration: none;
      white-space: nowrap;
      transition: all 0.2s ease;
    }
    .nav-link:hover { background: #f3f4f6; color: #374151; }
    .nav-link.active { background: #eff6ff; color: #2563eb; font-weight: 600; }
    .nav-link mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .outlet-wrapper { flex: 1; overflow-y: auto; background: #f9fafb; }
  `],
})
export class CommunicationLayoutComponent {}
