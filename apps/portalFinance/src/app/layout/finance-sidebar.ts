import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

interface NavItem {
  name: string;
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-finance-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  template: `
    <div class="sidebar-container">
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
        <div class="collapse-btn"><mat-icon>chevron_right</mat-icon></div>
      </div>
      <nav class="nav-section">
        <div class="nav-list">
          @for (item of navItems; track item.name) {
            <a class="nav-item"
               [routerLink]="item.route"
               routerLinkActive="active"
               [routerLinkActiveOptions]="{ exact: item.route === '/portalFinance' }">
              <div class="nav-item-left">
                <mat-icon class="nav-icon">{{ item.icon }}</mat-icon>
                <span class="nav-label">{{ item.label }}</span>
              </div>
              @if (item.name !== 'dashboard') { <mat-icon class="nav-chevron">chevron_right</mat-icon> }
            </a>
          }
        </div>
      </nav>
      <div class="sidebar-footer">
        <div class="footer-text">&copy; 2024 SafariStack Solutions. All rights reserved.</div>
        <div class="footer-version">Version 1.0.0</div>
      </div>
    </div>
  `,
  styles: [`
    .sidebar-container {
      display: flex; flex-direction: column; height: 100%;
      background: #2563EB; color: white;
      font-family: 'Inter', sans-serif; position: relative;
    }
    .logo-section {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 16px 8px 16px;
    }
    .logo-group { display: flex; align-items: center; gap: 12px; }
    .logo-icon {
      width: 32px; height: 32px;
      display: flex; align-items: center; justify-content: center;
    }
    .logo-text { font-size: 1.125rem; font-weight: 600; color: white; letter-spacing: -0.01em; }
    .collapse-btn {
      width: 24px; height: 24px; background: white; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
    }
    .collapse-btn mat-icon { color: #2563EB; font-size: 18px; width: 18px; height: 18px; }
    .nav-section {
      flex: 1; overflow-y: auto; padding: 4px 12px; padding-bottom: 56px;
    }
    .nav-section::-webkit-scrollbar { width: 0; background: transparent; }
    .nav-list { display: flex; flex-direction: column; gap: 2px; }
    .nav-item {
      display: flex; align-items: center; justify-content: space-between;
      padding: 8px 12px; border-radius: 6px;
      color: white; text-decoration: none; cursor: pointer; position: relative;
    }
    .nav-item:hover { background: rgba(255,255,255,0.1); }
    .nav-item.active {
      background: rgba(255,255,255,0.12); color: white;
      border-left: 3px solid white; border-radius: 0 6px 6px 0; padding-left: 9px;
    }
    .nav-item.active .nav-icon { color: white; }
    .nav-item-left { display: flex; align-items: center; gap: 12px; }
    .nav-icon { font-size: 20px; width: 20px; height: 20px; color: rgba(255,255,255,0.9); }
    .nav-label { font-size: 0.875rem; font-weight: 500; }
    .nav-chevron { font-size: 18px; width: 18px; height: 18px; color: rgba(255,255,255,0.6); }
    .sidebar-footer {
      padding: 12px 16px; position: absolute; bottom: 0; left: 0; right: 0;
      border-top: 1px solid rgba(255,255,255,0.1); background: #2563EB;
      text-align: center;
    }
    .footer-text {
      font-size: 0.625rem; color: rgba(255,255,255,0.6); line-height: 1.3;
    }
    .footer-version {
      font-size: 0.5625rem; color: rgba(255,255,255,0.4); margin-top: 2px;
    }
  `],
})
export class FinanceSidebarComponent {
  readonly navItems: NavItem[] = [
    { name: 'dashboard', label: 'Dashboard', icon: 'home', route: '/portalFinance/dashboard' },
    { name: 'students', label: 'Students', icon: 'group', route: '/portalFinance/students' },
    { name: 'staff', label: 'Staff', icon: 'person_outline', route: '/portalFinance/staff' },
    { name: 'parents', label: 'Parents', icon: 'people', route: '/portalFinance/parents' },
    { name: 'receivables', label: 'Receivables', icon: 'payments', route: '/portalFinance/receivables' },
    { name: 'payables', label: 'Payables', icon: 'receipt', route: '/portalFinance/payables' },
    { name: 'inventory', label: 'Inventory', icon: 'inventory_2', route: '/portalFinance/inventory' },
    { name: 'ledger', label: 'Master Ledger', icon: 'book', route: '/portalFinance/ledger' },
  ];
}
