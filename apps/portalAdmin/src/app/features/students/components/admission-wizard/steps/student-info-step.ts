import { Component, input, output, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { Gender } from '../../../../../shared/models/students.models';

@Component({
  selector: 'app-student-info-step',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule, FormsModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonToggleModule, MatDatepickerModule, MatNativeDateModule,
  ],
  template: `
    <div class="step-container">
      <h2>Student Information</h2>
      <p class="step-description">Enter the student's personal details</p>

      <div class="form-row">
        <div class="field-group">
          <label>First Name *</label>
          <input matInput [ngModel]="data().first_name" (ngModelChange)="update('first_name', $event)"
                 placeholder="Enter first name" required>
        </div>
        <div class="field-group">
          <label>Last Name *</label>
          <input matInput [ngModel]="data().last_name" (ngModelChange)="update('last_name', $event)"
                 placeholder="Enter last name" required>
        </div>
      </div>

      <div class="form-row">
        <div class="field-group">
          <label>Date of Birth *</label>
          <input matInput [ngModel]="data().date_of_birth" (ngModelChange)="update('date_of_birth', $event)"
                 type="date" required>
        </div>
        <div class="field-group">
          <label>Gender *</label>
          <mat-button-toggle-group [ngModel]="data().gender" (ngModelChange)="update('gender', $event)">
            <mat-button-toggle value="M">Male</mat-button-toggle>
            <mat-button-toggle value="F">Female</mat-button-toggle>
            <mat-button-toggle value="O">Other</mat-button-toggle>
          </mat-button-toggle-group>
        </div>
      </div>

      <div class="form-row">
        <div class="field-group">
          <label>Religion</label>
          <input matInput [ngModel]="data().religion" (ngModelChange)="update('religion', $event)"
                 placeholder="Enter religion">
        </div>
        <div class="field-group">
          <label>Nationality *</label>
          <input matInput [ngModel]="data().nationality" (ngModelChange)="update('nationality', $event)"
                 placeholder="Enter nationality" required>
        </div>
      </div>

      <div class="form-row">
        <div class="field-group full-width">
          <label>Residence</label>
          <input matInput [ngModel]="data().residence" (ngModelChange)="update('residence', $event)"
                 placeholder="Enter residence address">
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
    input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }
    mat-button-toggle-group { border: 1px solid #d1d5db; border-radius: 8px; }
  `]
})
export class StudentInfoStep {
  data = input.required<{ first_name: string; last_name: string; date_of_birth: string; gender: Gender; religion: string; nationality: string; residence: string }>();
  dataChange = output<any>();
  validityChange = output<boolean>();

  private current = { first_name: '', last_name: '', date_of_birth: '', gender: '' as Gender, religion: '', nationality: '', residence: '' };

  constructor() {
    effect(() => {
      const d = this.data();
      this.current = { ...d };
      this.validate();
    });
  }

  update(field: string, value: any): void {
    (this.current as any)[field] = value;
    this.dataChange.emit({ ...this.current });
    this.validate();
  }

  private validate(): void {
    const valid = !!this.current.first_name && !!this.current.last_name && !!this.current.date_of_birth && !!this.current.gender && !!this.current.nationality;
    this.validityChange.emit(valid);
  }
}
