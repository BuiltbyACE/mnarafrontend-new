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
      <h2>Language Competency</h2>
      <p class="step-description">Select the student's primary language competency</p>

      <div class="form-row">
        <div class="field-group">
          <label>Language Competency *</label>
          <select [ngModel]="data().language_competency" (ngModelChange)="update('language_competency', $event)">
            <option value="ENGLISH">English</option>
            <option value="KISWAHILI">Kiswahili</option>
            <option value="ARABIC">Arabic</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div class="field-group">
          <label>Other Language (if applicable)</label>
          <input [ngModel]="data().other_language" (ngModelChange)="update('other_language', $event)"
                 placeholder="Specify if 'Other' selected">
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
    input, select { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; background: white; font-family: inherit; width: 100%; box-sizing: border-box; }
    input:focus, select:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }
  `]
})
export class NoneEducationStep {
  data = input.required<NoneEducationDetails>();
  dataChange = output<any>();
  validityChange = output<boolean>();

  private hasEmitted = false;

  constructor() {
    effect(() => {
      if (!this.hasEmitted) {
        this.hasEmitted = true;
        this.dataChange.emit({ ...this.data() });
      }
      this.validate();
    });
  }

  update(field: string, value: any): void {
    this.dataChange.emit({ ...this.data(), [field]: value });
    this.validate();
  }

  private validate(): void {
    this.validityChange.emit(true);
  }
}
