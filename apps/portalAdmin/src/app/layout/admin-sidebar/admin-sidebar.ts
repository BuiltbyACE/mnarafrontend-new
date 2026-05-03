/**
 * Admin Sidebar Component
 * Replicated exactly from reference UI
 */

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

interface NavItem {
  name: string;
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatListModule,
    MatIconModule,
  ],
  template: `
    <div class="sidebar-container">
      <!-- Logo Section -->
      <div class="logo-section">
        <div class="logo-group">
          <div class="logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L22 7V17L12 22L2 17V7L12 2Z" fill="white" fill-opacity="0.2"/>
              <path d="M7 10L12 13L17 10V15H7V10Z" fill="white"/>
            </svg>
          </div>
          <span class="logo-text">Mnara ERP</span>
        </div>
        <div class="collapse-btn">
          <mat-icon>chevron_right</mat-icon>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="nav-section">
        <div class="nav-list">
          <a 
            class="nav-item"
            *ngFor="let item of navItems" 
            [routerLink]="item.route"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: item.route === '/portalAdmin' }"
          >
            <div class="nav-item-left">
              <mat-icon class="nav-icon">{{ item.icon }}</mat-icon>
              <span class="nav-label">{{ item.label }}</span>
            </div>
            <mat-icon *ngIf="item.name !== 'dashboard'" class="nav-chevron">chevron_right</mat-icon>
          </a>
        </div>
      </nav>

      <!-- Upgrade Card -->
      <div class="upgrade-card-wrapper">
        <div class="upgrade-card">
          <div class="upgrade-icon">
            <mat-icon>campaign</mat-icon>
          </div>
          <h4 class="upgrade-title">Upgrade to<br>Premium</h4>
          <p class="upgrade-sub">Unlock advanced features</p>
          <button class="upgrade-btn">Upgrade Now</button>
        </div>
      </div>

      <!-- Dark Mode Toggle -->
      <div class="dark-mode-toggle">
        <div class="toggle-left">
          <mat-icon>dark_mode</mat-icon>
          <span>Dark Mode</span>
        </div>
        <mat-icon>chevron_right</mat-icon>
      </div>
    </div>
  `,
  styles: [`
    .sidebar-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #2563EB; /* Bright royal blue */
      color: white;
      font-family: 'Inter', sans-serif;
    }

    .logo-section {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24px 20px 24px 24px;
    }

    .logo-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-icon {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .logo-text {
      font-size: 1.125rem;
      font-weight: 600;
      color: white;
      letter-spacing: -0.01em;
    }

    .collapse-btn {
      width: 24px;
      height: 24px;
      background: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      
      mat-icon {
        color: #2563EB;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .nav-section {
      flex: 1;
      overflow-y: auto;
      padding: 8px 16px;
      
      /* Hide scrollbar for a cleaner look */
      &::-webkit-scrollbar {
        width: 0px;
        background: transparent;
      }
    }

    .nav-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      border-radius: 12px;
      color: white;
      text-decoration: none;
      transition: all 0.2s ease;
      cursor: pointer;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      &.active {
        background: white;
        color: #2563EB;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

        .nav-icon {
          color: #2563EB;
        }
      }
    }

    .nav-item-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .nav-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: rgba(255, 255, 255, 0.9);
    }

    .nav-label {
      font-size: 0.875rem;
      font-weight: 500;
    }

    .nav-chevron {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: rgba(255, 255, 255, 0.6);
    }

    /* Upgrade Card */
    .upgrade-card-wrapper {
      padding: 16px;
      margin-top: 8px;
    }

    .upgrade-card {
      background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      padding: 20px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }

    .upgrade-icon {
      width: 48px;
      height: 48px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 12px;
      
      mat-icon {
        color: white;
      }
    }

    .upgrade-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: white;
      margin: 0 0 4px;
      line-height: 1.3;
    }

    .upgrade-sub {
      font-size: 0.6875rem;
      color: rgba(255, 255, 255, 0.7);
      margin: 0 0 16px;
    }

    .upgrade-btn {
      width: 100%;
      padding: 10px 0;
      background: white;
      color: #2563EB;
      border: none;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 600;
      font-family: 'Inter', sans-serif;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: background 0.2s;

      &:hover {
        background: #f8fafc;
      }
    }

    /* Dark Mode Toggle */
    .dark-mode-toggle {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px 24px;
      color: rgba(255, 255, 255, 0.8);
      cursor: pointer;
      transition: color 0.2s;

      &:hover {
        color: white;
      }

      .toggle-left {
        display: flex;
        align-items: center;
        gap: 12px;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }

        span {
          font-size: 0.875rem;
          font-weight: 500;
        }
      }

      > mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }
  `],
})
export class AdminSidebarComponent {
  @Input() pendingApprovals = 0;

  readonly navItems: NavItem[] = [
    { name: 'dashboard', label: 'Dashboard', icon: 'home', route: '/portalAdmin' },
    { name: 'academics', label: 'Academics', icon: 'school', route: '/portalAdmin/academics' },
    { name: 'students', label: 'Students', icon: 'group', route: '/portalAdmin/students' },
    { name: 'staff', label: 'Staff & HR', icon: 'person_outline', route: '/portalAdmin/staff' },
    { name: 'finance', label: 'Finance', icon: 'account_balance', route: '/portalAdmin/finance' },
    { name: 'examinations', label: 'Examinations', icon: 'description', route: '/portalAdmin/examinations' },
    { name: 'attendance', label: 'Attendance', icon: 'event_available', route: '/portalAdmin/attendance' },
    { name: 'transport', label: 'Transport', icon: 'directions_bus', route: '/portalAdmin/transport' },
    { name: 'communication', label: 'Communication', icon: 'chat', route: '/portalAdmin/communication' },
    { name: 'library', label: 'Library', icon: 'menu_book', route: '/portalAdmin/library' },
    { name: 'reports', label: 'Reports & Analytics', icon: 'bar_chart', route: '/portalAdmin/reports' },
    { name: 'rbac', label: 'System Access', icon: 'security', route: '/portalAdmin/rbac' },
    { name: 'settings', label: 'Settings', icon: 'settings', route: '/portalAdmin/settings' },
  ];
}
