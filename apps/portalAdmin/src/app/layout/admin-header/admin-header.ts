/**
 * Admin Header Component
 * Top navigation bar with user info and notifications
 */

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
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
    MatBadgeModule,
  ],
  template: `
    <mat-toolbar class="admin-header">
      <span class="portal-title">Admin Portal</span>
      
      <span class="spacer"></span>
      
      <!-- Notifications -->
      <button mat-icon-button [matBadge]="alertCount()" matBadgeColor="warn" matBadgeSize="small" [matBadgeHidden]="alertCount() === 0">
        <mat-icon>notifications</mat-icon>
      </button>
      
      <!-- User Menu -->
      <button mat-button [matMenuTriggerFor]="userMenu" class="user-button">
        <mat-icon>account_circle</mat-icon>
        <span class="user-name">{{ fullName() }}</span>
        <mat-icon>expand_more</mat-icon>
      </button>
      
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
    </mat-toolbar>
  `,
  styles: [`
    .admin-header {
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(12px);
      border-bottom: none;
      box-shadow: 0 2px 10px rgba(15, 37, 96, 0.05);
      padding: 0 2rem;
      height: 72px;
      position: sticky;
      top: 0;
      z-index: 100;
      font-family: 'Inter', sans-serif;
    }

    .portal-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #0F2560;
      letter-spacing: -0.01em;
    }

    .spacer {
      flex: 1 1 auto;
    }

    .user-button {
      margin-left: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      border-radius: 8px;
    }

    .user-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    mat-icon {
      color: #6b7280;
    }
  `],
})
export class AdminHeaderComponent {
  private authStore = inject(AuthStore);
  private router = inject(Router);

  readonly fullName = this.authStore.fullName;
  readonly alertCount = () => 0; // TODO: Connect to alerts service

  goToProfile(): void {
    // Navigate to profile page
  }

  logout(): void {
    this.authStore.logout();
    this.router.navigate(['/login']);
  }
}
