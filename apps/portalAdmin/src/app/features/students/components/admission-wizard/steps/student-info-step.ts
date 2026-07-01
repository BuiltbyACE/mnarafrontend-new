import { Component, input, output, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { StudentsService } from '../../../services/students.service';

@Component({
  selector: 'app-student-info-step',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatFormFieldModule, MatInputModule,
    MatSelectModule,
  ],
  template: `
    <div class="step-container">
      <h2>Student Information</h2>
      <p class="step-description">Enter the student's personal details</p>

      <div class="form-row">
        <div class="field-group">
          <label>First Name *</label>
          <input [ngModel]="current.first_name" (ngModelChange)="update('first_name', $event)"
                 placeholder="Enter first name" required>
        </div>
        <div class="field-group">
          <label>Last Name *</label>
          <input [ngModel]="current.last_name" (ngModelChange)="update('last_name', $event)"
                 placeholder="Enter last name" required>
        </div>
      </div>

      <div class="form-row">
        <div class="field-group">
          <label>Email (optional)</label>
          <input [ngModel]="current.email" (ngModelChange)="update('email', $event)"
                 type="email" placeholder="e.g. student@example.com">
        </div>
        <div class="field-group">
          <label>Admission Number (optional)</label>
          <input [ngModel]="current.school_id" (ngModelChange)="update('school_id', $event.toUpperCase())"
                 placeholder="e.g. STU-001 — auto-generated if blank"
                 (input)="current.school_id = $any($event.target).value.toUpperCase()">
        </div>
      </div>

      <div class="form-row">
        <div class="field-group">
          <label>Middle Name</label>
          <input [ngModel]="current.middle_name" (ngModelChange)="update('middle_name', $event)"
                 placeholder="Enter middle name">
        </div>
        <div class="field-group">
          <label>Other Names</label>
          <input [ngModel]="current.other_names" (ngModelChange)="update('other_names', $event)"
                 placeholder="e.g. Aliases, nicknames">
        </div>
      </div>

      <div class="form-row">
        <div class="field-group">
          <label>Date of Birth *</label>
          <input [ngModel]="current.date_of_birth" (ngModelChange)="update('date_of_birth', $event)"
                 type="date" required>
        </div>
        <div class="field-group">
          <label>Gender *</label>
          <select [ngModel]="current.gender" (ngModelChange)="update('gender', $event)" required>
            <option value="">Select gender</option>
            @for (g of genderChoices(); track g.value) {
              <option [value]="g.value">{{ g.label }}</option>
            }
            @if (genderChoices().length === 0) {
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            }
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="field-group">
          <label>Religion</label>
          <input [ngModel]="current.religion" (ngModelChange)="update('religion', $event)"
                 placeholder="Enter religion">
        </div>
        <div class="field-group">
          <label>Nationality *</label>
          <input [ngModel]="current.nationality" (ngModelChange)="update('nationality', $event)"
                 placeholder="Enter nationality" required>
        </div>
      </div>

      <div class="form-row">
        <div class="field-group">
          <label>Mother Tongue</label>
          <input [ngModel]="current.mother_tongue" (ngModelChange)="update('mother_tongue', $event)"
                 placeholder="e.g. Swahili, English">
        </div>
        <div class="field-group">
          <label>Residence</label>
          <input [ngModel]="current.residence" (ngModelChange)="update('residence', $event)"
                 placeholder="Enter residence area">
        </div>
      </div>

      <div class="form-row">
        <div class="field-group full-width">
          <label>Home Address</label>
          <input [ngModel]="current.home_address" (ngModelChange)="update('home_address', $event)"
                 placeholder="Enter full home address">
        </div>
      </div>

      <div class="form-row">
        <div class="field-group">
          <label>Emergency Contact Email <span class="lookup-hint">(Auto-fills on match)</span></label>
          <div class="email-input-wrap">
            <input type="email" [ngModel]="current.emergency_contact_email"
                   (ngModelChange)="onEmergencyEmailChange($event)"
                   placeholder="e.g. parent@example.com">
            @if (isLookingUp()) {
              <span class="lookup-spinner">⟳</span>
            }
          </div>
        </div>
        <div class="field-group">
          <label>Emergency Contact Phone</label>
          <input [ngModel]="current.emergency_contact_phone" (ngModelChange)="update('emergency_contact_phone', $event)"
                 placeholder="e.g. +254 712 345 678">
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
    input, select { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; background: white; }
    input:focus, select:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }
    .lookup-hint { font-weight: 400; color: #3b82f6; font-size: 11px; }
    .email-input-wrap { display: flex; align-items: center; gap: 6px; }
    .email-input-wrap input { flex: 1; }
    .lookup-spinner { color: #3b82f6; font-size: 18px; animation: spin 0.8s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }
  `]
})
export class StudentInfoStep {
  data = input.required<{
    first_name: string; last_name: string; date_of_birth: string; email: string;
    school_id: string;
    gender: string;
    religion: string; nationality: string; residence: string;
    middle_name: string; other_names: string; mother_tongue: string;
    resident: string; home_address: string;
    emergency_contact_email: string; emergency_contact_phone: string;
  }>();
  genderChoices = input<{ value: string; label: string }[]>([]);
  dataChange = output<any>();
  validityChange = output<boolean>();
  carerFound = output<any>();

  private studentsService = inject(StudentsService);
  isLookingUp = signal(false);

  private emailSubject = new Subject<string>();

  current = {
    first_name: '', last_name: '', date_of_birth: '', email: '',
    school_id: '',
    gender: '',
    religion: '', nationality: '', residence: '',
    middle_name: '', other_names: '', mother_tongue: '',
    resident: '', home_address: '',
    emergency_contact_email: '', emergency_contact_phone: '',
  };

  constructor() {
    effect(() => {
      const d = this.data();
      this.current = { ...d };
      this.validate();
    });

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
          this.carerFound.emit(res);
        }
      },
      error: () => {
        this.isLookingUp.set(false);
      },
    });
  }

  update(field: string, value: any): void {
    (this.current as any)[field] = value;
    this.dataChange.emit({ ...this.current });
    this.validate();
  }

  onEmergencyEmailChange(value: string): void {
    this.update('emergency_contact_email', value);
    this.emailSubject.next(value);
  }

  private validate(): void {
    const valid = !!this.current.first_name && !!this.current.last_name && !!this.current.date_of_birth && !!this.current.gender;
    this.validityChange.emit(valid);
  }
}
