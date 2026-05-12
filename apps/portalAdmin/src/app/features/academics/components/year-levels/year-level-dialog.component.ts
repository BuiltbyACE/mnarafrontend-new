import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { AcademicsService, YearLevel } from '../../services/academics.service';

export interface YearLevelDialogData {
  isEdit: boolean;
  yearLevel?: YearLevel;
}

@Component({
  selector: 'app-year-level-dialog',
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
    <h2 mat-dialog-title>{{ data.isEdit ? 'Edit' : 'Add' }} Year Level</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g., Year 1" />
          @if (form.get('name')?.hasError('required')) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Key Stage</mat-label>
          <select matNativeControl formControlName="key_stage" class="native-select">
            <option value="">Select Key Stage</option>
            @for (ks of keyStages; track ks.id) {
              <option [value]="ks.id">{{ ks.name }}</option>
            }
          </select>
          @if (form.get('key_stage')?.hasError('required')) {
            <mat-error>Key Stage is required</mat-error>
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

    .native-select {
      width: 100%;
      padding: 12px;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      font-size: 0.875rem;
      color: #334155;
      background: white;
      margin-top: 8px;
    }
  `],
})
export class YearLevelDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<YearLevelDialogComponent>);
  private service = inject(AcademicsService);
  data = inject<YearLevelDialogData>(MAT_DIALOG_DATA);

  keyStages: { id: number; name: string }[] = [];

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      key_stage: ['', Validators.required],
      is_active: [true],
    });
  }

  ngOnInit(): void {
    this.keyStages = this.service.keyStages();
    
    if (this.data.isEdit && this.data.yearLevel) {
      const ksId = typeof this.data.yearLevel.key_stage === 'object'
        ? this.data.yearLevel.key_stage.id
        : this.data.yearLevel.key_stage;
      this.form.patchValue({
        name: this.data.yearLevel.name,
        key_stage: ksId,
        is_active: this.data.yearLevel.is_active,
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
