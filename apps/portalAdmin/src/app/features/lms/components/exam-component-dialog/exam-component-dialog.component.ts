import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ExaminationsService, ExamComponent } from '../../services/examinations.service';

export interface ExamComponentDialogData {
  isEdit: boolean;
  component?: ExamComponent;
}

@Component({
  selector: 'app-exam-component-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.isEdit ? 'Edit' : 'Add' }} Exam Component</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <div class="form-field">
          <label class="input-label">Name</label>
          <input formControlName="name" placeholder="e.g., Mathematics Paper 1" />
          @if (form.get('name')?.hasError('required')) {
            <span class="error-text">Name is required</span>
          }
        </div>

        <div class="form-field">
          <label class="input-label">Exam Series</label>
          <select formControlName="exam_series">
            <option value="">Select Series</option>
            @for (series of seriesList; track series.id) {
              <option [value]="series.id">{{ series.name }}</option>
            }
          </select>
          @if (form.get('exam_series')?.hasError('required')) {
            <span class="error-text">Exam series is required</span>
          }
        </div>

        <div class="form-field">
          <label class="input-label">Max Score</label>
          <input type="number" formControlName="max_score" placeholder="e.g., 100" />
          @if (form.get('max_score')?.hasError('required')) {
            <span class="error-text">Max score is required</span>
          }
        </div>

        <div class="form-field">
          <label class="input-label">Weight (%)</label>
          <input type="number" formControlName="weight" placeholder="e.g., 50" />
          @if (form.get('weight')?.hasError('required')) {
            <span class="error-text">Weight is required</span>
          }
        </div>

        <div class="form-field">
          <label class="input-label">Component Type</label>
          <select formControlName="component_type">
            <option value="THEORY">Theory</option>
            <option value="PRACTICAL">Practical</option>
            <option value="ORAL">Oral</option>
            <option value="PROJECT">Project</option>
          </select>
          @if (form.get('component_type')?.hasError('required')) {
            <span class="error-text">Component type is required</span>
          }
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="onSubmit()">
        {{ data.isEdit ? 'Update' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form { display: flex; flex-direction: column; gap: 16px; padding: 16px 0; min-width: 400px; }
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
export class ExamComponentDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ExamComponentDialogComponent>);
  readonly data = inject<ExamComponentDialogData>(MAT_DIALOG_DATA);
  private service = inject(ExaminationsService);

  seriesList: { id: number; name: string }[] = [];
  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      exam_series: ['', Validators.required],
      max_score: ['', Validators.required],
      weight: ['', Validators.required],
      component_type: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.seriesList = this.service.examSeries();
    if (this.data.isEdit && this.data.component) {
      this.form.patchValue({
        name: this.data.component.name,
        exam_series: this.data.component.exam_series.id,
        max_score: this.data.component.max_score,
        weight: this.data.component.weight,
        component_type: this.data.component.component_type,
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
