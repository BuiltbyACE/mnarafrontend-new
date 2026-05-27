import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { StudentsService } from '../../services/students.service';
import { BehaviourCommitmentPayload } from '../../../../shared/models/students.models';

interface CommitmentItem {
  key: keyof BehaviourCommitmentPayload;
  label: string;
  description: string;
}

@Component({
  selector: 'app-behaviour-commitment-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule,
    MatIconModule, MatCheckboxModule, MatInputModule,
    MatProgressSpinnerModule, MatSnackBarModule,
  ],
  template: `
    <div class="commitment-page">
      <div class="page-header">
        <button mat-icon-button (click)="goBack()"><mat-icon>arrow_back</mat-icon></button>
        <div>
          <h1>Student Behaviour Commitment Form</h1>
          <p class="subtitle">Student ID: {{ studentId }}</p>
        </div>
      </div>

      <mat-card class="intro-card">
        <mat-card-content>
          <mat-icon>gavel</mat-icon>
          <p>I, the undersigned, <strong>commit</strong> to upholding the following standards of behaviour, conduct, and responsibility as a student of this institution. Each item below must be acknowledged before submission.</p>
        </mat-card-content>
      </mat-card>

      <mat-card class="commitments-card">
        <mat-card-content>
          <div class="commitments-list">
            @for (item of commitmentItems; track item.key) {
              <div class="commitment-item" [class.checked]="formState()[item.key]">
                <mat-checkbox [ngModel]="formState()[item.key]" (ngModelChange)="toggle(item.key)">
                  <div class="commitment-text">
                    <strong>{{ item.label }}</strong>
                    <p>{{ item.description }}</p>
                  </div>
                </mat-checkbox>
              </div>
            }
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="signature-card">
        <mat-card-content>
          <h3>Signatories</h3>
          <div class="form-row">
            <div class="field-group">
              <label>Student Name *</label>
              <input [ngModel]="studentName" (ngModelChange)="studentName = $event" placeholder="Full name of student">
            </div>
            <div class="field-group">
              <label>Parent/Guardian Name *</label>
              <input [ngModel]="parentName" (ngModelChange)="parentName = $event" placeholder="Full name of parent or guardian">
            </div>
          </div>
          <div class="form-row">
            <div class="field-group">
              <label>Date Signed *</label>
              <input type="date" [ngModel]="dateSigned" (ngModelChange)="dateSigned = $event">
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      @if (error()) {
        <div class="error-block">
          <mat-icon>error</mat-icon>
          <span>{{ error() }}</span>
        </div>
      }

      <div class="submit-area">
        <button mat-raised-button color="primary" [disabled]="!allChecked() || isSubmitting()" (click)="onSubmit()">
          @if (isSubmitting()) {
            <mat-spinner diameter="20"></mat-spinner>
            Submitting...
          } @else {
            <mat-icon>check_circle</mat-icon>
            Submit Commitment
          }
        </button>
        @if (!allChecked()) {
          <p class="hint">Please acknowledge all {{ commitmentItems.length }} commitments before submitting.</p>
        }
      </div>
    </div>
  `,
  styles: [`
    .commitment-page { max-width: 800px; margin: 0 auto; padding: 24px; }
    .page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
    .page-header h1 { margin: 0; font-size: 24px; font-weight: 600; color: #1e293b; }
    .page-header .subtitle { margin: 4px 0 0; color: #64748b; font-size: 14px; }
    .intro-card { margin-bottom: 20px; border-radius: 12px; }
    .intro-card mat-card-content { display: flex; align-items: center; gap: 16px; padding: 24px; }
    .intro-card mat-icon { font-size: 40px; width: 40px; height: 40px; color: #6366f1; flex-shrink: 0; }
    .intro-card p { margin: 0; font-size: 14px; color: #374151; line-height: 1.6; }
    .commitments-card { margin-bottom: 20px; border-radius: 12px; }
    .commitments-list { display: flex; flex-direction: column; gap: 4px; }
    .commitment-item { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; transition: background 0.15s; }
    .commitment-item:last-child { border-bottom: none; }
    .commitment-item.checked { background: #f0fdf4; }
    .commitment-text strong { display: block; font-size: 14px; color: #1e293b; margin-bottom: 2px; }
    .commitment-text p { margin: 0; font-size: 12px; color: #64748b; }
    .signature-card { margin-bottom: 20px; border-radius: 12px; }
    .signature-card h3 { margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #1e293b; }
    .form-row { display: flex; gap: 16px; margin-bottom: 16px; }
    .field-group { flex: 1; display: flex; flex-direction: column; gap: 6px; }
    label { font-size: 13px; font-weight: 500; color: #374151; }
    input { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; background: white; width: 100%; box-sizing: border-box; }
    input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }
    .error-block { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626; font-size: 14px; margin-bottom: 16px; }
    .submit-area { text-align: center; padding: 20px; }
    .submit-area button { min-width: 250px; display: inline-flex; align-items: center; gap: 8px; }
    .hint { margin: 8px 0 0; font-size: 13px; color: #f59e0b; }
  `]
})
export class BehaviourCommitmentFormComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private studentsService = inject(StudentsService);
  private snackBar = inject(MatSnackBar);

  studentId = Number(this.route.snapshot.paramMap.get('id'));
  isSubmitting = signal(false);
  error = signal<string | null>(null);

  studentName = '';
  parentName = '';
  dateSigned = new Date().toISOString().split('T')[0];

  readonly commitmentItems: CommitmentItem[] = [
    { key: 'understands_rules', label: 'School Rules', description: 'I understand and will follow all school rules and regulations.' },
    { key: 'respects_staff', label: 'Respect for Staff', description: 'I will treat all teachers, staff, and administrators with respect.' },
    { key: 'attends_regularly', label: 'Regular Attendance', description: 'I will attend school regularly and on time, unless excused.' },
    { key: 'completes_homework', label: 'Homework Completion', description: 'I will complete all assigned homework and submit it on time.' },
    { key: 'follows_dress_code', label: 'Dress Code', description: 'I will wear the prescribed uniform and maintain proper appearance.' },
    { key: 'no_bullying', label: 'No Bullying', description: 'I will not engage in bullying, harassment, or intimidation of any kind.' },
    { key: 'no_vandalism', label: 'No Vandalism', description: 'I will not damage or deface school property.' },
    { key: 'no_substance_abuse', label: 'No Substance Abuse', description: 'I will not use, possess, or distribute prohibited substances.' },
    { key: 'responsible_online', label: 'Responsible Online Behaviour', description: 'I will use school technology and social media responsibly.' },
    { key: 'maintains_cleanliness', label: 'Cleanliness', description: 'I will keep the school environment clean and tidy.' },
    { key: 'participates_activities', label: 'Active Participation', description: 'I will participate in school activities and events.' },
    { key: 'cares_facilities', label: 'Care for Facilities', description: 'I will take care of school facilities, books, and equipment.' },
    { key: 'respect_diversity', label: 'Respect for Diversity', description: 'I will respect classmates regardless of background or belief.' },
    { key: 'follows_safety', label: 'Safety Compliance', description: 'I will follow all safety guidelines and emergency procedures.' },
    { key: 'honest_communication', label: 'Honest Communication', description: 'I will communicate honestly with teachers and staff.' },
    { key: 'positive_behavior', label: 'Positive Behaviour', description: 'I will strive to be a positive role model for fellow students.' },
  ];

  formState = signal<Record<string, boolean>>(
    Object.fromEntries(this.commitmentItems.map(i => [i.key, false]))
  );

  allChecked = computed(() => this.commitmentItems.every(item => this.formState()[item.key]));

  toggle(key: string): void {
    this.formState.update(s => ({ ...s, [key]: !s[key] }));
  }

  private buildPayload(): BehaviourCommitmentPayload {
    const state = this.formState();
    return {
      understands_rules: state['understands_rules'],
      respects_staff: state['respects_staff'],
      attends_regularly: state['attends_regularly'],
      completes_homework: state['completes_homework'],
      follows_dress_code: state['follows_dress_code'],
      no_bullying: state['no_bullying'],
      no_vandalism: state['no_vandalism'],
      no_substance_abuse: state['no_substance_abuse'],
      responsible_online: state['responsible_online'],
      maintains_cleanliness: state['maintains_cleanliness'],
      participates_activities: state['participates_activities'],
      cares_facilities: state['cares_facilities'],
      respect_diversity: state['respect_diversity'],
      follows_safety: state['follows_safety'],
      honest_communication: state['honest_communication'],
      positive_behavior: state['positive_behavior'],
      student_name: this.studentName,
      parent_name: this.parentName,
      date_signed: this.dateSigned,
    };
  }

  onSubmit(): void {
    if (!this.allChecked()) return;
    if (!this.studentName || !this.parentName || !this.dateSigned) {
      this.error.set('Please fill in all signatory fields.');
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    this.studentsService.submitBehaviourCommitment(this.studentId, this.buildPayload()).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.snackBar.open('Behaviour commitment submitted successfully', 'Close', { duration: 5000 });
        this.router.navigate(['/portalAdmin/students', this.studentId]);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.error.set(err.error?.message || err.error?.detail || 'Failed to submit commitment.');
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/portalAdmin/students', this.studentId]);
  }
}
