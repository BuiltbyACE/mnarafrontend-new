import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
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
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.isEdit ? 'Edit' : 'Add' }} Year Level</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <div class="form-field">
          <label for="name">Name</label>
          <input id="name" formControlName="name" placeholder="e.g., Year 1" />
          @if (form.get('name')?.hasError('required')) {
            <span class="error-text">Name is required</span>
          }
        </div>

        <div class="form-field">
          <label for="key_stage">Key Stage</label>
          <select id="key_stage" formControlName="key_stage">
            <option value="">Select Key Stage</option>
            @for (ks of keyStages; track ks.id) {
              <option [ngValue]="ks.id">{{ ks.name }}</option>
            }
          </select>
          @if (form.get('key_stage')?.hasError('required')) {
            <span class="error-text">Key Stage is required</span>
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
