import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  TimetableApiService,
  TimetableVersion,
  TimetableStats,
  TimetableConflict,
} from '@sms/domain/timetable';
import { VersionStatusBadgeComponent } from '../../components/version-status-badge/version-status-badge.component';

interface QuickAction {
  icon: string;
  label: string;
  desc: string;
  route: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { icon: 'edit_calendar',  label: 'Editor',        desc: 'Edit timetable entries',           route: '/admin/timetable/editor' },
  { icon: 'account_tree',   label: 'Versions',      desc: 'Manage timetable versions',         route: '/admin/timetable/versions' },
  { icon: 'history',        label: 'Audit Log',     desc: 'View change history',              route: '/admin/timetable/audit' },
  { icon: 'settings',       label: 'Setup',         desc: 'Rooms, subjects & bell schedules',  route: '/admin/timetable/setup/rooms' },
];

const CONFLICT_STYLE: Record<string, { bg: string; dot: string }> = {
  ERROR:   { bg: 'bg-red-50 border-red-200', dot: 'bg-red-500' },
  WARNING: { bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-400' },
};

@Component({
  selector: 'app-timetable-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, TitleCasePipe, MatButtonModule, MatIconModule, MatTooltipModule, VersionStatusBadgeComponent],
  template: `
    <div class="min-h-screen p-6">
      <div class="max-w-[1400px] mx-auto">

        <!-- Header -->
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
            <p class="text-sm text-slate-500 mt-1">Overview of your school timetable</p>
          </div>
        </div>

        <!-- Loading skeleton -->
        @if (loading()) {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            @for (_ of [1,2,3,4]; track _) {
              <div class="rounded-2xl border border-slate-200 bg-white p-5 animate-pulse">
                <div class="flex items-center gap-3">
                  <div class="w-11 h-11 rounded-xl bg-slate-200"></div>
                  <div class="flex flex-col gap-2">
                    <div class="h-6 w-16 bg-slate-200 rounded"></div>
                    <div class="h-3 w-24 bg-slate-200 rounded"></div>
                  </div>
                </div>
              </div>
            }
          </div>
        }

        <!-- Error state -->
        @if (errorMessage(); as err) {
          <div class="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-sm text-red-700">
            <mat-icon class="text-red-500 shrink-0">error_outline</mat-icon>
            <span>{{ err }}</span>
            <button mat-stroked-button (click)="loadData()" class="ml-auto !text-xs !text-red-700 !border-red-300">
              Retry
            </button>
          </div>
        }

        <!-- Content -->
        @if (!loading() && !errorMessage()) {
          <!-- Summary Cards -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            @for (s of statCards(); track s.label; let i = $index) {
              <div class="stat-card rounded-2xl border border-slate-200 bg-white p-5 flex items-center gap-3
                          transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 cursor-default">
                <div class="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                     [style.background]="s.iconBg" [style.color]="s.iconColor">
                  <mat-icon>{{ s.icon }}</mat-icon>
                </div>
                <div>
                  <span class="text-xl font-bold text-slate-900 block leading-tight">{{ s.value }}</span>
                  <span class="text-xs text-slate-500">{{ s.label }}</span>
                </div>
              </div>
            }
          </div>

          <!-- Active Version + Recent Conflicts -->
          <div class="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-6 mb-8">

            <!-- Active Version Card -->
            <div class="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Active Version</h2>
              @if (activeVersion(); as v) {
                <div class="flex items-start gap-4">
                  <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl shrink-0">
                    <mat-icon>calendar_month</mat-icon>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="text-lg font-bold text-slate-900">{{ v.name }}</span>
                      <app-version-status-badge [status]="v.status" />
                    </div>
                    <div class="mt-3 space-y-1.5 text-sm text-slate-500">
                      <div class="flex items-center gap-2">
                        <mat-icon class="text-sm text-slate-400">post_add</mat-icon>
                        <span>{{ v.entry_count }} entries</span>
                      </div>
                      @if (v.published_at) {
                        <div class="flex items-center gap-2">
                          <mat-icon class="text-sm text-slate-400">check_circle</mat-icon>
                          <span>Published {{ v.published_at | date:'d MMM y, h:mm a' }}</span>
                        </div>
                      }
                      <div class="flex items-center gap-2">
                        <mat-icon class="text-sm text-slate-400">person</mat-icon>
                        <span>Created by {{ v.created_by_name }}</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <mat-icon class="text-sm text-slate-400">schedule</mat-icon>
                        <span>Updated {{ v.updated_at | date:'d MMM y' }}</span>
                      </div>
                    </div>
                    <div class="mt-4 flex gap-2">
                      <a mat-stroked-button routerLink="/admin/timetable/editor" class="!text-xs">
                        <mat-icon class="text-sm">edit</mat-icon> Open Editor
                      </a>
                      <a mat-stroked-button routerLink="/admin/timetable/versions" class="!text-xs">
                        <mat-icon class="text-sm">list</mat-icon> All Versions
                      </a>
                    </div>
                  </div>
                </div>
              } @else {
                <div class="flex flex-col items-center gap-3 py-10 text-center">
                  <mat-icon class="text-5xl text-slate-200 mb-1">calendar_month</mat-icon>
                  <p class="text-sm font-medium text-slate-600">No versions yet</p>
                  <p class="text-xs text-slate-400">Create a timetable version to get started</p>
                  <a mat-stroked-button routerLink="/admin/timetable/versions" class="mt-1 !text-xs">
                    <mat-icon class="text-sm">add</mat-icon> Create Version
                  </a>
                </div>
              }
            </div>

            <!-- Recent Conflicts -->
            <div class="rounded-2xl border border-slate-200 bg-white p-6">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recent Conflicts</h2>
                <a mat-stroked-button routerLink="/admin/timetable/conflicts" class="!text-xs">
                  View All
                </a>
              </div>
              @if (recentConflicts().length > 0) {
                <div class="space-y-2">
                  @for (c of recentConflicts(); track conflictKey(c)) {
                    <div class="flex items-start gap-3 p-3 rounded-xl border cursor-default"
                         [class]="CONFLICT_STYLE[c.severity]?.bg ?? 'bg-slate-50 border-slate-200'">
                      <span class="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
                            [class]="CONFLICT_STYLE[c.severity]?.dot ?? 'bg-slate-400'"></span>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-slate-800 truncate">{{ c.description }}</p>
                        <p class="text-xs text-slate-500 mt-0.5">
                          {{ c.conflict_type | titlecase }}
                          @if (c.start_time) { · {{ c.start_time }}–{{ c.end_time }} }
                        </p>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="flex flex-col items-center gap-3 py-10 text-center">
                  <mat-icon class="text-5xl text-green-200 mb-1">check_circle</mat-icon>
                  <p class="text-sm font-medium text-slate-600">No conflicts found</p>
                  <p class="text-xs text-slate-400">All entries are properly scheduled</p>
                </div>
              }
            </div>
          </div>

          <!-- Quick Links -->
          <h2 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Links</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            @for (qa of QUICK_ACTIONS; track qa.label) {
              <a [routerLink]="qa.route"
                 class="block rounded-2xl border border-slate-200 bg-white p-5
                        transition-all duration-150 hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 cursor-pointer">
                <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 text-xl">
                  <mat-icon>{{ qa.icon }}</mat-icon>
                </div>
                <h3 class="text-sm font-semibold text-slate-900">{{ qa.label }}</h3>
                <p class="text-xs text-slate-500 mt-0.5">{{ qa.desc }}</p>
              </a>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; background: #f8fafc; min-height: 100vh; }
    @keyframes countIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .stat-card { animation: countIn 0.4s ease-out both; }
    .stat-card:nth-child(1) { animation-delay: 0.05s; }
    .stat-card:nth-child(2) { animation-delay: 0.1s; }
    .stat-card:nth-child(3) { animation-delay: 0.15s; }
    .stat-card:nth-child(4) { animation-delay: 0.2s; }
  `],
})
export class TimetableDashboardPage implements OnInit {
  private api = inject(TimetableApiService);
  private snackbar = inject(MatSnackBar);

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly stats = signal<TimetableStats | null>(null);
  readonly versions = signal<TimetableVersion[]>([]);
  readonly conflicts = signal<TimetableConflict[]>([]);

  readonly activeVersion = computed(() => {
    const list = this.versions();
    return list.find((v) => v.status === 'PUBLISHED') ?? list[0] ?? null;
  });

  readonly recentConflicts = computed(() => this.conflicts().slice(0, 5));

  readonly statCards = computed(() => {
    const s = this.stats();
    if (!s) return [];
    return [
      { icon: 'calendar_view_week', iconBg: '#eff6ff', iconColor: '#2563eb', value: String(s.total_entries), label: 'Total Entries' },
      { icon: 'school', iconBg: '#f0fdf4', iconColor: '#16a34a', value: String(s.total_classes), label: 'Total Classes' },
      { icon: 'warning', iconBg: '#fef2f2', iconColor: '#dc2626', value: String(s.conflicts), label: 'Conflicts' },
      { icon: 'group', iconBg: '#fdf4ff', iconColor: '#c026d3', value: String(s.capacity_warnings), label: 'Capacity Warnings' },
    ];
  });

  readonly CONFLICT_STYLE = CONFLICT_STYLE;
  readonly QUICK_ACTIONS = QUICK_ACTIONS;

  protected conflictKey(c: TimetableConflict): string {
    return `${c.entry_a_id ?? 0}-${c.entry_b_id ?? 0}-${c.conflict_type}-${c.start_time}`;
  }

  ngOnInit(): void {
    this.loadData();
  }

  protected loadData(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.api.getAcademicTerms().subscribe({
      next: (terms) => {
        const activeTerm = terms[0];
        if (!activeTerm) {
          this.loading.set(false);
          return;
        }
        this.api.getStats(activeTerm.id).subscribe({
          next: (s) => this.stats.set(s),
          error: () => this.stats.set(null),
        });
        this.api.getVersions(activeTerm.id).subscribe({
          next: (v) => this.versions.set(v),
          error: () => this.versions.set([]),
        });
        this.api.checkConflicts(activeTerm.id).subscribe({
          next: (res) => this.conflicts.set(res.conflicts ?? []),
          error: () => this.conflicts.set([]),
          complete: () => this.loading.set(false),
        });
      },
      error: (err) => {
        this.errorMessage.set(err.message ?? 'Failed to load timetable data');
        this.loading.set(false);
      },
    });
  }
}
