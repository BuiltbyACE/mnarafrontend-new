import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { FinanceService } from '../../services/finance.service';
import {
  FeeWaiver, FeeWaiverRequest, WaiverReversalRequest, WaiverStats,
  StaffMember, FORMAT_CURRENCY, STATUS_COLOR,
  WAIVER_TYPE_LABELS, WAIVER_TYPE_OPTIONS,
  FamilyAccount, FamilySummaryItem, FamilySummaryStudent,
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
                  <td>{{ w.family_code || '—' }}</td>
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
        <div class="modal-content waiver-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Create Fee Waiver</h2>
            <button class="close-btn" (click)="closeCreateModal()">&times;</button>
          </div>
          <div class="modal-body">
            <p class="modal-desc">Waivers are posted immediately with dual-user audit (finance officer + principal).</p>

            <div class="top-filters">
              <div class="form-group flex-1">
                <label>Select Family <span class="text-danger">*</span></label>
                <select class="form-control" [(ngModel)]="selectedFamilyId" (change)="onFamilyChange()">
                  <option [ngValue]="null">— Select Family —</option>
                  @for (f of families(); track f.id) {
                    <option [ngValue]="f.id">{{ f.account_number }} ({{ FORMAT_CURRENCY(f.balance) }} bal)</option>
                  }
                </select>
                @if (selectedFamilyId()) {
                  <span class="field-help">Balance: {{ FORMAT_CURRENCY(getSelectedFamilyBalance()) }}</span>
                }
              </div>

              <div class="form-group flex-1">
                <label>Select Reason Category <span class="text-danger">*</span></label>
                <select class="form-control" [ngModel]="waiverType()" (ngModelChange)="waiverType.set($event)">
                  @for (opt of WAIVER_TYPE_OPTIONS; track opt.value) {
                    <option [ngValue]="opt.value">{{ opt.label }}</option>
                  }
                </select>
                <span class="field-help">Select the primary reason for this waiver</span>
              </div>
            </div>

            @if (selectedFamilyId() && familyStudents().length) {
              <div class="waiver-table-container">
                <div class="waiver-table-header">
                  <h3>Waive Items Per Student</h3>
                </div>
                <table class="waiver-table">
                  <thead>
                    <tr>
                      <th>STUDENT</th>
                      <th>INVOICE ITEM</th>
                      <th>INVOICE #</th>
                      <th>AMOUNT DUE (KES)</th>
                      <th>WAIVER AMOUNT (KES)</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (stu of familyStudents(); track stu.id) {
                      @for (item of stu.items; track item.id; let i = $index) {
                        <tr>
                          @if (i === 0) {
                            <td [rowSpan]="stu.items.length + 1" class="student-col">
                              <strong>{{ stu.name }}</strong>
                              <span class="student-adm">Admission: {{ getStudentAdm(stu.id) }}</span>
                            </td>
                          }
                          <td>
                            <label class="item-checkbox">
                              <input type="checkbox" 
                                     [ngModel]="selectedItems()[item.id]" 
                                     (ngModelChange)="toggleItem(item.id, $event)">
                              <span>{{ item.fee_category_name || item.description }}</span>
                            </label>
                          </td>
                          <td><span class="mono-text">{{ getInvoiceDisplay(item) }}</span></td>
                          <td>{{ FORMAT_VAL(item.balance) }}</td>
                          <td>
                            <input type="number" class="form-control amount-input" 
                                   [disabled]="!selectedItems()[item.id]"
                                   [ngModel]="itemAmounts()[item.id] || ''" 
                                   (ngModelChange)="updateItemAmount(item.id, $event, item.balance)"
                                   placeholder="0.00" min="0">
                          </td>
                        </tr>
                      }
                      <tr class="subtotal-row">
                        <td colspan="4" class="subtotal-label">Total Waiver for {{ getFirstName(stu.name) }}:</td>
                        <td class="subtotal-amount">{{ FORMAT_CURRENCY(getStudentWaiverTotal(stu.id)) }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            } @else if (selectedFamilyId()) {
              <p class="text-faint" style="font-size:0.8125rem;">No outstanding invoice items for this family.</p>
            }

            <div class="bottom-summary">
              <div class="total-section">
                <span class="total-label">Total Waiver Amount</span>
                <span class="total-value">{{ FORMAT_CURRENCY(totalWaiverAmount()) }}</span>
              </div>
              
              <div class="note-section">
                <div class="form-group mb-2">
                  <label>Authorized By <span class="text-danger">*</span></label>
                  <select class="form-control" [ngModel]="waiverAuthorizedBy()" (ngModelChange)="waiverAuthorizedBy.set($event)">
                    <option [ngValue]="0">— Select Principal —</option>
                    @for (s of staffMembers(); track s.id) {
                      <option [ngValue]="s.id">{{ s.first_name }} {{ s.last_name }} — {{ s.role }}</option>
                    }
                  </select>
                </div>
                <div class="form-group m-0">
                  <label>Waiver Note (Optional)</label>
                  <textarea class="form-control" [ngModel]="waiverReason()" (ngModelChange)="waiverReason.set($event)" placeholder="Add a note or supporting document reference..." rows="2"></textarea>
                </div>
              </div>
            </div>

            @if (error()) {
              <div class="error-msg">{{ error() }}</div>
            }
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" (click)="closeCreateModal()">Cancel</button>
            <button class="btn-primary" (click)="submitWaiver()" [disabled]="!canSubmit()">
              {{ submitting() ? 'Processing...' : 'Preview Waiver' }}
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
              <label>Reversal Reason</label>
              <textarea class="form-control" [(ngModel)]="reversalReason" placeholder="Explain why this waiver is being reversed..." rows="2"></textarea>
            </div>
            <div class="reversal-code-section">
              <div class="reversal-code-label">Enter confirmation code to proceed</div>
              <div class="reversal-code-display">{{ reversalCode() }}</div>
              <input type="text" class="form-control code-input" [(ngModel)]="reversalCodeInput" placeholder="Paste or type the code above" maxlength="10">
            </div>
            @if (error()) {
              <div class="error-msg">{{ error() }}</div>
            }
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" (click)="closeReverseModal()">Cancel</button>
            <button class="btn-danger" (click)="submitReverse()" [disabled]="reversalCodeInput !== reversalCode() || reversing()">
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
    .table-container { overflow-x: auto; overflow-y: auto; max-height: 480px; }
    .table-container thead { position: sticky; top: 0; z-index: 1; }
    .table-container thead th { position: sticky; top: 0; z-index: 2; }
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
    .modal-content { background: white; border-radius: 16px; width: 520px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
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
    .students-section { display: flex; flex-direction: column; gap: 8px; max-height: 320px; overflow-y: auto; padding-right: 4px; }
    .student-card { border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; transition: border-color 0.15s; }
    .student-card.has-selection { border-color: #2563eb; background: #f8faff; }
    .student-card-header { display: flex; align-items: center; gap: 12px; padding: 12px 14px; cursor: pointer; user-select: none; }
    .student-card-header:hover { background: #f8fafc; }
    .student-card-name { font-weight: 600; font-size: 0.875rem; color: #0f172a; flex: 1; }
    .student-card-total { font-size: 0.75rem; color: #64748b; font-weight: 500; }
    .expand-icon { font-size: 0.75rem; color: #94a3b8; transition: transform 0.15s; }
    .fee-items { border-top: 1px solid #f1f5f9; }
    .fee-item-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; cursor: pointer; transition: background 0.1s; }
    .fee-item-row:hover { background: #f1f5f9; }
    .fee-item-row.is-selected { background: #eff6ff; }
    .fee-item-left { display: flex; align-items: center; gap: 10px; }
    .fee-check { width: 18px; font-size: 0.75rem; color: #2563eb; font-weight: 700; text-align: center; }
    .fee-name { display: block; font-size: 0.8125rem; font-weight: 500; color: #0f172a; }
    .fee-balance { display: block; font-size: 0.6875rem; color: #64748b; margin-top: 1px; }
    .fee-amount { font-size: 0.8125rem; font-weight: 600; color: #334155; }
    .waiver-config-section { display: flex; flex-direction: column; gap: 14px; }
    .config-divider { height: 1px; background: #e2e8f0; margin: 4px 0; }
    .selected-summary { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; }
    .summary-label { font-size: 0.6875rem; font-weight: 700; color: #16a34a; text-transform: uppercase; letter-spacing: 0.05em; }
    .summary-value { font-size: 0.8125rem; font-weight: 600; color: #166534; }
    .reversal-code-section { text-align: center; padding: 8px 0; }
    .reversal-code-label { font-size: 0.75rem; font-weight: 600; color: #64748b; margin-bottom: 8px; }
    .reversal-code-display {
      font-family: 'JetBrains Mono', monospace; font-size: 1.5rem; font-weight: 700;
      letter-spacing: 0.3em; color: #e11d48; background: #fef2f2; border: 2px dashed #fca5a5;
      border-radius: 10px; padding: 12px; margin-bottom: 10px; user-select: all;
    }
    .code-input { text-align: center; font-family: 'JetBrains Mono', monospace; font-size: 1.125rem; letter-spacing: 0.2em; text-transform: uppercase; }
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

    .waiver-modal { width: 1100px; max-width: 95vw; }
    .top-filters { display: flex; gap: 24px; margin-top: 8px; }
    .flex-1 { flex: 1; }
    .text-danger { color: #e11d48; }
    .field-help { font-size: 0.75rem; color: #64748b; margin-top: 4px; display: block; }
    .waiver-table-container { margin-top: 20px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
    .waiver-table-header { padding: 12px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
    .waiver-table-header h3 { margin: 0; font-size: 0.875rem; font-weight: 600; color: #0f172a; }
    .waiver-table { width: 100%; border-collapse: collapse; text-align: left; }
    .waiver-table th { padding: 10px 16px; font-size: 0.6875rem; font-weight: 700; color: #64748b; text-transform: uppercase; background: white; border-bottom: 1px solid #e2e8f0; }
    .waiver-table td { padding: 12px 16px; font-size: 0.8125rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    .student-col { vertical-align: top; background: #fafafa; border-right: 1px solid #e2e8f0; }
    .student-col strong { display: block; color: #0f172a; font-size: 0.875rem; }
    .student-adm { font-size: 0.75rem; color: #64748b; margin-top: 2px; display: block; }
    .item-checkbox { display: flex; align-items: center; gap: 8px; cursor: pointer; }
    .item-checkbox input { margin: 0; cursor: pointer; }
    .amount-input { width: 120px; text-align: right; }
    .subtotal-row td { background: #f8fafc; padding: 10px 16px; font-weight: 600; font-size: 0.8125rem; }
    .subtotal-label { text-align: right; color: #475569; }
    .subtotal-amount { color: #0f172a; }
    .bottom-summary { display: flex; justify-content: space-between; margin-top: 24px; gap: 24px; }
    .total-section { flex: 1; display: flex; flex-direction: column; gap: 8px; }
    .total-label { font-size: 0.875rem; font-weight: 600; color: #334155; }
    .total-value { font-size: 2rem; font-weight: 700; color: #16a34a; }
    .note-section { flex: 2; display: flex; flex-direction: column; background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; }
    .mb-2 { margin-bottom: 16px; }
    .m-0 { margin: 0; }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  `],
})
export class WaiversComponent implements OnInit {
  private financeService = inject(FinanceService);

  readonly waivers = signal<FeeWaiver[]>([]);
  readonly stats = signal<WaiverStats>({
    total_waivers: 0, this_month: 0, this_term: 0, reversed: 0, outstanding: 0,
  });
  readonly families = signal<FamilyAccount[]>([]);
  readonly staffMembers = signal<StaffMember[]>([]);
  readonly searchQuery = signal('');
  readonly showCreateModal = signal(false);
  readonly submitting = signal(false);
  readonly reversing = signal(false);
  readonly error = signal<string | null>(null);
  readonly successMsg = signal<string | null>(null);
  readonly selectedFamilyId = signal<number | null>(null);
  readonly familySummaryData = signal<any>(null);
  readonly reverseTarget = signal<FeeWaiver | null>(null);
  readonly selectedItems = signal<Record<number, boolean>>({});
  readonly itemAmounts = signal<Record<number, number>>({});

  readonly familyStudents = computed(() => {
    const data = this.familySummaryData();
    if (!data) return [] as { id: number; name: string; totalOutstanding: number; items: FamilySummaryItem[] }[];
    return (data.students || []).map((s: FamilySummaryStudent) => {
      const items: FamilySummaryItem[] = [];
      for (const inv of s.invoices || []) {
        for (const item of inv.items || []) {
          items.push({ ...item, fee_category_name: item.fee_category_name || inv.fee_title, _studentName: `${s.first_name} ${s.last_name}` });
        }
      }
      const totalOutstanding = items.reduce((sum, i) => sum + (i.balance || 0), 0);
      return { id: s.id, name: `${s.first_name} ${s.last_name}`, totalOutstanding, items };
    });
  });

  // waiverAmount removed
  waiverType = signal('OTHER');
  waiverReason = signal('');
  waiverAuthorizedBy = signal(0);
  reversalReason = '';
  reversalCodeInput = '';
  reversalCode = signal('');

  private generateReversalCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 10; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  }

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
    let list = this.waivers();
    if (q) {
      list = list.filter(w =>
        w.reason.toLowerCase().includes(q) ||
        w.authorized_by_name?.toLowerCase().includes(q) ||
        w.student_name?.toLowerCase().includes(q) ||
        (w.reference_number || '').toLowerCase().includes(q)
      );
    }
    const sortKey: Record<string, number> = { active: 0, reversed: 1 };
    return [...list].sort((a, b) => {
      const sa = sortKey[a.status] ?? 2;
      const sb = sortKey[b.status] ?? 2;
      if (sa !== sb) return sa - sb;
      return (b.created_at || '').localeCompare(a.created_at || '');
    });
  });


  readonly totalWaiverAmount = computed(() => {
    const amounts = this.itemAmounts();
    const selected = this.selectedItems();
    let total = 0;
    for (const id in selected) {
      if (selected[id] && amounts[id]) {
        total += amounts[id];
      }
    }
    return total;
  });

  getStudentWaiverTotal(studentId: number): number {
    const data = this.familySummaryData();
    if (!data || !data.students) return 0;
    const student = data.students.find((s: any) => s.id === studentId);
    if (!student) return 0;
    
    const amounts = this.itemAmounts();
    const selected = this.selectedItems();
    let total = 0;
    for (const inv of student.invoices || []) {
      for (const item of inv.items || []) {
        if (selected[item.id] && amounts[item.id]) {
          total += amounts[item.id];
        }
      }
    }
    return total;
  }

  getStudentAdm(studentId: number): string {
    const data = this.familySummaryData();
    if (!data || !data.students) return 'N/A';
    const student = data.students.find((s: any) => s.id === studentId);
    return student?.school_id || 'N/A';
  }

  getFirstName(fullName: string): string {
    return fullName ? fullName.split(' ')[0] : '';
  }

  getSelectedFamilyBalance(): number {
    const fid = this.selectedFamilyId();
    if (!fid) return 0;
    const f = this.families().find(fam => fam.id === fid);
    return f ? f.balance : 0;
  }

  FORMAT_VAL(amount: number): string {
    return amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  getInvoiceDisplay(item: any): string {
    return `INV-2026-00${item.id % 100}`;
  }

  toggleItem(itemId: number, checked: boolean) {
    this.selectedItems.update(v => ({ ...v, [itemId]: checked }));
    if (!checked) {
      this.itemAmounts.update(v => {
        const copy = { ...v };
        delete copy[itemId];
        return copy;
      });
    }
  }

  updateItemAmount(itemId: number, value: number, maxBalance: number) {
    if (value > maxBalance) value = maxBalance;
    this.itemAmounts.update(v => ({ ...v, [itemId]: value }));
  }

  readonly canSubmit = computed(() => {
    return this.totalWaiverAmount() > 0 && !!this.waiverAuthorizedBy() && !this.submitting();
  });

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
    this.financeService.getFamilies().subscribe({
      next: (res) => this.families.set(res),
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

  onFamilyChange() {
    const fid = this.selectedFamilyId();
    if (!fid) { this.familySummaryData.set(null); return; }
    this.financeService.getFamilySummary(fid).subscribe({
      next: (res) => this.familySummaryData.set(res),
    });
  }



  closeCreateModal() {
    this.showCreateModal.set(false);
    this.selectedFamilyId.set(null);
    this.familySummaryData.set(null);
    this.selectedItems.set({});
    this.itemAmounts.set({});
    this.waiverType.set('OTHER');
    this.waiverReason.set('');
    this.waiverAuthorizedBy.set(0);
    this.error.set(null);
  }

  submitWaiver() {
    if (!this.canSubmit()) return;
    this.submitting.set(true);
    this.error.set(null);
    
    const selected = this.selectedItems();
    const amounts = this.itemAmounts();
    
    const requests = Object.keys(selected)
      .map(id => parseInt(id, 10))
      .filter(id => selected[id] && amounts[id] > 0)
      .map(id => this.financeService.createWaiver({
        invoice_item_id: id,
        amount: amounts[id],
        waiver_type: this.waiverType() as any,
        reason: this.waiverReason(),
        authorized_by_id: this.waiverAuthorizedBy(),
      }));

    if (requests.length === 0) {
      this.submitting.set(false);
      return;
    }

    forkJoin(requests).subscribe({
      next: () => {
        this.submitting.set(false);
        this.successMsg.set(`Successfully created ${requests.length} waiver(s)`);
        this.closeCreateModal();
        this.loadData();
        setTimeout(() => this.successMsg.set(null), 3000);
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(err.error?.message || err.error?.detail || 'Failed to create one or more waivers');
      },
    });
  }

  openReverseModal(waiver: FeeWaiver) {
    this.reverseTarget.set(waiver);
    this.reversalReason = '';
    this.reversalCodeInput = '';
    this.reversalCode.set(this.generateReversalCode());
    this.error.set(null);
  }

  closeReverseModal() {
    this.reverseTarget.set(null);
    this.reversalReason = '';
    this.reversalCodeInput = '';
    this.reversalCode.set('');
    this.error.set(null);
  }

  submitReverse() {
    const target = this.reverseTarget();
    if (!target || this.reversalCodeInput !== this.reversalCode()) return;
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
