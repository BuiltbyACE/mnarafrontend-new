import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
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
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.isEdit ? 'Edit' : 'Add' }} Report Card</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
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
          <mat-label>Total Score</mat-label>
          <input matInput type="number" formControlName="total_score" placeholder="e.g., 450" />
          @if (form.get('total_score')?.hasError('required')) {
            <mat-error>Total score is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Average</mat-label>
          <input matInput type="number" formControlName="average" placeholder="e.g., 75" />
          @if (form.get('average')?.hasError('required')) {
            <mat-error>Average is required</mat-error>
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
          <mat-label>Rank</mat-label>
          <input matInput type="number" formControlName="rank" placeholder="e.g., 1" />
          @if (form.get('rank')?.hasError('required')) {
            <mat-error>Rank is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Status</mat-label>
          <mat-select formControlName="status">
            <mat-option value="DRAFT">Draft</mat-option>
            <mat-option value="PUBLISHED">Published</mat-option>
            <mat-option value="WITHHELD">Withheld</mat-option>
          </mat-select>
          @if (form.get('status')?.hasError('required')) {
            <mat-error>Status is required</mat-error>
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
