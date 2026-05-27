import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ExaminationsService, ReportCard } from '../../services/examinations.service';
import { SchedulingService } from '../../services/scheduling.service';

export interface ReportCardDialogData {
  isEdit: boolean;
  card?: ReportCard;
}

@Component({
  selector: 'app-report-card-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.isEdit ? 'Edit' : 'Add' }} Report Card</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
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
          <label class="input-label">Total Score</label>
          <input type="number" formControlName="total_score" placeholder="e.g., 450" />
          @if (form.get('total_score')?.hasError('required')) {
            <span class="error-text">Total score is required</span>
          }
        </div>

        <div class="form-field">
          <label class="input-label">Average</label>
          <input type="number" formControlName="average" placeholder="e.g., 75" />
          @if (form.get('average')?.hasError('required')) {
            <span class="error-text">Average is required</span>
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
          <label class="input-label">Rank</label>
          <input type="number" formControlName="rank" placeholder="e.g., 1" />
          @if (form.get('rank')?.hasError('required')) {
            <span class="error-text">Rank is required</span>
          }
        </div>

        <div class="form-field">
          <label class="input-label">Status</label>
          <select formControlName="status">
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="WITHHELD">Withheld</option>
          </select>
          @if (form.get('status')?.hasError('required')) {
            <span class="error-text">Status is required</span>
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
export class ReportCardDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ReportCardDialogComponent>);
  readonly data = inject<ReportCardDialogData>(MAT_DIALOG_DATA);
  private schedulingService = inject(SchedulingService);

  terms: { id: number; name: string }[] = [];
  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      academic_term: ['', Validators.required],
      total_score: ['', Validators.required],
      average: ['', Validators.required],
      grade: ['', Validators.required],
      rank: ['', Validators.required],
      status: ['DRAFT', Validators.required],
    });
  }

  ngOnInit(): void {
    this.schedulingService.getAcademicTerms().subscribe(terms => {
      this.terms = terms;
    });
    if (this.data.isEdit && this.data.card) {
      this.form.patchValue({
        academic_term: this.data.card.academic_term.id,
        total_score: this.data.card.total_score,
        average: this.data.card.average,
        grade: this.data.card.grade,
        rank: this.data.card.rank,
        status: this.data.card.status,
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
