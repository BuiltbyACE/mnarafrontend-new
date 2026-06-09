import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { SchedulingService, AcademicTerm } from '../../services/scheduling.service';

export interface TermDialogData {
  isEdit: boolean;
  term?: AcademicTerm;
}

@Component({
  selector: 'app-term-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.isEdit ? 'Edit' : 'Add' }} Term</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <div class="form-field">
          <label class="input-label">Term Name</label>
          <input formControlName="name" placeholder="e.g., Term 1" />
          @if (form.get('name')?.hasError('required')) {
            <span class="error-text">Name is required</span>
          }
        </div>

        <div class="form-field">
          <label class="input-label">Academic Year</label>
          <select formControlName="academic_year">
            <option value="">Select Year</option>
            @for (year of years; track year.id) {
              <option [value]="year.id">{{ year.name }}</option>
            }
          </select>
          @if (form.get('academic_year')?.hasError('required')) {
            <span class="error-text">Academic year is required</span>
          }
        </div>

        <div class="form-field">
          <label class="input-label">Start Date</label>
          <input type="date" formControlName="start_date" />
          @if (form.get('start_date')?.hasError('required')) {
            <span class="error-text">Start date is required</span>
          }
        </div>

        <div class="form-field">
          <label class="input-label">End Date</label>
          <input type="date" formControlName="end_date" />
          @if (form.get('end_date')?.hasError('required')) {
            <span class="error-text">End date is required</span>
          }
        </div>

      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-flat-button color="primary" 
              [disabled]="form.invalid" 
              (click)="onSubmit()">
        {{ data.isEdit ? 'Update' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px 0;
      min-width: 400px;
    }
    .full-width { width: 100%; }
    mat-form-field { margin-bottom: 0; }
    .form-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      width: 100%;
    }
    .form-field input,
    .form-field select,
    .form-field textarea {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      color: #1f2937;
      background: #fff;
      transition: border-color 0.15s;
      box-sizing: border-box;
      font-family: inherit;
    }
    .form-field input:focus,
    .form-field select:focus,
    .form-field textarea:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59,130,246,0.2);
    }
    .form-field select {
      cursor: pointer;
    }
    .input-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 2px;
    }
    .error-text {
      font-size: 0.75rem;
      color: #dc2626;
      margin-top: 4px;
    }
  `],
})
export class TermDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<TermDialogComponent>);
  readonly data = inject<TermDialogData>(MAT_DIALOG_DATA);
  
  years: { id: number; name: string }[] = [];

  form: FormGroup;

  private service = inject(SchedulingService);

  constructor() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      academic_year: ['', Validators.required],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.years = this.service.academicYears().map(y => ({ id: y.id, name: y.name }));
    if (this.years.length === 0) {
      this.service.getAcademicYears().subscribe(years => {
        this.years = years.map(y => ({ id: y.id, name: y.name }));
      });
    }
    
    if (this.data.isEdit && this.data.term) {
      this.form.patchValue({
        name: this.data.term.name,
        academic_year: this.data.term.academic_year,
        start_date: this.data.term.start_date,
        end_date: this.data.term.end_date,
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}
