import { Component, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RegularSchoolInterruptDetails } from '../../../../../shared/models/students.models';

@Component({
  selector: 'app-regular-interrupt-step',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="step-container">
      <h2>Previous School Details (Interrupted)</h2>
      <p class="step-description">Enter details about the student's interrupted schooling</p>

      <div class="form-row">
        <div class="field-group">
          <label>School Name *</label>
          <input [ngModel]="data().school_name" (ngModelChange)="update('school_name', $event)" placeholder="Enter school name">
        </div>
        <div class="field-group">
          <label>Curriculum</label>
          <select [ngModel]="data().curriculum" (ngModelChange)="update('curriculum', $event)">
            <option value="">Select curriculum</option>
            <option value="NATIONAL">National Curriculum</option>
            <option value="IGCSE">IGCSE</option>
            <option value="IB">International Baccalaureate</option>
            <option value="MONTESSORI">Montessori</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="field-group full-width">
          <label>Reason for Transfer</label>
          <textarea [ngModel]="data().transfer_reason" (ngModelChange)="update('transfer_reason', $event)"
                    placeholder="Why is the student transferring?" rows="2"></textarea>
        </div>
      </div>

      <div class="form-row">
        <div class="field-group">
          <label>
            <input type="checkbox" [ngModel]="data().previous_reports" (ngModelChange)="update('previous_reports', $event)">
            Previous reports available
          </label>
        </div>
      </div>

      <div class="form-row">
        <div class="field-group">
          <label>Last Attended Class</label>
          <input [ngModel]="data().last_attended_class" (ngModelChange)="update('last_attended_class', $event)" placeholder="e.g. Year 3">
        </div>
        <div class="field-group">
          <label>Last Attended Year</label>
          <input [ngModel]="data().last_attended_year" (ngModelChange)="update('last_attended_year', $event)" placeholder="e.g. 2024-2025">
        </div>
      </div>

      <hr>

      <h3 class="section-title">Interruption Details</h3>

      <div class="form-row">
        <div class="field-group">
          <label>Interruption Start Date *</label>
          <input type="date" [ngModel]="data().interruption_start" (ngModelChange)="update('interruption_start', $event)">
        </div>
        <div class="field-group">
          <label>Interruption End Date *</label>
          <input type="date" [ngModel]="data().interruption_end" (ngModelChange)="update('interruption_end', $event)">
        </div>
      </div>
      @if (dateError) {
        <div class="field-error">End date must be after start date</div>
      }

      <div class="form-row">
        <div class="field-group full-width">
          <label>Reason for Interruption</label>
          <textarea [ngModel]="data().interruption_reason" (ngModelChange)="update('interruption_reason', $event)"
                    placeholder="Explain the reason for the educational break" rows="3"></textarea>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .step-container { padding: 24px; }
    h2 { margin: 0 0 4px; font-size: 20px; font-weight: 600; color: #1e293b; }
    .step-description { margin: 0 0 24px; color: #64748b; font-size: 14px; }
    .section-title { margin: 20px 0 16px; font-size: 16px; font-weight: 600; color: #1e293b; }
    .form-row { display: flex; gap: 16px; margin-bottom: 16px; }
    .field-group { flex: 1; display: flex; flex-direction: column; gap: 6px; }
    .field-group.full-width { flex: 0 0 100%; }
    label { font-size: 13px; font-weight: 500; color: #374151; }
    input, select, textarea { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; background: white; font-family: inherit; }
    input:focus, select:focus, textarea:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }
    input[type="checkbox"] { width: auto; margin-right: 8px; }
    .field-error { color: #dc2626; font-size: 12px; margin-top: -8px; }
  `]
})
export class RegularInterruptStep {
  data = input.required<RegularSchoolInterruptDetails>();
  dataChange = output<any>();
  validityChange = output<boolean>();

  dateError = false;

  private hasEmitted = false;
  private current: RegularSchoolInterruptDetails = {
    school_name: '', curriculum: '', transfer_reason: '', previous_reports: false,
    last_attended_class: '', last_attended_year: '',
    interruption_start: '', interruption_end: '', interruption_reason: '',
  };

  constructor() {
    effect(() => {
      this.current = { ...this.data() };
      if (!this.hasEmitted) {
        this.hasEmitted = true;
        this.dataChange.emit({ ...this.current });
      }
      this.validate();
    });
  }

  update(field: string, value: any): void {
    (this.current as any)[field] = value;
    this.validate();
    this.dataChange.emit({ ...this.current });
  }

  private validate(): void {
    this.dateError = false;
    if (this.current.interruption_start && this.current.interruption_end) {
      this.dateError = new Date(this.current.interruption_end) <= new Date(this.current.interruption_start);
    }
    const valid = !!this.current.school_name && !!this.current.interruption_start && !!this.current.interruption_end && !this.dateError;
    this.validityChange.emit(valid);
  }
}
