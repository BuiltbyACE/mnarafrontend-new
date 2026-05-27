import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { AcademicsService, SubjectOffering } from '../../services/academics.service';

export interface SubjectOfferingDialogData {
  isEdit: boolean;
  offering?: SubjectOffering;
}

@Component({
  selector: 'app-subject-offering-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.isEdit ? 'Edit' : 'Add' }} Subject Offering</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <div class="form-field">
          <label for="subject">Subject</label>
          <select id="subject" formControlName="subject">
            <option value="">Select Subject</option>
            @for (subj of subjects; track subj.id) {
              <option [ngValue]="subj.id">{{ subj.name }}</option>
            }
          </select>
          @if (form.get('subject')?.hasError('required')) {
            <span class="error-text">Subject is required</span>
          }
        </div>

        <div class="form-field">
          <label for="year_level">Year Level</label>
          <select id="year_level" formControlName="year_level">
            <option value="">Select Year Level</option>
            @for (yl of yearLevels; track yl.id) {
              <option [ngValue]="yl.id">{{ yl.name }}</option>
            }
          </select>
          @if (form.get('year_level')?.hasError('required')) {
            <span class="error-text">Year Level is required</span>
          }
        </div>

        <div class="form-field">
          <label for="credit_hours">Credit Hours</label>
          <input id="credit_hours" formControlName="credit_hours" placeholder="e.g. 4.0" />
        </div>

        <div class="form-field">
          <label for="teacher_name">Teacher</label>
          <input id="teacher_name" formControlName="teacher_name" placeholder="Assign teacher" />
        </div>

        <div class="form-field">
          <label for="is_compulsory">Type</label>
          <select id="is_compulsory" formControlName="is_compulsory">
            <option [ngValue]="true">Core (Compulsory)</option>
            <option [ngValue]="false">Elective</option>
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
export class SubjectOfferingDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<SubjectOfferingDialogComponent>);
  private service = inject(AcademicsService);
  data = inject<SubjectOfferingDialogData>(MAT_DIALOG_DATA);

  subjects: { id: number; name: string }[] = [];
  yearLevels: { id: number; name: string }[] = [];

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      subject: ['', Validators.required],
      year_level: ['', Validators.required],
      credit_hours: [''],
      teacher_name: [''],
      is_compulsory: [true],
    });
  }

  ngOnInit(): void {
    this.subjects = this.service.subjects();
    this.yearLevels = this.service.yearLevels();
    
    if (this.data.isEdit && this.data.offering) {
      this.form.patchValue({
        subject: this.data.offering.subject,
        year_level: this.data.offering.year_level,
        credit_hours: this.data.offering.credit_hours,
        teacher_name: this.data.offering.teacher_name,
        is_compulsory: this.data.offering.is_compulsory,
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
