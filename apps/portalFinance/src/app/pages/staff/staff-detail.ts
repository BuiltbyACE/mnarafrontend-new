import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FinanceService } from '../../services/finance.service';
import {
  StaffDetail, FORMAT_CURRENCY,
} from '../../models/finance.models';

@Component({
  selector: 'app-staff-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page page-fade-in">
      <a class="back-link" routerLink="/portalFinance/staff">
        <svg class="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5m7 7l-7-7 7-7"/>
        </svg>
        Back to Staff Directory
      </a>

      @if (staff()) {
        <div class="detail-grid">
          <div class="profile-card">
            <div class="profile-bg"></div>
            <div class="profile-content">
              <div class="profile-avatar-wrap">
                <div class="profile-avatar" [style.background]="avatarGrad(staff()!.first_name, staff()!.last_name)">
                  {{ getInitials(staff()!.first_name, staff()!.last_name) }}
                </div>
                <div class="profile-status-ring" [class.active]="staff()!.is_active"></div>
              </div>
              <div>
                <h2>{{ staff()!.first_name }} {{ staff()!.last_name }}</h2>
                <div class="profile-badges">
                  <span class="badge" [style.background]="roleColor(staff()!.role)">{{ staff()!.role }}</span>
                  <span class="badge badge-dept">{{ staff()!.department }}</span>
                  <span class="badge" [class.badge-active]="staff()!.is_active" [class.badge-inactive]="!staff()!.is_active">
                    {{ staff()!.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </div>
                <div class="profile-id">{{ staff()!.school_id }}</div>
              </div>
            </div>
            <div class="profile-contact">
              @if (staff()!.email) {
                <div class="contact-chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>{{ staff()!.email }}</div>
              }
              @if (staff()!.phone) {
                <div class="contact-chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>{{ staff()!.phone }}</div>
              }
              @if (staff()!.qualification) {
                <div class="contact-chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 14l9-5-9-5-9 5 9 5z"/><path d="M12 14l6.16-3.42a6.08 6.08 0 011.16 2.1M12 14l-6.16-3.42a6.08 6.08 0 00-1.16 2.1"/><polyline points="12 20 12 14"/><line x1="16.93" y1="16.93" x2="21" y2="21"/></svg>{{ staff()!.qualification }}{{ staff()!.specialization ? ' in ' + staff()!.specialization : '' }}</div>
              }
              @if (staff()!.staff_category === 'TEACHING' && staff()!.teaching_subjects.length > 0) {
                <div class="contact-chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>{{ staff()!.teaching_subjects.join(', ') }}</div>
              }
              @if (staff()!.hire_date) {
                <div class="contact-chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>Joined {{ staff()!.hire_date }}</div>
              }
            </div>
          </div>

          @if (staff()!.salary) {
            <div class="salary-card">
              <div class="salary-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Salary Structure
              </div>
              <div class="salary-grid">
                <div class="s-row"><span class="s-lbl">Base Pay</span><span class="s-val">{{ FORMAT_CURRENCY(staff()!.salary!.base_pay) }}</span></div>
                <div class="s-row"><span class="s-lbl">House Allowance</span><span class="s-val">{{ FORMAT_CURRENCY(staff()!.salary!.house_allowance) }}</span></div>
                <div class="s-row"><span class="s-lbl">Commuter Allowance</span><span class="s-val">{{ FORMAT_CURRENCY(staff()!.salary!.commuter_allowance) }}</span></div>
                <div class="s-row s-total"><span class="s-lbl">Total Allowances</span><span class="s-val">{{ FORMAT_CURRENCY(staff()!.salary!.total_allowances) }}</span></div>
                <div class="s-row s-gross"><span class="s-lbl">Gross Pay</span><span class="s-val-gross">{{ FORMAT_CURRENCY(staff()!.salary!.gross_pay) }}</span></div>
              </div>
            </div>
          }

          @if (staff()!.leave_balance) {
            <div class="leave-card">
              <div class="leave-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                Leave Balance
              </div>
              <div class="leave-ring">
                <svg viewBox="0 0 36 36" class="leave-ring-svg">
                  <path class="ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                  <path class="ring-fg" [attr.stroke-dasharray]="leavePct(staff()!.leave_balance!.points_remaining) + ', 100'"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                </svg>
                <div class="leave-num">{{ staff()!.leave_balance!.points_remaining }}</div>
              </div>
              <div class="leave-label">points remaining</div>
            </div>
          }

          @if (staff()!.staff_category === 'TEACHING' && staff()!.leadership_roles) {
            <div class="leadership-card">
              <div class="lead-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Leadership Roles
              </div>
              @if (staff()!.leadership_roles!.is_hod) {
                <div class="lead-row">
                  <span class="lead-icon" style="background: #dbeafe; color: #2563eb;">H</span>
                  <span>Head of <strong>{{ staff()!.leadership_roles!.hod_department }}</strong></span>
                </div>
              }
              @if (staff()!.leadership_roles!.is_coordinator) {
                <div class="lead-row">
                  <span class="lead-icon" style="background: #ede9fe; color: #7c3aed;">C</span>
                  <span>Coordinator — <strong>{{ staff()!.leadership_roles!.coordinator_key_stage }}</strong></span>
                </div>
              }
              @if (staff()!.leadership_roles!.is_class_teacher) {
                <div class="lead-row">
                  <span class="lead-icon" style="background: #d1fae5; color: #059669;">T</span>
                  <span>Class Teacher of <strong>{{ staff()!.leadership_roles!.class_teacher_of }}</strong></span>
                </div>
              }
            </div>
          }

          @if (staff()!.assignments.length > 0) {
            <div class="assign-card">
              <div class="assign-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
                </svg>
                Teaching Assignments
              </div>
              <div class="assign-table">
                <div class="assign-thead">
                  <span>Classroom</span><span>Subject</span><span>Role</span><span>Year</span>
                </div>
                @for (a of staff()!.assignments; track a.id) {
                  <div class="assign-trow">
                    <span class="assign-class">{{ a.classroom }}</span>
                    <span>{{ a.subject }}</span>
                    <span class="assign-badge">{{ a.role_display }}</span>
                    <span class="assign-year">{{ a.academic_year }}</span>
                  </div>
                }
              </div>
            </div>
          }

          @if (staff()!.latest_payslip) {
            <div class="payslip-card">
              <div class="payslip-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
                <span>Latest Payslip</span>
                <span class="payslip-month">{{ monthName(staff()!.latest_payslip!.month) }} {{ staff()!.latest_payslip!.year }}</span>
                <span class="chip" [class.chip-paid]="staff()!.latest_payslip!.is_paid" [class.chip-unpaid]="!staff()!.latest_payslip!.is_paid">
                  {{ staff()!.latest_payslip!.is_paid ? 'Paid' : 'Unpaid' }}
                </span>
              </div>
              <div class="payslip-grid">
                <div class="p-row"><span class="p-lbl">Gross Pay</span><span class="p-val">{{ FORMAT_CURRENCY(staff()!.latest_payslip!.gross_pay) }}</span></div>
                <div class="p-row"><span class="p-lbl">PAYE</span><span class="p-val p-deduct">-{{ FORMAT_CURRENCY(staff()!.latest_payslip!.paye) }}</span></div>
                <div class="p-row"><span class="p-lbl">NHIF</span><span class="p-val p-deduct">-{{ FORMAT_CURRENCY(staff()!.latest_payslip!.nhif) }}</span></div>
                <div class="p-row"><span class="p-lbl">NSSF</span><span class="p-val p-deduct">-{{ FORMAT_CURRENCY(staff()!.latest_payslip!.nssf) }}</span></div>
                <div class="p-row p-net"><span class="p-lbl">Net Pay</span><span class="p-val-net">{{ FORMAT_CURRENCY(staff()!.latest_payslip!.net_pay) }}</span></div>
              </div>
            </div>
          }
        </div>
      } @else if (loading()) {
        <div class="loading-state">
          <div class="loader"></div>
          <span>Loading staff details...</span>
        </div>
      } @else {
        <div class="error-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="err-icon">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <p>Staff member not found</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 1000px; margin: 0 auto; font-family: 'Inter', system-ui, sans-serif; }

    .back-link {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 0.8125rem; font-weight: 500; color: #64748b;
      text-decoration: none; margin-bottom: 20px; cursor: pointer;
      transition: color 0.15s ease;
    }
    .back-link:hover { color: #2563eb; }
    .back-link:hover .back-icon { transform: translateX(-2px); }
    .back-icon { width: 16px; height: 16px; transition: transform 0.15s ease; }

    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

    .profile-card {
      grid-column: 1 / -1;
      background: white; border-radius: 14px; overflow: hidden;
      box-shadow: 0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.06);
      border: 1px solid #e2e8f0;
    }
    .profile-bg {
      height: 80px;
      background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #7c3aed 100%);
    }
    .profile-content {
      display: flex; align-items: center; gap: 18px;
      padding: 0 24px; margin-top: -32px;
    }
    .profile-avatar-wrap { position: relative; flex-shrink: 0; }
    .profile-avatar {
      width: 64px; height: 64px; border-radius: 16px;
      color: white; display: flex; align-items: center; justify-content: center;
      font-size: 1.25rem; font-weight: 700;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      border: 3px solid white;
    }
    .profile-status-ring {
      position: absolute; bottom: -2px; right: -2px;
      width: 16px; height: 16px; border-radius: 50%;
      border: 3px solid white; background: #cbd5e1;
    }
    .profile-status-ring.active { background: #059669; }
    .profile-content h2 { font-size: 1.25rem; font-weight: 700; color: #0f172a; margin: 0 0 4px; }
    .profile-badges { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 4px; }
    .badge {
      font-size: 0.625rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;
      padding: 3px 10px; border-radius: 6px; color: white;
    }
    .badge-dept { background: #475569; }
    .badge-active { background: #059669; }
    .badge-inactive { background: #e11d48; }
    .profile-id { font-size: 0.75rem; color: #94a3b8; font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; }

    .profile-contact {
      display: flex; flex-wrap: wrap; gap: 8px;
      padding: 16px 24px 20px; border-top: 1px solid #f1f5f9;
      margin-top: 12px;
    }
    .contact-chip {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 0.75rem; color: #475569; padding: 5px 12px;
      background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;
    }
    .contact-chip svg { width: 13px; height: 13px; color: #64748b; flex-shrink: 0; }

    .salary-card {
      background: white; border-radius: 14px; padding: 20px;
      box-shadow: 0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.06);
      border: 1px solid #e2e8f0;
      border-top: 3px solid #2563eb;
    }
    .salary-header, .leave-header, .lead-header, .assign-header, .payslip-header {
      display: flex; align-items: center; gap: 8px;
      font-size: 0.75rem; font-weight: 700; color: #0f172a;
      text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 16px;
    }
    .salary-header svg, .leave-header svg, .lead-header svg, .assign-header svg, .payslip-header svg {
      width: 16px; height: 16px; color: #2563eb;
    }

    .salary-grid { display: flex; flex-direction: column; gap: 8px; }
    .s-row { display: flex; justify-content: space-between; align-items: center; font-size: 0.8125rem; padding: 6px 0; }
    .s-lbl { color: #64748b; }
    .s-val { font-weight: 600; color: #0f172a; font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; }
    .s-total { border-top: 1px solid #e2e8f0; margin-top: 4px; padding-top: 10px; }
    .s-gross { border-top: 2px solid #2563eb; margin-top: 4px; padding-top: 10px; }
    .s-gross .s-lbl { font-weight: 700; color: #0f172a; }
    .s-val-gross { color: #2563eb; font-size: 1rem; font-weight: 700; font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; }

    .leave-card {
      background: white; border-radius: 14px; padding: 20px; text-align: center;
      box-shadow: 0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.06);
      border: 1px solid #e2e8f0;
    }
    .leave-header { justify-content: center; }
    .leave-ring { position: relative; width: 100px; margin: 0 auto 8px; }
    .leave-ring-svg { width: 100px; height: 100px; transform: rotate(-90deg); }
    .ring-bg { fill: none; stroke: #e2e8f0; stroke-width: 3; }
    .ring-fg { fill: none; stroke: #2563eb; stroke-width: 3; stroke-linecap: round; transition: stroke-dasharray 0.5s ease; }
    .leave-num {
      position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      font-size: 1.75rem; font-weight: 700; color: #2563eb;
    }
    .leave-label { font-size: 0.75rem; color: #94a3b8; font-weight: 500; }

    .leadership-card {
      background: white; border-radius: 14px; padding: 20px;
      box-shadow: 0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.06);
      border: 1px solid #e2e8f0;
      border-top: 3px solid #7c3aed;
    }
    .lead-row { display: flex; align-items: center; gap: 10px; font-size: 0.8125rem; color: #475569; margin-bottom: 10px; }
    .lead-row:last-child { margin-bottom: 0; }
    .lead-row strong { color: #0f172a; }
    .lead-icon {
      width: 24px; height: 24px; border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.6875rem; font-weight: 800; flex-shrink: 0;
    }

    .assign-card {
      grid-column: 1 / -1;
      background: white; border-radius: 14px; padding: 20px;
      box-shadow: 0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.06);
      border: 1px solid #e2e8f0;
      border-top: 3px solid #0891b2;
    }
    .assign-table { font-size: 0.8125rem; }
    .assign-thead {
      display: grid; grid-template-columns: 1.2fr 1.5fr 1fr 0.8fr; gap: 12px;
      padding: 10px 0; font-weight: 700; color: #64748b;
      font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.04em;
      border-bottom: 1px solid #e2e8f0;
    }
    .assign-trow {
      display: grid; grid-template-columns: 1.2fr 1.5fr 1fr 0.8fr; gap: 12px;
      padding: 10px 0; color: #475569;
      border-bottom: 1px solid #f1f5f9; align-items: center;
    }
    .assign-trow:last-child { border-bottom: none; }
    .assign-class { font-weight: 600; color: #0f172a; }
    .assign-badge { font-size: 0.6875rem; font-weight: 600; color: #2563eb; background: #eff6ff; padding: 2px 8px; border-radius: 6px; display: inline-block; width: fit-content; }
    .assign-year { color: #94a3b8; font-size: 0.75rem; }

    .payslip-card {
      grid-column: 1 / -1;
      background: white; border-radius: 14px; padding: 20px;
      box-shadow: 0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.06);
      border: 1px solid #e2e8f0;
      border-top: 3px solid #059669;
    }
    .payslip-header { gap: 8px; flex-wrap: wrap; }
    .payslip-month { font-weight: 400; color: #64748b; text-transform: none; letter-spacing: normal; font-size: 0.75rem; }
    .chip { font-size: 0.625rem; font-weight: 700; padding: 3px 10px; border-radius: 999px; margin-left: auto; }
    .chip-paid { background: #d1fae5; color: #059669; }
    .chip-unpaid { background: #fee2e2; color: #e11d48; }

    .payslip-grid { display: flex; flex-direction: column; gap: 8px; }
    .p-row { display: flex; justify-content: space-between; align-items: center; font-size: 0.8125rem; padding: 6px 0; }
    .p-lbl { color: #64748b; }
    .p-val { font-weight: 600; color: #0f172a; font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; }
    .p-deduct { color: #e11d48; }
    .p-net { border-top: 2px solid #059669; margin-top: 4px; padding-top: 10px; }
    .p-net .p-lbl { font-weight: 700; color: #0f172a; }
    .p-val-net { color: #059669; font-weight: 700; font-size: 1rem; font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; }

    .loading-state, .error-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 60px; gap: 12px; color: #94a3b8; font-size: 0.875rem;
    }
    .err-icon { width: 40px; height: 40px; color: #e2e8f0; }
    .error-state p { margin: 0; }
    .loader {
      width: 28px; height: 28px; border: 3px solid #e2e8f0;
      border-top-color: #2563eb; border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class StaffDetailComponent implements OnInit {
  private financeService = inject(FinanceService);
  private route = inject(ActivatedRoute);

  staff = signal<StaffDetail | null>(null);
  loading = signal(true);
  FORMAT_CURRENCY = FORMAT_CURRENCY;

  private readonly palettes = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#0891b2'];

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.loading.set(false); return; }
    this.loadDetail(id);
  }

  private loadDetail(id: number): void {
    this.loading.set(true);
    this.financeService.getStaffDetail(id).subscribe({
      next: (s) => { this.staff.set(s); this.loading.set(false); },
      error: () => { this.loading.set(false); },
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

  monthName(m: number): string {
    return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1] || '';
  }

  avatarGrad(first: string, last: string): string {
    const n = ((first?.charCodeAt(0) || 0) + (last?.charCodeAt(0) || 0)) % this.palettes.length;
    return `linear-gradient(135deg, ${this.palettes[n]}, ${this.palettes[(n + 1) % this.palettes.length]})`;
  }

  leavePct(points: number): number {
    const max = 10;
    return Math.min(Math.round((points / max) * 100), 100);
  }
}
