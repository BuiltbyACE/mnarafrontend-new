import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
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
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.isEdit ? 'Edit' : 'Add' }} Exam Result</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Exam Component</mat-label>
          <mat-select formControlName="exam_component">
            <mat-option value="">Select Component</mat-option>
            @for (comp of components; track comp.id) {
              <mat-option [value]="comp.id">{{ comp.name }}</mat-option>
            }
          </mat-select>
          @if (form.get('exam_component')?.hasError('required')) {
            <mat-error>Component is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Score</mat-label>
          <input matInput type="number" formControlName="score" placeholder="e.g., 85" />
          @if (form.get('score')?.hasError('required')) {
            <mat-error>Score is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Grade</mat-label>
          <mat-select formControlName="grade">
            <mat-option value="A">A</mat-option>
            <mat-option value="B">B</mat-option>
            <mat-option value="C">C</mat-option>
            <mat-option value="D">D</mat-option>
            <mat-option value="E">E</mat-option>
            <mat-option value="F">F</mat-option>
          </mat-select>
          @if (form.get('grade')?.hasError('required')) {
            <mat-error>Grade is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Remarks</mat-label>
          <input matInput formControlName="remarks" placeholder="Optional remarks" />
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
