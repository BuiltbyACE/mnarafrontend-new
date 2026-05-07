import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
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
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.isEdit ? 'Edit' : 'Add' }} Term</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Term Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g., Term 1" />
          @if (form.get('name')?.hasError('required')) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Academic Year</mat-label>
          <mat-select formControlName="academic_year">
            <mat-option value="">Select Year</mat-option>
            @for (year of years; track year.id) {
              <mat-option [value]="year.id">{{ year.name }}</mat-option>
            }
          </mat-select>
          @if (form.get('academic_year')?.hasError('required')) {
            <mat-error>Academic year is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Start Date</mat-label>
          <input matInput type="date" formControlName="start_date" />
          @if (form.get('start_date')?.hasError('required')) {
            <mat-error>Start date is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>End Date</mat-label>
          <input matInput type="date" formControlName="end_date" />
          @if (form.get('end_date')?.hasError('required')) {
            <mat-error>End date is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
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
    .full-width { width: 100%; }
    mat-form-field { margin-bottom: 0; }
  `],
})
export class TermDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<TermDialogComponent>);
  readonly data = inject<TermDialogData>(MAT_DIALOG_DATA);
  
  years: { id: number; name: string }[] = [];

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      academic_year: ['', Validators.required],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      is_active: [true],
    });
  }

  ngOnInit(): void {
    this.years = this.data.isEdit && this.data.term 
      ? [{ id: this.data.term.academic_year.id, name: this.data.term.academic_year.name }]
      : [];
    
    if (this.data.isEdit && this.data.term) {
      this.form.patchValue({
        name: this.data.term.name,
        academic_year: this.data.term.academic_year.id,
        start_date: this.data.term.start_date,
        end_date: this.data.term.end_date,
        is_active: this.data.term.is_active,
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
