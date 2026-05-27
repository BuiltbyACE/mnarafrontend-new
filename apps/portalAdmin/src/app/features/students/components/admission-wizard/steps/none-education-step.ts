import { Component, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NoneEducationDetails } from '../../../../../shared/models/students.models';

@Component({
  selector: 'app-none-education-step',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="step-container">
      <h2>No Formal Education</h2>
      <p class="step-description">Please explain the student's educational background</p>

      <div class="form-row">
        <div class="field-group full-width">
          <label>Reason *</label>
          <textarea [ngModel]="data().reason" (ngModelChange)="update('reason', $event)"
                    placeholder="Explain why the student has not attended formal education" rows="4"></textarea>
        </div>
      </div>

      <div class="form-row">
        <div class="field-group full-width">
          <label>Alternative Arrangement</label>
          <textarea [ngModel]="data().alternative_arrangement" (ngModelChange)="update('alternative_arrangement', $event)"
                    placeholder="Describe any alternative educational arrangements" rows="3"></textarea>
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
    .field-group.full-width { flex: 0 0 100%; }
    label { font-size: 13px; font-weight: 500; color: #374151; }
    textarea { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; background: white; font-family: inherit; width: 100%; box-sizing: border-box; }
    textarea:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }
  `]
})
export class NoneEducationStep {
  data = input.required<NoneEducationDetails>();
  dataChange = output<any>();
  validityChange = output<boolean>();

  private current: NoneEducationDetails = { reason: '', alternative_arrangement: '' };

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
    this.validityChange.emit(!!this.current.reason);
  }
}
