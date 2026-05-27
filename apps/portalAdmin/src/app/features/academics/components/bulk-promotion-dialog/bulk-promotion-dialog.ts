/**
 * Bulk Promotion Dialog Component
 * End-of-year student promotion workflow
 */

import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { YearLevel } from '../../../../shared/models/academics.models';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AcademicsService } from '../../services/academics.service';

@Component({
  selector: 'app-bulk-promotion-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>
        <mat-icon>upgrade</mat-icon>
        Bulk Student Promotion
      </h2>

      <mat-dialog-content>
        <p class="dialog-description">
          Promote students from one year level to the next. This action will update all selected students' 
          classroom assignments for the new academic year.
        </p>

        <div class="form-fields">
          <!-- Source Year Level -->
          <div class="form-field">
            <label for="sourceYearLevel">Source Year Level</label>
            <select id="sourceYearLevel" [ngModel]="sourceYearLevel()" (ngModelChange)="sourceYearLevel.set($event)" required>
              @for (year of yearLevels(); track year.id) {
                <option [ngValue]="year.id">{{ year.name }}</option>
              }
            </select>
            <span class="hint-text">Current year level of students</span>
          </div>

          <!-- Target Year Level -->
          <div class="form-field">
            <label for="targetYearLevel">Target Year Level</label>
            <select id="targetYearLevel" [ngModel]="targetYearLevel()" (ngModelChange)="targetYearLevel.set($event)" required>
              @for (year of yearLevels(); track year.id) {
                <option [ngValue]="year.id" [disabled]="year.id === sourceYearLevel()">
                  {{ year.name }}
                </option>
              }
            </select>
            <span class="hint-text">Year level to promote to</span>
          </div>

          <!-- Academic Year -->
          <div class="form-field">
            <label for="academicYear">Academic Year</label>
            <input id="academicYear" [ngModel]="academicYear()" (ngModelChange)="academicYear.set($event)" placeholder="e.g., 2026/2027" required>
            <span class="hint-text">Format: YYYY/YYYY</span>
          </div>
        </div>

        @if (error()) {
          <div class="error-message">
            <mat-icon>error</mat-icon>
            {{ error() }}
          </div>
        }
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="cancel()" [disabled]="isLoading()">Cancel</button>
        <button 
          mat-raised-button 
          color="primary" 
          (click)="promote()"
          [disabled]="!canPromote() || isLoading()">
          @if (isLoading()) {
            <mat-spinner diameter="20"></mat-spinner>
          } @else {
            <span class="btn-content">
              <mat-icon>upgrade</mat-icon>
              Promote Students
            </span>
          }
        </button>
      </mat-dialog-actions>
    </div>
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

    .dialog-container {
      min-width: 400px;
    }

    h2 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
      padding: 24px 24px 0 24px;
      font-size: 20px;
      font-weight: 600;

      mat-icon {
        color: #3b82f6;
      }
    }

    mat-dialog-content {
      padding: 16px 24px;
    }

    .dialog-description {
      color: #6b7280;
      margin: 0 0 24px 0;
      line-height: 1.5;
    }

    .form-fields {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .full-width {
      width: 100%;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #fee2e2;
      border-radius: 8px;
      color: #dc2626;
      margin-top: 16px;
      font-size: 14px;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    mat-dialog-actions {
      padding: 16px 24px 24px;
      gap: 12px;

      button {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    }
  `],
})
export class BulkPromotionDialogComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<BulkPromotionDialogComponent>);
  readonly academicsService = inject(AcademicsService);
  readonly snackBar = inject(MatSnackBar);

  // Form state
  sourceYearLevel = signal<number | null>(null);
  targetYearLevel = signal<number | null>(null);
  academicYear = signal<string>('');
  yearLevels = signal<YearLevel[]>([]);
  
  // UI state
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadYearLevels();
    // Set default academic year
    const currentYear = new Date().getFullYear();
    this.academicYear.set(`${currentYear}/${currentYear + 1}`);
  }

  loadYearLevels(): void {
    this.academicsService.getAcademicYears().subscribe({
      next: (res: any) => {
        const levels = res.results || [];
        this.yearLevels.set(levels.filter((l: any) => l.is_active));
      },
      error: (err: any) => {
        this.error.set('Failed to load year levels');
      }
    });
  }

  canPromote(): boolean {
    return !!(
      this.sourceYearLevel() &&
      this.targetYearLevel() &&
      this.academicYear() &&
      this.sourceYearLevel() !== this.targetYearLevel()
    );
  }

  promote(): void {
    if (!this.canPromote()) return;

    this.isLoading.set(true);
    this.error.set(null);

    const request = {
      source_year_level: this.sourceYearLevel()!,
      target_year_level: this.targetYearLevel()!,
      academic_year: this.academicYear(),
      student_ids: [],
    };

    this.academicsService.bulkPromote(request).subscribe({
      next: (response: any) => {
        this.isLoading.set(false);
        this.dialogRef.close({ success: true, message: response.message });
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.error.set(err.message || 'Failed to promote students');
      }
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
