import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TimetableGridComponent } from '@sms/frontend/timetable-matrix';
import {
  TimetableApiService,
  TimetableStateService,
  TimetableVersion,
  TeacherOption,
  AuditLogEntry,
} from '@sms/domain/timetable';

const JUNE_2026 = [
  [ 1,  2,  3,  4,  5,  6,  7],
  [ 8,  9, 10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19, 20, 21],
  [22, 23, 24, 25, 26, 27, 28],
  [29, 30],
];

const DAY_HEADERS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

@Component({
  selector: 'app-timetable-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatSelectModule,
    MatIconModule,
    TimetableGridComponent,
  ],
  template: `
    <div class="min-h-screen bg-[#f1f4f9] font-['Inter',sans-serif]">

      <!-- ===== TOP BAR ===== -->
      <header class="flex items-center justify-between px-8 py-3.5 bg-white border-b border-[#e9eef4]">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 bg-[#1a2a6c] rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm">M</div>
          <span class="text-sm font-semibold text-[#0b1a2e]">Mnara School</span>

        </div>
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-sm font-semibold text-[#0b1a2e] cursor-pointer select-none transition-shadow hover:shadow-md">
            {{ avatarLabel() }}
          </div>
        </div>
      </header>

      <!-- ===== PAGE CONTENT ===== -->
      <div class="max-w-[1360px] mx-auto px-8 py-7 page-fade-in">

        <!-- ===== PAGE TITLE ===== -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-[#0b1a2e] tracking-tight">Timetable Management</h1>
          <p class="text-sm text-[#5e6f8d] mt-1">Create, manage, and publish school timetables with confidence</p>
        </div>

        <!-- ===== STATS ROW ===== -->
        <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          @for (stat of stats(); track stat.label) {
            <div class="bg-white rounded-xl p-4 border border-[#e9eef4] shadow-sm flex items-center gap-3.5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
              <div class="w-10 h-10 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                   [style.background]="stat.iconBg"
                   [style.color]="stat.iconColor">
                <mat-icon>{{ stat.icon }}</mat-icon>
              </div>
              <div>
                <div class="text-lg font-bold text-[#0b1a2e] leading-tight">{{ stat.value }}</div>
                <div class="text-xs text-[#5e6f8d] mt-0.5">{{ stat.label }}</div>
              </div>
            </div>
          }
        </div>

        <!-- ===== VERSION INFO BAR ===== -->
        @if (publishedVersion(); as pv) {
          <div class="flex items-center justify-between bg-white rounded-xl px-6 py-4 border border-[#e9eef4] shadow-sm mb-6">
            <div class="flex items-center gap-4 flex-wrap">
              <div>
                <div class="text-[11px] font-semibold text-[#5e6f8d] uppercase tracking-wider">Current Version</div>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="text-base font-bold text-[#0b1a2e]">{{ pv.name }}</span>
                  <span class="text-xs font-medium text-[#dc2626] bg-[#fef2f2] px-2.5 py-0.5 rounded-full">REQUIRES ATTENTION</span>
                </div>
              </div>
              <span class="text-sm text-[#5e6f8d] hidden sm:inline">Published {{ formatDate(pv.published_at) }}</span>
            </div>
            <div class="flex items-center gap-2">
              <button class="text-sm font-medium text-[#5e6f8d] bg-transparent border border-[#edf2f7] px-4 py-2 rounded-lg hover:bg-[#f8faff] transition-colors flex items-center gap-1.5"
                      (click)="navigateTo('/admin/timetable/admin')">
                <mat-icon class="text-sm">edit</mat-icon> Edit
              </button>
              <button class="text-sm font-medium text-white bg-[#1a2a6c] px-4 py-2 rounded-lg hover:bg-[#14225a] transition-colors flex items-center gap-1.5 shadow-sm"
                      (click)="publishFirstDraft()">
                <mat-icon class="text-sm">cloud_upload</mat-icon> Publish Draft
              </button>
            </div>
          </div>
        }

        <!-- ===== MAIN GRID ===== -->
        <div class="grid grid-cols-[1fr_340px] max-xl:grid-cols-1 gap-6 mb-8">

          <!-- LEFT: Timetable Table -->
          <section class="bg-white rounded-xl border border-[#e9eef4] overflow-hidden shadow-sm">
            <div class="flex items-center justify-between px-5 py-4 border-b border-[#e9eef4] flex-wrap gap-2">
              <div class="flex items-center gap-2 flex-wrap">
                <mat-icon class="text-base text-[#1a2a6c]">list</mat-icon>
                <span class="text-sm font-semibold text-[#0b1a2e]">Timetable</span>
                <mat-select [(ngModel)]="selectedTermId" placeholder="Term"
                  class="!w-36 !text-xs" appearance="outline">
                  @for (v of uniqueTerms(); track v.termId) {
                    <mat-option [value]="v.termId">{{ v.termName }}</mat-option>
                  }
                </mat-select>
                @if (selectedTermId()) {
                  <mat-select [(ngModel)]="selectedYearGroupId" placeholder="Year"
                    class="!w-32 !text-xs" appearance="outline">
                    <mat-option [value]="null">All</mat-option>
                    @for (yg of yearGroups(); track yg.id) {
                      <mat-option [value]="yg.id">{{ yg.name }}</mat-option>
                    }
                  </mat-select>
                  <mat-select [(ngModel)]="selectedTeacherId" placeholder="Teacher"
                    class="!w-32 !text-xs" appearance="outline">
                    <mat-option [value]="null">All</mat-option>
                    @for (t of teachers(); track t.id) {
                      <mat-option [value]="t.id">{{ t.name }}</mat-option>
                    }
                  </mat-select>
                }
              </div>
              <div class="flex items-center gap-2">
                <button class="text-xs font-medium text-[#5e6f8d] bg-transparent border border-[#edf2f7] px-3 py-1.5 rounded-lg hover:bg-[#f8faff] transition-colors flex items-center gap-1">
                  <mat-icon class="text-xs">filter_list</mat-icon> Filter
                </button>
                <button class="text-xs font-medium text-[#5e6f8d] bg-transparent border border-[#edf2f7] px-3 py-1.5 rounded-lg hover:bg-[#f8faff] transition-colors flex items-center gap-1">
                  <mat-icon class="text-xs">download</mat-icon> Export
                </button>
              </div>
            </div>
            <div class="h-[calc(100vh-500px)] min-h-[400px] p-1">
              <app-timetable-grid
                [termId]="selectedTermId() ?? undefined"
                [yearGroupId]="selectedYearGroupId() ?? undefined"
                [teacherId]="selectedTeacherId() ?? undefined" />
            </div>
          </section>

          <!-- RIGHT: Calendar + Activity -->
          <aside class="flex flex-col gap-6">

            <!-- Calendar Card -->
            <div class="bg-white rounded-xl border border-[#e9eef4] overflow-hidden shadow-sm">
              <div class="flex items-center justify-between px-5 py-3.5 border-b border-[#e9eef4]">
                <div class="flex items-center gap-2">
                  <mat-icon class="text-sm text-[#1a2a6c]">calendar_month</mat-icon>
                  <span class="text-sm font-semibold text-[#0b1a2e]">Calendar</span>
                </div>
                <div class="flex items-center gap-1">
                  <button class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#f1f4f9] text-[#5e6f8d] transition-colors">
                    <mat-icon class="text-sm">chevron_left</mat-icon>
                  </button>
                  <span class="text-xs font-medium text-[#0b1a2e] min-w-[72px] text-center">June 2026</span>
                  <button class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#f1f4f9] text-[#5e6f8d] transition-colors">
                    <mat-icon class="text-sm">chevron_right</mat-icon>
                  </button>
                </div>
              </div>
              <div class="p-4">
                <div class="grid grid-cols-7 mb-1">
                  @for (d of dayHeaders; track d) {
                    <div class="text-center text-[10px] font-semibold text-[#5e6f8d] uppercase tracking-wider py-1">{{ d }}</div>
                  }
                </div>
                @for (week of calendarWeeks; track week; let rowIdx = $index) {
                  <div class="grid grid-cols-7">
                    @for (day of week; track day; let colIdx = $index) {
                      <div class="text-center text-xs py-1 rounded-md transition-colors"
                           [class.text-[#5e6f8d]]="!isToday(day)"
                           [class.text-white]="isToday(day)"
                           [class.bg-[#1a2a6c]]="isToday(day)"
                           [class.font-bold]="isToday(day)">
                        {{ day || '' }}
                      </div>
                    }
                  </div>
                }
              </div>
            </div>

            <!-- Recent Activity Card -->
            <div class="bg-white rounded-xl border border-[#e9eef4] overflow-hidden shadow-sm">
              <div class="px-5 py-3.5 border-b border-[#e9eef4]">
                <div class="flex items-center gap-2">
                  <mat-icon class="text-sm text-[#1a2a6c]">history</mat-icon>
                  <span class="text-sm font-semibold text-[#0b1a2e]">Recent Activity</span>
                </div>
              </div>
              <div class="max-h-[240px] overflow-y-auto p-1">
                @for (act of recentActivity(); track act.id) {
                  <div class="flex gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-[#f8faff]">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 mt-0.5"
                         [style.background]="act.iconBg"
                         [style.color]="act.iconColor">
                      <mat-icon class="text-sm">{{ act.icon }}</mat-icon>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-sm font-medium text-[#0b1a2e] leading-tight" [innerHTML]="act.title"></div>
                      <div class="text-xs text-[#5e6f8d] mt-0.5 leading-relaxed" [innerHTML]="act.desc"></div>
                      <div class="text-[11px] text-[#8a9bb5] mt-1 flex items-center gap-2">
                        <span class="flex items-center gap-1"><mat-icon class="text-[11px]">schedule</mat-icon> {{ act.time }}</span>
                        @if (act.user) {
                          <span class="flex items-center gap-1"><mat-icon class="text-[11px]">person</mat-icon> {{ act.user }}</span>
                        }
                      </div>
                    </div>
                    @if (act.badge) {
                      <span class="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 mt-0.5"
                            [style.background]="act.badgeBg"
                            [style.color]="act.badgeColor">{{ act.badge }}</span>
                    }
                  </div>
                } @empty {
                  <div class="flex flex-col items-center justify-center py-10 text-center">
                    <mat-icon class="text-3xl text-[#8a9bb5] mb-3">history</mat-icon>
                    <p class="text-sm text-[#5e6f8d]">No recent activity</p>
                    <p class="text-xs text-[#8a9bb5] mt-1">Changes to timetables will appear here</p>
                  </div>
                }
              </div>
            </div>
          </aside>
        </div>

        <!-- ===== QUICK ACTIONS ===== -->
        <div class="mb-8">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <mat-icon class="text-base text-[#1a2a6c]">bolt</mat-icon>
              <span class="text-sm font-semibold text-[#0b1a2e]">Quick Actions</span>
            </div>
            <button class="text-xs font-medium text-[#1a2a6c] hover:underline flex items-center gap-1 bg-transparent border-none cursor-pointer"
                    (click)="navigateTo('/admin/timetable/audit')">
              View all actions <mat-icon class="text-xs">arrow_forward</mat-icon>
            </button>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            @for (qa of quickActions(); track qa.label) {
              <button class="bg-white border border-[#e9eef4] rounded-xl p-4 text-center cursor-pointer transition-all duration-200 flex flex-col items-center gap-1.5 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                      (click)="qa.action?.()">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center text-base transition-all duration-200"
                     [style.background]="qa.iconBg"
                     [style.color]="qa.iconColor"
                     (mouseenter)="onQaHover($event)"
                     (mouseleave)="onQaLeave($event)">
                  <mat-icon>{{ qa.icon }}</mat-icon>
                </div>
                <span class="text-sm font-medium text-[#0b1a2e]">{{ qa.label }}</span>
                <span class="text-[11px] text-[#5e6f8d] leading-tight">{{ qa.desc }}</span>
              </button>
            }
          </div>
        </div>


      </div>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; }
  `],
})
export class TimetableViewPage implements OnInit {
  private api = inject(TimetableApiService);
  private state = inject(TimetableStateService);
  protected router = inject(Router);
  private snackbar = inject(MatSnackBar);

  protected versions = this.state.versions;

  protected dayHeaders = DAY_HEADERS;
  protected calendarWeeks = JUNE_2026;

  protected auditLogEntries = signal<AuditLogEntry[]>([]);
  protected conflictCount = signal<number>(0);

  protected isToday(day: number | null): boolean {
    return day === 22;
  }

  protected publishedVersion = computed<TimetableVersion | null>(() =>
    this.state.versions().find((v) => v.status === 'PUBLISHED') ?? null
  );

  protected uniqueTerms = computed(() => {
    const seen = new Set<number>();
    return this.state.versions()
      .filter((v) => { if (seen.has(v.academic_term)) return false; seen.add(v.academic_term); return true; })
      .map((v) => ({ termId: v.academic_term, termName: v.academic_term_name }));
  });

  protected selectedTermId = signal<number | null>(null);
  protected selectedYearGroupId = signal<number | null>(null);
  protected selectedTeacherId = signal<number | null>(null);

  protected yearGroups = signal<{ id: number; name: string }[]>([]);
  protected teachers = signal<TeacherOption[]>([]);
  protected isCreating = signal(false);

  protected avatarLabel = computed(() => {
    const pv = this.publishedVersion();
    return pv?.created_by_name ? pv.created_by_name.split(' ').map(s => s[0]).join('').toUpperCase().slice(0, 2) : 'AD';
  });

  protected stats = computed(() => {
    const pv = this.publishedVersion();
    const entryCount = pv?.entry_count ?? 0;
    const classCount = Math.round(entryCount / 25);
    const conflicts = this.conflictCount();
    return [
      { icon: 'description', label: 'Active Version', value: pv?.name ?? '\u2014',   iconBg: '#e8edfb', iconColor: '#1a2a6c' },
      { icon: 'group',       label: 'Total Classes',   value: classCount.toString(), iconBg: '#dbeafe', iconColor: '#2563eb' },
      { icon: 'book',        label: 'Total Lessons',   value: entryCount.toString(), iconBg: '#d1fae5', iconColor: '#059669' },
      { icon: 'warning',     label: 'Conflicts',       value: conflicts.toString(),  iconBg: '#fef3c7', iconColor: '#d97706' },
      { icon: 'warning',     label: 'Capacity Warn',   value: '0',                   iconBg: '#fee2e2', iconColor: '#e11d48' },
      { icon: 'schedule',    label: 'Availability',    value: '0',                   iconBg: '#ccfbf1', iconColor: '#0d9488' },
    ];
  });

  protected recentActivity = computed(() => {
    const logs = this.auditLogEntries();
    if (logs.length > 0) {
      return logs.slice(0, 10).map((log) => ({
        id: log.id,
        icon: this._actionIcon(log.action),
        iconBg: '#e8edfb',
        iconColor: '#1a2a6c',
        title: `<strong style="color:#1a2a6c">${log.action}</strong> ${log.entity_type.replace('Timetable', '')}`,
        desc: log.detail ? JSON.stringify(log.detail).slice(0, 100) : `${log.action.toLowerCase()}d by ${log.user_name}`,
        time: this._relativeTime(log.timestamp || new Date().toISOString()),
        user: log.user_name,
        badge: log.action,
        badgeBg: '#e8edfb',
        badgeColor: '#1a2a6c',
      }));
    }
    const pv = this.publishedVersion();
    if (!pv) return [];
    return [{
      id: pv.id, icon: 'check', iconBg: '#dcfce7', iconColor: '#15803d',
      title: `Version <strong style="color:#1a2a6c">${pv.name}</strong> published`,
      desc: 'Published by ' + (pv.created_by_name || 'System'),
      time: 'Today', user: pv.created_by_name, badge: 'Live', badgeBg: '#dcfce7', badgeColor: '#15803d',
    }];
  });

  protected quickActions = computed(() => {
    const pv = this.publishedVersion();
    const creating = this.isCreating();
    return [
      { label: 'Create New Draft',  desc: 'Start a new timetable draft from scratch',    icon: 'add',          iconBg: '#e8edfb', iconColor: '#1a2a6c', action: () => this.createDraft() },
      { label: 'Clone Version', desc: 'Clone the published version with all entries',  icon: 'content_copy', iconBg: '#e8edfb', iconColor: '#1a2a6c', action: () => this._cloneVersion(pv) },
      { label: 'Check Conflicts', desc: 'Run conflict validation for the selected term', icon: 'search',       iconBg: '#e8edfb', iconColor: '#1a2a6c', action: () => this._checkConflicts() },
      { label: 'Publish Draft', desc: creating ? 'Publishing...' : 'Publish the first available draft',  icon: 'cloud_upload', iconBg: '#e8edfb', iconColor: '#1a2a6c', action: () => this.publishFirstDraft() },
      { label: 'Compare Versions', desc: 'Compare two versions side by side',      icon: 'call_split',   iconBg: '#e8edfb', iconColor: '#1a2a6c', action: () => this.router.navigate(['/admin/timetable/versions']) },
      { label: 'View Audit Log',   desc: 'View the complete change history',       icon: 'list',         iconBg: '#e8edfb', iconColor: '#1a2a6c', action: () => this.router.navigate(['/admin/timetable/audit']) },
    ];
  });

  ngOnInit(): void {
    if (this.state.versions().length === 0) {
      this.api.getVersions().subscribe({
        next: (list) => {
          this.state.setVersions(list);
          const published = list.find((v) => v.status === 'PUBLISHED');
          if (published) {
            this.selectedTermId.set(published.academic_term);
            this._loadSecondaryData(published.academic_term);
          }
        },
      });
    } else {
      const published = this.publishedVersion();
      if (published) this._loadSecondaryData(published.academic_term);
    }

    this.api.getTeachers().subscribe({
      next: (list) => this.teachers.set(list),
    });

    this.api.getClassrooms().subscribe({
      next: (list) => this.yearGroups.set(
        list.map((c) => ({ id: c.id, name: c.year_level_name + ' ' + c.name }))
      ),
    });
  }

  private _loadSecondaryData(termId: number): void {
    this.api.getAuditLog({ page: 1 }).subscribe({
      next: (res) => {
        this.auditLogEntries.set(res.results || []);
      },
    });

    this.api.checkConflicts(termId).subscribe({
      next: (res) => this.conflictCount.set(res.count ?? 0),
    });
  }

  protected createDraft(): void {
    const pv = this.publishedVersion();
    if (!pv) { this.snackbar.open('No published version to base draft on', 'Close', { duration: 3000 }); return; }
    this.isCreating.set(true);
    this.api.createVersion({
      name: `Draft — ${pv.academic_term_name} (${new Date().toLocaleDateString()})`,
      academic_term: pv.academic_term,
    }).subscribe({
      next: (v) => {
        this.state.setVersions([...this.state.versions(), v]);
        this.snackbar.open(`Draft "${v.name}" created`, 'Close', { duration: 3000 });
        this.isCreating.set(false);
      },
      error: () => { this.snackbar.open('Failed to create draft', 'Close', { duration: 3000 }); this.isCreating.set(false); },
    });
  }

  private _cloneVersion(pv: TimetableVersion | null): void {
    if (!pv) { this.snackbar.open('No version to clone', 'Close', { duration: 3000 }); return; }
    this.api.cloneVersion(pv.id, { name: `Clone — ${pv.name}`, copy_entries: true }).subscribe({
      next: (v) => {
        this.state.setVersions([...this.state.versions(), v]);
        this.snackbar.open(`Version "${v.name}" created from clone`, 'Close', { duration: 3000 });
      },
      error: () => this.snackbar.open('Failed to clone version', 'Close', { duration: 3000 }),
    });
  }

  private _checkConflicts(): void {
    const termId = this.selectedTermId();
    if (!termId) { this.snackbar.open('Select a term first', 'Close', { duration: 3000 }); return; }
    this.api.checkConflicts(termId).subscribe({
      next: (res) => {
        this.conflictCount.set(res.count ?? 0);
        this.snackbar.open(`${res.count} conflict(s) found`, 'Close', { duration: 3000 });
      },
      error: () => this.snackbar.open('Failed to check conflicts', 'Close', { duration: 3000 }),
    });
  }

  protected publishFirstDraft(): void {
    const drafts = this.state.versions().filter((v) => v.status === 'DRAFT');
    if (drafts.length === 0) { this.snackbar.open('No draft versions to publish', 'Close', { duration: 3000 }); return; }
    this.isCreating.set(true);
    this.api.publishVersion(drafts[0].id).subscribe({
      next: (v) => {
        this.state.updateVersion(v);
        this.snackbar.open(`"${v.name}" published`, 'Close', { duration: 3000 });
        this.isCreating.set(false);
      },
      error: () => { this.snackbar.open('Failed to publish draft', 'Close', { duration: 3000 }); this.isCreating.set(false); },
    });
  }

  protected navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  protected formatDate(d: string | null | undefined): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  protected onQaHover(ev: MouseEvent): void {
    const el = ev.currentTarget as HTMLElement;
    el.style.background = '#1a2a6c';
    el.style.color = '#fff';
  }

  protected onQaLeave(ev: MouseEvent): void {
    const el = ev.currentTarget as HTMLElement;
    el.style.background = '';
    el.style.color = '';
  }

  private _actionIcon(action: string): string {
    const map: Record<string, string> = { CREATE: 'add_circle', UPDATE: 'edit', DELETE: 'delete', PUBLISH: 'check', ARCHIVE: 'archive', ROLLBACK: 'undo', CLONE: 'content_copy' };
    return map[action] || 'history';
  }

  private _relativeTime(ts: string): string {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }
}
