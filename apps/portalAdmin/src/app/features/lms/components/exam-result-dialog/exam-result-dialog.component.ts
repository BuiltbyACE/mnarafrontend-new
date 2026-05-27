import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ExaminationsService, ExamResult } from '../../services/examinations.service';

export interface ExamResultDialogData {
  isEdit: boolean;
  result?: ExamResult;
}

@Component({
  selector: 'app-exam-result-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.isEdit ? 'Edit' : 'Add' }} Exam Result</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <div class="form-field">
          <label class="input-label">Exam Component</label>
          <select formControlName="exam_component">
            <option value="">Select Component</option>
            @for (comp of components; track comp.id) {
              <option [value]="comp.id">{{ comp.name }}</option>
            }
          </select>
          @if (form.get('exam_component')?.hasError('required')) {
            <span class="error-text">Component is required</span>
          }
        </div>

        <div class="form-field">
          <label class="input-label">Score</label>
          <input type="number" formControlName="score" placeholder="e.g., 85" />
          @if (form.get('score')?.hasError('required')) {
            <span class="error-text">Score is required</span>
          }
        </div>

        <div class="form-field">
          <label class="input-label">Grade</label>
          <select formControlName="grade">
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
            <option value="E">E</option>
            <option value="F">F</option>
          </select>
          @if (form.get('grade')?.hasError('required')) {
            <span class="error-text">Grade is required</span>
          }
        </div>

        <div class="form-field">
          <label class="input-label">Remarks</label>
          <input formControlName="remarks" placeholder="Optional remarks" />
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
export class ExamResultDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ExamResultDialogComponent>);
  readonly data = inject<ExamResultDialogData>(MAT_DIALOG_DATA);
  private service = inject(ExaminationsService);

  components: { id: number; name: string }[] = [];
  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      exam_component: ['', Validators.required],
      score: ['', Validators.required],
      grade: ['', Validators.required],
      remarks: [''],
    });
  }

  ngOnInit(): void {
    this.components = this.service.examComponents();
    if (this.data.isEdit && this.data.result) {
      this.form.patchValue({
        exam_component: this.data.result.exam_component.id,
        score: this.data.result.score,
        grade: this.data.result.grade,
        remarks: this.data.result.remarks,
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
