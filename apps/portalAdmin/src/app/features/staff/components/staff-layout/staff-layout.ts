import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-staff-layout',
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
    <div class="staff-layout-container">
      <nav class="sub-navigation" aria-label="Staff section navigation">
        <a
          routerLink="directory"
          routerLinkActive="active"
          class="nav-link"
          [class.active]="isActive('directory')">
          <mat-icon>group</mat-icon>
          <span>All Staff Directory</span>
        </a>
        <a
          routerLink="leave"
          routerLinkActive="active"
          class="nav-link"
          [class.active]="isActive('leave')">
          <mat-icon>event_note</mat-icon>
          <span>Leave & Time Off</span>
        </a>
        <a
          routerLink="payroll"
          routerLinkActive="active"
          class="nav-link"
          [class.active]="isActive('payroll')">
          <mat-icon>payments</mat-icon>
          <span>Payroll Summary</span>
        </a>
      </nav>

      <div class="outlet-wrapper">
        <router-outlet />
      </div>
    </div>
  `,
  styles: [`
    .staff-layout-container {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .sub-navigation {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px 24px;
      background: #ffffff;
      border-bottom: 1px solid #e5e7eb;
      flex-shrink: 0;
    }

    .nav-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      color: #6b7280;
      text-decoration: none;
      transition: all 0.2s ease;

      &:hover {
        background: #f3f4f6;
        color: #374151;
      }

      &.active {
        background: #eff6ff;
        color: #2563eb;
        font-weight: 600;
      }

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .outlet-wrapper {
      flex: 1;
      overflow-y: auto;
      background: #f9fafb;
    }
  `],
})
export class StaffLayoutComponent {
  isActive(segment: string): boolean {
    return window.location.pathname.includes(`/staff/${segment}`);
  }
}
