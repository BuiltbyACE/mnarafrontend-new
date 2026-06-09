import { Component, Input, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Location } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

interface NavItem {
  name: string;
  label: string;
  icon: string;
  route: string;
  children?: NavChild[];
}

interface NavChild {
  label: string;
  route: string;
  icon?: string;
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

      <nav class="nav-section">
        <div class="nav-list">
          @for (item of navItems; track item.name) {
            @if (item.children) {
              <div
                class="nav-item"
                role="button"
                tabindex="0"
                [class.expanded]="expandedItem() === item.name"
                [class.active]="isParentActive(item)"
                (click)="toggleExpand(item.name)"
                (keydown.enter)="toggleExpand(item.name)"
                (keydown.space)="toggleExpand(item.name)"
              >
                <div class="nav-item-left">
                  <mat-icon class="nav-icon">{{ item.icon }}</mat-icon>
                  <span class="nav-label">{{ item.label }}</span>
                </div>
                <mat-icon class="nav-chevron dropdown-arrow">
                  {{ expandedItem() === item.name ? 'expand_more' : 'chevron_right' }}
                </mat-icon>
              </div>
              @if (expandedItem() === item.name) {
                <div class="children-list">
                  @for (child of item.children; track child.route) {
                    <a
                      class="child-item"
                      [routerLink]="link(child.route)"
                      routerLinkActive="active"
                      [routerLinkActiveOptions]="{ exact: child.route === 'students' }"
                    >
                      <span class="child-dot"></span>
                      <span>{{ child.label }}</span>
                    </a>
                  }
                </div>
              }
            } @else {
              <a
                class="nav-item"
                [routerLink]="link(item.route)"
                routerLinkActive="active"
                [routerLinkActiveOptions]="{ exact: !item.route }"
              >
                <div class="nav-item-left">
                  <mat-icon class="nav-icon">{{ item.icon }}</mat-icon>
                  <span class="nav-label">{{ item.label }}</span>
                </div>
                @if (item.name !== 'dashboard') {
                  <mat-icon class="nav-chevron">chevron_right</mat-icon>
                }
              </a>
            }
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
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #2563EB;
      color: white;
      font-family: 'Inter', sans-serif;
      position: relative;
    }

    .logo-section {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 16px 8px 16px;
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
      padding: 4px 12px;
      padding-bottom: 56px;
      
      &::-webkit-scrollbar {
        width: 0px;
        background: transparent;
      }
    }

    .nav-list {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      border-radius: 6px;
      color: white;
      text-decoration: none;
      cursor: pointer;
      position: relative;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      &.active {
        background: rgba(255, 255, 255, 0.12);
        color: white;
        border-left: 3px solid white;
        border-radius: 0 6px 6px 0;
        padding-left: 9px;

        .nav-icon {
          color: white;
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

    .children-list {
      padding: 2px 0 2px 12px;
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .child-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 12px;
      border-radius: 4px;
      color: rgba(255, 255, 255, 0.8);
      text-decoration: none;
      font-size: 0.8125rem;
      font-weight: 400;
      transition: all 0.15s ease;
      cursor: pointer;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
      }

      &.active {
        background: white;
        color: #2563EB;
        font-weight: 500;

        .child-dot { background: #2563EB; }
      }
    }

    .child-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.5);
      flex-shrink: 0;
    }

    .dropdown-arrow {
      transition: transform 0.2s ease;
    }

    .nav-item.expanded .dropdown-arrow {
      transform: rotate(90deg);
    }

    .sidebar-footer {
      padding: 12px 16px;
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      background: #2563EB;
      text-align: center;

      .footer-text {
        font-size: 0.625rem;
        color: rgba(255, 255, 255, 0.6);
        line-height: 1.3;
      }

      .footer-version {
        font-size: 0.5625rem;
        color: rgba(255, 255, 255, 0.4);
        margin-top: 2px;
      }
    }
  `],
})
export class AdminSidebarComponent {
  @Input() pendingApprovals = 0;

  private location = inject(Location);

  readonly expandedItem = signal<string | null>(null);

  readonly adminBase = computed(() => {
    const path = this.location.path();
    if (path.startsWith('/admin')) return '/admin';
    return '/portalAdmin';
  });

  link(route: string): string {
    if (!route) return this.adminBase();
    return `${this.adminBase()}/${route}`;
  }

  toggleExpand(name: string): void {
    this.expandedItem.update(current => current === name ? null : name);
  }

  isParentActive(item: NavItem): boolean {
    if (!item.children) return false;
    const base = this.adminBase();
    return item.children.some(c => {
      const full = c.route ? `${base}/${c.route}` : base;
      return this.location.path().startsWith(full);
    });
  }

  readonly navItems: NavItem[] = [
    { name: 'dashboard', label: 'Dashboard', icon: 'home', route: '' },
    {
      name: 'academics', label: 'Academics', icon: 'school', route: 'academics',
      children: [
        { label: 'Class Rooms', route: 'academics/classrooms' },
        { label: 'Departments', route: 'academics/departments' },
        { label: 'Key Stages', route: 'academics/key-stages' },
        { label: 'Subject Offerings', route: 'academics/subject-offerings' },
        { label: 'Subjects', route: 'academics/subjects' },
        { label: 'Year levels', route: 'academics/year-levels' },
      ],
    },
    {
      name: 'lms', label: 'LMS', icon: 'menu_book', route: 'lms',
      children: [
        { label: 'Assignments', route: 'lms/assignments', icon: 'assignment' },
        { label: 'Scheduling Hub', route: 'lms/scheduling', icon: 'calendar_month' },
        { label: 'Examinations Hub', route: 'lms/examinations', icon: 'school' },
        { label: 'Operations Hub', route: 'lms/operations', icon: 'event_note' },
      ],
    },
    { name: 'students', label: 'Students', icon: 'group', route: 'students',
      children: [
        { label: 'All Students', route: 'students' },
        { label: 'Student Admission', route: 'students/admissions' },
        { label: 'Promote Students', route: 'students/promote' },
        { label: 'Student Categories', route: 'students/categories' },
        { label: 'Student Houses', route: 'students/houses' },
      ],
    },
    { name: 'timetable', label: 'Timetable', icon: 'calendar_month', route: 'timetable' },
    { name: 'calendar', label: 'School Calendar', icon: 'event_note', route: 'calendar' },
    { name: 'staff', label: 'HR', icon: 'person_outline', route: 'staff' },
    { name: 'finance', label: 'Finance', icon: 'account_balance', route: 'finance',
      children: [
        { label: 'Dashboard', route: 'finance/dashboard' },
        { label: 'Fee Balances', route: 'finance/fee-balances' },
        { label: 'Inventory', route: 'finance/inventory' },
        { label: 'Parents', route: 'finance/parents' },
      ],
    },
    { name: 'transport', label: 'Transport', icon: 'directions_bus', route: 'transport' },
    { name: 'communication', label: 'Communication', icon: 'chat', route: 'communication' },
    { name: 'monitoring', label: 'Live Monitor', icon: 'security', route: 'monitoring' },
    { name: 'reports', label: 'Reports', icon: 'bar_chart', route: 'reports' },
    { name: 'systemAccess', label: 'System Access', icon: 'admin_panel_settings', route: 'system-access' },
    { name: 'settings', label: 'Settings', icon: 'settings', route: 'settings' },
  ];
}
