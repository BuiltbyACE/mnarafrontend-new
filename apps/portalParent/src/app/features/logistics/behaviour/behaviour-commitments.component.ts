import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DatePipe } from '@angular/common';
import { ParentApiService } from '../../../services/parent-api.service';
import { BehaviourCommitment, CommitmentCreateRequest } from '../../../models/parent.models';
import { AuthStore } from '@sms/core/auth';

@Component({
  selector: 'app-behaviour-commitments',
  imports: [
    FormsModule, MatCardModule, MatIconModule, MatButtonModule,
    MatCheckboxModule, MatFormFieldModule, MatInputModule,
    MatDividerModule, MatSnackBarModule, MatProgressSpinnerModule,
    DatePipe,
  ],
  template: `
    <div class="page">
      <h2>Behaviour Commitment Form</h2>
      <p class="page-desc">Parent-school partnership agreement to support student behaviour and development.</p>

      @if (loading()) { <div class="loading-wrap"><mat-spinner diameter="28"></mat-spinner></div> }
      @else {
        @if (existing(); as ex) {
          <mat-card class="existing-card">
            <mat-card-header>
              <mat-icon mat-card-avatar>check_circle</mat-icon>
              <mat-card-title>Commitment Already Signed</mat-card-title>
              <mat-card-subtitle>Signed on {{ ex.signed_date | date:'mediumDate' }} by {{ ex.parent_full_name }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p>You have already submitted a commitment form. You can view or update it below.</p>
            </mat-card-content>
            <mat-card-actions>
              <button mat-button color="primary" (click)="editExisting(ex)">Edit</button>
              <button mat-stroked-button color="warn" (click)="deleteExisting(ex.id)">Delete</button>
            </mat-card-actions>
          </mat-card>
        }

        <mat-card class="form-card" [class.hidden]="!showForm()">
          <mat-card-header>
            <mat-icon mat-card-avatar>assignment</mat-icon>
            <mat-card-title>{{ existing() ? 'Update' : 'Sign' }} Commitment Form</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form #form="ngForm">
              <div class="form-section">
                <h3>Parent/Guardian Details</h3>
                <div class="form-row">
                  <mat-form-field appearance="outline" class="half">
                    <mat-label>Full Name</mat-label>
                    <input matInput [(ngModel)]="formData.parent_full_name" name="fullName" required>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="half">
                    <mat-label>Phone Number</mat-label>
                    <input matInput [(ngModel)]="formData.contact_mobile" name="phone" required>
                  </mat-form-field>
                </div>
                <mat-form-field appearance="outline">
                  <mat-label>Email</mat-label>
                  <input matInput type="email" [(ngModel)]="formData.contact_email" name="email" required>
                </mat-form-field>
              </div>

              <mat-divider></mat-divider>

              <div class="form-section">
                <h3>Commitments</h3>
                <p class="section-desc">I commit to the following as a parent/guardian of my child:</p>
                <div class="checkbox-list">
                  <mat-checkbox [(ngModel)]="formData.commit_attend_meetings" name="c1">Attend parent-teacher meetings and school events</mat-checkbox>
                  <mat-checkbox [(ngModel)]="formData.commit_monitor_progress" name="c2">Monitor my child's academic progress regularly</mat-checkbox>
                  <mat-checkbox [(ngModel)]="formData.commit_provide_resources" name="c3">Provide necessary learning resources and materials</mat-checkbox>
                  <mat-checkbox [(ngModel)]="formData.commit_communicate_concerns" name="c4">Communicate any concerns promptly to the school</mat-checkbox>
                  <mat-checkbox [(ngModel)]="formData.commit_reinforce_school_rules" name="c5">Reinforce school rules and values at home</mat-checkbox>
                  <mat-checkbox [(ngModel)]="formData.commit_support_values" name="c6">Support the school's values and code of conduct</mat-checkbox>
                  <mat-checkbox [(ngModel)]="formData.commit_discipline_at_home" name="c7">Reinforce positive discipline strategies at home</mat-checkbox>
                  <mat-checkbox [(ngModel)]="formData.commit_encourage_reading" name="c8">Encourage daily reading and study habits</mat-checkbox>
                  <mat-checkbox [(ngModel)]="formData.commit_limit_screen_time" name="c9">Limit screen time and monitor online activity</mat-checkbox>
                  <mat-checkbox [(ngModel)]="formData.commit_participate_activities" name="c10">Encourage participation in extracurricular activities</mat-checkbox>
                  <mat-checkbox [(ngModel)]="formData.commit_ensure_punctuality" name="c11">Ensure punctual and regular school attendance</mat-checkbox>
                </div>
              </div>

              <mat-divider></mat-divider>

              <div class="form-section">
                <h3>Declarations</h3>
                <div class="checkbox-list declarations">
                  <mat-checkbox [(ngModel)]="formData.decl_termination_clause" name="d1">I understand that breach of this agreement may lead to termination of enrolment</mat-checkbox>
                  <mat-checkbox [(ngModel)]="formData.decl_data_accuracy" name="d2">I confirm that all information provided is accurate and complete</mat-checkbox>
                  <mat-checkbox [(ngModel)]="formData.decl_photo_consent" name="d3">I consent to my child being photographed for school activities</mat-checkbox>
                  <mat-checkbox [(ngModel)]="formData.decl_medical_consent" name="d4">I consent to emergency medical treatment if necessary</mat-checkbox>
                  <mat-checkbox [(ngModel)]="formData.decl_fee_obligation" name="d5">I confirm my obligation to pay all school fees on time</mat-checkbox>
                </div>
              </div>

              @if (submitError()) {
                <div class="error-msg">{{ submitError() }}</div>
              }
            </form>
          </mat-card-content>
          <mat-card-actions align="end">
            <button mat-button (click)="cancelForm()">Cancel</button>
            <button mat-raised-button color="primary" [disabled]="!isFormValid() || submitting()" (click)="submitForm()">
              @if (submitting()) {
                <mat-spinner diameter="18" class="btn-spinner"></mat-spinner>
                Submitting...
              } @else {
                {{ existing() ? 'Update' : 'Submit' }} Commitment
              }
            </button>
          </mat-card-actions>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .page { padding: 16px 0; max-width: 700px; }
    h2 { font-size: 1.125rem; margin: 0 0 4px; color: #1e293b; }
    .page-desc { color: #64748b; font-size: 0.8125rem; margin: 0 0 20px; }
    .loading-wrap { display: flex; justify-content: center; padding: 48px; }
    .existing-card { margin-bottom: 16px; border-left: 4px solid #059669; }
    .hidden { display: none; }
    .form-card { }
    .form-section { padding: 16px 0; }
    .form-section h3 { font-size: 0.9375rem; font-weight: 600; color: #1e293b; margin: 0 0 4px; }
    .section-desc { font-size: 0.75rem; color: #64748b; margin: 0 0 12px; }
    .form-row { display: flex; gap: 12px; }
    .half { flex: 1; }
    mat-form-field { width: 100%; }
    .checkbox-list { display: flex; flex-direction: column; gap: 8px; }
    .checkbox-list mat-checkbox { font-size: 0.8125rem; }
    .declarations mat-checkbox { font-weight: 500; }
    .error-msg { color: #e11d48; background: #fef2f2; padding: 8px 12px; border-radius: 6px; border: 1px solid #fecaca; margin-top: 12px; font-size: 0.75rem; }
    .btn-spinner { display: inline-block; vertical-align: middle; margin-right: 6px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BehaviourCommitmentsComponent implements OnInit {
  private readonly api = inject(ParentApiService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly authStore = inject(AuthStore);

  readonly existing = signal<BehaviourCommitment | null>(null);
  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly submitError = signal('');
  readonly showForm = signal(false);
  private existingId: number | null = null;
  editing = false;

  readonly formData: CommitmentCreateRequest = {
    parent_full_name: '',
    contact_mobile: '',
    contact_email: '',
    commit_attend_meetings: false,
    commit_monitor_progress: false,
    commit_provide_resources: false,
    commit_communicate_concerns: false,
    commit_reinforce_school_rules: false,
    commit_support_values: false,
    commit_discipline_at_home: false,
    commit_encourage_reading: false,
    commit_limit_screen_time: false,
    commit_participate_activities: false,
    commit_ensure_punctuality: false,
    decl_termination_clause: false,
    decl_data_accuracy: false,
    decl_photo_consent: false,
    decl_medical_consent: false,
    decl_fee_obligation: false,
  };

  ngOnInit() {
    this.api.getBehaviourCommitments().subscribe({
      next: (list) => {
        if (list.length > 0) {
          const ex = list[list.length - 1];
          this.existing.set(ex);
          this.existingId = ex.id;
          this.populateForm(ex);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    const user = this.authStore.user()?.user;
    if (user) {
      this.formData.parent_full_name = user.firstName || '';
      this.formData.contact_email = user.email || '';
    }
  }

  private populateForm(ex: BehaviourCommitment): void {
    this.formData.parent_full_name = ex.parent_full_name || this.formData.parent_full_name;
    this.formData.contact_mobile = ex.contact_mobile || '';
    this.formData.contact_email = ex.contact_email || this.formData.contact_email;
    (Object.keys(this.formData) as (keyof CommitmentCreateRequest)[]).forEach((key) => {
      if (typeof this.formData[key] === 'boolean' && typeof ex[key] === 'boolean') {
        (this.formData as any)[key] = ex[key];
      }
    });
  }

  isFormValid(): boolean {
    return this.formData.parent_full_name.trim().length > 0
      && this.formData.contact_mobile.trim().length > 0
      && this.formData.contact_email.trim().length > 0;
  }

  editExisting(_ex: BehaviourCommitment): void {
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.submitError.set('');
  }

  submitForm(): void {
    if (!this.isFormValid()) return;
    this.submitting.set(true);
    this.submitError.set('');

    const obs = this.existingId
      ? this.api.updateBehaviourCommitment(this.existingId, this.formData)
      : this.api.createBehaviourCommitment(this.formData);

    obs.subscribe({
      next: (result) => {
        this.submitting.set(false);
        this.existing.set(result);
        this.existingId = result.id;
        this.showForm.set(false);
        this.snackBar.open(
          `Commitment form ${this.existingId ? 'updated' : 'submitted'} successfully`,
          'Close', { duration: 3000 }
        );
      },
      error: (err) => {
        this.submitting.set(false);
        this.submitError.set(err.error?.message || err.error?.detail || 'Failed to submit form');
      },
    });
  }

  deleteExisting(id: number): void {
    if (!confirm('Are you sure you want to delete this commitment form?')) return;
    this.api.deleteBehaviourCommitment(id).subscribe({
      next: () => {
        this.existing.set(null);
        this.existingId = null;
        this.showForm.set(true);
        this.snackBar.open('Commitment form deleted', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed to delete', 'Close', { duration: 3000 });
      },
    });
  }
}
