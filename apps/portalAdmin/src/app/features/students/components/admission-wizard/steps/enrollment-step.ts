import { Component, input, output, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AcademicsService, Classroom } from '../../../../academics/services/academics.service';

interface AcademicYear {
  id: number;
  name: string;
  is_active?: boolean;
}

@Component({
  selector: 'app-enrollment-step',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatSelectModule,
    MatButtonModule, MatProgressSpinnerModule, MatIconModule,
  ],
  template: `
    <div class="step-container">
      @if (enrollmentResult(); as result) {
        <div class="success-block">
          <mat-icon>check_circle</mat-icon>
          <h2>Enrollment Complete</h2>
          <p>Student has been enrolled in <strong>{{ result.classroom_name }}</strong> ({{ result.academic_year_name }})</p>

          <div class="subjects-section">
            <h3>Registered Subjects</h3>
            @if (result.registered_subjects.length) {
              <div class="subject-list">
                @for (sub of result.registered_subjects; track sub.id) {
                  <span class="subject-chip">{{ sub.name }}</span>
                }
              </div>
            } @else {
              <p class="text-muted">No subjects registered yet.</p>
            }
          </div>

          <button mat-raised-button color="primary" (click)="finish.emit()">
            <mat-icon>arrow_forward</mat-icon> View Student
          </button>
        </div>
      } @else {
        <h2>Enroll Student</h2>
        <p class="step-description">Select classroom and academic year to complete enrollment</p>

        <div class="form-row">
          <div class="field-group">
            <label>Classroom *</label>
            <select [ngModel]="selectedClassroom" (ngModelChange)="onClassroomChange($event)" required>
              <option [value]="null">Select classroom</option>
              @for (c of classrooms(); track c.id) {
                <option [value]="c.id">{{ c.name }} ({{ c.current_enrollment }}/{{ c.capacity }})</option>
              }
            </select>
            @if (classrooms().length === 0 && !loadingClassrooms()) {
              <span class="field-hint">No classrooms available for this year level</span>
            }
          </div>
          <div class="field-group">
            <label>Academic Year *</label>
            <select [ngModel]="selectedYear" (ngModelChange)="onYearChange($event)" required>
              <option [value]="null">Select academic year</option>
              @for (y of academicYears(); track y.id) {
                <option [value]="y.id">{{ y.name }}</option>
              }
            </select>
            @if (academicYears().length === 0 && !loadingYears()) {
              <span class="field-hint">No academic years available</span>
            }
          </div>
        </div>

        @if (error()) {
          <div class="error-block">
            <mat-icon>error</mat-icon>
            <span>{{ error() }}</span>
          </div>
        }

        <div class="submit-area">
          <button mat-raised-button color="primary"
                  [disabled]="!selectedClassroom || !selectedYear || submitting()"
                  (click)="submitEnroll()">
            @if (submitting()) {
              <mat-spinner diameter="20"></mat-spinner>
              Enrolling...
            } @else {
              <ng-container><mat-icon>how_to_reg</mat-icon></ng-container>
              Complete Enrollment
            }
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .step-container { padding: 24px; }
    h2 { margin: 0 0 4px; font-size: 20px; font-weight: 600; color: #1e293b; }
    .step-description { margin: 0 0 24px; color: #64748b; font-size: 14px; }
    .form-row { display: flex; gap: 16px; margin-bottom: 16px; }
    .field-group { flex: 1; display: flex; flex-direction: column; gap: 6px; }
    label { font-size: 13px; font-weight: 500; color: #374151; }
    select { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; background: white; }
    select:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }
    .field-hint { font-size: 12px; color: #94a3b8; margin-top: 2px; }
    .error-block { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626; font-size: 14px; margin-bottom: 16px; }
    .submit-area { text-align: center; padding-top: 16px; border-top: 1px solid #e2e8f0; }
    .submit-area button { min-width: 220px; display: inline-flex; align-items: center; gap: 8px; }
    .success-block { text-align: center; padding: 40px 24px; }
    .success-block mat-icon { font-size: 56px; width: 56px; height: 56px; color: #16a34a; margin-bottom: 16px; }
    .success-block h2 { color: #15803d; margin-bottom: 8px; }
    .success-block p { color: #374151; font-size: 15px; margin-bottom: 24px; }
    .subjects-section { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 20px; margin-bottom: 24px; text-align: left; }
    .subjects-section h3 { margin: 0 0 12px; font-size: 15px; color: #166534; }
    .subject-list { display: flex; flex-wrap: wrap; gap: 8px; }
    .subject-chip { padding: 6px 14px; background: #dcfce7; border: 1px solid #86efac; border-radius: 16px; font-size: 13px; color: #166534; font-weight: 500; }
    .text-muted { color: #94a3b8; font-size: 14px; }
  `]
})
export class EnrollmentStep {
  private academicsService = inject(AcademicsService);

  studentId = input.required<number>();
  yearLevelId = input.required<number>();
  submitting = input(false);
  error = input<string | null>(null);
  enrollmentResult = input<{ classroom_name: string; academic_year_name: string; registered_subjects: { id: number; name: string }[] } | null>(null);
  enroll = output<{ classroom: number; academic_year: number }>();
  finish = output<void>();

  classrooms = signal<Classroom[]>([]);
  academicYears = signal<AcademicYear[]>([]);
  loadingClassrooms = signal(false);
  loadingYears = signal(false);

  selectedClassroom: number | null = null;
  selectedYear: number | null = null;

  constructor() {
    effect(() => {
      const ylId = this.yearLevelId();
      if (ylId) {
        this.loadClassrooms(ylId);
      }
    });
    effect(() => {
      if (this.studentId()) {
        this.loadAcademicYears();
      }
    });
  }

  private loadClassrooms(yearLevelId: number): void {
    this.loadingClassrooms.set(true);
    this.academicsService.getClassroomsByYearLevel(yearLevelId).subscribe({
      next: (data) => {
        this.classrooms.set(data);
        this.loadingClassrooms.set(false);
      },
      error: () => this.loadingClassrooms.set(false),
    });
  }

  private loadAcademicYears(): void {
    this.loadingYears.set(true);
    this.academicsService.getAcademicYears().subscribe({
      next: (data: any) => {
        const years = Array.isArray(data) ? data : data?.results || [];
        this.academicYears.set(years);
        this.loadingYears.set(false);
      },
      error: () => this.loadingYears.set(false),
    });
  }

  onClassroomChange(id: number): void {
    this.selectedClassroom = id;
  }

  onYearChange(id: number): void {
    this.selectedYear = id;
  }

  submitEnroll(): void {
    if (this.selectedClassroom && this.selectedYear) {
      this.enroll.emit({
        classroom: this.selectedClassroom,
        academic_year: this.selectedYear,
      });
    }
  }
}
