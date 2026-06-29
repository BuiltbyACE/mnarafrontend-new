import { Component, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { CarerData, FamilyBackground, SiblingFormEntry } from '../../../../../shared/models/students.models';

@Component({
  selector: 'app-carers-family-step',
  standalone: true,
  imports: [CommonModule, FormsModule, MatExpansionModule],
  template: `
    <div class="step-container">
      <h2>Carers & Family Background</h2>
      <p class="step-description">Add carer details, family background, and sibling information</p>

      <mat-accordion>
        <mat-expansion-panel expanded>
          <mat-expansion-panel-header>
            <mat-panel-title>Carers (1-2)</mat-panel-title>
            <mat-panel-description>Primary carer required</mat-panel-description>
          </mat-expansion-panel-header>

          @for (carer of carers; track idx; let idx = $index) {
            <div class="carer-section">
              <h3>{{ carer.carer_level === 'PRIMARY' ? 'Primary Carer' : 'Secondary Carer' }}</h3>

              <div class="form-row">
                <div class="field-group">
                  <label>Title</label>
                  <select [ngModel]="carer.title" (ngModelChange)="updateCarer(idx, 'title', $event)">
                    <option value="">Select</option>
                    <option value="Mr">Mr</option>
                    <option value="Mrs">Mrs</option>
                    <option value="Ms">Ms</option>
                    <option value="Dr">Dr</option>
                  </select>
                </div>
                <div class="field-group">
                  <label>Relationship *</label>
                  <input [ngModel]="carer.relationship" (ngModelChange)="updateCarer(idx, 'relationship', $event)" placeholder="e.g. Mother, Father, Guardian">
                </div>
              </div>

              <div class="form-row">
                <div class="field-group">
                  <label>First Name *</label>
                  <input [ngModel]="carer.first_name" (ngModelChange)="updateCarer(idx, 'first_name', $event)" placeholder="First name">
                </div>
                <div class="field-group">
                  <label>Surname *</label>
                  <input [ngModel]="carer.surname" (ngModelChange)="updateCarer(idx, 'surname', $event)" placeholder="Surname">
                </div>
              </div>

              <div class="form-row">
                <div class="field-group">
                  <label>Email</label>
                  <input type="email" [ngModel]="carer.email" (ngModelChange)="updateCarer(idx, 'email', $event)" placeholder="Email address">
                </div>
                <div class="field-group">
                  <label>Mobile 1 *</label>
                  <input [ngModel]="carer.mobile_1" (ngModelChange)="updateCarer(idx, 'mobile_1', $event)" placeholder="Primary phone">
                </div>
              </div>

              <div class="form-row">
                <div class="field-group">
                  <label>Mobile 2</label>
                  <input [ngModel]="carer.mobile_2" (ngModelChange)="updateCarer(idx, 'mobile_2', $event)" placeholder="Secondary phone">
                </div>
                <div class="field-group">
                  <label>Nationality *</label>
                  <input [ngModel]="carer.nationality" (ngModelChange)="updateCarer(idx, 'nationality', $event)" placeholder="Nationality">
                </div>
              </div>

              @if (needsIdProof(carer.nationality)) {
                <div class="form-row id-row">
                  <div class="field-group">
                    <label>ID Type</label>
                    <select [ngModel]="carer.id_type" (ngModelChange)="updateCarer(idx, 'id_type', $event)">
                      <option value="">Select</option>
                      <option value="NATIONAL_ID">National ID</option>
                      <option value="PASSPORT">Passport</option>
                    </select>
                  </div>
                  <div class="field-group">
                    <label>ID Number</label>
                    <input [ngModel]="carer.id_number" (ngModelChange)="updateCarer(idx, 'id_number', $event)" placeholder="ID number">
                  </div>
                </div>
              }

              <div class="form-row">
                <div class="field-group">
                  <label>Occupation</label>
                  <input [ngModel]="carer.occupation" (ngModelChange)="updateCarer(idx, 'occupation', $event)" placeholder="Occupation">
                </div>
                <div class="field-group">
                  <label>Employer</label>
                  <input [ngModel]="carer.employer" (ngModelChange)="updateCarer(idx, 'employer', $event)" placeholder="Employer name">
                </div>
              </div>

              <div class="form-row">
                <div class="field-group full-width">
                  <label>Address</label>
                  <input [ngModel]="carer.address" (ngModelChange)="updateCarer(idx, 'address', $event)" placeholder="Residential address">
                </div>
              </div>
            </div>
          }

          @if (carers.length < 2) {
            <button class="add-carer-btn" (click)="addCarer()">+ Add Secondary Carer</button>
          }
        </mat-expansion-panel>

        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title>Family Background</mat-panel-title>
            <mat-panel-description>Family structure and home environment</mat-panel-description>
          </mat-expansion-panel-header>

          <div class="form-row">
            <div class="field-group">
              <label>Marital Status</label>
              <select [ngModel]="fb.marital_status" (ngModelChange)="updateFamily('marital_status', $event)">
                <option value="">Select</option>
                <option value="MARRIED">Married</option>
                <option value="DIVORCED">Divorced</option>
                <option value="WIDOWED">Widowed</option>
                <option value="SEPARATED">Separated</option>
                <option value="SINGLE">Single Parent</option>
              </select>
            </div>
            <div class="field-group">
              <label>Economic Status</label>
              <select [ngModel]="fb.economic_status" (ngModelChange)="updateFamily('economic_status', $event)">
                <option value="">Select</option>
                <option value="LOW">Low</option>
                <option value="MIDDLE">Middle</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="field-group">
              <label>Number of Siblings</label>
              <input type="number" [ngModel]="fb.number_of_siblings" (ngModelChange)="updateFamily('number_of_siblings', $event)" min="0" max="20">
            </div>
            <div class="field-group">
              <label>Student Position</label>
              <input type="number" [ngModel]="fb.student_position" (ngModelChange)="updateFamily('student_position', $event)" min="1" max="20">
            </div>
          </div>

          <div class="form-row">
            <div class="field-group">
              <label>Living With</label>
              <input [ngModel]="fb.living_with" (ngModelChange)="updateFamily('living_with', $event)" placeholder="e.g. Both parents, Mother only">
            </div>
            <div class="field-group">
              <label>Languages Spoken at Home</label>
              <input [ngModel]="languagesText" (ngModelChange)="updateLanguages($event)" placeholder="Comma-separated">
            </div>
          </div>
        </mat-expansion-panel>

        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title>Siblings</mat-panel-title>
            <mat-panel-description>Siblings also attending or previously at the school</mat-panel-description>
          </mat-expansion-panel-header>

          @for (sibling of siblings; track sIdx; let sIdx = $index) {
            <div class="sibling-row">
              <div class="form-row">
                <div class="field-group">
                  <label>Full Name</label>
                  <input [ngModel]="sibling.full_name" (ngModelChange)="updateSibling(sIdx, 'full_name', $event)" placeholder="Sibling name">
                </div>
                <div class="field-group">
                  <label>Date of Birth</label>
                  <input type="date" [ngModel]="sibling.date_of_birth" (ngModelChange)="updateSibling(sIdx, 'date_of_birth', $event)">
                </div>
              </div>
              <div class="form-row">
                <div class="field-group">
                  <label>Class</label>
                  <input [ngModel]="sibling.class_name" (ngModelChange)="updateSibling(sIdx, 'class_name', $event)" placeholder="Class name">
                </div>
                <div class="field-group">
                  <label>School</label>
                  <input [ngModel]="sibling.school_name" (ngModelChange)="updateSibling(sIdx, 'school_name', $event)" placeholder="School name">
                </div>
              </div>
              <div class="form-row">
                <div class="field-group full-width">
                  <label>Notes</label>
                  <input [ngModel]="sibling.notes" (ngModelChange)="updateSibling(sIdx, 'notes', $event)" placeholder="Any notes about this sibling">
                </div>
              </div>
              @if (siblings.length > 1) {
                <button class="remove-btn" (click)="removeSibling(sIdx)">Remove</button>
              }
              @if (!$last) { <hr> }
            </div>
          }
          <button class="add-sibling-btn" (click)="addSibling()">+ Add Sibling</button>
        </mat-expansion-panel>
      </mat-accordion>
    </div>
  `,
  styles: [`
    .step-container { padding: 24px; }
    h2 { margin: 0 0 4px; font-size: 20px; font-weight: 600; color: #1e293b; }
    .step-description { margin: 0 0 24px; color: #64748b; font-size: 14px; }
    h3 { font-size: 15px; font-weight: 600; color: #1e293b; margin: 16px 0 12px; }
    .form-row { display: flex; gap: 16px; margin-bottom: 12px; }
    .field-group { flex: 1; display: flex; flex-direction: column; gap: 6px; }
    .field-group.full-width { flex: 0 0 100%; }
    label { font-size: 13px; font-weight: 500; color: #374151; }
    input, select { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; background: white; width: 100%; box-sizing: border-box; }
    input:focus, select:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }
    .carer-section { padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 12px; background: #f8fafc; }
    .id-row { padding: 10px 14px; background: #eff6ff; border-radius: 8px; border: 1px solid #bfdbfe; }
    .add-carer-btn, .add-sibling-btn { padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 8px; font-size: 13px; cursor: pointer; margin-top: 8px; }
    .remove-btn { padding: 6px 14px; background: #fee2e2; color: #dc2626; border: none; border-radius: 6px; font-size: 12px; cursor: pointer; margin-bottom: 8px; }
    hr { border: none; border-top: 1px solid #e2e8f0; margin: 16px 0; }
    mat-panel-title { font-weight: 600; font-size: 14px; }
    mat-panel-description { font-size: 12px; }
  `]
})
export class CarersFamilyStep {
  data = input.required<{ carers: CarerData[]; family_background: FamilyBackground | null; siblings: SiblingFormEntry[] }>();
  dataChange = output<any>();
  validityChange = output<boolean>();

  carers: CarerData[] = [];
  siblings: SiblingFormEntry[] = [];
  languagesText = '';

  get fb(): FamilyBackground {
    return this.data().family_background || {
      marital_status: 'MARRIED' as const, number_of_siblings: 0, student_position: 1,
      languages_spoken_at_home: [], economic_status: 'MIDDLE' as const, living_with: '',
    };
  }

  constructor() {
    effect(() => {
      const d = this.data();
      this.carers = d.carers?.length ? [...d.carers] : [this.emptyCarer('PRIMARY')];
      this.siblings = d.siblings?.length ? [...d.siblings] : [];
      const fb = d.family_background || this.emptyFamily();
      this.languagesText = (fb.languages_spoken_at_home || []).join(', ');
      this.validate();
    });
  }

  private emptyCarer(level: 'PRIMARY' | 'SECONDARY'): CarerData {
    return { carer_level: level, relationship: '', title: '', first_name: '', surname: '', email: '', mobile_1: '', nationality: '', occupation: '', employer: '', address: '' };
  }

  private emptyFamily(): FamilyBackground {
    return { marital_status: 'MARRIED', number_of_siblings: 0, student_position: 1, languages_spoken_at_home: [], economic_status: 'MIDDLE', living_with: '' };
  }

  needsIdProof(nationality: string): boolean {
    return ['Tanzanian', 'Kenyan', 'Ugandan'].includes(nationality);
  }

  addCarer(): void {
    if (this.carers.length < 2) {
      this.carers.push(this.emptyCarer('SECONDARY'));
      this.emitData();
    }
  }

  updateCarer(idx: number, field: string, value: any): void {
    this.carers[idx] = { ...this.carers[idx], [field]: value };
    this.emitData();
  }

  updateFamily(field: string, value: any): void {
    const fb = { ...this.data().family_background || this.emptyFamily(), [field]: value };
    this.dataChange.emit({
      carers: this.carers,
      family_background: fb,
      siblings: this.siblings,
    });
  }

  updateLanguages(value: string): void {
    this.languagesText = value;
    const fb = { ...this.data().family_background || this.emptyFamily(), languages_spoken_at_home: value.split(',').map(s => s.trim()).filter(s => s) };
    this.dataChange.emit({
      carers: this.carers,
      family_background: fb,
      siblings: this.siblings,
    });
  }

  addSibling(): void {
    this.siblings.push({ full_name: '', date_of_birth: '', class_name: '', school_name: '', notes: '' });
    this.emitData();
  }

  removeSibling(idx: number): void {
    this.siblings.splice(idx, 1);
    this.emitData();
  }

  updateSibling(idx: number, field: string, value: any): void {
    this.siblings[idx] = { ...this.siblings[idx], [field]: value };
    this.emitData();
  }

  private emitData(): void {
    this.dataChange.emit({
      carers: this.carers,
      family_background: this.data().family_background,
      siblings: this.siblings,
    });
    this.validate();
  }

  private validate(): void {
    const primary = this.carers.find(c => c.carer_level === 'PRIMARY');
    const valid = !!primary?.first_name && !!primary?.surname && !!primary?.mobile_1 && !!primary?.relationship && !!primary?.nationality;
    this.validityChange.emit(valid);
  }
}
