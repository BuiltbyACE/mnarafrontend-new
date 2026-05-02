/**
 * Admin Header Component
 * Replicated exactly from reference UI
 */

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthStore } from '@sms/core/auth';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
  ],
  template: `
    <header class="admin-header">
      <div class="header-left">
        <span class="portal-title">Admin Portal</span>
      </div>
      
      <div class="header-center">
        <div class="search-bar">
          <mat-icon class="search-icon">search</mat-icon>
          <input type="text" placeholder="Search anything..." />
          <div class="search-shortcut">Ctrl + K</div>
        </div>
      </div>
      
      <div class="header-right">
        <!-- Notification -->
        <div class="notification-btn">
          <mat-icon>notifications_none</mat-icon>
          <div class="notification-badge">3</div>
        </div>
        
        <!-- Date Block -->
        <div class="date-block">
          <mat-icon class="date-icon">calendar_today</mat-icon>
          <div class="date-info">
            <span class="date-main">May 28, 2024</span>
            <span class="date-sub">Tuesday</span>
          </div>
        </div>
        
        <!-- User Profile -->
        <div class="user-block" [matMenuTriggerFor]="userMenu">
          <div class="user-avatar">
            <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Avatar" onerror="this.style.display='none'">
            <mat-icon *ngIf="false">person</mat-icon>
          </div>
          <div class="user-info">
            <span class="user-name">ADM-001</span>
            <span class="user-role">Super Admin</span>
          </div>
          <mat-icon class="user-chevron">expand_more</mat-icon>
        </div>
        
        <mat-menu #userMenu="matMenu">
          <button mat-menu-item (click)="goToProfile()">
            <mat-icon>person</mat-icon>
            <span>Profile</span>
          </button>
          <button mat-menu-item (click)="logout()">
            <mat-icon>logout</mat-icon>
            <span>Logout</span>
          </button>
        </mat-menu>
      </div>
    </header>
  `,
  styles: [`
    .admin-header {
      background: white;
      height: 72px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 32px;
      position: sticky;
      top: 0;
      z-index: 100;
      font-family: 'Inter', sans-serif;
    }

    .header-left {
      flex: 1;
      display: flex;
      align-items: center;
    }

    .portal-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: #1e293b;
      letter-spacing: -0.01em;
    }

    .header-center {
      flex: 2;
      display: flex;
      justify-content: center;
    }

    .search-bar {
      display: flex;
      align-items: center;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0 12px;
      width: 100%;
      max-width: 400px;
      height: 40px;
      transition: border-color 0.2s;

      &:focus-within {
        border-color: #2563EB;
        background: white;
      }

      .search-icon {
        color: #94a3b8;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      input {
        flex: 1;
        border: none;
        background: transparent;
        padding: 0 12px;
        font-family: 'Inter', sans-serif;
        font-size: 0.875rem;
        color: #334155;
        outline: none;

        &::placeholder {
          color: #94a3b8;
        }
      }

      .search-shortcut {
        font-size: 0.6875rem;
        color: #94a3b8;
        background: white;
        border: 1px solid #e2e8f0;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 500;
      }
    }

    .header-right {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 32px;
    }

    /* Notification Bell */
    .notification-btn {
      position: relative;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #64748b;
      transition: background 0.2s;

      &:hover {
        background: #f1f5f9;
        color: #334155;
      }

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .notification-badge {
        position: absolute;
        top: -4px;
        right: -4px;
        background: #2563EB;
        color: white;
        font-size: 10px;
        font-weight: 700;
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        border: 2px solid white;
      }
    }

    /* Date Block */
    .date-block {
      display: flex;
      align-items: center;
      gap: 12px;
      padding-right: 32px;
      border-right: 1px solid #e2e8f0;

      .date-icon {
        color: #94a3b8;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .date-info {
        display: flex;
        flex-direction: column;
        line-height: 1.2;
      }

      .date-main {
        font-size: 0.8125rem;
        font-weight: 600;
        color: #1e293b;
      }

      .date-sub {
        font-size: 0.6875rem;
        color: #64748b;
        margin-top: 2px;
      }
    }

    /* User Profile */
    .user-block {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;

      .user-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: #f1f5f9;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        mat-icon {
          color: #94a3b8;
        }
      }

      .user-info {
        display: flex;
        flex-direction: column;
        line-height: 1.2;
      }

      .user-name {
        font-size: 0.8125rem;
        font-weight: 600;
        color: #1e293b;
      }

      .user-role {
        font-size: 0.6875rem;
        color: #64748b;
        margin-top: 2px;
      }

      .user-chevron {
        color: #94a3b8;
        font-size: 18px;
        width: 18px;
        height: 18px;
        margin-left: 4px;
      }
    }
  `],
})
export class AdminHeaderComponent {
  private authStore = inject(AuthStore);
  private router = inject(Router);

  goToProfile(): void {
    // Navigate to profile page
  }

  logout(): void {
    this.authStore.logout();
    this.router.navigate(['/login']);
  }
}
