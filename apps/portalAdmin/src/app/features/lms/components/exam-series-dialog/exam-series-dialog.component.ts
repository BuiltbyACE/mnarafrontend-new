import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
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
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.isEdit ? 'Edit' : 'Add' }} Exam Series</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g., End of Term Exam" />
          @if (form.get('name')?.hasError('required')) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Academic Term</mat-label>
          <mat-select formControlName="academic_term">
            <mat-option value="">Select Term</mat-option>
            @for (term of terms; track term.id) {
              <mat-option [value]="term.id">{{ term.name }}</mat-option>
            }
          </mat-select>
          @if (form.get('academic_term')?.hasError('required')) {
            <mat-error>Term is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Exam Type</mat-label>
          <mat-select formControlName="exam_type">
            <mat-option value="MID_TERM">Mid Term</mat-option>
            <mat-option value="END_TERM">End Term</mat-option>
            <mat-option value="MOCK">Mock</mat-option>
            <mat-option value="QUIZ">Quiz</mat-option>
          </mat-select>
          @if (form.get('exam_type')?.hasError('required')) {
            <mat-error>Exam type is required</mat-error>
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
          <mat-label>Grading Scale</mat-label>
          <input matInput formControlName="grading_scale" placeholder="e.g., A-F" />
          @if (form.get('grading_scale')?.hasError('required')) {
            <mat-error>Grading scale is required</mat-error>
          }
        </mat-form-field>
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
