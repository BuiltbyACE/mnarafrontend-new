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
      <h2>Arabic & Quran</h2>
      <p class="step-description">Assess the student's Arabic and Quran proficiency</p>

      <div class="form-row">
        <div class="field-group">
          <label>Arabic Proficiency *</label>
          <select [ngModel]="data().arabic_proficiency" (ngModelChange)="update('arabic_proficiency', $event)">
            <option value="NONE">None</option>
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
            <option value="FLUENT">Fluent</option>
          </select>
        </div>
        <div class="field-group">
          <label>Quran Reading Level *</label>
          <select [ngModel]="data().quran_reading_level" (ngModelChange)="update('quran_reading_level', $event)">
            <option value="NONE">None</option>
            <option value="BASIC">Basic</option>
            <option value="MODERATE">Moderate</option>
            <option value="FLUENT">Fluent</option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="field-group">
          <label>Tajweed Level</label>
          <select [ngModel]="data().tajweed_level" (ngModelChange)="update('tajweed_level', $event)">
            <option value="NONE">None</option>
            <option value="BASIC">Basic</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>
        </div>
        <div class="field-group">
          <label>Quran Memorization</label>
          <input [ngModel]="data().quran_memorization" (ngModelChange)="update('quran_memorization', $event)"
                 placeholder="Surahs memorized or Juz count">
        </div>
      </div>

      <div class="form-row">
        <div class="field-group full-width">
          <label>Comments</label>
          <textarea [ngModel]="data().comments" (ngModelChange)="update('comments', $event)"
                    placeholder="Additional notes about Arabic/Quran proficiency" rows="3"></textarea>
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

  private current: ArabicQuranData = { arabic_proficiency: 'NONE', quran_memorization: '', quran_reading_level: 'NONE', tajweed_level: 'NONE', comments: '' };

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
    this.validityChange.emit(!!this.current.arabic_proficiency && !!this.current.quran_reading_level);
  }
}
