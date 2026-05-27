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
        </mat-expansion-panel>

        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title>Allergies & Blood Group</mat-panel-title>
            <mat-panel-description>Blood type and allergy information</mat-panel-description>
          </mat-expansion-panel-header>

          <div class="form-row">
            <div class="field-group">
              <label>Blood Group</label>
              <select [ngModel]="data().blood_group" (ngModelChange)="update('blood_group', $event)">
                <option value="">Select</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="field-group full-width">
              <label>Allergies</label>
              <input [ngModel]="allergiesText" (ngModelChange)="updateAllergies($event)" placeholder="Comma-separated list of allergies">
            </div>
          </div>
        </mat-expansion-panel>

        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title>Immunization</mat-panel-title>
            <mat-panel-description>Vaccination status</mat-panel-description>
          </mat-expansion-panel-header>

          <div class="form-row">
            <div class="field-group">
              <label>
                <input type="checkbox" [ngModel]="data().immunization_uptodate" (ngModelChange)="update('immunization_uptodate', $event)">
                Immunizations are up to date
              </label>
            </div>
          </div>

          <div class="form-row">
            <div class="field-group full-width">
              <label>Immunization Notes</label>
              <textarea [ngModel]="data().immunization_notes" (ngModelChange)="update('immunization_notes', $event)"
                        placeholder="Any notes about immunizations" rows="2"></textarea>
            </div>
          </div>
        </mat-expansion-panel>

        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title>Additional Info</mat-panel-title>
            <mat-panel-description>Doctor, hospital, and emergency contacts</mat-panel-description>
          </mat-expansion-panel-header>

          <div class="form-row">
            <div class="field-group">
              <label>Doctor Name</label>
              <input [ngModel]="data().doctor_name" (ngModelChange)="update('doctor_name', $event)" placeholder="Doctor's name">
            </div>
            <div class="field-group">
              <label>Doctor Contact</label>
              <input [ngModel]="data().doctor_contact" (ngModelChange)="update('doctor_contact', $event)" placeholder="Doctor's phone">
            </div>
          </div>

          <div class="form-row">
            <div class="field-group">
              <label>Emergency Contact</label>
              <input [ngModel]="data().emergency_contact" (ngModelChange)="update('emergency_contact', $event)" placeholder="Emergency phone number">
            </div>
            <div class="field-group">
              <label>Hospital Preference</label>
              <input [ngModel]="data().hospital_preference" (ngModelChange)="update('hospital_preference', $event)" placeholder="Preferred hospital">
            </div>
          </div>

          <div class="form-row">
            <div class="field-group full-width">
              <label>Additional Notes</label>
              <textarea [ngModel]="data().additional_notes" (ngModelChange)="update('additional_notes', $event)"
                        placeholder="Any other medical information" rows="2"></textarea>
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
    .form-row { display: flex; gap: 16px; margin-bottom: 16px; }
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

  allergiesText = '';

  private current: MedicalRecord = {
    blood_group: '', allergies: [], chronic_conditions: [], emergency_contact: '',
    doctor_name: '', doctor_contact: '', hospital_preference: '',
    immunization_uptodate: false, immunization_notes: '',
    conditions_detail: {} as Record<MedicalConditionKey, boolean>,
    additional_notes: '',
  };

  constructor() {
    effect(() => {
      this.current = { ...this.data() };
      this.allergiesText = (this.current.allergies || []).join(', ');
    });
  }

  getCondition(key: MedicalConditionKey): boolean {
    return this.current.conditions_detail?.[key] ?? false;
  }

  toggleCondition(key: MedicalConditionKey): void {
    const detail = { ...this.current.conditions_detail };
    detail[key] = !detail[key];
    this.current = { ...this.current, conditions_detail: detail };
    this.dataChange.emit({ ...this.current });
  }

  update(field: string, value: any): void {
    (this.current as any)[field] = value;
    this.dataChange.emit({ ...this.current });
  }

  updateAllergies(value: string): void {
    this.allergiesText = value;
    this.current.allergies = value.split(',').map(s => s.trim()).filter(s => s);
    this.dataChange.emit({ ...this.current });
  }
}
