import { Component, ChangeDetectionStrategy, inject, OnInit, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, ActivatedRoute } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ClassesService } from '../../classes.service';

@Component({
  selector: 'app-workspace-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatTabsModule, MatIconModule, MatButtonModule],
  template: `
    <div class="workspace-container">
      <div class="workspace-header">
        <div class="header-left">
          <a mat-icon-button routerLink="/student/classes" class="back-btn" aria-label="Back to classes">
            <mat-icon>arrow_back</mat-icon>
          </a>
          <div>
            <h1 class="page-title">{{ workspaceName() }}</h1>
            <p class="page-subtitle">{{ workspaceTeacher() }}</p>
          </div>
        </div>
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
      .workspace-container {
        padding: 24px;
        max-width: 1400px;
        margin: 0 auto;
      }

      .workspace-header {
        margin-bottom: 24px;
        
        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .back-btn {
          color: #64748b;
          background: #f1f5f9;
          transition: all 0.2s ease;
          &:hover {
            color: #1e293b;
            background: #e2e8f0;
          }
        }

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
export class WorkspaceLayoutComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly classesService = inject(ClassesService);

  readonly tabs = [
    { label: 'Dashboard', icon: 'dashboard', route: 'dashboard' },
    { label: 'Assignments', icon: 'assignment', route: 'assignments' },
    { label: 'Grades', icon: 'grade', route: 'grades' },
    { label: 'Resources', icon: 'folder', route: 'resources' },
    { label: 'Live Classes', icon: 'videocam', route: 'live' },
  ];

  readonly workspaceName = computed(() => {
    const ws = this.getCurrentWorkspace();
    return ws ? ws.subject_name + ' Workspace' : 'Subject Workspace';
  });

  readonly workspaceTeacher = computed(() => {
    const ws = this.getCurrentWorkspace();
    return ws ? 'Taught by ' + ws.teacher_name : 'Loading details...';
  });

  ngOnInit() {
    if (this.classesService.myClasses().length === 0) {
      this.classesService.fetchMyClasses();
    }
  }

  private getCurrentWorkspace() {
    const idParam = this.route.snapshot.paramMap.get('workspaceId');
    if (!idParam) return null;
    const wsId = parseInt(idParam, 10);
    return this.classesService.myClasses().find(c => c.id === wsId);
  }
}
