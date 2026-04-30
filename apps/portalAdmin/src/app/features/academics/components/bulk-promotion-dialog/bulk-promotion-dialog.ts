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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
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
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
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
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Source Year Level</mat-label>
            <mat-select [(ngModel)]="sourceYearLevel" required>
              @for (year of yearLevels(); track year.id) {
                <mat-option [value]="year.id">{{ year.name }}</mat-option>
              }
            </mat-select>
            <mat-hint>Current year level of students</mat-hint>
          </mat-form-field>

          <!-- Target Year Level -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Target Year Level</mat-label>
            <mat-select [(ngModel)]="targetYearLevel" required>
              @for (year of yearLevels(); track year.id) {
                <mat-option [value]="year.id" [disabled]="year.id === sourceYearLevel()">
                  {{ year.name }}
                </mat-option>
              }
            </mat-select>
            <mat-hint>Year level to promote to</mat-hint>
          </mat-form-field>

          <!-- Academic Year -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Academic Year</mat-label>
            <input matInput [(ngModel)]="academicYear" placeholder="e.g., 2026/2027" required>
            <mat-hint>Format: YYYY/YYYY</mat-hint>
          </mat-form-field>
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
  private dialogRef = inject(MatDialogRef<BulkPromotionDialogComponent>);
  private academicsService = inject(AcademicsService);
  private snackBar = inject(MatSnackBar);

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
    this.academicsService.getYearLevels().subscribe({
      next: (levels) => {
        this.yearLevels.set(levels.filter(l => l.is_active));
      },
      error: () => {
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
      student_ids: [], // Backend will auto-select all students from source year
    };

    this.academicsService.bulkPromote(request).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.dialogRef.close({ success: true, message: response.message });
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set(err.message || 'Failed to promote students');
      }
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
