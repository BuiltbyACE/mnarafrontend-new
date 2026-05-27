import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../services/finance.service';
import {
  InventoryItem, StockMovement, FORMAT_CURRENCY,
} from '../../models/finance.models';

@Component({
  selector: 'app-inventory-hub',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container page-fade-in">
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">Inventory Management</h1>
          <p class="page-subtitle">Track stock levels, record movements & restock alerts</p>
        </div>
        <button class="btn btn-primary" (click)="openAddItem()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
            <path d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
          </svg>
          Add Item
        </button>
      </div>

      @if (lowStockCount() > 0) {
        <div class="warning-banner">
          <svg class="warning-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
          <div class="warning-content">
            <strong>{{ lowStockCount() }} Items Below Minimum Threshold</strong>
            <span>These items require immediate restock to avoid shortages</span>
          </div>
        </div>
      }

      <div class="tab-bar">
        <button class="tab" [class.active]="activeTab() === 'stock'" (click)="switchTab('stock')">
          <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
          </svg>
          Inventory Stock
          @if (lowStockCount() > 0) {
            <span class="tab-badge warning">{{ lowStockCount() }}</span>
          }
        </button>
        <button class="tab" [class.active]="activeTab() === 'movements'" (click)="switchTab('movements')">
          <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>
          </svg>
          Stock Movements
        </button>
      </div>

      @if (activeTab() === 'stock') {
        <div class="stock-panel">
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th class="num-col">In Stock</th>
                  <th class="num-col">Min Thr.</th>
                  <th class="num-col">Unit Cost</th>
                  <th>Status</th>
                  <th class="actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (item of inventory(); track item.id) {
                  <tr class="clickable" (click)="toggleDetail(item)" [class.expanded]="detailItem()?.id === item.id">
                    <td class="text-medium">{{ item.name }}</td>
                    <td><span class="mono">{{ item.sku }}</span></td>
                    <td><span class="category-badge">{{ item.category }}</span></td>
                    <td class="text-muted">{{ item.location }}</td>
                    <td class="num-col">
                      <span class="mono stock-qty" [class.low]="item.current_stock <= item.minimum_threshold">
                        {{ item.current_stock }}
                      </span>
                    </td>
                    <td class="num-col"><span class="mono">{{ item.minimum_threshold }}</span></td>
                    <td class="num-col"><span class="mono amount">{{ FORMAT_CURRENCY(item.unit_cost) }}</span></td>
                    <td>
                      @if (item.needs_restock) {
                        <span class="status-badge low-stock">RESTOCK</span>
                      } @else {
                        <span class="status-badge in-stock">IN STOCK</span>
                      }
                    </td>
                    <td class="actions-col" (click)="$event.stopPropagation()">
                      <button class="btn-action move" (click)="openMovementForm(item)" title="Record Movement">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                        </svg>
                      </button>
                      <button class="btn-action edit" (click)="openEditItem(item)" title="Edit Item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button class="btn-action delete" (click)="confirmDelete(item)" title="Delete Item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                  @if (detailItem()?.id === item.id) {
                    <tr class="detail-row">
                      <td colspan="9">
                        <div class="item-detail">
                          <div class="detail-header">
                            <h3 class="detail-title">{{ item.name }}</h3>
                            <span class="detail-meta">SKU: {{ item.sku }} &middot; Last verified: {{ item.last_verified ? (item.last_verified | date:'mediumDate') : 'Never' }}</span>
                          </div>
                          <div class="detail-stats">
                            <div class="stat-box"><span class="stat-label">Current Stock</span><span class="stat-value" [class.text-danger]="item.current_stock <= item.minimum_threshold">{{ item.current_stock }}</span></div>
                            <div class="stat-box"><span class="stat-label">Threshold</span><span class="stat-value">{{ item.minimum_threshold }}</span></div>
                            <div class="stat-box"><span class="stat-label">Unit Cost</span><span class="stat-value">{{ FORMAT_CURRENCY(item.unit_cost) }}</span></div>
                            <div class="stat-box"><span class="stat-label">Total Value</span><span class="stat-value">{{ FORMAT_CURRENCY(item.current_stock * parseFloat(item.unit_cost)) }}</span></div>
                          </div>
                          <h4 class="movements-subtitle">Movement History</h4>
                          @if (itemMovements().length === 0) {
                            <div class="empty-state">No movements recorded for this item.</div>
                          } @else {
                            <table class="mini-table">
                              <thead><tr><th>Date</th><th>Type</th><th class="num-col">Qty</th><th>Remarks</th><th>By</th></tr></thead>
                              <tbody>
                                @for (m of itemMovements(); track m.id) {
                                  <tr>
                                    <td class="text-muted">{{ m.created_at | date:'shortDate' }}</td>
                                    <td><span class="mini-badge" [class.in]="m.movement_type === 'IN'" [class.out]="m.movement_type === 'OUT'">{{ m.movement_type }}</span></td>
                                    <td class="num-col mono">{{ m.quantity }}</td>
                                    <td class="text-muted">{{ m.remarks }}</td>
                                    <td class="text-muted">{{ m.recorded_by_name }}</td>
                                  </tr>
                                }
                              </tbody>
                            </table>
                          }
                        </div>
                      </td>
                    </tr>
                  }
                } @empty {
                  <tr><td colspan="9" class="empty-state-cell">No inventory items found. Click "Add Item" to create one.</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      @if (activeTab() === 'movements') {
        <div class="movements-panel">
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Item</th>
                  <th>Type</th>
                  <th class="num-col">Qty</th>
                  <th>Remarks</th>
                  <th>Recorded By</th>
                </tr>
              </thead>
              <tbody>
                @for (m of movements(); track m.id) {
                  <tr>
                    <td class="text-muted">{{ m.created_at | date:'shortDate' }}</td>
                    <td class="text-medium">{{ m.item_name }}</td>
                    <td>
                      <span class="movement-badge" [class.in]="m.movement_type === 'IN'" [class.out]="m.movement_type === 'OUT'">
                        {{ m.movement_type === 'IN' ? 'IN' : 'OUT' }}
                      </span>
                    </td>
                    <td class="num-col"><span class="mono">{{ m.quantity }}</span></td>
                    <td class="text-muted">{{ m.remarks }}</td>
                    <td class="text-muted">{{ m.recorded_by_name }}</td>
                  </tr>
                } @empty {
                  <tr><td colspan="6" class="empty-state-cell">No stock movements recorded yet.</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>

    @if (showMovementForm()) {
      <div class="modal-overlay" (click)="closeMovementForm()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2 class="modal-title">Record Stock Movement</h2>
            <button class="modal-close" (click)="closeMovementForm()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-field">
              <label class="form-label">Item</label>
              <input class="form-input" [value]="movementItem()?.name" disabled/>
            </div>
            <div class="form-row">
              <div class="form-field flex-1">
                <label class="form-label">Current Stock</label>
                <input class="form-input" [value]="movementItem()?.current_stock" disabled/>
              </div>
              <div class="form-field flex-1">
                <label class="form-label">Min Threshold</label>
                <input class="form-input" [value]="movementItem()?.minimum_threshold" disabled/>
              </div>
            </div>
            <div class="form-row">
              <div class="form-field flex-1">
                <label class="form-label">Movement Type</label>
                <select class="form-select" [(ngModel)]="moveType">
                  <option value="IN">Stock In (Receipt)</option>
                  <option value="OUT">Stock Out (Issue)</option>
                </select>
              </div>
              <div class="form-field flex-1">
                <label class="form-label">Quantity</label>
                <input class="form-input" type="number" min="1" [(ngModel)]="moveQty" placeholder="Enter quantity"/>
              </div>
            </div>
            <div class="form-field">
              <label class="form-label">Remarks</label>
              <input class="form-input" [(ngModel)]="moveRemarks" placeholder="Reason for movement"/>
            </div>
            @if (moveError()) {
              <div class="form-error">{{ moveError() }}</div>
            }
          </div>
          <div class="modal-footer">
            <button class="btn btn-cancel" (click)="closeMovementForm()">Cancel</button>
            <button class="btn btn-submit" (click)="submitMovement()" [disabled]="!moveQty || moveQty < 1 || submitting()">
              {{ submitting() ? 'Recording...' : 'Record Movement' }}
            </button>
          </div>
        </div>
      </div>
    }

    @if (showItemForm()) {
      <div class="modal-overlay" (click)="closeItemForm()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2 class="modal-title">{{ editingItem() ? 'Edit Item' : 'Add Inventory Item' }}</h2>
            <button class="modal-close" (click)="closeItemForm()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <div class="form-field flex-1">
                <label class="form-label">Item Name</label>
                <input class="form-input" [(ngModel)]="itemForm.name" placeholder="e.g. A4 Printer Paper"/>
              </div>
              <div class="form-field flex-1">
                <label class="form-label">SKU</label>
                <input class="form-input" [(ngModel)]="itemForm.sku" placeholder="e.g. PRNT-A4-001"/>
              </div>
            </div>
            <div class="form-row">
              <div class="form-field flex-1">
                <label class="form-label">Category</label>
                <input class="form-input" [(ngModel)]="itemForm.category" placeholder="e.g. Stationery"/>
              </div>
              <div class="form-field flex-1">
                <label class="form-label">Location</label>
                <input class="form-input" [(ngModel)]="itemForm.location" placeholder="e.g. Store A3"/>
              </div>
            </div>
            <div class="form-row">
              <div class="form-field flex-1">
                <label class="form-label">Unit Cost (KES)</label>
                <input class="form-input" type="number" min="0" step="0.01" [(ngModel)]="itemForm.unit_cost" placeholder="0.00"/>
              </div>
              <div class="form-field flex-1">
                <label class="form-label">Min. Threshold</label>
                <input class="form-input" type="number" min="0" [(ngModel)]="itemForm.minimum_threshold" placeholder="10"/>
              </div>
            </div>
            <div class="form-field">
              <label class="form-label">Current Stock (initial quantity)</label>
              <input class="form-input" type="number" min="0" [(ngModel)]="itemForm.current_stock" placeholder="0"/>
            </div>
            @if (itemError()) {
              <div class="form-error">{{ itemError() }}</div>
            }
          </div>
          <div class="modal-footer">
            <button class="btn btn-cancel" (click)="closeItemForm()">Cancel</button>
            <button class="btn btn-submit" (click)="submitItem()" [disabled]="!itemForm.name || !itemForm.sku || submitting()">
              {{ submitting() ? 'Saving...' : editingItem() ? 'Update Item' : 'Create Item' }}
            </button>
          </div>
        </div>
      </div>
    }

    @if (showDeleteConfirm()) {
      <div class="modal-overlay" (click)="closeDeleteConfirm()">
        <div class="modal-card confirm-card" (click)="$event.stopPropagation()">
          <div class="confirm-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
          </div>
          <h3 class="confirm-title">Delete {{ deleteTarget()?.name }}?</h3>
          <p class="confirm-text">This will permanently remove this item and all its movement records. This action cannot be undone.</p>
          <div class="confirm-actions">
            <button class="btn btn-cancel" (click)="closeDeleteConfirm()">Cancel</button>
            <button class="btn btn-danger" (click)="executeDelete()" [disabled]="submitting()">
              {{ submitting() ? 'Deleting...' : 'Delete Item' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-container { padding: 0; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #0f172a; letter-spacing: -0.02em; }
    .page-subtitle { font-size: 0.875rem; color: #64748b; margin-top: 4px; }

    .btn { padding: 8px 18px; border: none; border-radius: 8px; font-size: 0.8125rem; font-weight: 600; cursor: pointer; transition: all 0.15s; display: inline-flex; align-items: center; gap: 6px; }
    .btn-primary { background: #2563eb; color: white; }
    .btn-primary:hover { background: #1d4ed8; }
    .btn-cancel { background: #f1f5f9; color: #475569; }
    .btn-cancel:hover { background: #e2e8f0; }
    .btn-submit { background: #2563eb; color: white; }
    .btn-submit:hover { background: #1d4ed8; }
    .btn-submit:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-danger { background: #e11d48; color: white; }
    .btn-danger:hover { background: #be123c; }
    .btn-icon { width: 14px; height: 14px; }

    .warning-banner { display: flex; align-items: flex-start; gap: 12px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 14px 18px; margin-bottom: 20px; }
    .warning-icon { width: 20px; height: 20px; color: #e11d48; flex-shrink: 0; margin-top: 1px; }
    .warning-content { display: flex; flex-direction: column; gap: 2px; font-size: 0.8125rem; color: #991b1b; }
    .warning-content strong { font-size: 0.875rem; }

    .tab-bar { display: flex; gap: 4px; background: #f1f5f9; border-radius: 10px; padding: 4px; margin-bottom: 20px; }
    .tab { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 16px; border: none; background: transparent; border-radius: 8px; font-size: 0.8125rem; font-weight: 500; color: #64748b; cursor: pointer; transition: all 0.2s; }
    .tab:hover { color: #334155; }
    .tab.active { background: white; color: #0f172a; font-weight: 600; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .tab-icon { width: 16px; height: 16px; }
    .tab-badge { font-size: 0.625rem; font-weight: 700; padding: 1px 7px; border-radius: 999px; }
    .tab-badge.warning { background: #e11d48; color: white; }

    .table-wrapper { background: white; border: 1px solid #e2e8f0; border-radius: 12px; overflow: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { padding: 12px 16px; text-align: left; font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-weight: 600; }
    .data-table td { padding: 12px 16px; font-size: 0.8125rem; color: #334155; border-bottom: 1px solid #f1f5f9; }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr.clickable { cursor: pointer; }
    .data-table tr:hover td { background: #f8fafc; }
    .data-table tr.expanded td { background: #f1f5f9; border-bottom-color: #e2e8f0; }
    .mono { font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; }
    .mono.amount { font-weight: 600; color: #0f172a; }
    .text-medium { font-weight: 500; }
    .text-muted { color: #94a3b8; }
    .text-danger { color: #e11d48; font-weight: 700; }
    .num-col { text-align: right; }
    .actions-col { text-align: center; white-space: nowrap; }

    .stock-qty { font-weight: 600; color: #0f172a; }
    .stock-qty.low { color: #e11d48; }

    .category-badge { font-size: 0.6875rem; font-weight: 600; padding: 3px 10px; border-radius: 999px; display: inline-block; background: #f1f5f9; color: #475569; }

    .status-badge { font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.04em; padding: 2px 10px; border-radius: 999px; font-weight: 700; white-space: nowrap; }
    .status-badge.low-stock { background: #fee2e2; color: #e11d48; }
    .status-badge.in-stock { background: #d1fae5; color: #059669; }

    .movement-badge, .mini-badge { font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.04em; padding: 2px 10px; border-radius: 999px; font-weight: 700; display: inline-block; }
    .movement-badge.in, .mini-badge.in { background: #d1fae5; color: #059669; }
    .movement-badge.out, .mini-badge.out { background: #fee2e2; color: #e11d48; }

    .btn-action { width: 28px; height: 28px; border-radius: 6px; border: none; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.2s; margin: 0 2px; }
    .btn-action svg { width: 14px; height: 14px; }
    .btn-action.move { background: #dbeafe; color: #2563eb; }
    .btn-action.move:hover { background: #bfdbfe; }
    .btn-action.edit { background: #fef3c7; color: #d97706; }
    .btn-action.edit:hover { background: #fde68a; }
    .btn-action.delete { background: #fee2e2; color: #e11d48; }
    .btn-action.delete:hover { background: #fecaca; }

    .empty-state-cell { text-align: center; padding: 32px 16px !important; color: #94a3b8; font-size: 0.875rem; }

    /* ─── Detail Row ─── */
    .detail-row td { padding: 0 !important; background: #f8fafc; }
    .item-detail { padding: 20px 24px; border-top: 1px solid #e2e8f0; }
    .detail-header { display: flex; align-items: baseline; gap: 16px; margin-bottom: 16px; }
    .detail-title { font-size: 1rem; font-weight: 700; color: #0f172a; }
    .detail-meta { font-size: 0.75rem; color: #94a3b8; }
    .detail-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
    .stat-box { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
    .stat-label { display: block; font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 4px; }
    .stat-value { font-size: 1.125rem; font-weight: 700; color: #0f172a; }
    .movements-subtitle { font-size: 0.8125rem; font-weight: 700; color: #0f172a; margin-bottom: 10px; }
    .empty-state { font-size: 0.8125rem; color: #94a3b8; padding: 16px; text-align: center; }
    .mini-table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; }
    .mini-table th { padding: 8px 12px; text-align: left; font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; font-weight: 600; }
    .mini-table td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; }
    .mini-table tr:last-child td { border-bottom: none; }

    /* ─── Modal ─── */
    .modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 24px; }
    .modal-card { background: white; border-radius: 14px; width: 100%; max-width: 520px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); max-height: 90vh; overflow-y: auto; }
    .confirm-card { max-width: 400px; text-align: center; padding: 32px 24px 24px; }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 0; }
    .modal-title { font-size: 1.0625rem; font-weight: 700; color: #0f172a; }
    .modal-close { width: 28px; height: 28px; border: none; background: #f1f5f9; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748b; }
    .modal-close svg { width: 14px; height: 14px; }
    .modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px; border-top: 1px solid #e2e8f0; }

    .confirm-icon { width: 48px; height: 48px; border-radius: 50%; background: #fef2f2; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; }
    .confirm-icon svg { width: 24px; height: 24px; color: #e11d48; }
    .confirm-title { font-size: 1.0625rem; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
    .confirm-text { font-size: 0.8125rem; color: #64748b; margin-bottom: 20px; }
    .confirm-actions { display: flex; gap: 10px; justify-content: center; }

    .form-field { display: flex; flex-direction: column; gap: 5px; }
    .form-label { font-size: 0.75rem; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; }
    .form-input, .form-select { padding: 9px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.8125rem; color: #0f172a; background: #f8fafc; outline: none; transition: border-color 0.15s; width: 100%; }
    .form-input:focus, .form-select:focus { border-color: #2563eb; background: white; }
    .form-input:disabled { opacity: 0.6; cursor: not-allowed; }
    .form-select { cursor: pointer; }
    .form-row { display: flex; gap: 12px; }
    .flex-1 { flex: 1; }
    .form-error { font-size: 0.75rem; color: #e11d48; background: #fef2f2; padding: 8px 12px; border-radius: 6px; border: 1px solid #fecaca; }
  `],
})
export class InventoryHubComponent implements OnInit {
  private financeService = inject(FinanceService);

  activeTab = signal<'stock' | 'movements'>('stock');
  inventory = signal<InventoryItem[]>([]);
  movements = signal<StockMovement[]>([]);
  detailItem = signal<InventoryItem | null>(null);
  submitting = signal(false);

  lowStockCount = computed(() => this.inventory().filter(i => i.needs_restock).length);

  itemMovements = computed(() => {
    const item = this.detailItem();
    if (!item) return [];
    return item.stock_movements || [];
  });

  FORMAT_CURRENCY = FORMAT_CURRENCY;
  parseFloat = parseFloat;

  ngOnInit() {
    this.loadAll();
  }

  private loadAll() {
    this.financeService.getInventory().subscribe({
      next: (res) => this.inventory.set(res.results),
    });
    this.financeService.getStockMovements().subscribe({
      next: (res) => this.movements.set(res.results),
    });
  }

  switchTab(tab: 'stock' | 'movements') {
    this.activeTab.set(tab);
    this.detailItem.set(null);
    if (tab === 'movements' && this.movements().length === 0) {
      this.financeService.getStockMovements().subscribe({
        next: (res) => this.movements.set(res.results),
      });
    }
  }

  toggleDetail(item: InventoryItem) {
    this.detailItem.set(this.detailItem()?.id === item.id ? null : item);
  }

  // ─── Movement Form ───
  showMovementForm = signal(false);
  movementItem = signal<InventoryItem | null>(null);
  moveType: 'IN' | 'OUT' = 'IN';
  moveQty = 1;
  moveRemarks = '';
  moveError = signal('');

  openMovementForm(item: InventoryItem) {
    this.movementItem.set(item);
    this.moveType = 'IN';
    this.moveQty = 1;
    this.moveRemarks = '';
    this.moveError.set('');
    this.showMovementForm.set(true);
  }

  closeMovementForm() {
    this.showMovementForm.set(false);
    this.movementItem.set(null);
  }

  submitMovement() {
    const item = this.movementItem();
    if (!item || !this.moveQty || this.moveQty < 1) return;
    this.submitting.set(true);
    this.moveError.set('');

    this.financeService.createStockMovement({
      item: item.id,
      quantity: this.moveQty,
      movement_type: this.moveType,
      remarks: this.moveRemarks,
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.loadAll();
        this.closeMovementForm();
      },
      error: (err) => {
        this.submitting.set(false);
        const msg = err.error?.message || err.error?.detail || err.message || 'Failed to record movement';
        this.moveError.set(msg);
      },
    });
  }

  // ─── Item Form (Add/Edit) ───
  showItemForm = signal(false);
  editingItem = signal<InventoryItem | null>(null);
  itemError = signal('');
  itemForm: Partial<InventoryItem> & { current_stock: number } = {
    name: '', sku: '', category: '', location: '',
    unit_cost: '', minimum_threshold: 10, current_stock: 0,
  };

  openAddItem() {
    this.editingItem.set(null);
    this.itemForm = { name: '', sku: '', category: '', location: '', unit_cost: '', minimum_threshold: 10, current_stock: 0 };
    this.itemError.set('');
    this.showItemForm.set(true);
  }

  openEditItem(item: InventoryItem) {
    this.editingItem.set(item);
    this.itemForm = {
      name: item.name, sku: item.sku, category: item.category, location: item.location,
      unit_cost: item.unit_cost, minimum_threshold: item.minimum_threshold, current_stock: item.current_stock,
    };
    this.itemError.set('');
    this.showItemForm.set(true);
  }

  closeItemForm() {
    this.showItemForm.set(false);
    this.editingItem.set(null);
  }

  submitItem() {
    if (!this.itemForm.name || !this.itemForm.sku) return;
    this.submitting.set(true);
    this.itemError.set('');

    const payload = {
      name: this.itemForm.name,
      sku: this.itemForm.sku,
      category: this.itemForm.category || '',
      location: this.itemForm.location || '',
      unit_cost: this.itemForm.unit_cost || '0',
      minimum_threshold: this.itemForm.minimum_threshold ?? 10,
      current_stock: this.itemForm.current_stock ?? 0,
    };

    const action = this.editingItem()
      ? this.financeService.updateInventoryItem(this.editingItem()!.id, payload)
      : this.financeService.createInventoryItem(payload);

    action.subscribe({
      next: () => {
        this.submitting.set(false);
        this.loadAll();
        this.closeItemForm();
      },
      error: (err) => {
        this.submitting.set(false);
        const msg = err.error?.message || err.error?.detail || err.message || 'Failed to save item';
        this.itemError.set(msg);
      },
    });
  }

  // ─── Delete ───
  showDeleteConfirm = signal(false);
  deleteTarget = signal<InventoryItem | null>(null);

  confirmDelete(item: InventoryItem) {
    this.deleteTarget.set(item);
    this.showDeleteConfirm.set(true);
  }

  closeDeleteConfirm() {
    this.showDeleteConfirm.set(false);
    this.deleteTarget.set(null);
  }

  executeDelete() {
    const target = this.deleteTarget();
    if (!target) return;
    this.submitting.set(true);
    this.financeService.deleteInventoryItem(target.id).subscribe({
      next: () => {
        this.submitting.set(false);
        this.inventory.update(list => list.filter(i => i.id !== target.id));
        this.closeDeleteConfirm();
      },
      error: () => {
        this.submitting.set(false);
      },
    });
  }
}
