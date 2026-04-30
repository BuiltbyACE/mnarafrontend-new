/**
 * Admin Sidebar Component
 * Navigation menu for all 6 admin modules
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
  badge?: number;
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
      <!-- Logo -->
      <div class="logo-section">
        <div class="logo-icon">
          <mat-icon>school</mat-icon>
        </div>
        <span class="logo-text">Mnara ERP</span>
      </div>

      <!-- Navigation -->
      <nav class="nav-section">
        <mat-nav-list>
          <a 
            mat-list-item 
            *ngFor="let item of navItems" 
            [routerLink]="item.route"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: item.route === '/admin' }"
          >
            <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
            <span matListItemTitle>{{ item.label }}</span>
            <span matListItemMeta *ngIf="item.badge" class="nav-badge">{{ item.badge }}</span>
          </a>
        </mat-nav-list>
      </nav>

      <!-- Footer -->
      <div class="sidebar-footer">
        <div class="godmode-indicator">
          <mat-icon>security</mat-icon>
          <span>GodMode Active</span>
        </div>
        <p class="version">v1.0.0</p>
      </div>
    </div>
  `,
  styles: [`
    .sidebar-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #1D4ED8; /* Royal blue background to match the wave footer */
      color: white;
      font-family: 'Inter', sans-serif;
    }

    .logo-section {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 24px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .logo-icon {
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        color: white;
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
    }

    .logo-text {
      font-size: 1.125rem;
      font-weight: 700;
      color: white;
      letter-spacing: -0.01em;
    }

    .nav-section {
      flex: 1;
      padding: 16px 0;
      overflow-y: auto;
    }

    mat-nav-list {
      padding: 0 12px;
    }

    mat-list-item {
      margin-bottom: 4px;
      border-radius: 8px;
      color: rgba(255, 255, 255, 0.75) !important;
      font-weight: 500;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.08) !important;
        color: white !important;
      }

      &.active {
        background: rgba(255, 255, 255, 0.12) !important;
        color: white !important;
        border-left: 3px solid #3b82f6;
      }

      mat-icon {
        color: inherit;
        margin-right: 12px;
      }
    }

    .nav-badge {
      background: #ef4444;
      color: white;
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 10px;
      font-weight: 600;
    }

    .sidebar-footer {
      padding: 16px 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    .godmode-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #fbbf24;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 8px;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }

    .version {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.4);
      margin: 0;
    }
  `],
})
export class AdminSidebarComponent {
  @Input() pendingApprovals = 0;

  readonly navItems: NavItem[] = [
    { name: 'dashboard', label: 'Dashboard', icon: 'dashboard', route: '/admin' },
    { name: 'academics', label: 'Academics', icon: 'school', route: '/admin/academics' },
    { name: 'staff', label: 'Staff & HR', icon: 'people', route: '/admin/staff' },
    { name: 'students', label: 'Students', icon: 'person_add', route: '/admin/students' },
    { name: 'finance', label: 'Finance', icon: 'account_balance', route: '/admin/finance', badge: this.pendingApprovals },
    { name: 'transport', label: 'Transport', icon: 'directions_bus', route: '/admin/transport' },
    { name: 'rbac', label: 'System Access', icon: 'security', route: '/admin/rbac' },
  ];
}
