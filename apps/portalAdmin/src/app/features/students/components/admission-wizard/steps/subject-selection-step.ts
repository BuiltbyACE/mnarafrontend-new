import { Component, input, output, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubjectSelectionData } from '../../../../../shared/models/students.models';
import { AcademicsService, SubjectOffering } from '../../../../academics/services/academics.service';

@Component({
  selector: 'app-subject-selection-step',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="step-container">
      <h2>Subject Selection</h2>
      <p class="step-description">Select optional subjects for this student. Core subjects are pre-selected.</p>

      @if (loading()) {
        <div class="loading">Loading subjects...</div>
      } @else if (error()) {
        <div class="error">{{ error() }}</div>
      } @else if (allOfferings.length === 0) {
        <div class="empty">No subjects available for this year level.</div>
      } @else {
        <div class="filter-bar">
          <input [ngModel]="searchTerm" (ngModelChange)="searchTerm = $event"
                 placeholder="Search subjects..." class="search-input">
        </div>

        <div class="subjects-grid">
          @for (offering of filteredOfferings(); track offering.id) {
            <div class="subject-card" [class.compulsory]="offering.is_compulsory" [class.selected]="isSelected(offering)">
              <div class="card-header">
                <span class="subject-name">{{ offering.subject_name }}</span>
                <span class="badge" [class.core]="offering.is_compulsory" [class.elective]="!offering.is_compulsory">
                  {{ offering.is_compulsory ? 'Core' : 'Elective' }}
                </span>
              </div>
              <div class="card-body">
                @if (offering.is_compulsory) {
                  <label class="checkbox-label disabled">
                    <input type="checkbox" checked disabled>
                    <span>Required</span>
                  </label>
                } @else {
                  <label class="checkbox-label">
                    <input type="checkbox"
                           [checked]="selectedOptionalIds.has(offering.id)"
                           (change)="toggleOptional(offering.id)">
                    <span>{{ selectedOptionalIds.has(offering.id) ? 'Selected' : 'Select' }}</span>
                  </label>
                }
              </div>
              @if (offering.credit_hours) {
                <div class="credit-hours">{{ offering.credit_hours }} hrs</div>
              }
            </div>
          }
        </div>

        <div class="summary">
          <span>{{ compulsoryCount }} Core (fixed)</span>
          <span>{{ selectedOptionalIds.size }} Elective(s) selected</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .step-container { padding: 24px; }
    h2 { margin: 0 0 4px; font-size: 20px; font-weight: 600; color: #1e293b; }
    .step-description { margin: 0 0 24px; color: #64748b; font-size: 14px; }
    .loading, .error, .empty { padding: 40px; text-align: center; color: #64748b; font-size: 14px; }
    .error { color: #dc2626; }
    .filter-bar { margin-bottom: 16px; }
    .search-input { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; }
    .search-input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }
    .subjects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
    .subject-card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; background: white; transition: box-shadow 0.15s; }
    .subject-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .subject-card.compulsory { border-left: 3px solid #10b981; background: #f0fdf4; }
    .subject-card.selected { border-left: 3px solid #3b82f6; background: #eff6ff; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .subject-name { font-size: 14px; font-weight: 600; color: #1e293b; }
    .badge { font-size: 11px; padding: 2px 8px; border-radius: 12px; font-weight: 500; }
    .badge.core { background: #d1fae5; color: #065f46; }
    .badge.elective { background: #dbeafe; color: #1e40af; }
    .card-body { margin-bottom: 6px; }
    .checkbox-label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; color: #374151; }
    .checkbox-label.disabled { cursor: not-allowed; opacity: 0.6; }
    input[type="checkbox"] { width: 16px; height: 16px; }
    .credit-hours { font-size: 11px; color: #94a3b8; }
    .summary { margin-top: 20px; padding: 12px 16px; background: #f8fafc; border-radius: 8px; display: flex; gap: 24px; font-size: 13px; color: #475569; }
  `]
})
export class SubjectSelectionStep {
  private academicsService = inject(AcademicsService);

  data = input.required<SubjectSelectionData & { year_level_id: number }>();
  dataChange = output<any>();
  validityChange = output<boolean>();

  loading = signal(false);
  error = signal<string | null>(null);

  allOfferings: SubjectOffering[] = [];
  selectedOptionalIds = new Set<number>();
  searchTerm = '';

  constructor() {
    effect(() => {
      const d = this.data();
      if (d.year_level_id) {
        this.loadOfferings(d.year_level_id);
      }
      this.selectedOptionalIds = new Set(d.selected_optional_ids || []);
    });
  }

  private loadOfferings(yearLevelId: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.academicsService.getOfferingsByYearLevel(yearLevelId).subscribe({
      next: (offerings) => {
        this.allOfferings = offerings;
        this.loading.set(false);
        this.validityChange.emit(true);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('Failed to load subjects. Please try again.');
        this.validityChange.emit(false);
      },
    });
  }

  get compulsoryIds(): number[] {
    return this.allOfferings.filter(o => o.is_compulsory).map(o => o.id);
  }

  get compulsoryCount(): number {
    return this.compulsoryIds.length;
  }

  filteredOfferings(): SubjectOffering[] {
    if (!this.searchTerm.trim()) return this.allOfferings;
    const term = this.searchTerm.toLowerCase();
    return this.allOfferings.filter(o =>
      o.subject_name.toLowerCase().includes(term) ||
      (o.subject_code && o.subject_code.toLowerCase().includes(term))
    );
  }

  isSelected(offering: SubjectOffering): boolean {
    return offering.is_compulsory || this.selectedOptionalIds.has(offering.id);
  }

  toggleOptional(offeringId: number): void {
    if (this.selectedOptionalIds.has(offeringId)) {
      this.selectedOptionalIds.delete(offeringId);
    } else {
      this.selectedOptionalIds.add(offeringId);
    }
    this.emitData();
  }

  private emitData(): void {
    this.dataChange.emit({
      compulsory_ids: this.compulsoryIds,
      selected_optional_ids: Array.from(this.selectedOptionalIds),
    });
  }
}
