import { Component, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArabicQuranData } from '../../../../../shared/models/students.models';

@Component({
  selector: 'app-arabic-quran-step',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="step-container">
      <h2>Arabic & Quran Assessment</h2>
      <p class="step-description">Rate the student's Arabic and Quran proficiency</p>

      <div class="form-row">
        <div class="field-group">
          <label>Arabic Reading Fluency</label>
          <select [ngModel]="data().arabic_reading_fluency" (ngModelChange)="update('arabic_reading_fluency', $event)">
            <option value="GOOD">Good</option>
            <option value="AVERAGE">Average</option>
            <option value="POOR">Poor</option>
          </select>
        </div>
        <div class="field-group">
          <label>Arabic Writing Fluency</label>
          <select [ngModel]="data().arabic_writing_fluency" (ngModelChange)="update('arabic_writing_fluency', $event)">
            <option value="GOOD">Good</option>
            <option value="AVERAGE">Average</option>
            <option value="POOR">Poor</option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="field-group">
          <label>Arabic Speaking Fluency</label>
          <select [ngModel]="data().arabic_speaking_fluency" (ngModelChange)="update('arabic_speaking_fluency', $event)">
            <option value="GOOD">Good</option>
            <option value="AVERAGE">Average</option>
            <option value="POOR">Poor</option>
          </select>
        </div>
        <div class="field-group">
          <label>Reading Al-Quran</label>
          <select [ngModel]="data().reading_al_quran" (ngModelChange)="update('reading_al_quran', $event)">
            <option value="GOOD">Good</option>
            <option value="AVERAGE">Average</option>
            <option value="POOR">Poor</option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="field-group full-width">
          <label>Memorization of Al-Quran (Juzz list — one per line)</label>
          <textarea [ngModel]="memorizationText" (ngModelChange)="onMemorizationChange($event)"
                    placeholder="List the Juzz memorized, one per line&#10;e.g.&#10;Juzz 1&#10;Juzz 2&#10;Juzz 30" rows="4"></textarea>
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
    input, select, textarea { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; background: white; font-family: inherit; width: 100%; box-sizing: border-box; }
    input:focus, select:focus, textarea:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }
  `]
})
export class ArabicQuranStep {
  data = input.required<ArabicQuranData>();
  dataChange = output<any>();
  validityChange = output<boolean>();

  memorizationText = '';

  constructor() {
    effect(() => {
      const d = this.data();
      this.memorizationText = Array.isArray(d.memorization_of_al_quran)
        ? d.memorization_of_al_quran.join('\n')
        : '';
      this.validate();
    });
  }

  onMemorizationChange(value: string): void {
    this.memorizationText = value;
    this.emitData();
    this.validate();
  }

  update(field: string, value: any): void {
    const payload = { ...this.data(), [field]: value };
    payload.memorization_of_al_quran = this.memorizationText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);
    this.dataChange.emit(payload);
    this.validate();
  }

  private emitData(): void {
    this.dataChange.emit({
      ...this.data(),
      memorization_of_al_quran: this.memorizationText
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean),
    });
  }

  private validate(): void {
    this.validityChange.emit(true);
  }
}
