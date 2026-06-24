import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TimetableApiService, TimetableStateService, TimetableVersion } from '@sms/domain/timetable';
import { VersionStatusBadgeComponent } from '../../components/version-status-badge/version-status-badge.component';
import { VersionActionDialogComponent } from '../../components/version-action-dialog/version-action-dialog.component';
import { CreateVersionDialogComponent } from '../../components/create-version-dialog/create-version-dialog.component';

interface StatCard { icon: string; iconBg: string; iconColor: string; value: string; label: string; sub?: string; }
interface QuickAction { icon: string; label: string; desc: string; route?: string; action?: string; }

@Component({
  selector: 'app-timetable-overview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, MatButtonModule, MatIconModule, VersionStatusBadgeComponent],
  styles: [`
    :host { display: block; }
    .tt-bg { background: var(--tt-bg); }
    .tt-container { max-width:1440px; background:var(--tt-surface); border-radius:var(--tt-radius-app); box-shadow:var(--tt-shadow-card); padding:32px 36px 40px; }
    .tt-brand-icon { width:44px;height:44px;background:var(--tt-gradient-brand);border-radius:var(--tt-radius-icon-sm);box-shadow:var(--tt-shadow-primary);display:flex;align-items:center;justify-content:center;color:#fff;font-size:20px; }
    .tt-nav { background:var(--tt-surface-subtle);padding:4px;border-radius:var(--tt-radius-nav);border:1px solid var(--tt-border);display:flex;flex-wrap:wrap;gap:4px; }
    .tt-nav-btn { padding:10px 22px;font-size:14px;font-weight:500;color:#475569;border-radius:12px;cursor:pointer;transition:0.2s;background:transparent;border:none;display:flex;align-items:center;gap:8px;letter-spacing:0.2px;font-family:inherit; }
    .tt-nav-btn:hover { background:#eef2f6;color:#0f172a; }
    .tt-nav-btn:hover .tt-nav-icon { color:var(--tt-primary); }
    .tt-nav-btn.active { background:var(--tt-surface);color:var(--tt-text);box-shadow:var(--tt-shadow-nav); }
    .tt-nav-btn.active .tt-nav-icon { color:var(--tt-primary); }
    .tt-nav-icon { font-size:15px;color:#94a3b8;transition:0.2s; }
    .tt-stat-card { background:var(--tt-surface-alt);border-radius:var(--tt-radius-card);padding:16px 18px;border:1px solid var(--tt-border);display:flex;align-items:center;gap:14px;transition:0.2s; }
    .tt-stat-card:hover { border-color:#d0d9e8;background:var(--tt-surface);box-shadow:0 4px 12px rgba(0,0,0,0.02); }
    .tt-stat-icon { width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0; }
    .tt-stat-value { font-size:20px;font-weight:700;letter-spacing:-0.3px;color:var(--tt-text);line-height:1.2; }
    .tt-stat-label { font-size:13px;color:var(--tt-text-faint);margin-top:1px; }
    .tt-stat-sub { font-size:11px;font-weight:500;color:var(--tt-text-subtle);margin-top:2px; }
    .tt-version-bar { background:var(--tt-gradient-version-bar);border-radius:var(--tt-radius-card);padding:16px 24px;border:1px solid #e2eaf5;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px 24px; }
    .tt-version-name { font-size:18px;font-weight:700;color:var(--tt-text);letter-spacing:-0.3px;display:flex;align-items:center;gap:6px; }
    .tt-version-name small { font-weight:400;font-size:14px;color:#475569; }
    .tt-version-meta { display:flex;align-items:center;flex-wrap:wrap;gap:8px 16px;font-size:13px;color:#334155; }
    .tt-version-meta .dot { width:4px;height:4px;border-radius:4px;background:#cbd5e1; }
    .tt-version-meta mat-icon { color:#94a3b8;font-size:13px;vertical-align:middle;margin-right:2px; }
    .tt-tag { font-size:11px;font-weight:600;padding:4px 12px;border-radius:var(--tt-radius-pill);letter-spacing:0.3px;text-transform:uppercase;display:inline-flex;align-items:center;gap:5px; }
    .tt-tag-warning { background:var(--tt-warning-bg);color:var(--tt-warning-text); }
    .tt-btn-outline { background:transparent;border:1px solid var(--tt-border-strong);padding:6px 16px;border-radius:var(--tt-radius-pill);font-size:13px;font-weight:500;color:#334155;cursor:pointer;transition:0.2s;display:flex;align-items:center;gap:6px;font-family:inherit; }
    .tt-btn-outline:hover { background:#eef2f6;border-color:#94a3b8; }
    .tt-btn-primary { background:var(--tt-primary);border:none;padding:6px 18px;border-radius:var(--tt-radius-pill);font-size:13px;font-weight:500;color:#fff;cursor:pointer;transition:0.2s;display:flex;align-items:center;gap:6px;box-shadow:var(--tt-shadow-primary);font-family:inherit; }
    .tt-btn-primary:hover { background:var(--tt-primary-dark);transform:translateY(-1px);box-shadow:var(--tt-shadow-primary-hover); }
    .tt-card { background:var(--tt-surface);border-radius:var(--tt-radius-card-lg);border:1px solid var(--tt-border);overflow:hidden; }
    .tt-card-header { display:flex;justify-content:space-between;align-items:center;padding:18px 22px;border-bottom:1px solid #f1f5f9;flex-wrap:wrap;gap:12px; }
    .tt-card-header h3 { font-size:16px;font-weight:600;color:var(--tt-text);display:flex;align-items:center;gap:8px; }
    .tt-card-header h3 mat-icon { color:var(--tt-primary);font-size:16px; }
    .tt-table-btn { background:var(--tt-surface-subtle);border:1px solid var(--tt-border-medium);padding:5px 14px;border-radius:30px;font-size:12px;font-weight:500;color:#334155;cursor:pointer;transition:0.2s;display:flex;align-items:center;gap:6px;font-family:inherit; }
    .tt-table-btn:hover { background:#eef2f6;border-color:var(--tt-border-strong); }
    .tt-table-btn mat-icon { font-size:12px;color:#64748b; }
    .tt-table-wrap { overflow-x:auto;padding:0 6px 6px; }
    .tt-table { width:100%;border-collapse:collapse;font-size:14px; }
    .tt-table thead { background:var(--tt-surface-alt); }
    .tt-table th { text-align:left;padding:14px 16px;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:0.4px;color:var(--tt-text-faint);border-bottom:1px solid var(--tt-border); }
    .tt-table td { padding:14px 16px;border-bottom:1px solid #f1f5f9;color:var(--tt-text-body);vertical-align:middle; }
    .tt-table tbody tr { cursor:pointer;transition:0.15s; }
    .tt-table tbody tr:hover { background:var(--tt-surface-alt); }
    .tt-table tbody tr:last-child td { border-bottom:none; }
    .tt-version-chip { font-weight:600;font-size:13px;color:var(--tt-text);letter-spacing:-0.2px; }
    .tt-actions-btn { color:#94a3b8;cursor:pointer;padding:2px 8px;border-radius:6px;transition:0.2s;background:transparent;border:none;display:inline-flex;align-items:center; }
    .tt-actions-btn:hover { background:#eef2f6;color:#0f172a; }
    .tt-activity-list { flex:1;overflow-y:auto;max-height:380px;padding:6px; }
    .tt-activity-item { display:flex;gap:14px;padding:14px 16px;border-radius:12px;transition:0.15s;border-left:3px solid transparent; }
    .tt-activity-item:hover { background:var(--tt-surface-alt); }
    .tt-activity-avatar { width:36px;height:36px;border-radius:36px;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;margin-top:2px; }
    .tt-activity-content { flex:1;min-width:0; }
    .tt-activity-title { font-size:13.5px;font-weight:500;color:var(--tt-text);line-height:1.3; }
    .tt-activity-desc { font-size:12.5px;color:#475569;margin-top:2px;line-height:1.4; }
    .tt-activity-meta { font-size:11px;color:var(--tt-text-subtle);margin-top:4px;display:flex;align-items:center;gap:10px; }
    .tt-activity-meta mat-icon { font-size:11px; }
    .tt-activity-badge { font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.3px;padding:2px 10px;border-radius:var(--tt-radius-pill);white-space:nowrap;align-self:flex-start;margin-top:2px; }
    .tt-qa-grid { display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px; }
    .tt-qa-card { display:flex;flex-direction:column;align-items:center;gap:6px;padding:16px 12px;border-radius:var(--tt-radius-icon-sm);background:var(--tt-surface-alt);border:1px solid var(--tt-border);cursor:pointer;transition:0.2s;text-decoration:none;color:var(--tt-text-body);text-align:center;font-family:inherit; }
    .tt-qa-card:hover { background:var(--tt-surface);border-color:var(--tt-border-strong);box-shadow:var(--tt-shadow-qa-hover);transform:translateY(-2px); }
    .tt-qa-icon { width:44px;height:44px;border-radius:12px;background:var(--tt-primary-bg);color:var(--tt-primary);display:flex;align-items:center;justify-content:center;font-size:18px;transition:0.2s; }
    .tt-qa-card:hover .tt-qa-icon { background:var(--tt-primary);color:#fff; }
    .tt-qa-label { font-size:13px;font-weight:500;color:var(--tt-text); }
    .tt-qa-desc { font-size:11px;color:var(--tt-text-subtle);line-height:1.3; }
    .tt-empty { padding:40px 16px;text-align:center;color:var(--tt-text-subtle); }
    .tt-empty mat-icon { font-size:40px;display:block;margin:0 auto 12px; }
    @media(max-width:1024px) { .tt-main-grid { grid-template-columns:1fr !important;gap:32px; } }
    @media(max-width:768px) { .tt-container { padding:20px 16px;border-radius:20px; } }
    @media(max-width:480px) { .tt-stat-card { padding:10px 12px; } }
  `],
  template: `
    <div class="tt-bg" style="min-height:100vh;padding:24px;">
      <div class="tt-container mx-auto">

        <!-- HEADER -->
        <header style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px 24px;margin-bottom:28px;">
          <div style="display:flex;align-items:center;gap:14px;">
            <div class="tt-brand-icon"><mat-icon>calendar_month</mat-icon></div>
            <div>
              <h1 style="font-size:22px;font-weight:700;letter-spacing:-0.4px;color:var(--tt-text);line-height:1.2;margin:0;">Timetable Management</h1>
              <span style="font-size:14px;color:var(--tt-text-faint);margin-top:1px;display:block;">Create, manage, and publish school timetables with confidence</span>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:16px;">
            <span class="tt-btn-outline" style="cursor:default;gap:8px;border-radius:40px;padding:6px 16px;">
              <mat-icon style="font-size:14px;color:#64748b;">calendar_today</mat-icon>
              {{ activeTermName() }}
            </span>
            <div class="tt-avatar">JD</div>
          </div>
        </header>

        <!-- NAV -->
        <nav class="tt-nav" style="margin-bottom:32px;">
          @for (tab of navTabs; track tab.label) {
            <button class="tt-nav-btn" [class.active]="activeTab()===tab.label" (click)="activeTab.set(tab.label)">
              <mat-icon class="tt-nav-icon">{{ tab.icon }}</mat-icon> {{ tab.label }}
            </button>
          }
        </nav>

        <!-- STATS -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin-bottom:28px;">
          @for (s of stats; track s.label) {
            <div class="tt-stat-card">
              <div class="tt-stat-icon" [style.background]="s.iconBg" [style.color]="s.iconColor"><mat-icon>{{ s.icon }}</mat-icon></div>
              <div style="display:flex;flex-direction:column;">
                <span class="tt-stat-value">{{ s.value }}</span>
                <span class="tt-stat-label">{{ s.label }}</span>
                @if (s.sub) { <span class="tt-stat-sub">{{ s.sub }}</span> }
              </div>
            </div>
          }
        </div>

        <!-- VERSION BAR -->
        <div class="tt-version-bar" style="margin-bottom:28px;">
          <div style="display:flex;align-items:center;flex-wrap:wrap;gap:12px 20px;">
            <div class="tt-version-name">
              Version {{ activeVersion()?.name ?? '—' }}
              @if (activeVersion()?.published_at; as pub) { <small>Published on {{ pub | date:'d MMM y' }}</small> }
            </div>
            <div class="tt-version-meta">
              <span><mat-icon>group</mat-icon> All class groups</span>
              <span class="dot"></span>
              <span><mat-icon>schedule</mat-icon> Across all timetables</span>
            </div>
            <span class="tt-tag tt-tag-warning"><mat-icon style="font-size:12px;">warning_amber</mat-icon> Requires attention</span>
          </div>
          <div style="display:flex;align-items:center;gap:10px;">
            <button class="tt-btn-outline"><mat-icon>edit</mat-icon> Edit</button>
            <button class="tt-btn-primary"><mat-icon>cloud_upload</mat-icon> Publish</button>
          </div>
        </div>

        <!-- MAIN GRID -->
        <div class="tt-main-grid" style="display:grid;grid-template-columns:1fr 340px;gap:28px;margin-bottom:32px;">

          <!-- VERSIONS TABLE -->
          <div class="tt-card">
            <div class="tt-card-header">
              <h3><mat-icon>list_alt</mat-icon> Timetable Versions</h3>
              <div style="display:flex;gap:8px;">
                <button class="tt-table-btn"><mat-icon>filter_alt</mat-icon> Filter</button>
                <button class="tt-table-btn"><mat-icon>download</mat-icon> Export</button>
              </div>
            </div>
            <div class="tt-table-wrap">
              <table class="tt-table">
                <thead><tr>
                  <th>Version</th><th>Status</th><th>Created By</th><th>Created On</th><th>Published On</th><th style="text-align:center;">Actions</th>
                </tr></thead>
                <tbody>
                  @for (v of versions(); track v.id) {
                    <tr (click)="navigateToVersion(v.id)">
                      <td><span class="tt-version-chip">{{ v.name }}</span></td>
                      <td><app-version-status-badge [status]="v.status" /></td>
                      <td>{{ v.created_by_name }}</td>
                      <td>{{ v.created_at | date:'d MMM y' }}</td>
                      <td>{{ v.published_at ? (v.published_at | date:'d MMM y') : '—' }}</td>
                      <td style="text-align:center;">
                        <button class="tt-actions-btn" (click)="openVersionMenu($event,v)"><mat-icon>more_vert</mat-icon></button>
                      </td>
                    </tr>
                  } @empty {
                    <tr><td colspan="6" class="tt-empty">
                      <mat-icon>inbox</mat-icon>
                      No versions yet. Create your first draft to get started.
                    </td></tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <!-- RECENT ACTIVITY -->
          <aside class="tt-card" style="display:flex;flex-direction:column;">
            <div style="padding:18px 22px 12px;border-bottom:1px solid #f1f5f9;">
              <h3 style="font-size:16px;font-weight:600;color:var(--tt-text);display:flex;align-items:center;gap:8px;margin:0;">
                <mat-icon style="color:var(--tt-primary);font-size:16px;">schedule</mat-icon> Recent Activity
              </h3>
            </div>
            <div class="tt-activity-list">
              @for (act of activities; track act.title) {
                <div class="tt-activity-item">
                  <div class="tt-activity-avatar" [style.background]="act.iconBg" [style.color]="act.iconColor!"><mat-icon>{{ act.icon }}</mat-icon></div>
                  <div class="tt-activity-content">
                    <div class="tt-activity-title" [innerHTML]="act.title"></div>
                    <div class="tt-activity-desc">{{ act.desc }}</div>
                    <div class="tt-activity-meta"><span><mat-icon>schedule</mat-icon> {{ act.time }}</span></div>
                  </div>
                  <span class="tt-activity-badge" [style.background]="badgeBg(act.badgeClass)" [style.color]="badgeColor(act.badgeClass)">{{ act.badge }}</span>
                </div>
              }
            </div>
          </aside>
        </div>

        <!-- QUICK ACTIONS -->
        <div>
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:16px;">
            <h3 style="font-size:16px;font-weight:600;color:var(--tt-text);display:flex;align-items:center;gap:8px;margin:0;">
              <mat-icon style="color:var(--tt-primary);">bolt</mat-icon> Quick Actions
            </h3>
            <a routerLink="/admin/timetable/audit" style="font-size:13px;color:var(--tt-primary);font-weight:500;cursor:pointer;text-decoration:none;">
              View all actions <mat-icon style="font-size:13px;vertical-align:middle;">arrow_forward</mat-icon>
            </a>
          </div>
          <div class="tt-qa-grid">
            @for (qa of quickActions; track qa.label) {
              @if (qa.route) {
                <a [routerLink]="qa.route" class="tt-qa-card">
                  <div class="tt-qa-icon"><mat-icon>{{ qa.icon }}</mat-icon></div>
                  <span class="tt-qa-label">{{ qa.label }}</span>
                  <span class="tt-qa-desc">{{ qa.desc }}</span>
                </a>
              } @else {
                <button class="tt-qa-card" (click)="handleQuickAction(qa.action!)">
                  <div class="tt-qa-icon"><mat-icon>{{ qa.icon }}</mat-icon></div>
                  <span class="tt-qa-label">{{ qa.label }}</span>
                  <span class="tt-qa-desc">{{ qa.desc }}</span>
                </button>
              }
            }
          </div>
        </div>

      </div>
    </div>
  `,
})
export class TimetableOverviewPage implements OnInit {
  private api = inject(TimetableApiService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  protected activeTab = signal('Overview');

  protected readonly navTabs = [
    { label: 'Overview', icon: 'grid_view' },
    { label: 'Versions', icon: 'account_tree' },
    { label: 'Drafts', icon: 'description' },
    { label: 'Conflicts', icon: 'warning' },
    { label: 'Publish Center', icon: 'rocket_launch' },
    { label: 'Audit Log', icon: 'history' },
  ];

  protected readonly stats: StatCard[] = [
    { icon: 'check_circle', iconBg: '#eef2ff', iconColor: '#4f46e5', value: '—', label: 'Active Version' },
    { icon: 'group', iconBg: '#ecfdf5', iconColor: '#059669', value: '—', label: 'Total Classes' },
    { icon: 'book', iconBg: '#f5f3ff', iconColor: '#7c3aed', value: '—', label: 'Total Lessons' },
    { icon: 'bolt', iconBg: '#fffbeb', iconColor: '#d97706', value: '—', label: 'Conflicts', sub: '0 teacher, 0 room' },
    { icon: 'error', iconBg: '#fff1f2', iconColor: '#e11d48', value: '—', label: 'Capacity Warnings' },
    { icon: 'schedule', iconBg: '#ecfdf3', iconColor: '#0d9488', value: '—', label: 'Availability Issues' },
  ];

  protected readonly activities = [
    { iconBg: '#dcfce7', icon: 'check', iconColor: '#15803d', title: 'Version <span style="font-weight:600;color:var(--tt-primary)">v1.0</span> published', desc: 'Published by Admin User', time: '2 hours ago', badge: 'Live', badgeClass: 'success' },
    { iconBg: '#eef2ff', icon: 'edit_note', iconColor: '#4f46e5', title: 'Draft <span style="font-weight:600;color:var(--tt-primary)">v2.0</span> created', desc: 'Created by Registrar', time: '5 hours ago', badge: 'Draft', badgeClass: 'info' },
    { iconBg: '#e0f2fe', icon: 'edit', iconColor: '#0369a1', title: 'Timetable entry updated', desc: 'Mathematics — Grade 9A — Monday P2', time: '1 day ago', badge: 'Edited', badgeClass: '' },
    { iconBg: '#fef3c7', icon: 'warning', iconColor: '#b45309', title: 'Conflict detected', desc: 'Teacher conflict — John Doe', time: '2 days ago', badge: 'Conflict', badgeClass: 'warning' },
    { iconBg: '#fee2e2', icon: 'archive', iconColor: '#b91c1c', title: 'Version <span style="font-weight:600;color:var(--tt-primary)">v11.0</span> archived', desc: 'Archived by Registrar', time: '3 days ago', badge: 'Archived', badgeClass: '' },
    { iconBg: '#dcfce7', icon: 'check_circle', iconColor: '#15803d', title: 'Conflict resolution applied', desc: 'Room 204 — double booking fixed', time: '4 days ago', badge: 'Resolved', badgeClass: 'success' },
  ] as Array<{ iconBg: string; icon: string; iconColor?: string; title: string; desc: string; time: string; badge: string; badgeClass: string }>;

  protected readonly quickActions: QuickAction[] = [
    { icon: 'add', label: 'Create New Draft', desc: 'Create a new timetable draft', action: 'createDraft' },
    { icon: 'content_copy', label: 'Clone Version', desc: 'Clone existing version', action: 'cloneVersion' },
    { icon: 'search', label: 'Check Conflicts', desc: 'Run conflict validation', action: 'checkConflicts' },
    { icon: 'cloud_upload', label: 'Publish Version', desc: 'Publish draft version', action: 'publishVersion' },
    { icon: 'compare_arrows', label: 'Compare Versions', desc: 'Compare two versions', route: '/admin/timetable/versions/compare' },
    { icon: 'list_alt', label: 'View Audit Log', desc: 'View all changes', route: '/admin/timetable/audit' },
  ];

  protected versions = signal<TimetableVersion[]>([]);
  protected activeVersion = computed(() => this.versions().find(v => v.status === 'PUBLISHED') ?? null);
  protected activeTermName = computed(() => this.activeVersion()?.academic_term_name ?? 'Term 2 · 2025/26');

  ngOnInit() {
    this.api.getVersions().subscribe({
      next: (res) => this.versions.set(res),
    });
  }

  protected badgeBg(cls: string): string {
    const m: Record<string, string> = { success: '#dcfce7', warning: '#fef3c7', danger: '#fee2e2', info: '#e0f2fe' };
    return m[cls] ?? '#f1f5f9';
  }

  protected badgeColor(cls: string): string {
    const m: Record<string, string> = { success: '#15803d', warning: '#b45309', danger: '#b91c1c', info: '#0369a1' };
    return m[cls] ?? '#475569';
  }

  protected navigateToVersion(id: number) {
    this.router.navigate(['/admin/timetable/versions', id]);
  }

  protected openVersionMenu(event: MouseEvent, v: TimetableVersion) {
    event.stopPropagation();
  }

  protected handleQuickAction(action: string) {
    if (action === 'createDraft') {
      this.dialog.open(CreateVersionDialogComponent, { width: '480px' });
    }
    if (action === 'cloneVersion' || action === 'publishVersion' || action === 'checkConflicts') {
      this.dialog.open(VersionActionDialogComponent, {
        width: '480px',
        data: { action, version: this.activeVersion() },
      });
    }
  }
}
