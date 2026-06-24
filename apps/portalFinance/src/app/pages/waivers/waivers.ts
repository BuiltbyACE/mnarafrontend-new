import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../services/finance.service';
import {
  FeeWaiver, FeeWaiverRequest, WaiverReversalRequest, WaiverStats,
  InvoiceItem, StudentProfileMin,
  StaffMember, FORMAT_CURRENCY, STATUS_COLOR,
  WAIVER_TYPE_LABELS, WAIVER_TYPE_OPTIONS,
} from '../../models/finance.models';

@Component({
  selector: 'app-waivers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container page-fade-in">
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">Fee Waivers</h1>
          <p class="page-subtitle">Manage fee waivers and concessions</p>
        </div>
        <div class="header-actions">
          <button class="btn-primary" (click)="showCreateModal.set(true)">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Waiver
          </button>
        </div>
      </div>

      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-label">Total Waivers</span>
          <span class="stat-value">{{ FORMAT_CURRENCY(stats().total_waivers) }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">This Month</span>
          <span class="stat-value text-warning">{{ FORMAT_CURRENCY(stats().this_month) }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">This Term</span>
          <span class="stat-value text-blue">{{ FORMAT_CURRENCY(stats().this_term) }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Reversed</span>
          <span class="stat-value text-faint">{{ FORMAT_CURRENCY(stats().reversed) }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Outstanding</span>
          <span class="stat-value" [class.text-success]="stats().outstanding > 0">{{ FORMAT_CURRENCY(stats().outstanding) }}</span>
        </div>
      </div>

      <div class="panel main-panel">
        <div class="panel-header">
          <h3>All Waivers</h3>
          <div class="panel-actions">
            <div class="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" [(ngModel)]="searchQuery" placeholder="Search reason or student..." class="search-input">
            </div>
          </div>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Waiver #</th>
                <th>Student</th>
                <th>Family</th>
                <th>Invoice Item</th>
                <th>Waiver Type</th>
                <th>Amount</th>
                <th>Reason</th>
                <th>Entered By</th>
                <th>Authorized By</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (w of filteredWaivers(); track w.id) {
                <tr>
                  <td><span class="mono-badge">{{ w.reference_number || '#' + w.id }}</span></td>
                  <td>{{ w.student_name || '—' }}</td>
                  <td>{{ w.family_account_number || '—' }}</td>
                  <td>{{ getItemCategory(w) }}</td>
                  <td><span class="type-badge">{{ WAIVER_TYPE_LABELS[w.waiver_type] || w.waiver_type }}</span></td>
                  <td class="font-bold text-warning">{{ FORMAT_CURRENCY(w.amount) }}</td>
                  <td class="reason-cell">{{ w.reason }}</td>
                  <td>{{ w.entered_by_name }}</td>
                  <td>{{ w.authorized_by_name }}</td>
                  <td>
                    <span class="status-badge" [style.background]="STATUS_COLOR[w.status] || '#94a3b8'">
                      {{ w.status }}
                    </span>
                  </td>
                  <td class="text-faint">{{ w.created_at.slice(0, 10) }}</td>
                  <td>
                    @if (w.status === 'active') {
                      <button class="btn-small btn-danger" (click)="openReverseModal(w)">
                        Reverse
                      </button>
                    }
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="12" class="empty-state">No waivers found</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    @if (showCreateModal()) {
      <div class="modal-overlay" (click)="closeCreateModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Create Fee Waiver</h2>
            <button class="close-btn" (click)="closeCreateModal()">&times;</button>
          </div>
          <div class="modal-body">
            <p class="modal-desc">Waivers are posted immediately with dual-user audit (finance officer + principal).</p>
            <div class="form-group">
              <label>Select Student</label>
              <select class="form-control" [(ngModel)]="selectedStudentId" (change)="onStudentChange()">
                <option [ngValue]="null">— Select Student —</option>
                @for (s of students(); track s.id) {
                  <option [ngValue]="s.id">{{ s.first_name }} {{ s.last_name }} ({{ s.user_school_id }})</option>
                }
              </select>
            </div>
            @if (selectedStudentId() && studentInvoiceItems().length) {
              <div class="form-group">
                <label>Select Invoice Item</label>
                <select class="form-control" [(ngModel)]="newWaiver.invoice_item_id">
                  <option [ngValue]="0">— Select Item —</option>
                  @for (item of studentInvoiceItems(); track item.id) {
                    <option [ngValue]="item.id">
                      {{ item.fee_category_name }} — Bal: {{ FORMAT_CURRENCY(item.balance) }}
                    </option>
                  }
                </select>
              </div>
            } @else if (selectedStudentId()) {
              <p class="text-faint" style="font-size:0.8125rem;">No outstanding invoice items for this student.</p>
            }
            <div class="form-row">
              <div class="form-group" style="flex:1;">
                <label>Waiver Amount (KES)</label>
                <input type="number" class="form-control" [(ngModel)]="newWaiver.amount" placeholder="0.00" min="1">
              </div>
              <div class="form-group" style="flex:1;">
                <label>Waiver Type</label>
                <select class="form-control" [(ngModel)]="newWaiver.waiver_type">
                  @for (opt of WAIVER_TYPE_OPTIONS; track opt.value) {
                    <option [ngValue]="opt.value">{{ opt.label }}</option>
                  }
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>Reason</label>
              <textarea class="form-control" [(ngModel)]="newWaiver.reason" placeholder="Explain why this waiver is being granted..." rows="3"></textarea>
            </div>
            <div class="form-group">
              <label>Authorized By (Principal)</label>
              <select class="form-control" [(ngModel)]="newWaiver.authorized_by_id">
                <option [ngValue]="0">— Select Principal —</option>
                @for (s of staffMembers(); track s.id) {
                  <option [ngValue]="s.id">{{ s.first_name }} {{ s.last_name }} — {{ s.role }}</option>
                }
              </select>
            </div>
            @if (error()) {
              <div class="error-msg">{{ error() }}</div>
            }
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" (click)="closeCreateModal()">Cancel</button>
            <button class="btn-primary" (click)="submitWaiver()" [disabled]="!canSubmit()">
              {{ submitting() ? 'Posting...' : 'Post Waiver' }}
            </button>
          </div>
        </div>
      </div>
    }

    @if (reverseTarget()) {
      <div class="modal-overlay" (click)="closeReverseModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Reverse Waiver</h2>
            <button class="close-btn" (click)="closeReverseModal()">&times;</button>
          </div>
          <div class="modal-body">
            <p class="modal-desc">
              Reversing waiver <strong>{{ reverseTarget()?.reference_number }}</strong> ({{ FORMAT_CURRENCY(reverseTarget()?.amount || 0) }}).
              This creates offsetting journal entries. The original record remains visible.
            </p>
            <div class="form-group">
              <label>Reversal Reason (min 10 characters)</label>
              <textarea class="form-control" [(ngModel)]="reversalReason" placeholder="Explain why this waiver is being reversed..." rows="3"></textarea>
            </div>
            @if (error()) {
              <div class="error-msg">{{ error() }}</div>
            }
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" (click)="closeReverseModal()">Cancel</button>
            <button class="btn-danger" (click)="submitReverse()" [disabled]="reversalReason.trim().length < 10 || reversing()">
              {{ reversing() ? 'Reversing...' : 'Confirm Reversal' }}
            </button>
          </div>
        </div>
      </div>
    }

    @if (successMsg()) {
      <div class="toast-success">{{ successMsg() }}</div>
    }
  `,
  styles: [`
    :host { display: contents; }
    .page-container { padding: 24px 32px; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .header-left { display: flex; flex-direction: column; gap: 4px; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0; }
    .page-subtitle { font-size: 0.875rem; color: #64748b; margin: 0; }
    .header-actions { display: flex; gap: 8px; }
    .stats-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06); }
    .stat-label { display: block; font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: #0f172a; }
    .text-success { color: #059669; }
    .text-warning { color: #d97706; }
    .text-blue { color: #2563eb; }
    .text-faint { color: #94a3b8; }
    .font-bold { font-weight: 600; }
    .btn-primary {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 8px 20px; background: #2563eb; color: white; border: none;
      border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer;
      font-family: 'Inter', sans-serif;
    }
    .btn-primary:hover { background: #1d4ed8; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-danger {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 8px 20px; background: #e11d48; color: white; border: none;
      border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer;
      font-family: 'Inter', sans-serif;
    }
    .btn-danger:hover { background: #be123c; }
    .btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-small {
      padding: 4px 12px;
      font-size: 0.75rem;
    }
    .btn-icon { width: 16px; height: 16px; }
    .panel { background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06); overflow: hidden; }
    .main-panel { margin-bottom: 24px; }
    .panel-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #e2e8f0; }
    .panel-header h3 { margin: 0; font-size: 1rem; font-weight: 600; color: #0f172a; }
    .panel-actions { display: flex; gap: 8px; }
    .search-box { display: flex; align-items: center; gap: 6px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 12px; }
    .search-box svg { width: 16px; height: 16px; color: #94a3b8; }
    .search-input { border: none; background: transparent; outline: none; font-size: 0.8125rem; color: #0f172a; width: 200px; font-family: 'Inter', sans-serif; }
    .table-container { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; padding: 10px 16px; font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; background: #f8fafc; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
    .data-table td { padding: 12px 16px; font-size: 0.8125rem; color: #334155; border-bottom: 1px solid #f1f5f9; }
    .data-table tbody tr:hover td { background: #f8fafc; }
    .mono-badge { font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; color: #64748b; }
    .reason-cell { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .status-badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 0.6875rem; font-weight: 600; color: white; text-transform: uppercase; }
    .type-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.6875rem; font-weight: 600; background: #f1f5f9; color: #475569; }
    .empty-state { text-align: center; padding: 40px; color: #94a3b8; font-size: 0.875rem; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-content { background: white; border-radius: 16px; width: 520px; max-height: 80vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px 0; }
    .modal-header h2 { margin: 0; font-size: 1.125rem; font-weight: 700; color: #0f172a; }
    .close-btn { background: none; border: none; font-size: 1.5rem; color: #94a3b8; cursor: pointer; padding: 0; line-height: 1; }
    .modal-desc { font-size: 0.8125rem; color: #64748b; margin: 0; }
    .modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-row { display: flex; gap: 16px; }
    .form-group label { font-size: 0.8125rem; font-weight: 600; color: #334155; }
    .form-control {
      padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px;
      font-size: 0.875rem; color: #0f172a; background: white; outline: none;
      font-family: 'Inter', sans-serif; transition: border-color 0.15s;
    }
    .form-control:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
    select.form-control { appearance: auto; }
    textarea.form-control { resize: vertical; min-height: 60px; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 16px 24px 20px; border-top: 1px solid #f1f5f9; }
    .btn-ghost { padding: 8px 20px; background: transparent; color: #334155; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem; font-weight: 500; cursor: pointer; font-family: 'Inter', sans-serif; }
    .btn-ghost:hover { background: #f8fafc; }
    .error-msg { padding: 10px 14px; background: #fef2f2; color: #e11d48; border-radius: 8px; font-size: 0.8125rem; border: 1px solid #fecaca; }
    .toast-success {
      position: fixed; bottom: 24px; right: 24px;
      padding: 12px 24px; background: #059669; color: white; border-radius: 10px;
      font-size: 0.875rem; font-weight: 500; z-index: 2000;
      box-shadow: 0 4px 12px rgba(5,150,105,0.3);
      animation: slideUp 0.3s ease;
    }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  `],
})
export class WaiversComponent implements OnInit {
  private financeService = inject(FinanceService);

  readonly waivers = signal<FeeWaiver[]>([]);
  readonly stats = signal<WaiverStats>({
    total_waivers: 0, this_month: 0, this_term: 0, reversed: 0, outstanding: 0,
  });
  readonly students = signal<StudentProfileMin[]>([]);
  readonly staffMembers = signal<StaffMember[]>([]);
  readonly searchQuery = signal('');
  readonly showCreateModal = signal(false);
  readonly submitting = signal(false);
  readonly reversing = signal(false);
  readonly error = signal<string | null>(null);
  readonly successMsg = signal<string | null>(null);
  readonly selectedStudentId = signal<number | null>(null);
  readonly studentData = signal<any>(null);
  readonly reverseTarget = signal<FeeWaiver | null>(null);

  readonly studentInvoiceItems = computed(() => {
    const data = this.studentData();
    if (!data) return [];
    const items: InvoiceItem[] = [];
    for (const inv of data.invoices || []) {
      for (const item of inv.items || []) {
        items.push({ ...item, fee_category_name: item.fee_category_name || inv.fee_title });
      }
    }
    return items;
  });

  newWaiver: FeeWaiverRequest = { invoice_item_id: 0, amount: 0, waiver_type: 'OTHER', reason: '', authorized_by_id: 0 };
  reversalReason = '';

  readonly STATUS_COLOR = STATUS_COLOR;
  readonly FORMAT_CURRENCY = FORMAT_CURRENCY;
  readonly WAIVER_TYPE_LABELS = WAIVER_TYPE_LABELS;
  readonly WAIVER_TYPE_OPTIONS = WAIVER_TYPE_OPTIONS;

  getItemCategory(w: FeeWaiver): string {
    const details = (w.invoice_item_details as any);
    return details?.fee_category_name || details?.description || '—';
  }

  readonly filteredWaivers = computed(() => {
    const q = this.searchQuery().toLowerCase();
    if (!q) return this.waivers();
    return this.waivers().filter(w =>
      w.reason.toLowerCase().includes(q) ||
      w.authorized_by_name?.toLowerCase().includes(q) ||
      w.student_name?.toLowerCase().includes(q) ||
      (w.reference_number || '').toLowerCase().includes(q)
    );
  });

  readonly canSubmit = computed(() =>
    !!this.newWaiver.invoice_item_id &&
    this.newWaiver.amount > 0 &&
    this.newWaiver.reason.trim().length > 0 &&
    !!this.newWaiver.authorized_by_id &&
    !this.submitting()
  );

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    this.financeService.getWaivers().subscribe({
      next: (res) => this.waivers.set(res),
    });
    this.financeService.getWaiverStats().subscribe({
      next: (res) => this.stats.set(res),
    });
    this.financeService.getStudentProfiles(1, 500).subscribe({
      next: (res) => this.students.set(res.results),
    });
    this.financeService.getStaffDirectory().subscribe({
      next: (res) => {
        const all = [
          ...(res.teaching_staff || []).flatMap((g: any) => g.members),
          ...(res.non_teaching_staff || []).flatMap((g: any) => g.members)
        ];
        this.staffMembers.set(all);
      },
    });
  }

  onStudentChange() {
    const sid = this.selectedStudentId();
    if (!sid) { this.studentData.set(null); return; }
    this.financeService.getStudentFinanceSummary(sid).subscribe({
      next: (res) => this.studentData.set(res),
    });
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
    this.selectedStudentId.set(null);
    this.studentData.set(null);
    this.newWaiver = { invoice_item_id: 0, amount: 0, waiver_type: 'OTHER', reason: '', authorized_by_id: 0 };
    this.error.set(null);
  }

  submitWaiver() {
    if (!this.canSubmit()) return;
    this.submitting.set(true);
    this.error.set(null);
    this.financeService.createWaiver({ ...this.newWaiver }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.successMsg.set('Waiver created successfully');
        this.closeCreateModal();
        this.loadData();
        setTimeout(() => this.successMsg.set(null), 3000);
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(err.error?.message || err.error?.detail || 'Failed to create waiver');
      },
    });
  }

  openReverseModal(waiver: FeeWaiver) {
    this.reverseTarget.set(waiver);
    this.reversalReason = '';
    this.error.set(null);
  }

  closeReverseModal() {
    this.reverseTarget.set(null);
    this.reversalReason = '';
    this.error.set(null);
  }

  submitReverse() {
    const target = this.reverseTarget();
    if (!target || this.reversalReason.trim().length < 10) return;
    this.reversing.set(true);
    this.error.set(null);
    this.financeService.reverseWaiver(target.id, { reason: this.reversalReason }).subscribe({
      next: () => {
        this.reversing.set(false);
        this.successMsg.set('Waiver reversed successfully');
        this.closeReverseModal();
        this.loadData();
        setTimeout(() => this.successMsg.set(null), 3000);
      },
      error: (err) => {
        this.reversing.set(false);
        this.error.set(err.error?.detail || 'Failed to reverse waiver');
      },
    });
  }
}