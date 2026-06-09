import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { getApiUrl } from '@sms/core/config';
import { Department } from '../../services/academics.service';

interface StaffProfileSelect {
  id: number;
  full_name: string;
}

export interface DepartmentDialogData {
  isEdit: boolean;
  department?: Department;
}

@Component({
  selector: 'app-department-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.isEdit ? 'Edit' : 'Create' }} Department</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <div class="form-field">
          <label for="name">Department Name</label>
          <input id="name" formControlName="name" placeholder="e.g., Science Department" />
          @if (form.get('name')?.hasError('required')) {
            <span class="error-text">Name is required</span>
          }
        </div>

        <div class="form-field">
          <label for="code">Code</label>
          <input id="code" formControlName="code" placeholder="e.g., SCI" />
          @if (form.get('code')?.hasError('required')) {
            <span class="error-text">Code is required</span>
          }
        </div>

        <div class="form-field">
          <label for="hod">Head of Department</label>
          <select id="hod" formControlName="head_of_department">
            <option [ngValue]="null">Not assigned</option>
            @if (loadingProfiles) {
              <option disabled>Loading staff…</option>
            } @else if (profilesError) {
              <option disabled>Could not load staff list</option>
            }
            @for (p of staffProfiles; track p.id) {
              <option [ngValue]="p.id">{{ p.full_name }}</option>
            }
          </select>
          @if (profilesError) {
            <span class="error-text">{{ profilesError }}</span>
          }
        </div>

        <div class="form-field">
          <label for="is_active">Status</label>
          <select id="is_active" formControlName="is_active">
            <option [ngValue]="true">Active</option>
            <option [ngValue]="false">Inactive</option>
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
    .form-field { display: flex; flex-direction: column; gap: 4px; }
    .form-field label { font-size: 14px; font-weight: 500; color: #374151; }
    .form-field input,
    .form-field select {
      width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px;
      font-size: 14px; color: #1f2937; background: #fff; transition: border-color 0.15s; box-sizing: border-box;
    }
    .form-field input:focus,
    .form-field select:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.2); }
    .form-field input.ng-invalid.ng-touched,
    .form-field select.ng-invalid.ng-touched { border-color: #ef4444; }
    .error-text { font-size: 12px; color: #ef4444; }
    .hint-text { font-size: 12px; color: #6b7280; }

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
  `],
})
export class DepartmentDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<DepartmentDialogComponent>);
  private http = inject(HttpClient);
  data = inject<DepartmentDialogData>(MAT_DIALOG_DATA);

  staffProfiles: StaffProfileSelect[] = [];
  loadingProfiles = false;
  profilesError = '';
  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      code: ['', Validators.required],
      head_of_department: [null],
      is_active: [true],
    });
  }

  ngOnInit(): void {
    this.loadStaffProfiles();
    if (this.data.isEdit && this.data.department) {
      this.form.patchValue({
        name: this.data.department.name,
        code: this.data.department.code,
        head_of_department: this.data.department.head_of_department?.id ?? null,
        is_active: this.data.department.is_active ?? true,
      });
    }
  }

  private loadStaffProfiles(): void {
    this.loadingProfiles = true;
    this.http.get<StaffProfileSelect[]>(getApiUrl('/staff/profiles/select/')).subscribe({
      next: (profiles) => {
        this.staffProfiles = profiles;
        this.loadingProfiles = false;
      },
      error: (err) => {
        this.staffProfiles = [];
        this.profilesError = err.status === 404
          ? 'Staff profiles endpoint not available. Contact IT.'
          : 'Failed to load staff list.';
        this.loadingProfiles = false;
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.form.valid) {
      const v = this.form.value;
      this.dialogRef.close({
        name: v.name,
        code: v.code,
        is_active: v.is_active,
        head_of_department: v.head_of_department ?? null,
      });
    }
  }
}
