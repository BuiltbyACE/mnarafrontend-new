import { Component, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Location } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

interface NavChild {
  label: string;
  route: string;
  icon?: string;
}

interface NavItem {
  name: string;
  label: string;
  icon: string;
  route: string;
  children?: NavChild[];
}

interface NavSection {
  heading: string;
  items: NavItem[];
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
    <div class="sidebar-container" [class.collapsed]="collapsed">
      <div class="logo-section">
        <div class="logo-group">
          <div class="logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L22 7V17L12 22L2 17V7L12 2Z" fill="white" fill-opacity="0.2"/>
              <path d="M7 10L12 13L17 10V15H7V10Z" fill="white"/>
            </svg>
          </div>
          @if (!collapsed) {
            <div class="logo-text-group">
              <span class="logo-text">Mnara ERP</span>
              <span class="logo-sub">Admin Portal</span>
            </div>
          }
        </div>
        <button type="button" class="collapse-btn" (click)="collapseToggle.emit()" [attr.aria-label]="collapsed ? 'Expand sidebar' : 'Collapse sidebar'">
          <mat-icon>{{ collapsed ? 'chevron_right' : 'chevron_left' }}</mat-icon>
        </button>
      </div>

      <nav class="nav-section">
        <div class="nav-list">
          @for (section of navSections; track section.heading) {
            @if (!collapsed) {
              <div class="section-heading">{{ section.heading }}</div>
            }
            @for (item of section.items; track item.name) {
              @if (item.children) {
                <div
                  class="nav-item"
                  role="button"
                  tabindex="0"
                  [attr.title]="collapsed ? item.label : null"
                  [class.expanded]="expandedItem() === item.name"
                  [class.active]="isParentActive(item)"
                  (click)="toggleExpand(item.name)"
                  (keydown.enter)="toggleExpand(item.name)"
                  (keydown.space)="toggleExpand(item.name)"
                >
                  <div class="nav-item-left">
                    <mat-icon class="nav-icon">{{ item.icon }}</mat-icon>
                    @if (!collapsed) {
                      <span class="nav-label">{{ item.label }}</span>
                    }
                  </div>
                  @if (!collapsed) {
                    <mat-icon class="nav-chevron dropdown-arrow">
                      {{ expandedItem() === item.name ? 'expand_more' : 'chevron_right' }}
                    </mat-icon>
                  }
                </div>
                @if (expandedItem() === item.name && !collapsed) {
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
                  [attr.title]="collapsed ? item.label : null"
                  [routerLink]="link(item.route)"
                  routerLinkActive="active"
                  [routerLinkActiveOptions]="{ exact: !item.route }"
                >
                  <div class="nav-item-left">
                    <mat-icon class="nav-icon">{{ item.icon }}</mat-icon>
                    @if (!collapsed) {
                      <span class="nav-label">{{ item.label }}</span>
                    }
                  </div>
                  @if (!collapsed && item.name === 'dashboard' && pendingApprovals > 0) {
                    <span class="nav-badge">{{ pendingApprovals > 9 ? '9+' : pendingApprovals }}</span>
                  }
                </a>
              }
            }
          }
        </div>
      </nav>

      <div class="sidebar-footer"></div>
    </div>
  `,
  styles: [`
    .sidebar-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: linear-gradient(180deg, #0d6efd 0%, #0a58ca 100%);
      color: white;
      font-family: 'Inter', sans-serif;
      position: relative;
      width: 260px;
      transition: width 0.2s ease;
      overflow: hidden;
    }

    .sidebar-container.collapsed {
      width: 76px;
    }

    .logo-section {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 16px 14px 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .logo-group {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }

    .logo-icon {
      width: 34px;
      height: 34px;
      border-radius: 9px;
      background: rgba(255, 255, 255, 0.18);
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .logo-text-group {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
      min-width: 0;
    }

    .logo-text {
      font-size: 1rem;
      font-weight: 700;
      color: white;
      letter-spacing: -0.01em;
      white-space: nowrap;
    }

    .logo-sub {
      font-size: 0.625rem;
      color: rgba(255, 255, 255, 0.55);
      white-space: nowrap;
    }

    .collapse-btn {
      width: 26px;
      height: 26px;
      background: rgba(255, 255, 255, 0.12);
      border: none;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
      padding: 0;

      &:hover { background: rgba(255, 255, 255, 0.22); }

      mat-icon {
        color: white;
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }

    .nav-section {
      flex: 1;
      overflow-y: auto;
      padding: 12px 10px;
      padding-bottom: 72px;

      &::-webkit-scrollbar { width: 0px; background: transparent; }
    }

    .nav-list {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .section-heading {
      font-size: 0.625rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.4);
      padding: 14px 12px 6px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 9px 12px;
      border-radius: 8px;
      color: white;
      text-decoration: none;
      cursor: pointer;
      position: relative;

      &:hover { background: rgba(255, 255, 255, 0.08); }

      &.active {
        background: white;
        color: #0d6efd;
        border-radius: 8px;
        padding-left: 12px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);

        .nav-label { color: #0d6efd; font-weight: 600; }
        .nav-icon { color: #0d6efd; }
      }
    }

    .sidebar-container.collapsed .nav-item {
      justify-content: center;
      padding: 10px;
    }

    .nav-item-left {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }

    .nav-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: rgba(255, 255, 255, 0.85);
      flex-shrink: 0;
    }

    .nav-label {
      font-size: 0.8125rem;
      font-weight: 500;
      white-space: nowrap;
    }

    .nav-badge {
      background: #ef4444;
      color: white;
      font-size: 0.625rem;
      font-weight: 700;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .nav-chevron {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: rgba(255, 255, 255, 0.5);
      flex-shrink: 0;
    }

    .children-list {
      padding: 2px 0 4px 14px;
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .child-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 7px 12px;
      border-radius: 6px;
      color: rgba(255, 255, 255, 0.75);
      text-decoration: none;
      font-size: 0.78125rem;
      font-weight: 400;
      transition: all 0.15s ease;
      cursor: pointer;

      &:hover { background: rgba(255, 255, 255, 0.08); color: white; }

      &.active {
        background: rgba(255, 255, 255, 0.15);
        color: white;
        font-weight: 600;

        .child-dot { background: white; }
      }
    }

    .child-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.45);
      flex-shrink: 0;
    }

    .dropdown-arrow { transition: transform 0.2s ease; }
    .nav-item.expanded .dropdown-arrow { transform: rotate(90deg); }

    .sidebar-footer {
      padding: 12px;
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      border-top: 1px solid rgba(255, 255, 255, 0.12);
      background: rgba(15, 23, 42, 0.18);
    }


  `],
})
export class AdminSidebarComponent {
  @Input() pendingApprovals = 0;
  @Input() collapsed = false;
  @Output() collapseToggle = new EventEmitter<void>();

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
    if (this.collapsed) return;
    this.expandedItem.update((current) => (current === name ? null : name));
  }

  isParentActive(item: NavItem): boolean {
    if (!item.children) return false;
    const base = this.adminBase();
    return item.children.some((c) => {
      const full = c.route ? `${base}/${c.route}` : base;
      return this.location.path().startsWith(full);
    });
  }

  readonly navSections: NavSection[] = [
    {
      heading: 'Overview',
      items: [
        { name: 'dashboard', label: 'Dashboard', icon: 'home', route: '' },
      ],
    },
    {
      heading: 'Academics',
      items: [
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
            { label: 'Assignments', route: 'lms/assignments' },
            { label: 'Scheduling Hub', route: 'lms/scheduling' },
            { label: 'Examinations Hub', route: 'lms/examinations' },
            { label: 'Operations Hub', route: 'lms/operations' },
          ],
        },
        {
          name: 'students', label: 'Students', icon: 'group', route: 'students',
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
      ],
    },
    {
      heading: 'People',
      items: [
        { name: 'staff', label: 'HR', icon: 'person_outline', route: 'staff' },
      ],
    },
    {
      heading: 'Operations',
      items: [
        { name: 'transport', label: 'Transport', icon: 'directions_bus', route: 'transport' },
        { name: 'communication', label: 'Communication', icon: 'chat', route: 'communication' },
        { name: 'monitoring', label: 'Live Monitor', icon: 'security', route: 'monitoring' },
      ],
    },
    {
      heading: 'Finance',
      items: [
        {
          name: 'finance', label: 'Finance', icon: 'account_balance', route: 'finance',
          children: [
            { label: 'Dashboard', route: 'finance/dashboard' },
            { label: 'Fee Balances', route: 'finance/fee-balances' },
            { label: 'Inventory', route: 'finance/inventory' },
            { label: 'Parents', route: 'finance/parents' },
          ],
        },
        { name: 'reports', label: 'Reports', icon: 'bar_chart', route: 'reports' },
      ],
    },
    {
      heading: 'System',
      items: [
        { name: 'systemAccess', label: 'System Access', icon: 'admin_panel_settings', route: 'system-access' },
        { name: 'settings', label: 'Settings', icon: 'settings', route: 'settings' },
      ],
    },
  ];
}
