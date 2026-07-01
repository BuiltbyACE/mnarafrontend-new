import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface FilterState {
  teacherId: number | null;
  yearLevelId: number | null;
}

@Component({
  selector: 'sched-filter-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="filter-bar">
      <div class="filter-group">
        <label class="filter-label">Teacher</label>
        <select
          class="filter-select"
          [(ngModel)]="filters.teacherId"
          (ngModelChange)="onFilterChange()">
          <option [ngValue]="null">All Teachers</option>
          @for (t of teacherOptions; track t.id) {
            <option [ngValue]="t.id">{{ t.name }}</option>
          }
        </select>
      </div>

      <div class="filter-group">
        <label class="filter-label">Year Level</label>
        <select
          class="filter-select"
          [(ngModel)]="filters.yearLevelId"
          (ngModelChange)="onFilterChange()">
          <option [ngValue]="null">All Levels</option>
          @for (l of yearLevelOptions; track l.id) {
            <option [ngValue]="l.id">{{ l.name }}</option>
          }
        </select>
      </div>

      @if (hasActiveFilters()) {
        <button class="clear-btn" (click)="clearFilters()">
          Clear
        </button>
      }
    </div>
  `,
  styles: [`
    .filter-bar { display: flex; align-items: center; gap: 12px; padding: 8px 16px; }
    .filter-group { display: flex; flex-direction: column; gap: 2px; }
    .filter-label { font-size: 0.625rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--tt-text-muted, #5e6f8d); }
    .filter-select { font-size: 0.8125rem; padding: 4px 24px 4px 8px; border: 1px solid var(--tt-border, #e9eef4); border-radius: 8px; background: var(--tt-surface, #ffffff); color: var(--tt-text, #0b1a2e); cursor: pointer; outline: none; min-width: 140px; appearance: none; background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 8px center; }
    .filter-select:hover { border-color: var(--tt-primary-light, #2d4373); }
    .clear-btn { font-size: 0.6875rem; color: var(--tt-primary, #1a2a6c); background: transparent; border: 1px solid var(--tt-primary, #1a2a6c); border-radius: 6px; padding: 4px 10px; cursor: pointer; transition: all 0.15s ease; margin-top: 14px; }
    .clear-btn:hover { background: var(--tt-primary, #1a2a6c); color: white; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterBarComponent {
  @Input() teacherOptions: { id: number; name: string }[] = [];
  @Input() yearLevelOptions: { id: number; name: string }[] = [];
  @Output() filterChange = new EventEmitter<FilterState>();

  filters: FilterState = { teacherId: null, yearLevelId: null };

  hasActiveFilters(): boolean {
    return this.filters.teacherId !== null || this.filters.yearLevelId !== null;
  }

  onFilterChange(): void {
    this.filterChange.emit({ ...this.filters });
  }

  clearFilters(): void {
    this.filters = { teacherId: null, yearLevelId: null };
    this.filterChange.emit({ ...this.filters });
  }
}
