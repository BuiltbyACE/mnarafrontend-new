import { Component, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { YearLevel } from '../../../../../shared/models/academics.models';

@Component({
  selector: 'app-class-selection-step',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSelectModule],
  template: `
    <div class="step-container">
      <h2>Class & Options</h2>
      <p class="step-description">Select the year level, admission date, and enrollment options</p>

      <div class="form-row">
        <div class="field-group">
          <label>Year Level *</label>
          <select [ngModel]="current.year_level_id" (ngModelChange)="update('year_level_id', $event)" required>
            <option [value]="">Select year level</option>
            @for (yl of yearLevels(); track yl.id) {
              <option [value]="yl.id">{{ yl.name }}</option>
            }
          </select>
        </div>
        <div class="field-group">
          <label>Date of Admission *</label>
          <input type="date" [ngModel]="current.date_of_admission" (ngModelChange)="update('date_of_admission', $event)" required>
        </div>
      </div>

      <div class="form-row">
        <div class="field-group">
          <label>Transport Options</label>
          <select [ngModel]="current.transport_options" (ngModelChange)="update('transport_options', $event)">
            <option value="NONE">None</option>
            @for (t of transportChoices(); track t.value) {
              <option [value]="t.value">{{ t.label }}</option>
            }
            <option value="SCHOOL_BUS">School Bus</option>
            <option value="PRIVATE">Private Transport</option>
          </select>
        </div>
        <div class="field-group">
          <label>Lunch Option</label>
          <select [ngModel]="current.lunch_option" (ngModelChange)="update('lunch_option', $event === 'true')">
            <option [value]="false">No Lunch</option>
            <option [value]="true">School Lunch Program</option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="field-group">
          <label>Embrace Islamic Studies</label>
          <select [ngModel]="current.embrace_islamic" (ngModelChange)="update('embrace_islamic', $event)">
            @for (e of embraceChoices(); track e.value) {
              <option [value]="e.value">{{ e.label }}</option>
            }
            @if (embraceChoices().length === 0) {
              <option value="YES">Yes</option>
              <option value="NO">No</option>
            }
          </select>
        </div>
        <div class="field-group">
        </div>
      </div>
    </div>
  `,
  styles: [`
    .step-container { padding: 24px; }
    h2 { margin: 0 0 4px; font-size: 20px; font-weight: 600; color: #1e293b; }
    .step-description { margin: 0 0 24px; color: #64748b; font-size: 14px; }
    .form-row { display: flex; gap: 16px; margin-bottom: 16px; }
    .field-group { flex: 1; display: flex; flex-direction: column; gap: 6px; }
    label { font-size: 13px; font-weight: 500; color: #374151; }
    select, input { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; background: white; }
    select:focus, input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }
  `]
})
export class ClassSelectionStep {
  data = input.required<{ year_level_id: number | null; date_of_admission: string; transport_options: string; lunch_option: boolean; embrace_islamic: string }>();
  yearLevels = input.required<YearLevel[]>();
  transportChoices = input<{ value: string; label: string }[]>([]);
  embraceChoices = input<{ value: string; label: string }[]>([]);
  dataChange = output<any>();
  validityChange = output<boolean>();

  current = { year_level_id: null as number | null, date_of_admission: '', transport_options: 'NONE', lunch_option: false, embrace_islamic: 'NO' };

  constructor() {
    effect(() => {
      this.current = { ...this.data() };
      this.validate();
    });
  }

  update(field: string, value: any): void {
    (this.current as any)[field] = value;
    this.dataChange.emit({ ...this.current });
    this.validate();
  }

  private validate(): void {
    const valid = !!this.current.year_level_id && !!this.current.date_of_admission;
    this.validityChange.emit(valid);
  }
}
