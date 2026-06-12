import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

interface NavItem {
  label: string;
  icon: string;
  route?: string;
  children?: { label: string; route: string }[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

@Component({
  selector: 'app-teacher-sidebar',
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  template: `
    <aside class="sidebar">
      <div class="logo-section">
        <mat-icon class="logo-icon">school</mat-icon>
        <div class="logo-text-group">
          <span class="logo-text">Mnara ERP</span>
          <span class="logo-sub">Teacher Portal</span>
        </div>
      </div>

      <nav class="nav-section">
        @for (group of navGroups; track group.label) {
          <div class="nav-group-label">{{ group.label }}</div>
          @for (item of group.items; track item.label) {
            @if (item.children) {
              <div class="nav-parent" (click)="toggleExpand(item.label)">
                <div class="nav-item" [class.active]="isParentActive(item)">
                  <mat-icon class="nav-icon">{{ item.icon }}</mat-icon>
                  <span class="nav-label">{{ item.label }}</span>
                  <mat-icon class="chevron">{{ expandedItem() === item.label ? 'expand_less' : 'expand_more' }}</mat-icon>
                </div>
                @if (expandedItem() === item.label) {
                  <div class="nav-children">
                    @for (child of item.children; track child.label) {
                      <a class="child-item"
                         [routerLink]="child.route"
                         routerLinkActive="child-active"
                         [routerLinkActiveOptions]="{ exact: false }">
                        <span class="child-dot"></span>
                        <span>{{ child.label }}</span>
                      </a>
                    }
                  </div>
                }
              </div>
            } @else {
              <a class="nav-item"
                 [routerLink]="item.route"
                 routerLinkActive="active"
                 [routerLinkActiveOptions]="{ exact: item.route === '/teacher/dashboard' }">
                <mat-icon class="nav-icon">{{ item.icon }}</mat-icon>
                <span class="nav-label">{{ item.label }}</span>
              </a>
            }
          }
        }
      </nav>

      <div class="sidebar-footer">
        <span class="footer-text">Mnara ERP v1.0.0</span>
      </div>
    </aside>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .sidebar {
      display: flex; flex-direction: column; height: 100%;
      background: #1e3a8a; padding: 0 12px; font-family: 'Inter', sans-serif;
    }
    .logo-section {
      display: flex; align-items: center; gap: 10px;
      padding: 18px 12px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    .logo-icon { color: white; font-size: 28px; width: 28px; height: 28px; }
    .logo-text { font-size: 1.125rem; font-weight: 700; color: white; letter-spacing: -0.01em; }
    .logo-sub { font-size: 0.6875rem; color: rgba(255, 255, 255, 0.6); margin-top: 1px; }
    .nav-section { flex: 1; overflow-y: auto; padding: 12px 0; display: flex; flex-direction: column; gap: 2px; }
    .nav-section::-webkit-scrollbar { width: 4px; }
    .nav-section::-webkit-scrollbar-track { background: transparent; }
    .nav-section::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 2px; }
    .nav-group-label {
      font-size: 0.625rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em;
      color: rgba(255, 255, 255, 0.4); padding: 16px 14px 6px;
    }
    .nav-item {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 14px; border-radius: 8px;
      color: rgba(255, 255, 255, 0.75); text-decoration: none;
      font-size: 0.875rem; font-weight: 500;
      transition: all 0.15s ease; cursor: pointer;
    }
    .nav-item:hover { background: rgba(255, 255, 255, 0.1); color: white; }
    .nav-item.active { background: #2563eb; color: white; font-weight: 600; }
    .nav-item.active .nav-icon { color: white; }
    .nav-icon { font-size: 22px; width: 22px; height: 22px; color: rgba(255, 255, 255, 0.6); }
    .nav-label { flex: 1; }
    .chevron { font-size: 18px; width: 18px; height: 18px; color: rgba(255, 255, 255, 0.5); }
    .nav-parent { display: flex; flex-direction: column; }
    .nav-children { display: flex; flex-direction: column; gap: 1px; padding-left: 12px; margin-top: 2px; }
    .child-item {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 14px; border-radius: 6px;
      color: rgba(255, 255, 255, 0.65); text-decoration: none;
      font-size: 0.8125rem; font-weight: 400;
      transition: all 0.15s ease;
    }
    .child-item:hover { background: rgba(255, 255, 255, 0.08); color: white; }
    .child-item.child-active { color: white; font-weight: 500; }
    .child-item.child-active .child-dot { background: #60a5fa; }
    .child-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255, 255, 255, 0.3); flex-shrink: 0; }
    .sidebar-footer {
      padding: 12px 14px; border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    .footer-text { font-size: 0.6875rem; color: rgba(255, 255, 255, 0.4); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherSidebarComponent {
  readonly expandedItem = signal<string | null>(null);

  readonly navGroups: NavGroup[] = [
    {
      label: 'Overview',
      items: [{ label: 'Dashboard', icon: 'dashboard', route: '/teacher/dashboard' }],
    },
    {
      label: 'Academics',
      items: [
        { label: 'My Classes', icon: 'school', route: '/teacher/classes' },
        { label: 'Timetable', icon: 'calendar_month', route: '/teacher/timetable' },
      ],
    },
    {
      label: 'Students',
      items: [
        { label: 'Behaviour & Discipline', icon: 'gavel', route: '/teacher/behaviour' },
      ],
    },
    {
      label: 'Communication',
      items: [
        { label: 'Announcements', icon: 'campaign', route: '/teacher/announcements' },
      ],
    },
    {
      label: 'Administration',
      items: [
        { label: 'HR & Leave', icon: 'badge', route: '/teacher/hr' },
        { label: 'Payslips', icon: 'payments', route: '/teacher/payslips' },
        { label: 'Calendar', icon: 'event', route: '/teacher/calendar' },
      ],
    },
    {
      label: 'Utilities',
      items: [
        { label: 'Settings', icon: 'settings', route: '/teacher/settings' },
      ],
    },
  ];

  toggleExpand(label: string) {
    this.expandedItem.update(v => v === label ? null : label);
  }

  isParentActive(item: NavItem): boolean {
    return false;
  }
}
