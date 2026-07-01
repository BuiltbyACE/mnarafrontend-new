import { Component } from '@angular/core';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-monitoring-layout',
  standalone: true,
  imports: [RouterModule, RouterLink, RouterLinkActive, MatIconModule],
  template: `
    <div class="monitor-shell">
      <div class="sub-nav">
        <a class="sub-nav-item" routerLink="live" routerLinkActive="active"
           [routerLinkActiveOptions]="{exact:true}">
          <mat-icon>monitor_heart</mat-icon>
          Live Real-Time
        </a>
        <a class="sub-nav-item" routerLink="unassigned" routerLinkActive="active">
          <mat-icon>person_add</mat-icon>
          Unassigned Scans
          <span class="pending-badge" id="unassigned-badge"></span>
        </a>
      </div>
      <router-outlet />
    </div>
  `,
  styles: [`
    .monitor-shell {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background: #0b1120;
    }
    .sub-nav {
      display: flex;
      gap: 4px;
      padding: 12px 32px 0;
      background: #0b1120;
      border-bottom: 1px solid #1e293b;
    }
    .sub-nav-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 20px;
      font-size: 13px;
      font-weight: 600;
      color: #64748b;
      text-decoration: none;
      border-bottom: 2px solid transparent;
      transition: all .15s;
      cursor: pointer;
    }
    .sub-nav-item:hover {
      color: #e2e8f0;
      background: rgba(255,255,255,.03);
    }
    .sub-nav-item.active {
      color: #60a5fa;
      border-bottom-color: #60a5fa;
    }
    .sub-nav-item mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .pending-badge {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #ef4444;
      opacity: 0;
      transition: opacity .2s;
    }
    .pending-badge.has-pending {
      opacity: 1;
    }
  `],
})
export class MonitoringLayoutComponent {}
