import { Component, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PathwayType } from '../../../../../shared/models/students.models';

@Component({
  selector: 'app-pathway-selection-step',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="step-container">
      <h2>Educational Pathway</h2>
      <p class="step-description">Select the student's prior educational background</p>

      @if (isUnder4()) {
        <div class="auto-notice">
          <strong>Note:</strong> Student is under 4 years old. Pathway auto-set to "No Formal Education".
        </div>
      }

      <div class="pathway-grid">
        @for (opt of pathwayOptions; track opt.value) {
          <div class="pathway-card" [class.selected]="selected === opt.value"
               [class.disabled]="isUnder4() && opt.value !== 'NONE'"
               (click)="selectPathway(opt.value)">
            <div class="card-icon">{{ opt.icon }}</div>
            <div class="card-content">
              <h3>{{ opt.label }}</h3>
              <p>{{ opt.description }}</p>
            </div>
            <div class="card-check">
              @if (selected === opt.value) {
                <span class="check-mark">✓</span>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .step-container { padding: 24px; }
    h2 { margin: 0 0 4px; font-size: 20px; font-weight: 600; color: #1e293b; }
    .step-description { margin: 0 0 24px; color: #64748b; font-size: 14px; }
    .auto-notice { padding: 12px 16px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; color: #1d4ed8; font-size: 14px; margin-bottom: 20px; }
    .pathway-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .pathway-card { display: flex; align-items: flex-start; gap: 16px; padding: 20px; border: 2px solid #e2e8f0; border-radius: 12px; cursor: pointer; transition: all 0.2s; position: relative; background: white; }
    .pathway-card:hover:not(.disabled) { border-color: #93c5fd; background: #f8fafc; }
    .pathway-card.selected { border-color: #3b82f6; background: #eff6ff; }
    .pathway-card.disabled { opacity: 0.5; cursor: not-allowed; }
    .card-icon { font-size: 28px; line-height: 1; }
    .card-content { flex: 1; }
    .card-content h3 { margin: 0 0 4px; font-size: 15px; font-weight: 600; color: #1e293b; }
    .card-content p { margin: 0; font-size: 12px; color: #64748b; line-height: 1.4; }
    .card-check { flex-shrink: 0; }
    .check-mark { display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; background: #3b82f6; color: white; font-size: 14px; font-weight: 700; }
  `]
})
export class PathwaySelectionStep {
  data = input.required<{ pathway: PathwayType }>();
  isUnder4 = input(false);
  dataChange = output<any>();
  validityChange = output<boolean>();

  readonly pathwayOptions = [
    { value: 'REGULAR_SCHOOL' as PathwayType, icon: '🏫', label: 'Regular School', description: 'Student previously attended a formal school and has recent academic records' },
    { value: 'REGULAR_SCHOOL_INTERRUPTED' as PathwayType, icon: '⏸️', label: 'Regular School (Interrupted)', description: 'Student attended school but has had a break in their education' },
    { value: 'HOMESCHOOL' as PathwayType, icon: '🏠', label: 'Homeschool', description: 'Student was educated at home rather than a formal institution' },
    { value: 'NONE' as PathwayType, icon: '📝', label: 'No Formal Education', description: 'Student has not yet attended any formal educational institution' },
  ];

  selected: PathwayType = 'REGULAR_SCHOOL';

  constructor() {
    effect(() => {
      this.selected = this.data().pathway || 'REGULAR_SCHOOL';
      if (this.isUnder4() && this.selected !== 'NONE') {
        this.selected = 'NONE';
        this.dataChange.emit({ pathway: 'NONE' });
      }
      this.validityChange.emit(true);
    });
  }

  selectPathway(value: PathwayType): void {
    if (this.isUnder4() && value !== 'NONE') return;
    this.selected = value;
    this.dataChange.emit({ pathway: value });
  }
}
