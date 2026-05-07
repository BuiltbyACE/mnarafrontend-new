import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { SchedulingService, AcademicYear } from '../../services/scheduling.service';

export interface AcademicYearDialogData {
  isEdit: boolean;
  year?: AcademicYear;
}

@Component({
  selector: 'app-academic-year-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.isEdit ? 'Edit' : 'Add' }} Academic Year</h2>
    <mat-dialog-content>
      <form [formGroup]="form" className="dialog-form">
        <mat-form-field appearance="outline" className="full-width">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g., 2025/2026" />
          @if (form.get('name')?.hasError('required')) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" className="full-width">
          <mat-label>Start Date</mat-label>
          <input matInput type="date" formControlName="start_date" />
          @if (form.get('start_date')?.hasError('required')) {
            <mat-error>Start date is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" className="full-width">
          <mat-label>End Date</mat-label>
          <input matInput type="date" formControlName="end_date" />
          @if (form.get('end_date')?.hasError('required')) {
            <mat-error>End date is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" className="full-width">
          <mat-label>Status</mat-label>
          <mat-select formControlName="is_active">
            <mat-option [value]="true">Active</mat-option>
            <mat-option [value]="false">Inactive</mat-option>
          </mat-select>
        </mat-form-field>
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

    mat-form-field {
      margin-bottom: 0;
    }
  `],
})
export class AcademicYearDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<AcademicYearDialogComponent>);
  readonly data = inject<AcademicYearDialogData>(MAT_DIALOG_DATA);

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      is_active: [true],
    });
  }

  ngOnInit(): void {
    if (this.data.isEdit && this.data.year) {
      this.form.patchValue({
        name: this.data.year.name,
        start_date: this.data.year.start_date,
        end_date: this.data.year.end_date,
        is_active: this.data.year.is_active,
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
