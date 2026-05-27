import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FinanceService } from '../../services/finance.service';
import {
  StaffDirectorySummary, StaffDirectoryResponse, StaffMember,
  StaffDepartmentGroup, FORMAT_CURRENCY,
} from '../../models/finance.models';

@Component({
  selector: 'app-staff-directory',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page page-fade-in">
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
            </svg>
          </div>
          <div>
            <h1>Staff Directory</h1>
            <p class="subtitle">Complete staff listing grouped by department</p>
          </div>
        </div>
        @if (loading()) {
          <div class="status-badge loading"><span class="pulse"></span>Loading...</div>
        } @else if (error()) {
          <div class="status-badge error"><span class="dot err-dot"></span>Unavailable</div>
        } @else {
          <div class="status-badge live"><span class="dot"></span>Live</div>
        }
      </div>

      @if (error()) {
        <div class="error-banner">
          <svg class="err-banner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div class="err-banner-text">
            <strong>Staff Directory unavailable</strong>
            <p>The staff directory API is not responding. Please ensure the backend server is running and the staff directory endpoints are registered.</p>
          </div>
        </div>
      }

      <div class="kpi-grid">
        <div class="kpi-card" style="--accent: #2563eb">
          <div class="kpi-icon" style="background: #dbeafe; color: #2563eb;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </div>
          <div class="kpi-body">
            <div class="kpi-value accent">{{ summary()?.total_staff ?? 0 }}</div>
            <div class="kpi-label">Total Staff</div>
          </div>
        </div>
        <div class="kpi-card" style="--accent: #059669">
          <div class="kpi-icon" style="background: #d1fae5; color: #059669;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
          </div>
          <div class="kpi-body">
            <div class="kpi-value" style="color: #059669">{{ summary()?.teaching ?? 0 }}</div>
            <div class="kpi-label">Teaching</div>
          </div>
        </div>
        <div class="kpi-card" style="--accent: #d97706">
          <div class="kpi-icon" style="background: #fef3c7; color: #d97706;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
          </div>
          <div class="kpi-body">
            <div class="kpi-value" style="color: #d97706">{{ summary()?.non_teaching ?? 0 }}</div>
            <div class="kpi-label">Non-Teaching</div>
          </div>
        </div>
        <div class="kpi-card" style="--accent: #7c3aed">
          <div class="kpi-icon" style="background: #ede9fe; color: #7c3aed;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
          </div>
          <div class="kpi-body">
            <div class="kpi-value" style="color: #7c3aed">{{ summary()?.by_department?.length ?? 0 }}</div>
            <div class="kpi-label">Departments</div>
          </div>
        </div>
      </div>

      <div class="tab-bar">
        <button class="tab-btn" [class.active]="activeTab() === 'teaching'" (click)="activeTab.set('teaching')">
          <svg class="tab-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
          </svg>
          Teaching Staff
          <span class="tab-count">{{ summary()?.teaching ?? 0 }}</span>
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'non-teaching'" (click)="activeTab.set('non-teaching')">
          <svg class="tab-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
          </svg>
          Non-Teaching Staff
          <span class="tab-count">{{ summary()?.non_teaching ?? 0 }}</span>
        </button>
      </div>

      <div class="directory-content">
        @for (group of filteredGroups(); track group.department) {
          <div class="dept-section">
            <div class="dept-header" [style.--dept-accent]="deptColor(group.department)">
              <div class="dept-brand">
                <div class="dept-icon-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                  </svg>
                </div>
                <span class="dept-name">{{ group.department }}</span>
              </div>
              <span class="dept-count">{{ group.members.length }} {{ group.members.length === 1 ? 'member' : 'members' }}</span>
            </div>
            <div class="staff-list">
              @for (member of group.members; track member.id) {
                <a class="staff-row" [routerLink]="['/portalFinance/staff', member.id]">
                  <div class="staff-avatar" [style.background]="avatarGrad(member.first_name, member.last_name)">
                    {{ getInitials(member.first_name, member.last_name) }}
                  </div>
                  <div class="staff-info">
                    <div class="staff-name">{{ member.first_name }} {{ member.last_name }}</div>
                    <div class="staff-meta">
                      <span class="role-badge" [style.background]="roleColor(member.role)">{{ member.role }}</span>
                      <span class="meta-sep">•</span>
                      <span class="meta-text">{{ member.school_id }}</span>
                      @if (member.qualification) {
                        <span class="meta-sep">•</span>
                        <span class="meta-text">{{ member.qualification }}</span>
                      }
                    </div>
                  </div>
                  <div class="staff-right">
                    @if (member.salary) {
                      <div class="salary-block">
                        <div class="salary-amount">{{ FORMAT_CURRENCY(member.salary.gross_pay) }}</div>
                        <div class="salary-label">gross / month</div>
                      </div>
                    } @else {
                      <div class="salary-na">Not configured</div>
                    }
                    <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </div>
                </a>
              }
            </div>
          </div>
        } @empty {
          <div class="empty-state">
            <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <p>No staff found for this category</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 1200px; margin: 0 auto; font-family: 'Inter', system-ui, sans-serif; }

    .page-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 28px;
    }
    .header-left { display: flex; align-items: center; gap: 14px; }
    .header-icon {
      width: 44px; height: 44px; border-radius: 12px;
      background: linear-gradient(135deg, #dbeafe, #bfdbfe);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .header-icon svg { width: 22px; height: 22px; color: #2563eb; }
    .page-header h1 { font-size: 1.375rem; font-weight: 700; color: #0f172a; margin: 0; letter-spacing: -0.02em; }
    .subtitle { font-size: 0.8125rem; color: #64748b; margin-top: 2px; }

    .status-badge {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.6875rem; font-weight: 600; padding: 6px 14px; border-radius: 999px;
    }
    .status-badge.live { background: #d1fae5; color: #059669; }
    .status-badge.loading { background: #fef3c7; color: #d97706; }
    .dot, .pulse { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
    .dot { background: #059669; }
    .err-dot { background: #e11d48; }

    .error-banner {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 14px 18px; border-radius: 10px; margin-bottom: 20px;
      background: #fef2f2; border: 1px solid #fecaca;
    }
    .err-banner-icon { width: 20px; height: 20px; color: #e11d48; flex-shrink: 0; margin-top: 1px; }
    .err-banner-text strong { font-size: 0.8125rem; color: #991b1b; display: block; }
    .err-banner-text p { font-size: 0.75rem; color: #b91c1c; margin: 2px 0 0; }
    .pulse { background: #d97706; animation: pulse 1.2s ease-in-out infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
    .kpi-card {
      position: relative;
      background: white; border-radius: 14px; padding: 20px;
      box-shadow: 0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.06);
      border: 1px solid #e2e8f0;
      display: flex; align-items: center; gap: 14px;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .kpi-card:hover { transform: translateY(-2px); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1); }
    .kpi-card:before {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
      background: var(--accent); border-radius: 14px 14px 0 0;
    }
    .kpi-icon {
      width: 44px; height: 44px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .kpi-icon svg { width: 20px; height: 20px; }
    .kpi-body { min-width: 0; }
    .kpi-value { font-size: 1.625rem; font-weight: 700; color: #0f172a; line-height: 1.1; letter-spacing: -0.02em; }
    .kpi-label { font-size: 0.8125rem; color: #64748b; margin-top: 2px; font-weight: 500; }

    .tab-bar { display: flex; gap: 8px; margin-bottom: 24px; }
    .tab-btn {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 18px; border-radius: 10px; border: 1px solid #e2e8f0;
      background: white; font-size: 0.8125rem; font-weight: 600; color: #475569;
      cursor: pointer; transition: all 0.15s ease;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    }
    .tab-btn:hover { border-color: #93c5fd; background: #f8faff; color: #2563eb; }
    .tab-btn.active { border-color: #2563eb; background: #eff6ff; color: #2563eb; box-shadow: 0 1px 3px rgba(37,99,235,0.15); }
    .tab-svg { width: 16px; height: 16px; }
    .tab-count {
      font-size: 0.625rem; font-weight: 700; padding: 2px 8px;
      border-radius: 999px; background: #f1f5f9; color: #64748b;
    }
    .tab-btn.active .tab-count { background: #dbeafe; color: #2563eb; }

    .directory-content { display: flex; flex-direction: column; gap: 20px; }

    .dept-section {
      background: white; border-radius: 14px; overflow: hidden;
      box-shadow: 0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.06);
      border: 1px solid #e2e8f0;
    }
    .dept-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-bottom: 1px solid #e2e8f0;
      border-left: 4px solid var(--dept-accent, #2563eb);
    }
    .dept-brand { display: flex; align-items: center; gap: 10px; }
    .dept-icon-wrap {
      width: 28px; height: 28px; border-radius: 8px;
      background: var(--dept-accent, #2563eb); opacity: 0.9;
      display: flex; align-items: center; justify-content: center;
    }
    .dept-icon-wrap svg { width: 14px; height: 14px; color: white; }
    .dept-name { font-size: 0.8125rem; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.04em; }
    .dept-count { font-size: 0.75rem; color: #94a3b8; font-weight: 500; background: #f1f5f9; padding: 3px 10px; border-radius: 999px; }

    .staff-list { display: flex; flex-direction: column; }
    .staff-row {
      display: flex; align-items: center; gap: 14px;
      padding: 14px 20px; text-decoration: none; cursor: pointer;
      transition: all 0.12s ease; border-bottom: 1px solid #f1f5f9;
      position: relative;
    }
    .staff-row:last-child { border-bottom: none; }
    .staff-row:hover { background: #f8faff; }
    .staff-row:hover::before {
      content: ''; position: absolute; left: 0; top: 4px; bottom: 4px; width: 3px;
      background: #2563eb; border-radius: 0 3px 3px 0;
    }

    .staff-avatar {
      width: 40px; height: 40px; border-radius: 10px;
      color: white; display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 700; flex-shrink: 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .staff-info { flex: 1; min-width: 0; }
    .staff-name { font-size: 0.875rem; font-weight: 600; color: #0f172a; }
    .staff-meta { display: flex; align-items: center; gap: 4px; margin-top: 3px; flex-wrap: wrap; }
    .meta-text { font-size: 0.6875rem; color: #94a3b8; }
    .meta-sep { font-size: 0.5625rem; color: #cbd5e1; }
    .role-badge {
      font-size: 0.5625rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;
      padding: 2px 7px; border-radius: 5px; color: white;
    }

    .staff-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
    .salary-block { text-align: right; }
    .salary-amount { font-size: 0.875rem; font-weight: 700; color: #0f172a; font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; }
    .salary-label { font-size: 0.625rem; color: #94a3b8; margin-top: 1px; }
    .salary-na { font-size: 0.75rem; color: #94a3b8; font-style: italic; }

    .chevron { width: 16px; height: 16px; color: #cbd5e1; flex-shrink: 0; transition: transform 0.15s ease; }
    .staff-row:hover .chevron { color: #2563eb; transform: translateX(2px); }

    .empty-state { text-align: center; padding: 60px 20px; }
    .empty-icon { width: 48px; height: 48px; color: #cbd5e1; margin: 0 auto 12px; }
    .empty-state p { font-size: 0.875rem; color: #94a3b8; }
  `],
})
export class StaffDirectoryComponent implements OnInit {
  private financeService = inject(FinanceService);

  summary = signal<StaffDirectorySummary | null>(null);
  directory = signal<StaffDirectoryResponse | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  activeTab = signal<'teaching' | 'non-teaching'>('teaching');
  FORMAT_CURRENCY = FORMAT_CURRENCY;

  filteredGroups = computed<StaffDepartmentGroup[]>(() => {
    const dir = this.directory();
    if (!dir) return [];
    return this.activeTab() === 'teaching' ? dir.teaching_staff : dir.non_teaching_staff;
  });

  private readonly palettes = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#0891b2', '#e11d48'];

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    this.error.set(null);
    this.financeService.getStaffDirectorySummary().subscribe({
      next: (s) => this.summary.set(s),
      error: () => {},
    });
    this.financeService.getStaffDirectory().subscribe({
      next: (d) => { this.directory.set(d); this.loading.set(false); },
      error: () => { this.loading.set(false); this.error.set('Failed to load staff directory'); },
    });
  }

  getInitials(first: string, last: string): string {
    return ((first?.[0] || '') + (last?.[0] || '')).toUpperCase() || '?';
  }

  roleColor(role: string): string {
    const map: Record<string, string> = {
      TEACHER: '#6366f1', ADMIN: '#0891b2', FINANCE: '#059669', SUPPORT_STAFF: '#d97706',
    };
    return map[role] || '#94a3b8';
  }

  deptColor(dept: string): string {
    const map: Record<string, string> = {
      STEM: '#2563eb', Humanities: '#7c3aed', Languages: '#0891b2',
      Finance: '#059669', Administration: '#d97706',
    };
    return map[dept] || '#2563eb';
  }

  avatarGrad(first: string, last: string): string {
    const n = ((first?.charCodeAt(0) || 0) + (last?.charCodeAt(0) || 0)) % this.palettes.length;
    const colors = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#0891b2'];
    return `linear-gradient(135deg, ${colors[n]}, ${colors[(n + 1) % colors.length]})`;
  }
}
