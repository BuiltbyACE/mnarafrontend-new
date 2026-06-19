/**
 * Admin Layout Component
 * Main layout shell with sidebar, header, and content area
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar';
import { AdminHeaderComponent } from '../admin-header/admin-header';
import { WebSocketFleetService } from '../../core/services/websocket-fleet.service';
import { PrincipalDashboardService } from '../../features/dashboard/services/principal-dashboard.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatSidenavModule,
    AdminSidebarComponent,
    AdminHeaderComponent,
  ],
  template: `
    <div class="admin-layout">
      <!-- Sidebar -->
      <aside class="sidebar" [class.collapsed]="sidebarCollapsed()">
        <app-admin-sidebar
          [pendingApprovals]="pendingApprovalsCount()"
          [collapsed]="sidebarCollapsed()"
          (collapseToggle)="toggleSidebar()"
        ></app-admin-sidebar>
      </aside>

      <!-- Main Content Area -->
      <div class="main-area" [class.collapsed]="sidebarCollapsed()">
        <!-- Header -->
        <app-admin-header
          [notificationCount]="pendingApprovalsCount()"
          (toggleSidebar)="toggleSidebar()"
        ></app-admin-header>

        <!-- Content -->
        <main class="content">
          <router-outlet></router-outlet>
        </main>

        <!-- Wave Footer -->
        <div class="wave-footer">
          <svg class="wave-svg" viewBox="0 0 1440 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path fill="#1e3a5f" d="M0,60 C180,0 360,120 540,60 C720,0 900,120 1080,60 C1260,0 1380,80 1440,60 L1440,120 L0,120 Z"/>
          </svg>
          <div class="footer-band">
            <div class="footer-left">
              <span>© 2024 SafariStack Solutions. All rights reserved.</span>
            </div>
            <div class="footer-right">
              <span>Version 1.0.0</span>
              <span class="code-brackets">&lt;/&gt;</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-layout {
      display: flex;
      height: 100vh;
      overflow: hidden;
      background: linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%);
      font-family: 'Inter', system-ui, sans-serif;
    }

    .sidebar {
      width: 260px;
      flex-shrink: 0;
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      z-index: 50;
      transition: width 0.2s ease;
    }

    .sidebar.collapsed {
      width: 76px;
    }

    .main-area {
      flex: 1;
      margin-left: 260px;
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow-y: auto;
      transition: margin-left 0.2s ease;
    }

    .main-area.collapsed {
      margin-left: 76px;
    }

    .content {
      flex: 1 0 auto;
      padding: 32px 32px 0 32px;
    }

    /* Wave Footer */
    .wave-footer {
      position: relative;
      height: 100px;
      width: 100%;
      flex-shrink: 0;
      margin-top: auto;
    }
    .wave-svg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: block;
    }
    .footer-band {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 50px;
      background: #1e3a5f;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 32px;
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.75rem;
      font-family: 'Inter', sans-serif;
    }

    .footer-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .code-brackets {
      font-weight: 700;
      color: white;
      letter-spacing: 1px;
    }

    // Responsive
    @media (max-width: 1024px) {
      .sidebar:not(.collapsed) {
        width: 240px;
      }
      .main-area:not(.collapsed) {
        margin-left: 240px;
      }
    }

    @media (max-width: 768px) {
      .sidebar {
        transform: translateX(-100%);
        transition: transform 0.3s;
      }
      .main-area {
        margin-left: 0;
      }
      .content {
        padding: 1.5rem;
      }
      .footer-band {
        padding: 0 1.5rem;
      }
    }
  `],
})
export class AdminLayoutComponent implements OnInit {
  private fleetService = inject(WebSocketFleetService);
  private dashboardService = inject(PrincipalDashboardService);

  readonly sidebarCollapsed = signal(false);
  readonly pendingApprovalsCount = signal(0);

  constructor() {
    this.fleetService.connect();
  }

  ngOnInit(): void {
    this.dashboardService.getPrincipalSummary().subscribe({
      next: (data) => this.pendingApprovalsCount.set(data.pendingApprovals?.length ?? 0),
      error: () => this.pendingApprovalsCount.set(0),
    });
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update((v) => !v);
  }
}
