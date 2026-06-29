import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CONDITION_LABELS, MedicalConditionKey } from '../../../../../shared/models/students.models';

@Component({
  selector: 'app-review-submit-step',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="step-container">
      <h2>Review & Submit</h2>
      <p class="step-description">Please review all information before submitting the admission</p>

      <div class="review-sections">
        <!-- Student Profile created -->
        @if (data().createdStudent; as student) {
          <div class="review-section success">
            <h3>Student Profile Created</h3>
            <p class="student-created">✓ <strong>{{ student.name }}</strong> (ID: {{ student.id }})</p>
          </div>
        }

        <div class="review-section">
          <h3>Student Information</h3>
          <div class="review-grid">
            <div><span class="rlabel">Name</span><span class="rvalue">{{ data().first_name }} {{ data().last_name }}</span></div>
            <div><span class="rlabel">DOB</span><span class="rvalue">{{ data().date_of_birth }}</span></div>
            <div><span class="rlabel">Gender</span><span class="rvalue">{{ data().gender }}</span></div>
            <div><span class="rlabel">Middle Name</span><span class="rvalue">{{ data().middle_name || '—' }}</span></div>
            <div><span class="rlabel">Other Names</span><span class="rvalue">{{ data().other_names || '—' }}</span></div>
            <div><span class="rlabel">Religion</span><span class="rvalue">{{ data().religion || '—' }}</span></div>
            <div><span class="rlabel">Nationality</span><span class="rvalue">{{ data().nationality }}</span></div>
            <div><span class="rlabel">Mother Tongue</span><span class="rvalue">{{ data().mother_tongue || '—' }}</span></div>
            <div><span class="rlabel">Residence</span><span class="rvalue">{{ data().residence || '—' }}</span></div>
            <div><span class="rlabel">Home Address</span><span class="rvalue">{{ data().home_address || '—' }}</span></div>
            <div><span class="rlabel">Emergency Email</span><span class="rvalue">{{ data().emergency_contact_email || '—' }}</span></div>
            <div><span class="rlabel">Emergency Phone</span><span class="rvalue">{{ data().emergency_contact_phone || '—' }}</span></div>
          </div>
        </div>

        <div class="review-section">
          <h3>Class & Options</h3>
          <div class="review-grid">
            <div><span class="rlabel">Year Level ID</span><span class="rvalue">{{ data().year_level_id }}</span></div>
            <div><span class="rlabel">Admission Date</span><span class="rvalue">{{ data().date_of_admission }}</span></div>
            <div><span class="rlabel">Transport</span><span class="rvalue">{{ data().transport_options || 'NONE' }}</span></div>
            <div><span class="rlabel">Lunch</span><span class="rvalue">{{ data().lunch_option ? 'School Lunch' : 'No Lunch' }}</span></div>
            <div><span class="rlabel">Embrace Islamic</span><span class="rvalue">{{ data().embrace_islamic || 'NO' }}</span></div>
          </div>
        </div>

        <div class="review-section">
          <h3>Pathway</h3>
          <div class="review-grid">
            <div><span class="rlabel">Type</span><span class="rvalue">{{ pathwayLabel() }}</span></div>
          </div>
        </div>

        @if (data().arabic_quran_data) {
          <div class="review-section">
            <h3>Arabic & Quran</h3>
            <div class="review-grid">
              <div><span class="rlabel">Reading</span><span class="rvalue">{{ data().arabic_quran_data?.arabic_reading_fluency || '—' }}</span></div>
              <div><span class="rlabel">Al-Quran</span><span class="rvalue">{{ data().arabic_quran_data?.reading_al_quran || '—' }}</span></div>
            </div>
          </div>
        }

        <div class="review-section">
          <h3>Medical</h3>
          <div class="review-grid">
            <div><span class="rlabel">Physician</span><span class="rvalue">{{ data().medical_record?.physician_name || '—' }}</span></div>
            <div><span class="rlabel">Insurance</span><span class="rvalue">{{ data().medical_record?.has_insurance ? 'Yes' : 'No' }}</span></div>
          </div>
          @if (hasConditions()) {
            <div class="conditions-summary">
              <strong>Conditions:</strong>
              @for (key of activeConditions(); track key) {
                <span class="condition-chip">{{ CONDITION_LABELS[key] }}</span>
              }
            </div>
          }
        </div>

        <div class="review-section">
          <h3>Carers</h3>
          @for (carer of data().carers; track carer.first_name + carer.surname) {
            <div class="carer-summary">
              <strong>{{ carer.carer_level }}:</strong> {{ carer.first_name }} {{ carer.surname }}
              ({{ carer.relationship }}) — {{ carer.mobile_1 }}
            </div>
          }
        </div>
      </div>

      @if (error()) {
        <div class="error-block">
          <mat-icon>error</mat-icon>
          <span>{{ error() }}</span>
        </div>
      }

      <div class="submit-area">
        <button mat-raised-button color="primary" [disabled]="submitting()" (click)="submit.emit()">
          @if (submitting()) {
            <mat-spinner diameter="20"></mat-spinner>
            Submitting...
          } @else {
            <mat-icon>check_circle</mat-icon>
            Submit Admission
          }
        </button>
      </div>
    </div>
  `,
  styles: [`
    .step-container { padding: 24px; }
    h2 { margin: 0 0 4px; font-size: 20px; font-weight: 600; color: #1e293b; }
    .step-description { margin: 0 0 24px; color: #64748b; font-size: 14px; }
    .review-sections { display: flex; flex-direction: column; gap: 20px; margin-bottom: 24px; }
    .review-section { padding: 16px; border: 1px solid #e2e8f0; border-radius: 10px; background: #f8fafc; }
    .review-section.success { background: #f0fdf4; border-color: #bbf7d0; }
    .review-section h3 { margin: 0 0 12px; font-size: 15px; font-weight: 600; color: #1e293b; }
    .student-created { margin: 0; font-size: 14px; color: #15803d; }
    .review-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .rlabel { font-size: 12px; color: #64748b; display: block; }
    .rvalue { font-size: 14px; color: #1e293b; font-weight: 500; display: block; }
    .conditions-summary { margin-top: 10px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
    .conditions-summary strong { font-size: 13px; color: #374151; }
    .condition-chip { padding: 3px 10px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; font-size: 12px; color: #1d4ed8; }
    .carer-summary { font-size: 13px; color: #374151; margin-bottom: 4px; }
    .error-block { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626; font-size: 14px; margin-bottom: 16px; }
    .submit-area { text-align: center; padding-top: 16px; border-top: 1px solid #e2e8f0; }
    .submit-area button { min-width: 200px; display: inline-flex; align-items: center; gap: 8px; }
  `]
})
export class ReviewSubmitStep {
  data = input.required<any>();
  submitting = input(false);
  error = input<string | null>(null);
  submit = output<void>();

  readonly CONDITION_LABELS = CONDITION_LABELS;

  pathwayLabel = computed(() => {
    const labels: Record<string, string> = {
      REGULAR_SCHOOL: 'Regular School',
      REGULAR_SCHOOL_INTERRUPTED: 'Regular School (Interrupted)',
      HOMESCHOOL: 'Homeschool',
      NONE: 'No Formal Education',
    };
    return labels[this.data().pathway] || this.data().pathway || '—';
  });

  hasConditions = computed(() => {
    const cd = this.data().medical_record?.conditions_detail;
    return !!cd && Object.values(cd).some(v => v);
  });

  activeConditions = computed<MedicalConditionKey[]>(() => {
    const cd = this.data().medical_record?.conditions_detail;
    if (!cd) return [];
    return (Object.entries(cd) as [MedicalConditionKey, boolean][])
      .filter(([, v]) => v).map(([k]) => k);
  });
}
