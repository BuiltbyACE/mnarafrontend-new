/**
 * Create User Dialog
 * POST /api/v1/accounts/users/ — flat payload per v2.0 contract
 */

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RbacService } from '../../services/rbac.service';
import { UserRole } from '../../../../shared/models/rbac.models';

@Component({
  selector: 'app-create-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,

    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>Create New User</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <div class="form-row">
          <div class="form-field">
            <label class="input-label">First Name</label>
            <input formControlName="first_name" placeholder="e.g. James" />
            @if (form.get('first_name')?.hasError('required') && form.get('first_name')?.touched) {
              <span class="error-text">First name is required</span>
            }
          </div>
          <div class="form-field">
            <label class="input-label">Last Name</label>
            <input formControlName="last_name" placeholder="e.g. Mwangi" />
            @if (form.get('last_name')?.hasError('required') && form.get('last_name')?.touched) {
              <span class="error-text">Last name is required</span>
            }
          </div>
        </div>

        <div class="form-field">
          <label class="input-label">Email Address</label>
          <input formControlName="email" type="email" placeholder="user@school.ac.ke" />
          @if (form.get('email')?.hasError('required') && form.get('email')?.touched) {
            <span class="error-text">Email is required</span>
          }
          @if (form.get('email')?.hasError('email')) {
            <span class="error-text">Enter a valid email address</span>
          }
        </div>

        <div class="form-field">
          <label class="input-label">Role</label>
          <select formControlName="role">
            @for (role of roles; track role.value) {
              <option [value]="role.value">{{ role.label }}</option>
            }
          </select>
          @if (form.get('role')?.hasError('required') && form.get('role')?.touched) {
            <span class="error-text">Role is required</span>
          }
        </div>

        <div class="toggle-row">
          <mat-slide-toggle formControlName="is_active" color="primary">
            Active Account
          </mat-slide-toggle>
          <span class="toggle-hint">User can log in immediately if enabled</span>
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
        Create User
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      width: 100%;
    }
    .form-field input,
    .form-field select {
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
    .form-field select:focus {
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
    .dialog-form { display: flex; flex-direction: column; gap: 4px; min-width: 480px; padding-top: 8px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .full-width { width: 100%; }
    .toggle-row { display: flex; align-items: center; gap: 16px; padding: 8px 0; }
    .toggle-hint { font-size: 12px; color: #6b7280; }
    .error-banner { display: flex; align-items: center; gap: 8px; padding: 12px; background: #fee2e2; border-radius: 8px; color: #dc2626; font-size: 14px; }
    mat-dialog-actions { padding: 16px 24px; }
  `],
})
export class CreateUserDialogComponent {
  private fb = inject(FormBuilder);
  private rbacService = inject(RbacService);
  private dialogRef = inject(MatDialogRef<CreateUserDialogComponent>);

  saving = false;
  errorMessage = '';

  readonly roles: { value: UserRole; label: string }[] = [
    { value: 'ADMIN', label: 'Administrator' },
    { value: 'TEACHER', label: 'Teacher' },
    { value: 'FINANCE', label: 'Finance Officer' },
    { value: 'STAFF', label: 'Support Staff' },
    { value: 'NURSE', label: 'Nurse' },
    { value: 'TRANSPORT', label: 'Transport Officer' },
  ];

  form = this.fb.group({
    first_name: ['', Validators.required],
    last_name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['' as UserRole, Validators.required],
    is_active: [true],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.saving = true;
    this.errorMessage = '';

    const payload = this.form.getRawValue();
    this.rbacService.createUser({
      first_name: payload.first_name!,
      last_name: payload.last_name!,
      email: payload.email!,
      role: payload.role as UserRole,
      is_active: payload.is_active ?? true,
    }).subscribe({
      next: () => this.dialogRef.close(true),
      error: (err) => {
        this.errorMessage = err.error?.detail || err.error?.email?.[0] || 'Failed to create user. Please try again.';
        this.saving = false;
      },
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
