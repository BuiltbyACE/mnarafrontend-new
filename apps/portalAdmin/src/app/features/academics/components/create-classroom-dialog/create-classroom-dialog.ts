/**
 * Create Classroom Dialog
 * POST /api/v1/academics/classrooms/ — flat FK IDs per v2.0 contract
 */

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AcademicsService } from '../../services/academics.service';
import { ClassroomWritePayload, YearLevel } from '../../../../shared/models/academics.models';

@Component({
  selector: 'app-create-classroom-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>Add Classroom</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Class Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g. Form 1A" />
          @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
            <mat-error>Class name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Year Level</mat-label>
          <mat-select formControlName="year_level">
            @if (loadingYearLevels) {
              <mat-option disabled>Loading year levels…</mat-option>
            }
            @for (yl of yearLevels; track yl.id) {
              <mat-option [value]="yl.id">{{ yl.name }}</mat-option>
            }
          </mat-select>
          @if (form.get('year_level')?.hasError('required') && form.get('year_level')?.touched) {
            <mat-error>Year level is required</mat-error>
          }
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Room Number</mat-label>
            <input matInput formControlName="room_number" placeholder="e.g. B12" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Capacity</mat-label>
            <input matInput formControlName="capacity" type="number" min="1" placeholder="e.g. 35" />
            @if (form.get('capacity')?.hasError('min')) {
              <mat-error>Capacity must be at least 1</mat-error>
            }
          </mat-form-field>
        </div>

        @if (errorMessage) {
          <div class="error-banner">
            <mat-icon>error_outline</mat-icon>
            <span>{{ errorMessage }}</span>
          </div>
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()" [disabled]="saving">Cancel</button>
      <button mat-raised-button color="primary" (click)="submit()" [disabled]="form.invalid || saving">
        @if (saving) {
          <mat-spinner diameter="18" style="display:inline-block; margin-right: 8px;"></mat-spinner>
        }
        Add Classroom
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form { display: flex; flex-direction: column; gap: 4px; min-width: 460px; padding-top: 8px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .full-width { width: 100%; }
    .error-banner { display: flex; align-items: center; gap: 8px; padding: 12px; background: #fee2e2; border-radius: 8px; color: #dc2626; font-size: 14px; }
    mat-dialog-actions { padding: 16px 24px; }
  `],
})
export class CreateClassroomDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private academicsService = inject(AcademicsService);
  private dialogRef = inject(MatDialogRef<CreateClassroomDialogComponent>);

  saving = false;
  loadingYearLevels = false;
  errorMessage = '';
  yearLevels: YearLevel[] = [];

  form = this.fb.group({
    name: ['', Validators.required],
    year_level: [null as number | null, Validators.required],
    room_number: [''],
    capacity: [30, [Validators.min(1)]],
  });

  ngOnInit(): void {
    this.loadingYearLevels = true;
    this.academicsService.getYearLevels().subscribe({
      next: (levels) => {
        this.yearLevels = levels.filter(l => l.is_active);
        this.loadingYearLevels = false;
      },
      error: () => {
        this.loadingYearLevels = false;
        this.errorMessage = 'Could not load year levels.';
      },
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving = true;
    this.errorMessage = '';

    const v = this.form.getRawValue();
    const payload: ClassroomWritePayload = {
      name: v.name ?? '',
      year_level: (v.year_level ?? undefined) as number | undefined,
      room_number: v.room_number ?? '',
      capacity: v.capacity ?? 30,
    };
    this.academicsService.createClassroom(payload).subscribe({
      next: () => this.dialogRef.close(true),
      error: (err) => {
        this.errorMessage = err.error?.detail || err.error?.name?.[0] || 'Failed to create classroom.';
        this.saving = false;
      },
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
