import { Component, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HomeschoolDetails, HomeschoolSubject } from '../../../../../shared/models/students.models';

@Component({
  selector: 'app-homeschool-step',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="step-container">
      <h2>Homeschool Details</h2>
      <p class="step-description">Enter information about the student's homeschooling</p>

      <div class="form-row">
        <div class="field-group">
          <label>Supervisor Name *</label>
          <input [ngModel]="data().supervisor_name" (ngModelChange)="update('supervisor_name', $event)" placeholder="Name of homeschool supervisor">
        </div>
        <div class="field-group">
          <label>Supervisor Qualification</label>
          <input [ngModel]="data().supervisor_qualification" (ngModelChange)="update('supervisor_qualification', $event)" placeholder="e.g. Teaching certificate">
        </div>
      </div>

      <div class="form-row">
        <div class="field-group">
          <label>Supervisor Contact</label>
          <input [ngModel]="data().supervisor_contact" (ngModelChange)="update('supervisor_contact', $event)" placeholder="Phone or email">
        </div>
      </div>

      <div class="form-row">
        <div class="field-group">
          <label>Start Year</label>
          <input type="number" [ngModel]="data().start_year" (ngModelChange)="updateNumeric('start_year', $event)" placeholder="e.g. 2022" min="1900" max="2100">
        </div>
        <div class="field-group">
          <label>End Year</label>
          <input type="number" [ngModel]="data().end_year" (ngModelChange)="updateNumeric('end_year', $event)" placeholder="e.g. 2025" min="1900" max="2100">
        </div>
      </div>

      <div class="form-row">
        <div class="field-group full-width">
          <label>Content Covered (one item per line)</label>
          <textarea [ngModel]="contentCoveredText" (ngModelChange)="onContentCoveredChange($event)"
                    placeholder="Describe the educational content covered during homeschooling&#10;Each line becomes a separate entry" rows="5"></textarea>
        </div>
      </div>

      <h3 class="section-title">Subjects Studied (max 11)</h3>
      @if (subjects.length < 11) {
        <button class="add-subject-btn" (click)="addSubject()">+ Add Subject</button>
      }
      <div class="subjects-list">
        @for (subject of subjects; track idx; let idx = $index) {
          <div class="subject-row">
            <div class="field-group">
              <label>Subject Name</label>
              <input [ngModel]="subject.subject_name" (ngModelChange)="updateSubject(idx, 'subject_name', $event)" placeholder="e.g. Mathematics">
            </div>
            <div class="field-group">
              <label>Level Achieved</label>
              <select [ngModel]="subject.level_achieved" (ngModelChange)="updateSubject(idx, 'level_achieved', $event)">
                <option value="">Select level</option>
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </div>
            <div class="field-group">
              <label>Years Studied</label>
              <input type="number" [ngModel]="subject.years_studied" (ngModelChange)="updateSubject(idx, 'years_studied', $event)" min="0" max="20">
            </div>
            <button class="remove-btn" (click)="removeSubject(idx)" [disabled]="subjects.length <= 1">✕</button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .step-container { padding: 24px; }
    h2 { margin: 0 0 4px; font-size: 20px; font-weight: 600; color: #1e293b; }
    .step-description { margin: 0 0 24px; color: #64748b; font-size: 14px; }
    .section-title { margin: 20px 0 12px; font-size: 16px; font-weight: 600; color: #1e293b; }
    .form-row { display: flex; gap: 16px; margin-bottom: 16px; }
    .field-group { flex: 1; display: flex; flex-direction: column; gap: 6px; }
    .field-group.full-width { flex: 0 0 100%; }
    label { font-size: 13px; font-weight: 500; color: #374151; }
    input, select, textarea { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; background: white; font-family: inherit; width: 100%; box-sizing: border-box; }
    input:focus, select:focus, textarea:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }
    .add-subject-btn { padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 8px; font-size: 13px; cursor: pointer; margin-bottom: 12px; }
    .subjects-list { display: flex; flex-direction: column; gap: 12px; }
    .subject-row { display: flex; gap: 12px; align-items: flex-end; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; }
    .remove-btn { padding: 6px 10px; background: #fee2e2; color: #dc2626; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; flex-shrink: 0; }
    .remove-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  `]
})
export class HomeschoolStep {
  data = input.required<HomeschoolDetails>();
  dataChange = output<any>();
  validityChange = output<boolean>();

  contentCoveredText = '';
  subjects: HomeschoolSubject[] = [];

  constructor() {
    effect(() => {
      const d = this.data();
      this.contentCoveredText = Array.isArray(d.content_covered)
        ? d.content_covered.join('\n')
        : typeof d.content_covered === 'string'
          ? d.content_covered
          : '';
      this.subjects = d.subjects?.length ? [...d.subjects] : [{ subject_name: '', level_achieved: '', years_studied: 0 }];
      this.validate();
    });
  }

  private emit(): void {
    const content_covered = this.contentCoveredText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);
    this.dataChange.emit({
      ...this.data(),
      content_covered,
      subjects: this.subjects,
    });
  }

  onContentCoveredChange(value: string): void {
    this.contentCoveredText = value;
    this.emit();
    this.validate();
  }

  update(field: string, value: any): void {
    const payload = { ...this.data(), [field]: value, subjects: this.subjects };
    const content_covered = this.contentCoveredText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);
    payload.content_covered = content_covered;
    this.dataChange.emit(payload);
    this.validate();
  }

  updateNumeric(field: string, value: any): void {
    this.update(field, value ? Number(value) : null);
  }

  updateSubject(idx: number, field: string, value: any): void {
    this.subjects[idx] = { ...this.subjects[idx], [field]: value };
    this.emit();
  }

  addSubject(): void {
    if (this.subjects.length < 11) {
      this.subjects.push({ subject_name: '', level_achieved: '', years_studied: 0 });
    }
  }

  removeSubject(idx: number): void {
    if (this.subjects.length > 1) {
      this.subjects.splice(idx, 1);
      this.emit();
    }
  }

  private validate(): void {
    this.validityChange.emit(!!this.data().supervisor_name);
  }
}
