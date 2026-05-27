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
      <h2>Class Selection</h2>
      <p class="step-description">Select the year level and admission date</p>

      <div class="form-row">
        <div class="field-group">
          <label>Year Level *</label>
          <select [ngModel]="data().year_level_id" (ngModelChange)="update('year_level_id', $event)" required>
            <option [value]="">Select year level</option>
            @for (yl of yearLevels(); track yl.id) {
              <option [value]="yl.id">{{ yl.name }}</option>
            }
          </select>
        </div>
        <div class="field-group">
          <label>Date of Admission *</label>
          <input type="date" [ngModel]="data().date_of_admission" (ngModelChange)="update('date_of_admission', $event)" required>
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
  data = input.required<{ year_level_id: number | null; date_of_admission: string }>();
  yearLevels = input.required<YearLevel[]>();
  dataChange = output<any>();
  validityChange = output<boolean>();

  private current = { year_level_id: null as number | null, date_of_admission: '' };

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
