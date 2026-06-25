import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
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
  TimetableStats,
} from '@sms/domain/timetable';
import { SharedCalendarService } from '@sms/shared/services';

type NavTab = 'Overview' | 'Versions' | 'Drafts' | 'Conflicts' | 'Publish Center' | 'Audit Log';

const NAV_TABS: { label: NavTab; icon: string }[] = [
  { label: 'Overview',      icon: 'grid_view'    },
  { label: 'Versions',      icon: 'account_tree' },
  { label: 'Drafts',        icon: 'description'  },
  { label: 'Conflicts',     icon: 'warning'      },
  { label: 'Publish Center',icon: 'rocket_launch'},
  { label: 'Audit Log',     icon: 'history'      },
];

const ACTION_ICON_MAP: Record<string, string> = {
  CREATE: 'add_circle', UPDATE: 'edit', DELETE: 'delete',
  PUBLISH: 'cloud_done', ARCHIVE: 'archive', CLONE: 'content_copy', ROLLBACK: 'history',
};
const ACTION_BG_MAP: Record<string, string> = {
  CREATE: '#ecfdf5', UPDATE: '#eef2ff', DELETE: '#fef2f2',
  PUBLISH: '#f0fdf4', ARCHIVE: '#fdf4ff', CLONE: '#fffbeb', ROLLBACK: '#eff6ff',
};
const ACTION_COLOR_MAP: Record<string, string> = {
  CREATE: '#059669', UPDATE: '#4f46e5', DELETE: '#dc2626',
  PUBLISH: '#16a34a', ARCHIVE: '#c026d3', CLONE: '#d97706', ROLLBACK: '#3b82f6',
};

@Component({
  selector: 'app-timetable-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, DatePipe, MatSelectModule, MatIconModule, TimetableGridComponent],
  styles: [`
    :host { display: block; min-height: 100vh; }
    .nav-tab {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 16px; font-size: 14px; font-weight: 500;
      color: #64748b; cursor: pointer; white-space: nowrap;
      border-bottom: 2px solid transparent;
      border-top: none; border-left: none; border-right: none;
      background: transparent; transition: color 0.2s, border-color 0.2s;
    }
    .nav-tab:hover  { color: #0f172a; }
    .nav-tab.active { color: #2563eb; border-bottom-color: #2563eb; }
    .avatar-circle {
      width: 32px; height: 32px; border-radius: 50%;
      background: #e2e8f0; color: #334155;
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 700; flex-shrink: 0;
    }
    .stat-card {
      background: #fff; border: 1px solid #e2e8f0; border-radius: 14px;
      padding: 16px; display: flex; align-items: center; gap: 14px;
      transition: box-shadow 0.2s, transform 0.2s;
    }
    .stat-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.08); transform: translateY(-2px); }
    .stat-icon {
      width: 44px; height: 44px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; flex-shrink: 0;
    }
    .qa-card {
      background: #fff; border: 1px solid #e2e8f0; border-radius: 14px;
      padding: 16px; display: flex; flex-direction: column;
      align-items: center; gap: 6px; text-align: center; cursor: pointer;
      transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s;
      border-top: none; border-left: none; border-right: none;
      border: 1px solid #e2e8f0;
    }
    .qa-card:hover { box-shadow: 0 8px 32px rgba(37,99,235,0.10); transform: translateY(-3px); border-color: #bfdbfe; }
    .qa-icon {
      width: 44px; height: 44px; border-radius: 12px;
      background: #eff6ff; color: #2563eb;
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; transition: background 0.2s, color 0.2s;
    }
    .qa-card:hover .qa-icon { background: #2563eb; color: #fff; }
    .tbl-row { border-bottom: 1px solid #f1f5f9; transition: background 0.15s; cursor: pointer; }
    .tbl-row:last-child { border-bottom: none; }
    .tbl-row:hover { background: #f8fafc; }
    .act-row { display: flex; gap: 14px; padding: 10px 12px; border-radius: 12px; transition: background 0.15s; }
    .act-row:hover { background: #f8fafc; }
  `],
  template: `
    <div style="background:#f1f4f9; min-height:100vh; font-family:'Inter',system-ui,sans-serif;">

      <!-- ── OUTER CARD ───────────────────────────────────────── -->
      <div style="max-width:1440px; margin:24px auto; background:#fff; border-radius:20px; box-shadow:0 1px 6px rgba(0,0,0,0.06); border:1px solid #e2e8f0; padding:32px;">

        <!-- HEADER -->
        <header style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:16px; margin-bottom:24px;">
          <div style="display:flex; align-items:center; gap:16px;">
            <div style="width:44px; height:44px; background:#2563eb; border-radius:14px; box-shadow:0 4px 12px rgba(37,99,235,0.25); display:flex; align-items:center; justify-content:center; color:#fff;">
              <mat-icon>calendar_month</mat-icon>
            </div>
            <div>
              <h1 style="font-size:1.5rem; font-weight:800; color:#0f172a; margin:0; letter-spacing:-0.5px;">Timetable Management</h1>
              <p style="font-size:13px; color:#64748b; margin:2px 0 0;">Create, manage, and publish school timetables with confidence</p>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            <span style="display:flex; align-items:center; gap:8px; border:1px solid #e2e8f0; border-radius:999px; padding:6px 16px; font-size:13px; font-weight:500; color:#475569; background:#fff;">
              <mat-icon style="font-size:16px; color:#94a3b8;">calendar_today</mat-icon>
              {{ activeTermName() }}
            </span>
            <div style="width:36px; height:36px; border-radius:50%; background:#e2e8f0; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; color:#334155;">{{ avatarLabel() }}</div>
          </div>
        </header>

        <!-- NAV TABS -->
        <nav style="display:flex; border-bottom:2px solid #e2e8f0; margin-bottom:32px; gap:4px; overflow-x:auto;">
          @for (tab of navTabs; track tab.label) {
            <button class="nav-tab" [class.active]="activeTab()===tab.label" (click)="activeTab.set(tab.label)">
              <mat-icon style="font-size:18px;">{{ tab.icon }}</mat-icon> {{ tab.label }}
            </button>
          }
        </nav>

        <!-- ── STATS CARDS ──────────────────────────────────────── -->
        <div style="display:grid; grid-template-columns:repeat(6,1fr); gap:14px; margin-bottom:32px;">
          @for (s of stats(); track s.label) {
            <div class="stat-card">
              <div class="stat-icon" [style.background]="s.iconBg" [style.color]="s.iconColor">
                <mat-icon>{{ s.icon }}</mat-icon>
              </div>
              <div>
                <div style="font-size:1.2rem; font-weight:800; color:#0f172a; line-height:1.1;">{{ s.value }}</div>
                <div style="font-size:11px; color:#64748b; margin-top:2px;">{{ s.label }}</div>
              </div>
            </div>
          }
        </div>

        <!-- ── VERSION INFO BAR ───────────────────────────────── -->
        @if (publishedVersion(); as pv) {
          <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:16px; background:linear-gradient(90deg,#f8fafc 0%,#fff 100%); border:1px solid #e2e8f0; border-radius:14px; padding:18px 24px; margin-bottom:32px;">
            <div style="display:flex; align-items:center; flex-wrap:wrap; gap:16px;">
              <div>
                <div style="font-size:18px; font-weight:700; color:#0f172a; display:flex; align-items:center; gap:10px;">
                  Version {{ pv.name }}
                  @if (pv.published_at) { <span style="font-size:13px; font-weight:400; color:#64748b;">Published {{ pv.published_at | date:'d MMM y' }}</span> }
                </div>
                <div style="display:flex; align-items:center; gap:16px; margin-top:6px; font-size:13px; color:#64748b; flex-wrap:wrap;">
                  <span style="display:flex; align-items:center; gap:6px;"><mat-icon style="font-size:16px; color:#94a3b8;">group</mat-icon> All class groups</span>
                  <span style="width:4px; height:4px; border-radius:50%; background:#cbd5e1;"></span>
                  <span style="display:flex; align-items:center; gap:6px;"><mat-icon style="font-size:16px; color:#94a3b8;">schedule</mat-icon> Across all timetables</span>
                </div>
              </div>
              <span style="background:#fef3c7; color:#92400e; font-size:10px; font-weight:700; padding:4px 12px; border-radius:999px; text-transform:uppercase; letter-spacing:0.8px; display:flex; align-items:center; gap:4px;">
                <mat-icon style="font-size:14px;">warning_amber</mat-icon> Requires attention
              </span>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
              <button style="border:1px solid #e2e8f0; background:#fff; color:#475569; padding:8px 18px; border-radius:999px; font-size:13px; font-weight:500; display:flex; align-items:center; gap:6px; cursor:pointer;" (click)="navigateTo('/admin/timetable/admin')">
                <mat-icon style="font-size:18px;">edit</mat-icon> Edit
              </button>
              <button style="background:#2563eb; color:#fff; padding:8px 18px; border-radius:999px; font-size:13px; font-weight:600; display:flex; align-items:center; gap:6px; cursor:pointer; box-shadow:0 2px 8px rgba(37,99,235,0.25); border:none;" (click)="createDraft()">
                <mat-icon style="font-size:18px;">add</mat-icon> Create New Version
              </button>
            </div>
          </div>
        }

        <!-- ── MAIN GRID ──────────────────────────────────────── -->
        <div style="display:grid; grid-template-columns:1fr 340px; gap:32px; align-items:start;">

          <!-- LEFT COLUMN -->
          <div style="display:flex; flex-direction:column; gap:32px;">

            <!-- VERSION TABLE -->
            <div style="background:#fff; border:1px solid #e2e8f0; border-radius:16px; overflow:hidden;">
              <div style="display:flex; justify-content:space-between; align-items:center; padding:16px 20px; border-bottom:1px solid #f1f5f9;">
                <h3 style="font-size:15px; font-weight:700; color:#0f172a; display:flex; align-items:center; gap:8px; margin:0;">
                  <mat-icon style="color:#2563eb; font-size:20px;">list_alt</mat-icon> Timetable Versions
                </h3>
                <div style="display:flex; gap:8px;">
                  <button style="display:flex; align-items:center; gap:6px; padding:5px 14px; border:1px solid #e2e8f0; border-radius:999px; font-size:12px; font-weight:500; color:#64748b; cursor:pointer; background:#fff;">
                    <mat-icon style="font-size:16px; color:#94a3b8;">filter_alt</mat-icon> Filter
                  </button>
                  <button style="display:flex; align-items:center; gap:6px; padding:5px 14px; border:1px solid #e2e8f0; border-radius:999px; font-size:12px; font-weight:500; color:#64748b; cursor:pointer; background:#fff;">
                    <mat-icon style="font-size:16px; color:#94a3b8;">download</mat-icon> Export
                  </button>
                </div>
              </div>
              <div style="overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse; min-width:700px;">
                  <thead style="background:#f8fafc;">
                    <tr>
                      @for (col of ['Version','Status','Created By','Created On','Published On','Actions']; track col) {
                        <th style="padding:12px 20px; font-size:11px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:0.6px; border-bottom:1px solid #e2e8f0; text-align:left; white-space:nowrap;">{{ col }}</th>
                      }
                    </tr>
                  </thead>
                  <tbody>
                    @for (v of state.versions(); track v.id) {
                      <tr class="tbl-row" (click)="navigateTo('/admin/timetable/versions/'+v.id)">
                        <td style="padding:14px 20px;">
                          <div style="font-weight:600; font-size:14px; color:#0f172a;">{{ v.name }}</div>
                          <div style="font-size:12px; color:#64748b; margin-top:2px;">{{ v.academic_term_name }}</div>
                        </td>
                        <td style="padding:14px 20px;">
                          <span style="font-size:11px; font-weight:700; padding:4px 12px; border-radius:999px; text-transform:uppercase; letter-spacing:0.5px;"
                                [style.background]="statusBg(v.status)" [style.color]="statusColor(v.status)">{{ v.status }}</span>
                        </td>
                        <td style="padding:14px 20px;">
                          <div style="display:flex; align-items:center; gap:12px;">
                            <div class="avatar-circle">{{ getInitials(v.created_by_name) }}</div>
                            <div style="font-size:13px; font-weight:600; color:#0f172a;">{{ v.created_by_name }}</div>
                          </div>
                        </td>
                        <td style="padding:14px 20px; font-size:13px; color:#475569; white-space:nowrap;">{{ v.created_at | date:'MMM d, y, h:mm a' }}</td>
                        <td style="padding:14px 20px; font-size:13px; color:#475569; white-space:nowrap;">{{ v.published_at ? (v.published_at | date:'MMM d, y, h:mm a') : '—' }}</td>
                        <td style="padding:14px 20px; text-align:center;">
                          <button style="color:#94a3b8; background:none; border:none; cursor:pointer; padding:6px; border-radius:8px; display:inline-flex;" (click)="$event.stopPropagation()">
                            <mat-icon>more_vert</mat-icon>
                          </button>
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="6" style="padding:48px 20px; text-align:center; color:#94a3b8; font-size:14px;">
                          <mat-icon style="font-size:40px; display:block; margin:0 auto 12px;">inbox</mat-icon>
                          No versions yet. Create your first draft to get started.
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <!-- TIMETABLE GRID (existing) -->
            <div style="background:#fff; border:1px solid #e2e8f0; border-radius:16px; overflow:hidden;">
              <div style="display:flex; align-items:center; justify-content:space-between; padding:14px 20px; border-bottom:1px solid #f1f5f9; flex-wrap:wrap; gap:8px;">
                <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                  <mat-icon style="font-size:18px; color:#2563eb;">grid_on</mat-icon>
                  <span style="font-size:14px; font-weight:600; color:#0f172a;">Timetable Grid</span>
                  <mat-select [(ngModel)]="selectedTermId" placeholder="Select Term" style="width:160px; font-size:13px;" appearance="outline">
                    @for (v of uniqueTerms(); track v.termId) {
                      <mat-option [value]="v.termId">{{ v.termName }}</mat-option>
                    }
                  </mat-select>
                  @if (selectedTermId()) {
                    <mat-select [(ngModel)]="selectedYearGroupId" placeholder="All Years" style="width:130px; font-size:13px;" appearance="outline">
                      <mat-option [value]="null">All Years</mat-option>
                      @for (yg of yearGroups(); track yg.id) { <mat-option [value]="yg.id">{{ yg.name }}</mat-option> }
                    </mat-select>
                    <mat-select [(ngModel)]="selectedTeacherId" placeholder="All Teachers" style="width:130px; font-size:13px;" appearance="outline">
                      <mat-option [value]="null">All Teachers</mat-option>
                      @for (t of teachers(); track t.id) { <mat-option [value]="t.id">{{ t.name }}</mat-option> }
                    </mat-select>
                  }
                </div>
                <div style="display:flex; gap:8px;">
                  <button style="font-size:12px; color:#64748b; border:1px solid #e2e8f0; padding:6px 14px; border-radius:999px; cursor:pointer; background:#fff; display:flex; align-items:center; gap:4px;">
                    <mat-icon style="font-size:16px;">filter_list</mat-icon> Filter
                  </button>
                  <button style="font-size:12px; color:#64748b; border:1px solid #e2e8f0; padding:6px 14px; border-radius:999px; cursor:pointer; background:#fff; display:flex; align-items:center; gap:4px;">
                    <mat-icon style="font-size:16px;">download</mat-icon> Export
                  </button>
                </div>
              </div>
              <div style="height:calc(100vh - 700px); min-height:400px; padding:4px;">
                <app-timetable-grid
                  [termId]="selectedTermId() ?? undefined"
                  [yearGroupId]="selectedYearGroupId() ?? undefined"
                  [teacherId]="selectedTeacherId() ?? undefined" />
              </div>
            </div>

            <!-- QUICK ACTIONS -->
            <div>
              <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
                <h3 style="font-size:15px; font-weight:700; color:#0f172a; margin:0;">Quick Actions</h3>
                <a routerLink="/admin/timetable/audit" style="font-size:13px; color:#2563eb; font-weight:500; text-decoration:none; display:flex; align-items:center; gap:4px;">
                  View all actions <mat-icon style="font-size:16px;">arrow_forward</mat-icon>
                </a>
              </div>
              <div style="display:grid; grid-template-columns:repeat(6,1fr); gap:14px;">
                @for (qa of quickActions(); track qa.label) {
                  <button class="qa-card" (click)="qa.action?.()">
                    <div class="qa-icon"><mat-icon>{{ qa.icon }}</mat-icon></div>
                    <span style="font-size:13px; font-weight:600; color:#0f172a; margin-top:4px;">{{ qa.label }}</span>
                    <span style="font-size:11px; color:#64748b; line-height:1.4;">{{ qa.desc }}</span>
                  </button>
                }
              </div>
            </div>

          </div>

          <!-- RIGHT COLUMN -->
          <div style="display:flex; flex-direction:column; gap:20px;">

            <!-- MINI CALENDAR (live from backend via SharedCalendarService) -->
            <div style="background:#fff; border:1px solid #e2e8f0; border-radius:16px; overflow:hidden;">
              <div style="display:flex; align-items:center; justify-content:space-between; padding:14px 18px; border-bottom:1px solid #f1f5f9;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <mat-icon style="font-size:18px; color:#2563eb;">calendar_month</mat-icon>
                  <span style="font-size:14px; font-weight:600; color:#0f172a;">{{ calSvc.monthLabel() }}</span>
                </div>
                <div style="display:flex; align-items:center; gap:4px;">
                  <button style="width:28px; height:28px; border:none; border-radius:8px; background:none; cursor:pointer; color:#64748b; display:flex; align-items:center; justify-content:center;" (click)="prevMonth()">
                    <mat-icon style="font-size:18px;">chevron_left</mat-icon>
                  </button>
                  <button style="border:1px solid #e2e8f0; background:#fff; padding:3px 12px; border-radius:999px; font-size:12px; font-weight:500; color:#475569; cursor:pointer;" (click)="goToday()">Today</button>
                  <button style="width:28px; height:28px; border:none; border-radius:8px; background:none; cursor:pointer; color:#64748b; display:flex; align-items:center; justify-content:center;" (click)="nextMonth()">
                    <mat-icon style="font-size:18px;">chevron_right</mat-icon>
                  </button>
                </div>
              </div>
              <div style="padding:12px;">
                <!-- Day headers -->
                <div style="display:grid; grid-template-columns:repeat(7,1fr); margin-bottom:4px;">
                  @for (d of dayHeaders; track d) {
                    <div style="text-align:center; font-size:10px; font-weight:600; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px; padding:4px 0;">{{ d }}</div>
                  }
                </div>
                <!-- Calendar grid -->
                @for (week of calendarGrid(); track $index) {
                  <div style="display:grid; grid-template-columns:repeat(7,1fr);">
                    @for (cell of week; track $index) {
                      <div style="text-align:center; padding:5px 2px; border-radius:8px; font-size:12px; cursor:default;"
                           [style.background]="cell.today ? '#2563eb' : cell.hasEvent ? '#eff6ff' : 'transparent'"
                           [style.color]="cell.today ? '#fff' : cell.day ? '#334155' : '#cbd5e1'"
                           [style.fontWeight]="cell.today ? '700' : '400'">
                        {{ cell.day || '' }}
                        @if (cell.hasEvent && !cell.today) {
                          <div style="width:4px; height:4px; border-radius:50%; background:#2563eb; margin:0 auto;"></div>
                        }
                      </div>
                    }
                  </div>
                }
                <!-- Legend -->
                <div style="display:flex; gap:12px; flex-wrap:wrap; margin-top:10px; padding-top:10px; border-top:1px solid #f1f5f9;">
                  @for (leg of calLegend; track leg.label) {
                    <span style="display:flex; align-items:center; gap:5px; font-size:11px; font-weight:500; color:#475569;">
                      <span style="width:10px; height:10px; border-radius:3px; display:inline-block;" [style.background]="leg.color"></span>{{ leg.label }}
                    </span>
                  }
                </div>
              </div>
            </div>

            <!-- RECENT ACTIVITY -->
            <div style="background:#fff; border:1px solid #e2e8f0; border-radius:16px; overflow:hidden; display:flex; flex-direction:column; max-height:440px;">
              <div style="padding:14px 18px; border-bottom:1px solid #f1f5f9; flex-shrink:0;">
                <h3 style="font-size:14px; font-weight:700; color:#0f172a; display:flex; align-items:center; gap:8px; margin:0;">
                  <mat-icon style="color:#2563eb; font-size:20px;">history</mat-icon> Recent Activity
                </h3>
              </div>
              <div style="flex:1; overflow-y:auto; padding:8px;">
                @for (act of recentActivity(); track act.id) {
                  <div class="act-row">
                    <div style="width:36px; height:36px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:16px; margin-top:2px;"
                         [style.background]="act.iconBg" [style.color]="act.iconColor">
                      <mat-icon style="font-size:18px;">{{ act.icon }}</mat-icon>
                    </div>
                    <div style="flex:1; min-width:0;">
                      <div style="font-size:13px; font-weight:600; color:#0f172a; line-height:1.3;">
                        {{ act.entity }} <span [style.color]="act.iconColor">{{ act.action }}</span>
                      </div>
                      <div style="font-size:12px; color:#64748b; margin-top:2px;">by {{ act.user }}</div>
                      <div style="font-size:11px; color:#94a3b8; margin-top:4px; display:flex; align-items:center; gap:4px;">
                        <mat-icon style="font-size:12px;">schedule</mat-icon>
                        {{ act.timestamp | date:'MMM d, y, h:mm a' }}
                      </div>
                    </div>
                    <span style="font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; padding:3px 10px; border-radius:999px; align-self:flex-start; white-space:nowrap;"
                          [style.background]="act.iconBg" [style.color]="act.iconColor">{{ act.action }}</span>
                  </div>
                } @empty {
                  <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px 20px; text-align:center;">
                    <mat-icon style="font-size:36px; color:#cbd5e1; display:block; margin-bottom:10px;">history</mat-icon>
                    <p style="color:#64748b; font-size:14px; margin:0;">No recent activity</p>
                    <p style="color:#94a3b8; font-size:12px; margin:4px 0 0;">Changes to timetables will appear here</p>
                  </div>
                }
              </div>
              <div style="padding:10px 18px; border-top:1px solid #f1f5f9; flex-shrink:0;">
                <a routerLink="/admin/timetable/audit" style="font-size:12px; color:#2563eb; font-weight:500; text-decoration:none; display:flex; align-items:center; gap:4px;">
                  View all activity <mat-icon style="font-size:14px;">arrow_forward</mat-icon>
                </a>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  `,
})
export class TimetableViewPage implements OnInit {
  private api    = inject(TimetableApiService);
  protected state   = inject(TimetableStateService);
  protected router  = inject(Router);
  private snackbar  = inject(MatSnackBar);
  protected calSvc  = inject(SharedCalendarService);

  protected navTabs = NAV_TABS;
  protected activeTab = signal<NavTab>('Overview');
  protected dayHeaders = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  protected calLegend = [
    { label: 'Term', color: '#2563eb' }, { label: 'Holiday', color: '#ef4444' },
    { label: 'Exam', color: '#f59e0b' }, { label: 'Meeting', color: '#8b5cf6' },
  ];

  protected auditLogEntries   = signal<AuditLogEntry[]>([]);
  protected backendStats       = signal<TimetableStats | null>(null);

  protected selectedTermId      = signal<number | null>(null);
  protected selectedYearGroupId = signal<number | null>(null);
  protected selectedTeacherId   = signal<number | null>(null);

  protected yearGroups = signal<{ id: number; name: string }[]>([]);
  protected teachers   = signal<TeacherOption[]>([]);
  protected isCreating = signal(false);

  // ── Computed ────────────────────────────────────────────────────────────────
  protected publishedVersion = computed<TimetableVersion | null>(
    () => this.state.versions().find(v => v.status === 'PUBLISHED') ?? null
  );
  protected activeTermName = computed(
    () => this.publishedVersion()?.academic_term_name ?? 'Current Term'
  );
  protected uniqueTerms = computed(() => {
    const seen = new Set<number>();
    return this.state.versions()
      .filter(v => { if (seen.has(v.academic_term)) return false; seen.add(v.academic_term); return true; })
      .map(v => ({ termId: v.academic_term, termName: v.academic_term_name }));
  });
  protected avatarLabel = computed(() => {
    const n = this.publishedVersion()?.created_by_name ?? '';
    return n ? n.split(' ').map((s: string) => s[0]).join('').toUpperCase().slice(0, 2) : 'AD';
  });
  protected stats = computed(() => {
    const s = this.backendStats();
    const pv = this.publishedVersion();
    return [
      { icon: 'check_circle', iconBg: '#eef2ff', iconColor: '#4f46e5', value: s?.active_version ?? pv?.name ?? '—', label: 'Active Version' },
      { icon: 'group',        iconBg: '#ecfdf5', iconColor: '#059669', value: String(s?.total_classes ?? 0),         label: 'Total Classes'  },
      { icon: 'book',         iconBg: '#f5f3ff', iconColor: '#7c3aed', value: String(s?.total_entries ?? 0),         label: 'Total Lessons'  },
      { icon: 'bolt',         iconBg: '#fffbeb', iconColor: '#d97706', value: String(s?.conflicts ?? 0),             label: 'Conflicts'      },
      { icon: 'error',        iconBg: '#fff1f2', iconColor: '#e11d48', value: String(s?.capacity_warnings ?? 0),     label: 'Capacity Warns' },
      { icon: 'schedule',     iconBg: '#ecfdf3', iconColor: '#0d9488', value: String(s?.availability_issues ?? 0),   label: 'Availability'   },
    ];
  });
  protected recentActivity = computed(() =>
    this.auditLogEntries().slice(0, 8).map(log => ({
      id:        log.id,
      icon:      ACTION_ICON_MAP[log.action]   ?? 'info',
      iconBg:    ACTION_BG_MAP[log.action]     ?? '#f8fafc',
      iconColor: ACTION_COLOR_MAP[log.action]  ?? '#475569',
      entity:    log.entity_type,
      action:    log.action,
      user:      log.user_name,
      timestamp: log.timestamp,
    }))
  );
  protected quickActions = computed(() => {
    const pv = this.publishedVersion();
    const creating = this.isCreating();
    return [
      { label: 'Create Draft',     desc: 'Start a new draft',               icon: 'add',           action: () => this.createDraft()      },
      { label: 'Clone Version',    desc: 'Clone existing version',           icon: 'content_copy',  action: () => this._cloneVersion(pv)  },
      { label: 'Check Conflicts',  desc: 'Run conflict validation',          icon: 'search',        action: () => this._checkConflicts()  },
      { label: 'Publish Draft',    desc: creating ? 'Publishing…' : 'Publish first draft', icon: 'cloud_upload', action: () => this.publishFirstDraft() },
      { label: 'Compare Versions', desc: 'Compare two versions',             icon: 'compare_arrows',action: () => this.router.navigate(['/admin/timetable/versions']) },
      { label: 'Audit Log',        desc: 'View change history',              icon: 'list_alt',      action: () => this.router.navigate(['/admin/timetable/audit'])    },
    ];
  });

  // Calendar grid from service events
  protected calendarGrid = computed(() => {
    const year  = this.calSvc.currentYear();
    const month = this.calSvc.currentMonth(); // 0-indexed
    const events = this.calSvc.events();
    const eventDays = new Set(events.filter(e => !!e.start_date).map(e => new Date(e.start_date!).getDate()));

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const todayNum = (today.getFullYear() === year && today.getMonth() === month) ? today.getDate() : -1;

    const cells: { day: number | null; today: boolean; hasEvent: boolean }[] = [];
    for (let i = 0; i < firstDay; i++) cells.push({ day: null, today: false, hasEvent: false });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, today: d === todayNum, hasEvent: eventDays.has(d) });
    while (cells.length % 7 !== 0) cells.push({ day: null, today: false, hasEvent: false });

    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
  });

  ngOnInit(): void {
    // Load versions
    if (this.state.versions().length === 0) {
      this.api.getVersions().subscribe(list => {
        this.state.setVersions(list);
        const pub = list.find(v => v.status === 'PUBLISHED');
        if (pub) { this.selectedTermId.set(pub.academic_term); this._loadSecondaryData(pub.academic_term); }
      });
    } else {
      const pub = this.publishedVersion();
      if (pub) this._loadSecondaryData(pub.academic_term);
    }
    this.api.getTeachers().subscribe(list => this.teachers.set(list));
    this.api.getClassrooms().subscribe(list => this.yearGroups.set(list.map(c => ({ id: c.id, name: c.year_level_name + ' ' + c.name }))));
    this.calSvc.fetchCurrentMonth().subscribe();
  }

  private _loadSecondaryData(termId: number): void {
    this.api.getStats(termId).subscribe(s => this.backendStats.set(s));
    this.api.getAuditLog({ page: 1 }).subscribe(res => this.auditLogEntries.set(res.results ?? []));
  }

  protected prevMonth()  { this.calSvc.goToPreviousMonth().subscribe(); }
  protected nextMonth()  { this.calSvc.goToNextMonth().subscribe(); }
  protected goToday()    { this.calSvc.goToToday().subscribe(); }

  protected createDraft(): void {
    const pv = this.publishedVersion();
    if (!pv) { this.snackbar.open('No published version to base draft on', 'Close', { duration: 3000 }); return; }
    this.isCreating.set(true);
    this.api.createVersion({ name: `Draft — ${pv.academic_term_name} (${new Date().toLocaleDateString()})`, academic_term: pv.academic_term }).subscribe({
      next: v => { this.state.setVersions([...this.state.versions(), v]); this.snackbar.open(`Draft "${v.name}" created`, 'Close', { duration: 3000 }); this.isCreating.set(false); },
      error: () => { this.snackbar.open('Failed to create draft', 'Close', { duration: 3000 }); this.isCreating.set(false); },
    });
  }
  private _cloneVersion(pv: TimetableVersion | null): void {
    if (!pv) { this.snackbar.open('No version to clone', 'Close', { duration: 3000 }); return; }
    this.api.cloneVersion(pv.id, { name: `Clone — ${pv.name}`, copy_entries: true }).subscribe({
      next: v => { this.state.setVersions([...this.state.versions(), v]); this.snackbar.open(`"${v.name}" created`, 'Close', { duration: 3000 }); },
      error: () => this.snackbar.open('Failed to clone version', 'Close', { duration: 3000 }),
    });
  }
  private _checkConflicts(): void {
    const termId = this.selectedTermId();
    if (!termId) { this.snackbar.open('Select a term first', 'Close', { duration: 3000 }); return; }
    this.api.checkConflicts(termId).subscribe({
      next: res => this.snackbar.open(`${res.count} conflict(s) found`, 'Close', { duration: 3000 }),
      error: () => this.snackbar.open('Failed to check conflicts', 'Close', { duration: 3000 }),
    });
  }
  protected publishFirstDraft(): void {
    const drafts = this.state.versions().filter(v => v.status === 'DRAFT');
    if (!drafts.length) { this.snackbar.open('No draft versions to publish', 'Close', { duration: 3000 }); return; }
    this.isCreating.set(true);
    this.api.publishVersion(drafts[0].id).subscribe({
      next: v => { this.state.updateVersion(v); this.snackbar.open(`"${v.name}" published`, 'Close', { duration: 3000 }); this.isCreating.set(false); },
      error: () => { this.snackbar.open('Failed to publish draft', 'Close', { duration: 3000 }); this.isCreating.set(false); },
    });
  }
  protected navigateTo(path: string): void { this.router.navigate([path]); }
  protected getInitials(name: string): string {
    if (!name) return 'U';
    const p = name.trim().split(' ');
    return p.length > 1 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
  }
  protected statusBg(s: string): string {
    return s==='PUBLISHED'?'#dcfce7':s==='DRAFT'?'#dbeafe':s==='ARCHIVED'?'#f1f5f9':'#fef3c7';
  }
  protected statusColor(s: string): string {
    return s==='PUBLISHED'?'#15803d':s==='DRAFT'?'#1d4ed8':s==='ARCHIVED'?'#64748b':'#92400e';
  }
}
