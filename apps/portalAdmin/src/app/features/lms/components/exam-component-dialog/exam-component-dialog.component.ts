import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
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
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.isEdit ? 'Edit' : 'Add' }} Exam Component</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g., Mathematics Paper 1" />
          @if (form.get('name')?.hasError('required')) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Exam Series</mat-label>
          <mat-select formControlName="exam_series">
            <mat-option value="">Select Series</mat-option>
            @for (series of seriesList; track series.id) {
              <mat-option [value]="series.id">{{ series.name }}</mat-option>
            }
          </mat-select>
          @if (form.get('exam_series')?.hasError('required')) {
            <mat-error>Exam series is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Max Score</mat-label>
          <input matInput type="number" formControlName="max_score" placeholder="e.g., 100" />
          @if (form.get('max_score')?.hasError('required')) {
            <mat-error>Max score is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Weight (%)</mat-label>
          <input matInput type="number" formControlName="weight" placeholder="e.g., 50" />
          @if (form.get('weight')?.hasError('required')) {
            <mat-error>Weight is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Component Type</mat-label>
          <mat-select formControlName="component_type">
            <mat-option value="THEORY">Theory</mat-option>
            <mat-option value="PRACTICAL">Practical</mat-option>
            <mat-option value="ORAL">Oral</mat-option>
            <mat-option value="PROJECT">Project</mat-option>
          </mat-select>
          @if (form.get('component_type')?.hasError('required')) {
            <mat-error>Component type is required</mat-error>
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
