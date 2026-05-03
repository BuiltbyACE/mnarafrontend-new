/**
 * Create User Dialog
 * POST /api/v1/accounts/users/ — flat payload per v2.0 contract
 */

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
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
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
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
          <mat-form-field appearance="outline">
            <mat-label>First Name</mat-label>
            <input matInput formControlName="first_name" placeholder="e.g. James" />
            @if (form.get('first_name')?.hasError('required') && form.get('first_name')?.touched) {
              <mat-error>First name is required</mat-error>
            }
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Last Name</mat-label>
            <input matInput formControlName="last_name" placeholder="e.g. Mwangi" />
            @if (form.get('last_name')?.hasError('required') && form.get('last_name')?.touched) {
              <mat-error>Last name is required</mat-error>
            }
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email Address</mat-label>
          <input matInput formControlName="email" type="email" placeholder="user@school.ac.ke" />
          @if (form.get('email')?.hasError('required') && form.get('email')?.touched) {
            <mat-error>Email is required</mat-error>
          }
          @if (form.get('email')?.hasError('email')) {
            <mat-error>Enter a valid email address</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Role</mat-label>
          <mat-select formControlName="role">
            @for (role of roles; track role.value) {
              <mat-option [value]="role.value">{{ role.label }}</mat-option>
            }
          </mat-select>
          @if (form.get('role')?.hasError('required') && form.get('role')?.touched) {
            <mat-error>Role is required</mat-error>
          }
        </mat-form-field>

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
