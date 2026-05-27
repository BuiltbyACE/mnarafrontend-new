import { Component, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubjectExclusionData, COMPULSORY_SUBJECTS } from '../../../../../shared/models/students.models';

@Component({
  selector: 'app-subject-exclusions-step',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="step-container">
      <h2>Subject Exclusions</h2>
      <p class="step-description">Select subjects to exclude for this student</p>

      <div class="note">Arabic and Arabic Compulsory Language are mandatory and cannot be excluded.</div>

      <div class="subjects-grid">
        @for (subject of allSubjects; track subject) {
          <div class="subject-item" [class.disabled]="isCompulsory(subject)">
            <label>
              <input type="checkbox"
                     [checked]="excluded.has(subject)"
                     [disabled]="isCompulsory(subject)"
                     (change)="toggleSubject(subject)">
              <span>{{ subject }}</span>
            </label>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .step-container { padding: 24px; }
    h2 { margin: 0 0 4px; font-size: 20px; font-weight: 600; color: #1e293b; }
    .step-description { margin: 0 0 24px; color: #64748b; font-size: 14px; }
    .note { padding: 10px 14px; background: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; color: #92400e; font-size: 13px; margin-bottom: 20px; }
    .subjects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px; }
    .subject-item { padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 8px; background: white; }
    .subject-item.disabled { background: #f1f5f9; opacity: 0.6; }
    .subject-item label { display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 14px; color: #1e293b; }
    .subject-item.disabled label { cursor: not-allowed; }
    input[type="checkbox"] { width: 16px; height: 16px; }
  `]
})
export class SubjectExclusionsStep {
  data = input.required<SubjectExclusionData>();
  dataChange = output<any>();
  validityChange = output<boolean>();

  readonly allSubjects = [
    'Arabic', 'Arabic Compulsory Language', 'Mathematics', 'English', 'Science',
    'History', 'Geography', 'Art', 'Music', 'Physical Education',
    'ICT', 'French', 'Islamic Studies', 'Social Studies', 'Biology',
    'Chemistry', 'Physics', 'Business Studies', 'Accounting', 'Economics',
  ];

  excluded = new Set<string>();

  constructor() {
    effect(() => {
      this.excluded = new Set(this.data().excluded_subjects || []);
    });
  }

  isCompulsory(subject: string): boolean {
    return COMPULSORY_SUBJECTS.includes(subject);
  }

  toggleSubject(subject: string): void {
    if (this.isCompulsory(subject)) return;
    const updated = new Set(this.excluded);
    updated.has(subject) ? updated.delete(subject) : updated.add(subject);
    this.excluded = updated;
    this.dataChange.emit({ excluded_subjects: Array.from(updated) });
    this.validityChange.emit(true);
  }
}
