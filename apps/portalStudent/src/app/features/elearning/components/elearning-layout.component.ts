import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-elearning-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatTabsModule, MatIconModule],
  template: `
    <div class="elearning-container">
      <div class="elearning-header">
        <h1 class="page-title">E-Learning Portal</h1>
        <p class="page-subtitle">Your comprehensive learning hub</p>
      </div>

      <nav class="tab-nav" mat-tab-nav-bar [tabPanel]="tabPanel">
        @for (tab of tabs; track tab.route) {
          <a
            mat-tab-link
            [routerLink]="tab.route"
            routerLinkActive
            #rla="routerLinkActive"
            [active]="rla.isActive"
            [routerLinkActiveOptions]="{ exact: tab.route === 'dashboard' }"
          >
            <mat-icon class="tab-icon">{{ tab.icon }}</mat-icon>
            {{ tab.label }}
          </a>
        }
      </nav>

      <mat-tab-nav-panel #tabPanel class="tab-content">
        <router-outlet />
      </mat-tab-nav-panel>
    </div>
  `,
  styles: [
    `
      .elearning-container {
        padding: 24px;
        max-width: 1400px;
        margin: 0 auto;
      }

      .elearning-header {
        margin-bottom: 24px;

        .page-title {
          margin: 0 0 4px;
          font-size: 1.75rem;
          font-weight: 700;
          color: #1e293b;
        }

        .page-subtitle {
          margin: 0;
          color: #64748b;
          font-size: 0.95rem;
        }
      }

      .tab-nav {
        margin-bottom: 24px;
        border-bottom: 2px solid #e2e8f0;

        .tab-icon {
          margin-right: 6px;
          font-size: 18px;
          width: 18px;
          height: 18px;
          vertical-align: middle;
        }
      }

      .tab-content {
        display: block;
        min-height: 400px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ElearningLayoutComponent {
  readonly tabs = [
    { label: 'Dashboard', icon: 'dashboard', route: 'dashboard' },
    { label: 'Assignments', icon: 'assignment', route: 'assignments' },
    { label: 'Grades', icon: 'grade', route: 'grades' },
    { label: 'Resources', icon: 'folder', route: 'resources' },
    { label: 'Live Classes', icon: 'videocam', route: 'live' },
  ];
}
