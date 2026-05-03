/**
 * Edit Role Dialog
 * PATCH /api/v1/accounts/users/{id}/role/ — flat write per v2.0 contract
 */

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RbacService } from '../../services/rbac.service';
import { AdminUser, UserRole } from '../../../../shared/models/rbac.models';

@Component({
  selector: 'app-edit-role-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>Edit Role</h2>
    <mat-dialog-content>
      <div class="user-summary">
        <div class="avatar">{{ getInitials() }}</div>
        <div>
          <p class="user-name">{{ data.user.full_name || (data.user.first_name + ' ' + data.user.last_name) }}</p>
          <p class="user-email">{{ data.user.email }}</p>
        </div>
      </div>

      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>New Role</mat-label>
          <mat-select formControlName="role">
            @for (role of roles; track role.value) {
              <mat-option [value]="role.value">{{ role.label }}</mat-option>
            }
          </mat-select>
          @if (form.get('role')?.hasError('required') && form.get('role')?.touched) {
            <mat-error>Role is required</mat-error>
          }
        </mat-form-field>

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
      <button mat-raised-button color="primary" (click)="submit()" [disabled]="form.invalid || saving || !hasChanged()">
        @if (saving) {
          <mat-spinner diameter="18" style="display:inline-block; margin-right: 8px;"></mat-spinner>
        }
        Update Role
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form { display: flex; flex-direction: column; gap: 4px; min-width: 400px; padding-top: 8px; }
    .full-width { width: 100%; }
    .user-summary { display: flex; align-items: center; gap: 12px; padding: 12px; background: #f9fafb; border-radius: 8px; margin-bottom: 20px; }
    .avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); color: white; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; flex-shrink: 0; }
    .user-name { margin: 0; font-weight: 600; color: #1f2937; font-size: 14px; }
    .user-email { margin: 2px 0 0 0; font-size: 12px; color: #6b7280; }
    .error-banner { display: flex; align-items: center; gap: 8px; padding: 12px; background: #fee2e2; border-radius: 8px; color: #dc2626; font-size: 14px; }
    mat-dialog-actions { padding: 16px 24px; }
  `],
})
export class EditRoleDialogComponent {
  private fb = inject(FormBuilder);
  private rbacService = inject(RbacService);
  private dialogRef = inject(MatDialogRef<EditRoleDialogComponent>);
  readonly data = inject<{ user: AdminUser }>(MAT_DIALOG_DATA);

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
    role: [this.data.user.role as UserRole, Validators.required],
  });

  getInitials(): string {
    const name = this.data.user.full_name || `${this.data.user.first_name || ''} ${this.data.user.last_name || ''}`;
    return name.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  hasChanged(): boolean {
    return this.form.value.role !== this.data.user.role;
  }

  submit(): void {
    if (this.form.invalid || !this.hasChanged()) return;
    this.saving = true;
    this.errorMessage = '';

    this.rbacService.updateUserRole(this.data.user.id, { role: this.form.value.role as UserRole })
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => {
          this.errorMessage = err.error?.detail || 'Failed to update role. Please try again.';
          this.saving = false;
        },
      });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
