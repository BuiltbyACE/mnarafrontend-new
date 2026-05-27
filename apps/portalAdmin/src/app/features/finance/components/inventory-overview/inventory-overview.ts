import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FinanceService } from '../../services/finance.service';
import type { InventoryItemFull, StockMovementItem } from '../../../../shared/models/finance.models';

@Component({
  selector: 'app-inventory-overview',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatTabsModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div class="title-section">
          <h1>Inventory Overview</h1>
          <p class="subtitle">Stock levels, movement history & verification status</p>
        </div>
        <div class="header-badge" [class.has-warnings]="lowStockCount() > 0">
          <mat-icon>{{ lowStockCount() > 0 ? 'warning' : 'check_circle' }}</mat-icon>
          <span>{{ lowStockCount() > 0 ? lowStockCount() + ' items need restock' : 'All items in stock' }}</span>
        </div>
      </header>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate"></mat-progress-bar>
      }

      <mat-tab-group (selectedTabChange)="onTabChange($event.index)" animationDuration="200ms">
        <mat-tab label="Inventory Stock ({{ inventory().length }})">
          <div class="tab-content">
            <mat-card class="content-card">
              <mat-card-content>
                <div class="table-container">
                  <table mat-table [dataSource]="inventory()" class="inventory-table">
                    <ng-container matColumnDef="name">
                      <th mat-header-cell *matHeaderCellDef>Item</th>
                      <td mat-cell *matCellDef="let item">{{ item.name }}</td>
                    </ng-container>
                    <ng-container matColumnDef="sku">
                      <th mat-header-cell *matHeaderCellDef>SKU</th>
                      <td mat-cell *matCellDef="let item"><span class="mono">{{ item.sku }}</span></td>
                    </ng-container>
                    <ng-container matColumnDef="category">
                      <th mat-header-cell *matHeaderCellDef>Category</th>
                      <td mat-cell *matCellDef="let item"><span class="category-chip">{{ item.category }}</span></td>
                    </ng-container>
                    <ng-container matColumnDef="location">
                      <th mat-header-cell *matHeaderCellDef>Location</th>
                      <td mat-cell *matCellDef="let item" class="text-muted">{{ item.location }}</td>
                    </ng-container>
                    <ng-container matColumnDef="stock">
                      <th mat-header-cell *matHeaderCellDef class="num-col">In Stock</th>
                      <td mat-cell *matCellDef="let item" class="num-col">
                        <span class="stock-value" [class.critical]="item.current_stock <= item.minimum_threshold">
                          {{ item.current_stock }}
                        </span>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="threshold">
                      <th mat-header-cell *matHeaderCellDef class="num-col">Min</th>
                      <td mat-cell *matCellDef="let item" class="num-col">
                        <span class="mono">{{ item.minimum_threshold }}</span>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="unit_cost">
                      <th mat-header-cell *matHeaderCellDef class="num-col">Unit Cost</th>
                      <td mat-cell *matCellDef="let item" class="num-col mono">
                        {{ formatCurrency(item.unit_cost) }}
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="last_verified">
                      <th mat-header-cell *matHeaderCellDef>Last Verified</th>
                      <td mat-cell *matCellDef="let item" class="text-muted">
                        {{ item.last_verified ? (item.last_verified | date:'mediumDate') : 'Never' }}
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="status">
                      <th mat-header-cell *matHeaderCellDef>Status</th>
                      <td mat-cell *matCellDef="let item">
                        @if (item.needs_restock) {
                          <span class="status-badge restock">RESTOCK</span>
                        } @else {
                          <span class="status-badge ok">IN STOCK</span>
                        }
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="actions">
                      <th mat-header-cell *matHeaderCellDef class="actions-header"></th>
                      <td mat-cell *matCellDef="let item" class="actions-cell">
                        <button mat-icon-button color="primary" (click)="verifyItem(item)"
                                [disabled]="verifyingIds().has(item.id)"
                                matTooltip="Mark as verified">
                          @if (verifyingIds().has(item.id)) {
                            <mat-spinner diameter="18"></mat-spinner>
                          } @else {
                            <mat-icon>verified</mat-icon>
                          }
                        </button>
                      </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="clickable-row"
                        (click)="toggleDetail(row)"
                        [class.expanded]="detailItem()?.id === row.id"></tr>

                    @if (inventory().length === 0) {
                      <tr class="mat-row no-data-row">
                        <td class="mat-cell" [attr.colspan]="displayedColumns.length">
                          <div class="empty-state">
                            <mat-icon>inventory_2</mat-icon>
                            <p>No inventory items found</p>
                          </div>
                        </td>
                      </tr>
                    }
                  </table>
                </div>
              </mat-card-content>
            </mat-card>

            @if (detailItem(); as item) {
              <mat-card class="detail-card">
                <mat-card-header>
                  <mat-card-title>{{ item.name }}</mat-card-title>
                  <span class="detail-sku">SKU: {{ item.sku }}</span>
                </mat-card-header>
                <mat-card-content>
                  <div class="detail-stats">
                    <div class="stat-box">
                      <span class="stat-value" [class.critical]="item.current_stock <= item.minimum_threshold">{{ item.current_stock }}</span>
                      <span class="stat-label">Current Stock</span>
                    </div>
                    <div class="stat-box">
                      <span class="stat-value">{{ item.minimum_threshold }}</span>
                      <span class="stat-label">Threshold</span>
                    </div>
                    <div class="stat-box">
                      <span class="stat-value">{{ formatCurrency(item.unit_cost) }}</span>
                      <span class="stat-label">Unit Cost</span>
                    </div>
                    <div class="stat-box">
                      <span class="stat-value">{{ formatCurrency(item.current_stock * parseFloat(item.unit_cost)) }}</span>
                      <span class="stat-label">Total Value</span>
                    </div>
                  </div>
                  <h3 class="movements-title">Movement History</h3>
                  @if (item.stock_movements.length === 0) {
                    <div class="empty-state">
                      <mat-icon>swap_vert</mat-icon>
                      <p>No movements recorded for this item</p>
                    </div>
                  } @else {
                    <div class="mini-table-wrapper">
                      <table class="mini-table">
                        <thead>
                          <tr><th>Date</th><th>Type</th><th class="num-col">Qty</th><th>Remarks</th><th>By</th></tr>
                        </thead>
                        <tbody>
                          @for (m of item.stock_movements; track m.id) {
                            <tr>
                              <td class="text-muted">{{ m.created_at | date:'shortDate' }}</td>
                              <td>
                                <span class="movement-chip" [class.in]="m.movement_type === 'IN'" [class.out]="m.movement_type === 'OUT'">
                                  {{ m.movement_type === 'IN' ? 'IN' : 'OUT' }}
                                </span>
                              </td>
                              <td class="num-col mono">{{ m.quantity }}</td>
                              <td class="text-muted">{{ m.remarks }}</td>
                              <td class="text-muted">{{ m.recorded_by_name }}</td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  }
                </mat-card-content>
              </mat-card>
            }
          </div>
        </mat-tab>

        <mat-tab label="Stock Movements ({{ movements().length }})">
          <div class="tab-content">
            <mat-card class="content-card">
              <mat-card-content>
                <div class="table-container">
                  <table mat-table [dataSource]="movements()" class="movements-table">
                    <ng-container matColumnDef="date">
                      <th mat-header-cell *matHeaderCellDef>Date</th>
                      <td mat-cell *matCellDef="let m">{{ m.created_at | date:'shortDate' }}</td>
                    </ng-container>
                    <ng-container matColumnDef="item">
                      <th mat-header-cell *matHeaderCellDef>Item</th>
                      <td mat-cell *matCellDef="let m" class="text-medium">{{ m.item_name }}</td>
                    </ng-container>
                    <ng-container matColumnDef="type">
                      <th mat-header-cell *matHeaderCellDef>Type</th>
                      <td mat-cell *matCellDef="let m">
                        <span class="movement-chip" [class.in]="m.movement_type === 'IN'" [class.out]="m.movement_type === 'OUT'">
                          {{ m.movement_type === 'IN' ? 'IN' : 'OUT' }}
                        </span>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="qty">
                      <th mat-header-cell *matHeaderCellDef class="num-col">Qty</th>
                      <td mat-cell *matCellDef="let m" class="num-col mono">{{ m.quantity }}</td>
                    </ng-container>
                    <ng-container matColumnDef="remarks">
                      <th mat-header-cell *matHeaderCellDef>Remarks</th>
                      <td mat-cell *matCellDef="let m" class="text-muted">{{ m.remarks }}</td>
                    </ng-container>
                    <ng-container matColumnDef="recorded_by">
                      <th mat-header-cell *matHeaderCellDef>Recorded By</th>
                      <td mat-cell *matCellDef="let m" class="text-muted">{{ m.recorded_by_name }}</td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="movementColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: movementColumns;"></tr>

                    @if (movements().length === 0) {
                      <tr class="mat-row no-data-row">
                        <td class="mat-cell" [attr.colspan]="movementColumns.length">
                          <div class="empty-state">
                            <mat-icon>swap_vert</mat-icon>
                            <p>No stock movements recorded yet</p>
                          </div>
                        </td>
                      </tr>
                    }
                  </table>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
    .page-header .title-section h1 { font-size: 24px; font-weight: 600; margin: 0 0 4px 0; }
    .page-header .title-section .subtitle { color: #6b7280; margin: 0; font-size: 0.875rem; }
    .header-badge { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; font-size: 0.8125rem; font-weight: 500; background: #d1fae5; color: #059669; }
    .header-badge.has-warnings { background: #fef2f2; color: #e11d48; }
    .header-badge mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .tab-content { padding: 20px 0; }
    .content-card { border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.07); }
    .table-container { overflow-x: auto; }

    .inventory-table, .movements-table { width: 100%; }
    .mat-mdc-header-cell { font-weight: 600; color: #374151; background-color: #f9fafb; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .mat-mdc-cell { font-size: 0.8125rem; color: #334155; }
    .num-col { text-align: right; }
    .actions-header { width: 56px; }
    .actions-cell { text-align: center; }

    .clickable-row { cursor: pointer; }
    .clickable-row:hover { background: #f8fafc; }
    .clickable-row.expanded { background: #f1f5f9; }

    .mono { font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; font-size: 0.8125rem; }
    .text-muted { color: #94a3b8; }
    .text-medium { font-weight: 500; }

    .stock-value { font-weight: 600; color: #1f2937; }
    .stock-value.critical { color: #e11d48; font-weight: 700; }

    .category-chip { font-size: 0.6875rem; font-weight: 600; padding: 2px 10px; border-radius: 999px; background: #f1f5f9; color: #475569; display: inline-block; white-space: nowrap; }

    .status-badge { font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.04em; padding: 2px 10px; border-radius: 999px; font-weight: 700; white-space: nowrap; }
    .status-badge.restock { background: #fee2e2; color: #e11d48; }
    .status-badge.ok { background: #d1fae5; color: #059669; }

    .movement-chip { font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.04em; padding: 2px 10px; border-radius: 999px; font-weight: 700; display: inline-block; }
    .movement-chip.in { background: #d1fae5; color: #059669; }
    .movement-chip.out { background: #fee2e2; color: #e11d48; }

    .no-data-row .mat-cell { padding: 48px 24px; text-align: center; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; color: #9ca3af; }
    .empty-state mat-icon { font-size: 40px; width: 40px; height: 40px; opacity: 0.5; }
    .empty-state p { margin: 0; font-size: 0.875rem; }

    .detail-card { margin-top: 16px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.07); border-left: 4px solid #2563eb; }
    .detail-card mat-card-header { display: flex; align-items: baseline; gap: 12px; padding: 20px 20px 0; }
    .detail-card mat-card-title { font-size: 1rem; font-weight: 600; }
    .detail-sku { font-size: 0.75rem; color: #94a3b8; }
    .detail-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
    .stat-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; text-align: center; }
    .stat-box .stat-value { font-size: 1.25rem; font-weight: 700; color: #1f2937; display: block; }
    .stat-box .stat-value.critical { color: #e11d48; }
    .stat-box .stat-label { font-size: 0.6875rem; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.04em; margin-top: 4px; display: block; }

    .movements-title { font-size: 0.875rem; font-weight: 600; color: #1f2937; margin-bottom: 12px; }

    .mini-table-wrapper { overflow-x: auto; }
    .mini-table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; }
    .mini-table th { padding: 8px 12px; text-align: left; font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; background: #f3f4f6; border-bottom: 1px solid #e5e7eb; font-weight: 600; }
    .mini-table td { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; color: #374151; }
    .mini-table tr:last-child td { border-bottom: none; }

    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
  `],
})
export class InventoryOverviewComponent implements OnInit {
  private financeService = inject(FinanceService);
  private snackBar = inject(MatSnackBar);

  loading = signal(false);
  inventory = signal<InventoryItemFull[]>([]);
  movements = signal<StockMovementItem[]>([]);
  detailItem = signal<InventoryItemFull | null>(null);
  verifyingIds = signal<Set<number>>(new Set());

  lowStockCount = computed(() => this.inventory().filter(i => i.needs_restock).length);

  displayedColumns = ['name', 'sku', 'category', 'location', 'stock', 'threshold', 'unit_cost', 'last_verified', 'status', 'actions'];
  movementColumns = ['date', 'item', 'type', 'qty', 'remarks', 'recorded_by'];

  parseFloat = parseFloat;

  ngOnInit() {
    this.loadInventory();
    this.loadMovements();
  }

  private loadInventory() {
    this.loading.set(true);
    this.financeService.getInventory().subscribe({
      next: (res) => {
        this.inventory.set(res.results);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private loadMovements() {
    this.financeService.getStockMovements().subscribe({
      next: (res) => this.movements.set(res.results),
    });
  }

  onTabChange(index: number) {
    this.detailItem.set(null);
    if (index === 1 && this.movements().length === 0) {
      this.loadMovements();
    }
  }

  toggleDetail(item: InventoryItemFull) {
    this.detailItem.set(this.detailItem()?.id === item.id ? null : item);
  }

  formatCurrency(amount: string | number): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return 'KES 0';
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 2 }).format(num);
  }

  verifyItem(item: InventoryItemFull): void {
    const ids = this.verifyingIds();
    ids.add(item.id);
    this.verifyingIds.set(new Set(ids));

    this.financeService.verifyItem(item.id).subscribe({
      next: (response) => {
        this.inventory.update(list =>
          list.map(i => i.id === item.id ? { ...i, last_verified: response.last_verified } : i)
        );
        const newIds = this.verifyingIds();
        newIds.delete(item.id);
        this.verifyingIds.set(new Set(newIds));
        this.snackBar.open(`"${item.name}" verified`, 'Close', { duration: 3000 });
      },
      error: () => {
        const newIds = this.verifyingIds();
        newIds.delete(item.id);
        this.verifyingIds.set(new Set(newIds));
        this.snackBar.open(`Failed to verify "${item.name}"`, 'Close', { duration: 3000 });
      },
    });
  }
}
