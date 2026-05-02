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
            <path fill="#2563EB" d="M0,60 C180,0 360,120 540,60 C720,0 900,120 1080,60 C1260,0 1380,80 1440,60 L1440,120 L0,120 Z"/>
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
      background: #2563EB;
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

  readonly pendingApprovals = 0;

  constructor() {
    this.fleetService.connect();
  }
}
