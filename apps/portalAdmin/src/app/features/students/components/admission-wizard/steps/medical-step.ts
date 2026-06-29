import { Component, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MedicalRecord, MEDICAL_CONDITIONS, CONDITION_LABELS, MedicalConditionKey } from '../../../../../shared/models/students.models';

@Component({
  selector: 'app-medical-step',
  standalone: true,
  imports: [CommonModule, FormsModule, MatExpansionModule],
  template: `
    <div class="step-container">
      <h2>Medical Information</h2>
      <p class="step-description">Provide the student's medical details</p>

      <mat-accordion>
        <mat-expansion-panel expanded>
          <mat-expansion-panel-header>
            <mat-panel-title>Medical Conditions</mat-panel-title>
            <mat-panel-description>Select all that apply</mat-panel-description>
          </mat-expansion-panel-header>

          <div class="conditions-grid">
            @for (key of conditionKeys; track key) {
              <div class="condition-item" [class.has-condition]="getCondition(key)">
                <label>
                  <input type="checkbox"
                         [checked]="getCondition(key)"
                         (change)="toggleCondition(key)">
                  <span>{{ CONDITION_LABELS[key] }}</span>
                </label>
              </div>
            }
          </div>

          <div class="form-row">
            <div class="field-group full-width">
              <label>Conditions Elaboration</label>
              <textarea [ngModel]="med.conditions_elaboration" (ngModelChange)="update('conditions_elaboration', $event)"
                        placeholder="Provide details about the conditions checked above" rows="3"></textarea>
            </div>
          </div>
        </mat-expansion-panel>

        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title>Allergies & Chronic Illnesses</mat-panel-title>
            <mat-panel-description>Allergies, chronic conditions, and daily medications</mat-panel-description>
          </mat-expansion-panel-header>

          <div class="form-row">
            <div class="field-group full-width">
              <label>Allergies</label>
              <textarea [ngModel]="med.allergies" (ngModelChange)="update('allergies', $event)"
                        placeholder="List any allergies (food, drug, insect, latex, etc.)" rows="2"></textarea>
            </div>
          </div>

          <div class="form-row">
            <div class="field-group full-width">
              <label>Chronic Illnesses</label>
              <textarea [ngModel]="med.chronic_illnesses" (ngModelChange)="update('chronic_illnesses', $event)"
                        placeholder="Describe any chronic illnesses" rows="2"></textarea>
            </div>
          </div>

          <div class="form-row">
            <div class="field-group full-width">
              <label>Daily Medications</label>
              <textarea [ngModel]="med.daily_medications" (ngModelChange)="update('daily_medications', $event)"
                        placeholder="List any daily medications" rows="2"></textarea>
            </div>
          </div>

          <div class="form-row">
            <div class="field-group full-width">
              <label>Physical Limitations</label>
              <textarea [ngModel]="med.physical_limitations" (ngModelChange)="update('physical_limitations', $event)"
                        placeholder="Describe any physical limitations" rows="2"></textarea>
            </div>
          </div>

          <div class="form-row">
            <div class="field-group full-width">
              <label>Visual / Hearing Impairments</label>
              <textarea [ngModel]="med.visual_hearing_impairments" (ngModelChange)="update('visual_hearing_impairments', $event)"
                        placeholder="Describe any visual or hearing impairments" rows="2"></textarea>
            </div>
          </div>
        </mat-expansion-panel>

        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title>Immunization</mat-panel-title>
            <mat-panel-description>Vaccination status — check all completed</mat-panel-description>
          </mat-expansion-panel-header>

          <div class="immunization-grid">
            <label class="imm-item">
              <input type="checkbox" [ngModel]="med.imm_mmr" (ngModelChange)="update('imm_mmr', $event)"> MMR
            </label>
            <label class="imm-item">
              <input type="checkbox" [ngModel]="med.imm_tdap" (ngModelChange)="update('imm_tdap', $event)"> Tdap
            </label>
            <label class="imm-item">
              <input type="checkbox" [ngModel]="med.imm_varicella" (ngModelChange)="update('imm_varicella', $event)"> Varicella
            </label>
            <label class="imm-item">
              <input type="checkbox" [ngModel]="med.imm_polio" (ngModelChange)="update('imm_polio', $event)"> Polio
            </label>
            <label class="imm-item">
              <input type="checkbox" [ngModel]="med.imm_meningococcal" (ngModelChange)="update('imm_meningococcal', $event)"> Meningococcal
            </label>
            <label class="imm-item">
              <input type="checkbox" [ngModel]="med.imm_hepatitis_b" (ngModelChange)="update('imm_hepatitis_b', $event)"> Hepatitis B
            </label>
            <label class="imm-item">
              <input type="checkbox" [ngModel]="med.imm_bcg" (ngModelChange)="update('imm_bcg', $event)"> BCG
            </label>
          </div>
        </mat-expansion-panel>

        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title>Physician & Insurance</mat-panel-title>
            <mat-panel-description>Doctor details and insurance information</mat-panel-description>
          </mat-expansion-panel-header>

          <div class="form-row">
            <div class="field-group">
              <label>Physician Name</label>
              <input [ngModel]="med.physician_name" (ngModelChange)="update('physician_name', $event)" placeholder="Doctor's name">
            </div>
            <div class="field-group">
              <label>Physician Office</label>
              <input [ngModel]="med.physician_office" (ngModelChange)="update('physician_office', $event)" placeholder="Office or clinic name">
            </div>
          </div>

          <div class="form-row">
            <div class="field-group">
              <label>Physician Mobile</label>
              <input [ngModel]="med.physician_mobile" (ngModelChange)="update('physician_mobile', $event)" placeholder="Phone number">
            </div>
            <div class="field-group">
              <label>Physician Email</label>
              <input type="email" [ngModel]="med.physician_email" (ngModelChange)="update('physician_email', $event)" placeholder="Email address">
            </div>
          </div>

          <div class="form-row">
            <div class="field-group">
              <label>Emergency Facility</label>
              <input [ngModel]="med.emergency_facility" (ngModelChange)="update('emergency_facility', $event)" placeholder="Preferred emergency facility">
            </div>
          </div>

          <div class="form-row">
            <div class="field-group">
              <label>
                <input type="checkbox" [ngModel]="med.has_insurance" (ngModelChange)="update('has_insurance', $event)">
                Has Health Insurance
              </label>
            </div>
          </div>

          @if (med.has_insurance) {
            <div class="insurance-section">
              <div class="form-row">
                <div class="field-group">
                  <label>Insurance Provider</label>
                  <input [ngModel]="med.insurance_provider" (ngModelChange)="update('insurance_provider', $event)" placeholder="Provider name">
                </div>
                <div class="field-group">
                  <label>Policy Number</label>
                  <input [ngModel]="med.insurance_policy_no" (ngModelChange)="update('insurance_policy_no', $event)" placeholder="Policy number">
                </div>
              </div>
              <div class="form-row">
                <div class="field-group">
                  <label>Insurance Mobile</label>
                  <input [ngModel]="med.insurance_mobile" (ngModelChange)="update('insurance_mobile', $event)" placeholder="Insurance contact phone">
                </div>
              </div>
            </div>
          }
        </mat-expansion-panel>

        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title>Additional</mat-panel-title>
            <mat-panel-description>Other medical information</mat-panel-description>
          </mat-expansion-panel-header>

          <div class="form-row">
            <div class="field-group">
              <label>
                <input type="checkbox" [ngModel]="med.wears_dental_braces" (ngModelChange)="update('wears_dental_braces', $event)">
                Wears Dental Braces
              </label>
            </div>
          </div>

          <div class="form-row">
            <div class="field-group">
              <label>
                <input type="checkbox" [ngModel]="med.declaration_signed" (ngModelChange)="update('declaration_signed', $event)">
                Declaration Signed
              </label>
            </div>
          </div>
        </mat-expansion-panel>
      </mat-accordion>
    </div>
  `,
  styles: [`
    .step-container { padding: 24px; }
    h2 { margin: 0 0 4px; font-size: 20px; font-weight: 600; color: #1e293b; }
    .step-description { margin: 0 0 24px; color: #64748b; font-size: 14px; }
    .form-row { display: flex; gap: 16px; margin-bottom: 12px; }
    .field-group { flex: 1; display: flex; flex-direction: column; gap: 6px; }
    .field-group.full-width { flex: 0 0 100%; }
    label { font-size: 13px; font-weight: 500; color: #374151; display: flex; align-items: center; gap: 8px; }
    input, select, textarea { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; background: white; font-family: inherit; width: 100%; box-sizing: border-box; }
    input:focus, select:focus, textarea:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }
    input[type="checkbox"] { width: auto; }
    .conditions-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 6px; }
    .condition-item { padding: 6px 10px; border: 1px solid #e2e8f0; border-radius: 6px; }
    .condition-item.has-condition { background: #eff6ff; border-color: #93c5fd; }
    .condition-item label { font-size: 13px; cursor: pointer; }
    .immunization-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; }
    .imm-item { font-size: 13px; cursor: pointer; padding: 6px 10px; border: 1px solid #e2e8f0; border-radius: 6px; }
    .insurance-section { padding: 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; margin-top: 8px; }
    mat-panel-title { font-weight: 600; font-size: 14px; }
    mat-panel-description { font-size: 12px; }
  `]
})
export class MedicalStep {
  data = input.required<MedicalRecord>();
  dataChange = output<any>();
  validityChange = output<boolean>();

  readonly CONDITION_LABELS = CONDITION_LABELS;
  readonly conditionKeys = MEDICAL_CONDITIONS;

  med: MedicalRecord = {
    emergency_facility: '', physician_name: '', physician_office: '',
    physician_mobile: '', physician_email: '',
    has_insurance: false, insurance_provider: '', insurance_policy_no: '', insurance_mobile: '',
    imm_mmr: false, imm_tdap: false, imm_varicella: false, imm_polio: false,
    imm_meningococcal: false, imm_hepatitis_b: false, imm_bcg: false,
    allergies: '', chronic_illnesses: '', daily_medications: '',
    physical_limitations: '', visual_hearing_impairments: '',
    conditions_history: [], conditions_detail: {} as Record<MedicalConditionKey, boolean>,
    conditions_elaboration: '', wears_dental_braces: false, declaration_signed: false,
  };

  constructor() {
    effect(() => {
      this.med = { ...this.data() };
    });
  }

  getCondition(key: MedicalConditionKey): boolean {
    return this.med.conditions_detail?.[key] ?? false;
  }

  toggleCondition(key: MedicalConditionKey): void {
    const detail = { ...this.med.conditions_detail };
    detail[key] = !detail[key];
    this.med = { ...this.med, conditions_detail: detail };
    this.dataChange.emit({ ...this.med });
  }

  update(field: string, value: any): void {
    (this.med as any)[field] = value;
    this.dataChange.emit({ ...this.med });
  }
}
