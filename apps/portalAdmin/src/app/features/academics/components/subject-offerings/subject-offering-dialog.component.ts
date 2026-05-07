import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
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
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.isEdit ? 'Edit' : 'Add' }} Subject Offering</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Subject</mat-label>
          <mat-select formControlName="subject">
            <mat-option value="">Select Subject</mat-option>
            @for (subj of subjects; track subj.id) {
              <mat-option [value]="subj.id">{{ subj.name }}</mat-option>
            }
          </mat-select>
          @if (form.get('subject')?.hasError('required')) {
            <mat-error>Subject is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Year Level</mat-label>
          <mat-select formControlName="year_level">
            <mat-option value="">Select Year Level</mat-option>
            @for (yl of yearLevels; track yl.id) {
              <mat-option [value]="yl.id">{{ yl.name }}</mat-option>
            }
          </mat-select>
          @if (form.get('year_level')?.hasError('required')) {
            <mat-error>Year Level is required</mat-error>
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

    .full-width {
      width: 100%;
    }

    mat-form-field {
      margin-bottom: 0;
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
      is_active: [true],
    });
  }

  ngOnInit(): void {
    this.subjects = this.service.subjects();
    this.yearLevels = this.service.yearLevels();
    
    if (this.data.isEdit && this.data.offering) {
      this.form.patchValue({
        subject: this.data.offering.subject.id,
        year_level: this.data.offering.year_level.id,
        is_active: this.data.offering.is_active,
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
