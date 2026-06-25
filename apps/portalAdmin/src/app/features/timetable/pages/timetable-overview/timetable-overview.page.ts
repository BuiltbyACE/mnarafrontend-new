import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TimetableApiService, TimetableVersion } from '@sms/domain/timetable';
import { VersionStatusBadgeComponent } from '../../components/version-status-badge/version-status-badge.component';
import { VersionActionDialogComponent } from '../../components/version-action-dialog/version-action-dialog.component';
import { CreateVersionDialogComponent } from '../../components/create-version-dialog/create-version-dialog.component';
import { SchoolCalendarViewComponent } from '@sms/shared/ui';

interface StatCard { icon: string; iconBg: string; iconColor: string; value: string; label: string; sub?: string; }
interface QuickAction { icon: string; label: string; desc: string; route?: string; action?: string; }

interface TimetableStats {
  active_version: string;
  total_entries: number;
  total_classes: number;
  conflicts: number;
  capacity_warnings: number;
  availability_issues: number;
}

@Component({
  selector: 'app-timetable-overview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, MatButtonModule, MatIconModule, VersionStatusBadgeComponent, SchoolCalendarViewComponent],
  styles: [`
    :host { display: block; }
    .nav-tab {
      padding: 12px 16px; font-size: 14px; font-weight: 500; color: #64748b; cursor: pointer;
      border-bottom: 2px solid transparent; transition: 0.2s; background: transparent; border-top: none; border-left: none; border-right: none;
    }
    .nav-tab:hover { color: #0f172a; }
    .nav-tab.active { color: #2563eb; border-bottom-color: #2563eb; }
    .avatar-circle { width: 32px; height: 32px; border-radius: 50%; background: #e2e8f0; color: #334155; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; }
  `],
  template: `
    <div class="bg-slate-50 min-h-screen p-6">
      <div class="max-w-[1440px] mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
      
        <!-- HEADER -->
        <header class="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div class="flex items-center gap-4">
            <div class="w-11 h-11 bg-blue-600 rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center text-white text-xl">
              <mat-icon>calendar_month</mat-icon>
            </div>
            <div>
              <h1 class="text-2xl font-bold text-slate-900 tracking-tight m-0">Timetable Management</h1>
              <span class="text-sm text-slate-500 mt-0.5 block">Create, manage, and publish school timetables with confidence</span>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <span class="flex items-center gap-2 border border-slate-300 rounded-full px-4 py-1.5 text-sm font-medium text-slate-700 bg-white">
              <mat-icon class="text-[18px] text-slate-400">calendar_today</mat-icon>
              {{ activeTermName() }}
            </span>
            <div class="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-700">JD</div>
          </div>
        </header>

        <!-- NAV -->
        <nav class="flex border-b border-slate-200 mb-8 gap-4">
          @for (tab of navTabs; track tab.label) {
            <button class="nav-tab flex items-center gap-2" [class.active]="activeTab()===tab.label" (click)="activeTab.set(tab.label)">
              <mat-icon class="text-[18px]">{{ tab.icon }}</mat-icon> {{ tab.label }}
            </button>
          }
        </nav>

        <!-- STATS -->
        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          @for (s of stats(); track s.label) {
            <div class="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 transition-shadow hover:shadow-md">
              <div class="w-11 h-11 rounded-xl flex items-center justify-center text-[20px] shrink-0" [style.background]="s.iconBg" [style.color]="s.iconColor">
                <mat-icon>{{ s.icon }}</mat-icon>
              </div>
              <div class="flex flex-col">
                <span class="text-xl font-bold text-slate-900 leading-tight">{{ s.value }}</span>
                <span class="text-xs text-slate-500 mt-0.5">{{ s.label }}</span>
                @if (s.sub) { <span class="text-[10px] font-medium text-slate-400 mt-0.5">{{ s.sub }}</span> }
              </div>
            </div>
          }
        </div>

        <!-- MAIN GRID -->
        <div class="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-8">
          
          <!-- LEFT COL -->
          <div class="flex flex-col gap-8">
            <!-- VERSION BAR -->
            <div class="bg-gradient-to-r from-slate-50 to-white rounded-xl p-5 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div class="flex items-center flex-wrap gap-4">
                <div class="text-lg font-bold text-slate-900 flex items-center gap-2">
                  Version {{ activeVersion()?.name ?? '—' }}
                  @if (activeVersion()?.published_at; as pub) { <small class="font-normal text-sm text-slate-500">Published on {{ pub | date:'d MMM y' }}</small> }
                </div>
                <div class="flex items-center gap-4 text-sm text-slate-600">
                  <span class="flex items-center gap-1.5"><mat-icon class="text-[18px] text-slate-400">group</mat-icon> All class groups</span>
                  <span class="w-1 h-1 rounded-full bg-slate-300"></span>
                  <span class="flex items-center gap-1.5"><mat-icon class="text-[18px] text-slate-400">schedule</mat-icon> Across all timetables</span>
                </div>
                <span class="bg-amber-100 text-amber-800 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <mat-icon class="text-[14px]">warning_amber</mat-icon> Requires attention
                </span>
              </div>
              <div class="flex items-center gap-3">
                <button class="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 transition-colors">
                  <mat-icon class="text-[18px]">edit</mat-icon> Edit
                </button>
                <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-sm shadow-blue-500/30 flex items-center gap-1.5 transition-all hover:-translate-y-[1px]">
                  <mat-icon class="text-[18px]">add</mat-icon> Create New Version
                </button>
              </div>
            </div>

            <!-- VERSIONS TABLE -->
            <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div class="flex justify-between items-center px-5 py-4 border-b border-slate-100">
                <h3 class="text-base font-semibold text-slate-900 flex items-center gap-2 m-0">
                  <mat-icon class="text-blue-600 text-[20px]">list_alt</mat-icon> Timetable Versions
                </h3>
                <div class="flex gap-2">
                  <button class="flex items-center gap-1.5 px-3 py-1 border border-slate-200 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                    <mat-icon class="text-[16px] text-slate-400">filter_alt</mat-icon> Filter
                  </button>
                  <button class="flex items-center gap-1.5 px-3 py-1 border border-slate-200 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                    <mat-icon class="text-[16px] text-slate-400">download</mat-icon> Export
                  </button>
                </div>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse min-w-[700px]">
                  <thead class="bg-slate-50">
                    <tr>
                      <th class="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200">Version</th>
                      <th class="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200">Status</th>
                      <th class="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200">Created By</th>
                      <th class="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200">Created On</th>
                      <th class="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200">Published On</th>
                      <th class="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (v of versions(); track v.id) {
                      <tr class="hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-100 last:border-0" (click)="navigateToVersion(v.id)">
                        <td class="px-5 py-4"><span class="font-semibold text-sm text-slate-900">{{ v.name }}</span><br><span class="text-xs text-slate-500">{{ v.academic_term_name }}</span></td>
                        <td class="px-5 py-4"><app-version-status-badge [status]="v.status" /></td>
                        <td class="px-5 py-4">
                          <div class="flex items-center gap-3">
                            <div class="avatar-circle">{{ getInitials(v.created_by_name) }}</div>
                            <div>
                              <div class="text-sm font-medium text-slate-900">{{ v.created_by_name }}</div>
                              <div class="text-xs text-slate-500">{{ getEmail(v.created_by_name) }}</div>
                            </div>
                          </div>
                        </td>
                        <td class="px-5 py-4 text-sm text-slate-700">{{ v.created_at | date:'MMM d, y, h:mm a' }}</td>
                        <td class="px-5 py-4 text-sm text-slate-700">{{ v.published_at ? (v.published_at | date:'MMM d, y, h:mm a') : '—' }}</td>
                        <td class="px-5 py-4 text-center">
                          <button class="text-slate-400 hover:text-slate-900 hover:bg-slate-100 p-1.5 rounded-lg transition-colors" (click)="openVersionMenu($event,v)">
                            <mat-icon>more_vert</mat-icon>
                          </button>
                        </td>
                      </tr>
                    } @empty {
                      <tr><td colspan="6" class="px-5 py-10 text-center text-slate-400 text-sm"><mat-icon class="text-4xl block mx-auto mb-3">inbox</mat-icon>No versions yet. Create your first draft to get started.</td></tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <!-- QUICK ACTIONS -->
            <div>
              <div class="flex items-center justify-between gap-4 mb-4">
                <h3 class="text-base font-semibold text-slate-900 flex items-center gap-2 m-0">
                  Quick Actions
                </h3>
                <a routerLink="/admin/timetable/audit" class="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">
                  View all actions <mat-icon class="text-[16px]">arrow_forward</mat-icon>
                </a>
              </div>
              <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                @for (qa of quickActions; track qa.label) {
                  @if (qa.route) {
                    <a [routerLink]="qa.route" class="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center gap-2 text-center transition-all hover:shadow-lg hover:-translate-y-1 hover:border-blue-200 group no-underline text-slate-700">
                      <div class="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-[22px] transition-colors group-hover:bg-blue-600 group-hover:text-white"><mat-icon>{{ qa.icon }}</mat-icon></div>
                      <span class="text-sm font-medium text-slate-900 mt-1">{{ qa.label }}</span>
                      <span class="text-[11px] text-slate-500 leading-tight">{{ qa.desc }}</span>
                    </a>
                  } @else {
                    <button (click)="handleQuickAction(qa.action!)" class="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center gap-2 text-center transition-all hover:shadow-lg hover:-translate-y-1 hover:border-blue-200 group text-slate-700 w-full">
                      <div class="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-[22px] transition-colors group-hover:bg-blue-600 group-hover:text-white"><mat-icon>{{ qa.icon }}</mat-icon></div>
                      <span class="text-sm font-medium text-slate-900 mt-1">{{ qa.label }}</span>
                      <span class="text-[11px] text-slate-500 leading-tight">{{ qa.desc }}</span>
                    </button>
                  }
                }
              </div>
            </div>

          </div>

          <!-- RIGHT COL -->
          <div class="flex flex-col gap-6">
            <!-- CALENDAR -->
            <div class="bg-white rounded-xl border border-slate-200 p-1">
              <app-school-calendar-view></app-school-calendar-view>
            </div>
            
            <!-- RECENT ACTIVITY -->
            <div class="bg-white rounded-xl border border-slate-200 flex flex-col h-[400px]">
              <div class="px-5 py-4 border-b border-slate-100 shrink-0">
                <h3 class="text-base font-semibold text-slate-900 flex items-center gap-2 m-0">
                  <mat-icon class="text-blue-600 text-[20px]">history</mat-icon> Recent Activity
                </h3>
              </div>
              <div class="flex-1 overflow-y-auto p-2">
                @for (act of activities(); track act.id) {
                  <div class="flex gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors border-l-4 border-transparent">
                    <div class="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-[16px] mt-0.5" [style.background]="getAuditIconBg(act.action)" [style.color]="getAuditIconColor(act.action)">
                      <mat-icon>{{ getAuditIcon(act.action) }}</mat-icon>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-sm font-medium text-slate-900 leading-snug">
                        {{ act.entity_type }} <span class="font-semibold text-blue-600">{{ act.action }}</span>
                      </div>
                      <div class="text-[13px] text-slate-600 mt-0.5">by {{ act.user_name }}</div>
                      <div class="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        <mat-icon class="text-[12px]">schedule</mat-icon> {{ act.timestamp | date:'MMM d, y, h:mm a' }}
                      </div>
                    </div>
                    <span class="self-start text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full whitespace-nowrap" [style.background]="getAuditIconBg(act.action)" [style.color]="getAuditIconColor(act.action)">
                      {{ act.action }}
                    </span>
                  </div>
                }
              </div>
              <div class="px-5 py-3 border-t border-slate-100 shrink-0">
                <a routerLink="/admin/timetable/audit" class="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1">
                  View all activity <mat-icon class="text-[14px]">arrow_forward</mat-icon>
                </a>
              </div>
            </div>

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
  protected navTabs = [
    { label: 'Overview', icon: 'grid_view' },
    { label: 'Versions', icon: 'account_tree' },
    { label: 'Drafts', icon: 'description' },
    { label: 'Conflicts', icon: 'warning' },
    { label: 'Publish Center', icon: 'rocket_launch' },
    { label: 'Audit Log', icon: 'history' },
  ];

  protected versions = signal<TimetableVersion[]>([]);
  protected activeVersion = computed(() => this.versions().find(v => v.status === 'PUBLISHED') ?? null);
  protected activeTermName = computed(() => this.activeVersion()?.academic_term_name ?? 'Term 2 - 2025/26');

  protected backendStats = signal<TimetableStats | null>(null);
  
  protected stats = computed<StatCard[]>(() => {
    const s = this.backendStats();
    return [
      { icon: 'check_circle', iconBg: '#eef2ff', iconColor: '#4f46e5', value: s?.active_version ?? '—', label: 'Active Version', sub: 'Current published' },
      { icon: 'group', iconBg: '#ecfdf5', iconColor: '#059669', value: s?.total_classes?.toString() ?? '—', label: 'Total Classes', sub: 'Across all timetables' },
      { icon: 'book', iconBg: '#f5f3ff', iconColor: '#7c3aed', value: s?.total_entries?.toString() ?? '—', label: 'Total Lessons', sub: 'Scheduled' },
      { icon: 'bolt', iconBg: '#fffbeb', iconColor: '#d97706', value: s?.conflicts?.toString() ?? '—', label: 'Conflicts', sub: 'No conflicts found' },
      { icon: 'error', iconBg: '#fff1f2', iconColor: '#e11d48', value: s?.capacity_warnings?.toString() ?? '—', label: 'Capacity Warnings', sub: 'All good' },
      { icon: 'schedule', iconBg: '#ecfdf3', iconColor: '#0d9488', value: s?.availability_issues?.toString() ?? '—', label: 'Availability Issues', sub: 'No issues' },
    ];
  });

  protected activities = signal<any[]>([]);

  protected quickActions: QuickAction[] = [
    { icon: 'add', label: 'Create New Draft', desc: 'Create a new timetable draft', action: 'createDraft' },
    { icon: 'content_copy', label: 'Clone Version', desc: 'Clone existing version', action: 'cloneVersion' },
    { icon: 'search', label: 'Check Conflicts', desc: 'Run conflict validation', action: 'checkConflicts' },
    { icon: 'cloud_upload', label: 'Publish Version', desc: 'Publish draft version', action: 'publishVersion' },
    { icon: 'compare_arrows', label: 'Compare Versions', desc: 'Compare two versions', route: '/admin/timetable/versions/compare' },
    { icon: 'list_alt', label: 'View Audit Log', desc: 'View all changes', route: '/admin/timetable/audit' },
  ];

  ngOnInit() {
    this.api.getVersions().subscribe(res => {
      this.versions.set(res);
      const active = res.find(v => v.status === 'PUBLISHED') || res[0];
      if (active) {
        this.api.getStats(active.academic_term).subscribe(st => this.backendStats.set(st));
      }
    });

    this.api.getAuditLog({ page: 1 }).subscribe(log => {
      this.activities.set(log.results.slice(0, 5));
    });
  }

  protected navigateToVersion(id: number) { this.router.navigate(['/admin/timetable/versions', id]); }
  protected openVersionMenu(event: MouseEvent, v: TimetableVersion) { event.stopPropagation(); }
  
  protected handleQuickAction(action: string) {
    if (action === 'createDraft') this.dialog.open(CreateVersionDialogComponent, { width: '480px' });
    if (['cloneVersion', 'publishVersion', 'checkConflicts'].includes(action)) {
      this.dialog.open(VersionActionDialogComponent, { width: '480px', data: { action, version: this.activeVersion() } });
    }
  }

  protected getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length > 1) return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  protected getEmail(name: string): string {
    if (!name) return 'unknown@mnara.sc.ke';
    return name.split(' ').join('.').toLowerCase() + '@mnara.sc.ke';
  }

  protected getAuditIcon(action: string): string {
    const map: any = { CREATE: 'add_circle', UPDATE: 'edit', DELETE: 'delete', PUBLISH: 'cloud_done', ARCHIVE: 'archive', CLONE: 'content_copy', ROLLBACK: 'history' };
    return map[action] ?? 'info';
  }

  protected getAuditIconBg(action: string): string {
    const map: any = { CREATE: '#ecfdf5', UPDATE: '#eef2ff', DELETE: '#fef2f2', PUBLISH: '#f0fdf4', ARCHIVE: '#fdf4ff', CLONE: '#fffbeb', ROLLBACK: '#eff6ff' };
    return map[action] ?? '#f8fafc';
  }

  protected getAuditIconColor(action: string): string {
    const map: any = { CREATE: '#059669', UPDATE: '#4f46e5', DELETE: '#dc2626', PUBLISH: '#16a34a', ARCHIVE: '#c026d3', CLONE: '#d97706', ROLLBACK: '#3b82f6' };
    return map[action] ?? '#475569';
  }
}
