import { Component, input, output, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { StudentsService } from '../../../services/students.service';
import { CarerData, FamilyBackground, SiblingFormEntry } from '../../../../../shared/models/students.models';

@Component({
  selector: 'app-carers-family-step',
  standalone: true,
  imports: [CommonModule, FormsModule, MatExpansionModule, MatSnackBarModule],
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
                    <option value="MR">Mr</option>
                    <option value="MRS">Mrs</option>
                    <option value="MS">Ms</option>
                    <option value="DR">Dr</option>
                    <option value="PROF">Prof</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div class="field-group">
                  <label>Relationship *</label>
                  <select [ngModel]="carer.relationship" (ngModelChange)="updateCarer(idx, 'relationship', $event)">
                    <option value="">Select</option>
                    <option value="PARENT">Parent</option>
                    <option value="SIBLING">Sibling</option>
                    <option value="EXTENDED">Extended Family</option>
                    <option value="GUARDIAN">Guardian</option>
                    <option value="SPONSOR">Sponsor</option>
                  </select>
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
                  <label>Email @if (idx === 0) { <span class="lookup-hint">(Auto-fills on match)</span> }</label>
                  <div class="email-input-wrap">
                    <input type="email" [ngModel]="carer.email"
                      (ngModelChange)="onEmailChange(idx, $event)"
                      placeholder="Email address">
                    @if (idx === 0 && isLookingUp()) {
                      <span class="lookup-spinner">⟳</span>
                    }
                  </div>
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

              <div class="form-row id-row">
                <div class="field-group">
                  <label>National ID</label>
                  <input [ngModel]="carer.national_id" (ngModelChange)="updateCarer(idx, 'national_id', $event)" placeholder="National ID number">
                </div>
                <div class="field-group">
                  <label>Passport Number</label>
                  <input [ngModel]="carer.passport_number" (ngModelChange)="updateCarer(idx, 'passport_number', $event)" placeholder="Passport number">
                </div>
              </div>

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
            <button class="add-btn" (click)="addCarer()">+ Add Secondary Carer</button>
          }
        </mat-expansion-panel>

        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title>Family Background</mat-panel-title>
            <mat-panel-description>Family structure and home environment</mat-panel-description>
          </mat-expansion-panel-header>

          <div class="form-row">
            <div class="field-group">
              <label>Family Type</label>
              <select [ngModel]="familyBackground.family_type" (ngModelChange)="updateFamily('family_type', $event)">
                <option value="">Select</option>
                <option value="SINGLE_PARENT">Single Parent</option>
                <option value="DIVORCE">Divorce</option>
                <option value="LEGAL_CUSTODIAN">Legal Custodian</option>
                <option value="CO_PARENTS">Co-Parents</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="field-group">
              <label>
                <input type="checkbox" [ngModel]="familyBackground.different_home_address" (ngModelChange)="updateFamily('different_home_address', $event)">
                Different from Student's Address
              </label>
            </div>
          </div>

          @if (familyBackground.different_home_address) {
            <div class="address-section">
              <div class="form-row">
                <div class="field-group">
                  <label>Estate</label>
                  <input [ngModel]="familyBackground.estate" (ngModelChange)="updateFamily('estate', $event)" placeholder="Estate name">
                </div>
                <div class="field-group">
                  <label>Apartment / House No.</label>
                  <input [ngModel]="familyBackground.apartment" (ngModelChange)="updateFamily('apartment', $event)" placeholder="Apartment or house number">
                </div>
              </div>
              <div class="form-row">
                <div class="field-group">
                  <label>Road / Street</label>
                  <input [ngModel]="familyBackground.road" (ngModelChange)="updateFamily('road', $event)" placeholder="Road or street name">
                </div>
              </div>
            </div>
          }

          <div class="form-row">
            <div class="field-group">
              <label>Emergency Contact Phone</label>
              <input [ngModel]="familyBackground.emergency_contact_phone" (ngModelChange)="updateFamily('emergency_contact_phone', $event)" placeholder="Emergency phone number">
            </div>
            <div class="field-group">
              <label>Emergency Contact Relationship</label>
              <input [ngModel]="familyBackground.emergency_contact_relationship" (ngModelChange)="updateFamily('emergency_contact_relationship', $event)" placeholder="e.g. Mother, Father, Guardian">
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
                  <label>Year of Admission</label>
                  <input type="number" [ngModel]="sibling.year_of_admission" (ngModelChange)="updateSibling(sIdx, 'year_of_admission', $event)" placeholder="e.g. 2025" min="1900" max="2100">
                </div>
              </div>
              <div class="form-row">
                <div class="field-group">
                  <label>Class</label>
                  <input [ngModel]="sibling.class_name" (ngModelChange)="updateSibling(sIdx, 'class_name', $event)" placeholder="Class name">
                </div>
                <div class="field-group">
                  <label>Relationship</label>
                  <select [ngModel]="sibling.relationship" (ngModelChange)="updateSibling(sIdx, 'relationship', $event)">
                    <option value="">Select</option>
                    <option value="BROTHER">Brother</option>
                    <option value="SISTER">Sister</option>
                    <option value="TWIN">Twin</option>
                  </select>
                </div>
              </div>
              @if (siblings.length > 1) {
                <button class="remove-btn" (click)="removeSibling(sIdx)">Remove</button>
              }
              @if (!$last) { <hr> }
            </div>
          }
          <button class="add-btn" (click)="addSibling()">+ Add Sibling</button>
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
    label { font-size: 13px; font-weight: 500; color: #374151; display: flex; align-items: center; gap: 8px; }
    input, select { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; background: white; width: 100%; box-sizing: border-box; }
    input:focus, select:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }
    input[type="checkbox"] { width: auto; }
    .lookup-hint { font-weight: 400; color: #3b82f6; font-size: 11px; }
    .email-input-wrap { display: flex; align-items: center; gap: 6px; }
    .email-input-wrap input { flex: 1; }
    .lookup-spinner { color: #3b82f6; font-size: 18px; animation: spin 0.8s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    .carer-section { padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 12px; background: #f8fafc; }
    .id-row { padding: 10px 14px; background: #eff6ff; border-radius: 8px; border: 1px solid #bfdbfe; }
    .address-section { padding: 12px; background: #fefce8; border: 1px solid #fde68a; border-radius: 8px; margin-bottom: 12px; }
    .add-btn { padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 8px; font-size: 13px; cursor: pointer; margin-top: 8px; }
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
  carerFound = output<any>();

  private studentsService = inject(StudentsService);
  private snackBar = inject(MatSnackBar);

  carers: CarerData[] = [];
  siblings: SiblingFormEntry[] = [];
  isLookingUp = signal(false);

  familyBackground: FamilyBackground = {
    family_type: '' as any, different_home_address: false,
    estate: '', apartment: '', road: '',
    emergency_contact_phone: '', emergency_contact_relationship: '',
  };

  private emailSubject = new Subject<string>();

  constructor() {
    effect(() => {
      const d = this.data();
      this.carers = d.carers?.length ? [...d.carers] : [this.emptyCarer('PRIMARY')];
      this.siblings = d.siblings?.length ? [...d.siblings] : [];
      if (d.family_background) {
        this.familyBackground = { ...d.family_background };
      }
      this.validate();
    });

    // Debounced email lookup with 400ms delay
    this.emailSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(email => {
        if (!email || !email.includes('@')) return of(null);
        this.isLookingUp.set(true);
        return this.studentsService.lookupCarerByEmail(email);
      }),
    ).subscribe({
      next: (res) => {
        this.isLookingUp.set(false);
        if (res?.found && res.carer) {
          this.autoFillCarer(res.carer);
          if (res.students?.length) {
            this.autoFillSiblings(res.students);
          }
          this.carerFound.emit(res);
          this.snackBar.open('Carer found! Fields auto-filled.', 'Close', { duration: 3000 });
        }
      },
      error: () => {
        this.isLookingUp.set(false);
      },
    });
  }

  onEmailChange(idx: number, value: string): void {
    this.updateCarer(idx, 'email', value);
    if (idx === 0) {
      this.emailSubject.next(value);
    }
  }

  private autoFillCarer(found: CarerData): void {
    if (!this.carers.length) return;
    const primary = { ...this.carers[0] };
    if (found.title) primary.title = found.title;
    if (found.first_name) primary.first_name = found.first_name;
    if (found.surname) primary.surname = found.surname;
    if (found.nationality) primary.nationality = found.nationality;
    if (found.national_id) primary.national_id = found.national_id;
    if (found.passport_number) primary.passport_number = found.passport_number;
    if (found.mobile_1) primary.mobile_1 = found.mobile_1;
    this.carers[0] = primary;
    this.emitData();
  }

  private autoFillSiblings(foundStudents: { id: number; school_id: string; first_name: string; last_name: string; year_level: string | null }[]): void {
    this.siblings = foundStudents.map(s => ({
      full_name: `${s.first_name} ${s.last_name}`,
      year_of_admission: new Date().getFullYear(),
      class_name: s.year_level || '',
      relationship: '',
    }));
    this.emitData();
  }

  private emptyCarer(level: 'PRIMARY' | 'SECONDARY'): CarerData {
    return {
      carer_level: level, relationship: '', title: '', first_name: '', surname: '',
      email: '', mobile_1: '', nationality: 'Kenyan',
      national_id: '', passport_number: '',
      occupation: '', employer: '', address: '',
    };
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
    this.familyBackground = { ...this.familyBackground, [field]: value };
    this.emitData();
  }

  addSibling(): void {
    this.siblings.push({ full_name: '', year_of_admission: new Date().getFullYear(), class_name: '', relationship: '' });
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
      family_background: this.familyBackground,
      siblings: this.siblings,
    });
    this.validate();
  }

  private validate(): void {
    const primary = this.carers.find(c => c.carer_level === 'PRIMARY');
    const valid = !!primary?.first_name && !!primary?.surname && !!primary?.mobile_1 && !!primary?.relationship;
    this.validityChange.emit(valid);
  }
}
