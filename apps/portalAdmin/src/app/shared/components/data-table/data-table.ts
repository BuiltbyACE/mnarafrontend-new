/**
 * Reusable Data Table Component
 * Paginated table with sorting and filtering
 */

import { Component, Input, Output, EventEmitter, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

export interface TableColumn<T = any> {
  name: string;
  label: string;
  sortable?: boolean;
  formatter?: (row: T) => string;
  component?: 'badge' | 'button' | 'link';
  action?: (row: T) => void;
}

export interface TableAction<T = any> {
  name: string;
  label: string;
  icon: string;
  condition?: (row: T) => boolean;
  action: (row: T) => void;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
  ],
  template: `
    <div class="data-table-container">
      <!-- Loading overlay -->
      <div class="loading-overlay" *ngIf="isLoading()">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <!-- Table -->
      <table mat-table [dataSource]="displayedData()" matSort (matSortChange)="onSort($event)" class="data-table">
        
        <!-- Dynamic columns -->
        <ng-container *ngFor="let column of columns" [matColumnDef]="column.name">
          <th mat-header-cell *matHeaderCellDef mat-sort-header [disabled]="!column.sortable">
            {{ column.label }}
          </th>
          <td mat-cell *matCellDef="let row">
            <ng-container *ngIf="column.formatter">
              {{ column.formatter(row) }}
            </ng-container>
            <ng-container *ngIf="!column.formatter">
              {{ row[column.name] }}
            </ng-container>
          </td>
        </ng-container>

        <!-- Actions column -->
        <ng-container matColumnDef="actions" *ngIf="actions.length > 0">
          <th mat-header-cell *matHeaderCellDef class="actions-header">Actions</th>
          <td mat-cell *matCellDef="let row" class="actions-cell">
            <button mat-icon-button [matMenuTriggerFor]="menu" aria-label="Actions">
              <mat-icon>more_vert</mat-icon>
            </button>
            <mat-menu #menu="matMenu">
              <ng-container *ngFor="let action of actions">
                <button 
                  mat-menu-item 
                  *ngIf="!action.condition || action.condition(row)"
                  (click)="action.action(row)"
                >
                  <mat-icon>{{ action.icon }}</mat-icon>
                  <span>{{ action.label }}</span>
                </button>
              </ng-container>
            </mat-menu>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns()"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns();"></tr>

        <!-- No data row -->
        <tr class="mat-row no-data-row" *matNoDataRow>
          <td class="mat-cell" [attr.colspan]="displayedColumns().length">
            <div class="no-data-message">
              <mat-icon>inbox</mat-icon>
              <p>{{ emptyMessage }}</p>
            </div>
          </td>
        </tr>
      </table>

      <!-- Paginator -->
      <mat-paginator
        [length]="totalCount()"
        [pageSize]="pageSize"
        [pageSizeOptions]="[10, 25, 50, 100]"
        [pageIndex]="currentPage()"
        (page)="onPageChange($event)"
        aria-label="Select page"
      ></mat-paginator>
    </div>
  `,
  styles: [`
    .data-table-container {
      position: relative;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
    }

    .data-table {
      width: 100%;
    }

    .mat-mdc-header-cell {
      font-weight: 600;
      color: #374151;
      background-color: #f9fafb;
    }

    .actions-header {
      width: 60px;
      text-align: center;
    }

    .actions-cell {
      text-align: center;
    }

    .no-data-row .mat-cell {
      padding: 48px 24px;
      text-align: center;
    }

    .no-data-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      color: #9ca3af;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 16px;
      }

      p {
        margin: 0;
        font-size: 14px;
      }
    }

    .mat-mdc-row:hover {
      background-color: #f9fafb;
    }
  `],
})
export class DataTableComponent<T = any> {
  @Input() columns: TableColumn<T>[] = [];
  @Input() actions: TableAction<T>[] = [];
  @Input() pageSize = 25;
  @Input() emptyMessage = 'No data available';

  // Data signals
  readonly data = signal<T[]>([]);
  readonly totalCount = signal<number>(0);
  readonly isLoading = signal<boolean>(false);
  readonly currentPage = signal<number>(0);
  readonly sortField = signal<string>('');
  readonly sortDirection = signal<'asc' | 'desc'>('asc');

  // Output events
  @Output() pageChange = new EventEmitter<PageEvent>();
  @Output() sortChange = new EventEmitter<Sort>();
  @Output() rowClick = new EventEmitter<T>();

  // Computed values
  readonly displayedData = computed(() => this.data());
  
  readonly displayedColumns = computed(() => {
    const cols = this.columns.map(c => c.name);
    if (this.actions.length > 0) {
      cols.push('actions');
    }
    return cols;
  });

  /**
   * Set table data
   */
  setData(data: T[], totalCount: number): void {
    this.data.set(data);
    this.totalCount.set(totalCount);
  }

  /**
   * Set loading state
   */
  setLoading(loading: boolean): void {
    this.isLoading.set(loading);
  }

  /**
   * Handle page change
   */
  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageChange.emit(event);
  }

  /**
   * Handle sort change
   */
  onSort(sort: Sort): void {
    this.sortField.set(sort.active);
    this.sortDirection.set(sort.direction as 'asc' | 'desc' || 'asc');
    this.sortChange.emit(sort);
  }
}
