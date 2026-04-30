/**
 * Admin Layout Component
 * Main layout shell with sidebar, header, and content area
 */

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar';
import { AdminHeaderComponent } from '../admin-header/admin-header';
import { WebSocketFleetService } from '../../core/services/websocket-fleet.service';

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
      <aside class="sidebar">
        <app-admin-sidebar [pendingApprovals]="pendingApprovals"></app-admin-sidebar>
      </aside>

      <!-- Main Content Area -->
      <div class="main-area">
        <!-- Header -->
        <app-admin-header></app-admin-header>

        <!-- Content -->
        <main class="content">
          <router-outlet></router-outlet>
        </main>

        <!-- Wave Footer -->
        <div class="wave-footer">
          <svg class="wave-svg" viewBox="0 0 1440 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path fill="#1D4ED8" d="M0,60 C180,0 360,120 540,60 C720,0 900,120 1080,60 C1260,0 1380,80 1440,60 L1440,120 L0,120 Z"/>
          </svg>
          <div class="footer-band">
            <div class="footer-logo">
              <div class="logo-box"><span>&lt;/&gt;</span></div>
              <div class="footer-copy">
                <span>© 2026 SafariStack Solutions.</span>
                <span>All rights reserved.</span>
              </div>
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
      background: linear-gradient(135deg, #EBF3FD 0%, #F8FBFF 100%);
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
    }

    .main-area {
      flex: 1;
      margin-left: 260px;
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow-y: auto;
    }

    .content {
      flex: 1 0 auto;
      padding: 2rem 3rem;
    }

    /* Wave Footer */
    .wave-footer {
      position: relative;
      height: 140px;
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
      height: 70px;
      background: #1D4ED8;
      display: flex;
      align-items: center;
      padding: 0 3rem;
    }
    .footer-logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-box {
      width: 36px;
      height: 36px;
      border: 2px solid rgba(255, 255, 255, 0.5);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .logo-box span {
      font-size: 13px;
      font-weight: 700;
      color: white;
      font-family: 'Courier New', monospace;
      letter-spacing: -0.5px;
    }
    .footer-copy {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }
    .footer-copy span {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.85);
      font-family: 'Inter', sans-serif;
      line-height: 1.4;
    }

    // Responsive
    @media (max-width: 1024px) {
      .sidebar {
        width: 240px;
      }
      .main-area {
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
export class AdminLayoutComponent {
  private fleetService = inject(WebSocketFleetService);

  // TODO: Connect to actual pending approvals count
  readonly pendingApprovals = 0;

  constructor() {
    // Connect to fleet WebSocket when admin layout loads
    this.fleetService.connect();
  }
}
