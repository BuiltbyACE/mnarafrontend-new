import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ExaminationsService, ExamSeries } from '../../services/examinations.service';
import { SchedulingService } from '../../services/scheduling.service';

export interface ExamSeriesDialogData {
  isEdit: boolean;
  series?: ExamSeries;
}

@Component({
  selector: 'app-exam-series-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.isEdit ? 'Edit' : 'Add' }} Exam Series</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <div class="form-field">
          <label class="input-label">Name</label>
          <input formControlName="name" placeholder="e.g., End of Term Exam" />
          @if (form.get('name')?.hasError('required')) {
            <span class="error-text">Name is required</span>
          }
        </div>

        <div class="form-field">
          <label class="input-label">Academic Term</label>
          <select formControlName="academic_term">
            <option value="">Select Term</option>
            @for (term of terms; track term.id) {
              <option [value]="term.id">{{ term.name }}</option>
            }
          </select>
          @if (form.get('academic_term')?.hasError('required')) {
            <span class="error-text">Term is required</span>
          }
        </div>

        <div class="form-field">
          <label class="input-label">Exam Type</label>
          <select formControlName="exam_type">
            <option value="MID_TERM">Mid Term</option>
            <option value="END_TERM">End Term</option>
            <option value="MOCK">Mock</option>
            <option value="QUIZ">Quiz</option>
          </select>
          @if (form.get('exam_type')?.hasError('required')) {
            <span class="error-text">Exam type is required</span>
          }
        </div>

        <div class="form-field">
          <label class="input-label">Start Date</label>
          <input type="date" formControlName="start_date" />
          @if (form.get('start_date')?.hasError('required')) {
            <span class="error-text">Start date is required</span>
          }
        </div>

        <div class="form-field">
          <label class="input-label">End Date</label>
          <input type="date" formControlName="end_date" />
          @if (form.get('end_date')?.hasError('required')) {
            <span class="error-text">End date is required</span>
          }
        </div>

        <div class="form-field">
          <label class="input-label">Grading Scale</label>
          <input formControlName="grading_scale" placeholder="e.g., A-F" />
          @if (form.get('grading_scale')?.hasError('required')) {
            <span class="error-text">Grading scale is required</span>
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
export class ExamSeriesDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ExamSeriesDialogComponent>);
  readonly data = inject<ExamSeriesDialogData>(MAT_DIALOG_DATA);
  private schedulingService = inject(SchedulingService);

  terms: { id: number; name: string }[] = [];
  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      academic_term: ['', Validators.required],
      exam_type: ['', Validators.required],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      grading_scale: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.schedulingService.getAcademicTerms().subscribe(terms => {
      this.terms = terms;
    });
    if (this.data.isEdit && this.data.series) {
      this.form.patchValue({
        name: this.data.series.name,
        academic_term: this.data.series.academic_term.id,
        exam_type: this.data.series.exam_type,
        start_date: this.data.series.start_date,
        end_date: this.data.series.end_date,
        grading_scale: this.data.series.grading_scale,
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
