import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AcademicsService, Subject } from '../../services/academics.service';

export interface SubjectDialogData {
  isEdit: boolean;
  subject?: Subject;
}

@Component({
  selector: 'app-subject-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.isEdit ? 'Edit' : 'Add' }} Subject</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <div class="form-field">
          <label class="input-label">Subject Name</label>
          <input formControlName="name" placeholder="e.g., Mathematics" />
          @if (form.get('name')?.hasError('required')) {
            <span class="error-text">Name is required</span>
          }
        </div>

        <div class="form-field">
          <label class="input-label">Subject Code</label>
          <input formControlName="code" placeholder="e.g., MATH" />
          @if (form.get('code')?.hasError('required')) {
            <span class="error-text">Code is required</span>
          }
        </div>

        <div class="form-field">
          <label class="input-label">Department</label>
            <select formControlName="department">
            <option value="">Select Department</option>
            @if (service.isLoading()) {
              <option disabled>Loading departments…</option>
            }
            @for (dept of service.departments(); track dept.id) {
              <option [value]="dept.id">{{ dept.name }}</option>
            }
          </select>
          @if (form.get('department')?.hasError('required')) {
            <span class="error-text">Department is required</span>
          }
        </div>

        <div class="form-field">
          <label class="input-label">Status</label>
          <select formControlName="is_active">
            <option [value]="true">Active</option>
            <option [value]="false">Inactive</option>
          </select>
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

    .full-width {
      width: 100%;
    }

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
export class SubjectDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<SubjectDialogComponent>);
  protected service = inject(AcademicsService);
  data = inject<SubjectDialogData>(MAT_DIALOG_DATA);

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      code: ['', Validators.required],
      department: ['', Validators.required],
      is_active: [true],
    });
  }

  ngOnInit(): void {
    this.service.getDepartments().subscribe();

    if (this.data.isEdit && this.data.subject) {
      const deptId = typeof this.data.subject.department === 'object'
        ? this.data.subject.department.id
        : this.data.subject.department;
      this.form.patchValue({
        name: this.data.subject.name,
        code: this.data.subject.code,
        department: deptId,
        is_active: this.data.subject.is_active,
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
