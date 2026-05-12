import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { getApiUrl } from '@sms/core/config';
import { catchError, throwError } from 'rxjs';

export interface SystemRole {
  id: number;
  name: string;
  portal_type: string;
  requires_mfa: boolean;
}

export interface SystemUser {
  id: string;
  school_id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  portal_type: string;
  role: string;
  system_role: SystemRole | null;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

@Injectable({
  providedIn: 'root',
})
export class SystemAccessService {
  private http = inject(HttpClient);

  readonly users = signal<SystemUser[]>([]);
  readonly availableRoles = signal<SystemRole[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  loadUsers(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.http
      .get<PaginatedResponse<SystemUser>>(getApiUrl('/accounts/users/'), {
        params: { page_size: '100' },
      })
      .pipe(
        catchError((err) => {
          const message = err.error?.detail || err.error?.message || 'Failed to load users';
          this.error.set(message);
          this.isLoading.set(false);
          return throwError(() => new Error(message));
        })
      )
      .subscribe({
        next: (res) => {
          this.users.set(res.results);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  loadRoles(): void {
    this.http
      .get<PaginatedResponse<SystemRole>>(getApiUrl('/accounts/system-roles/'))
      .pipe(
        catchError((err) => {
          const message = err.error?.detail || 'Failed to load roles';
          return throwError(() => new Error(message));
        })
      )
      .subscribe({
        next: (res) => this.availableRoles.set(res.results || []),
        error: () => this.availableRoles.set([]),
      });
  }

  updateUserRole(userId: string, systemRoleId: number): void {
    this.http
      .patch<SystemUser>(
        getApiUrl(`/accounts/users/${userId}/role/`),
        { system_role_id: systemRoleId }
      )
      .pipe(
        catchError((err) => {
          const message = err.error?.detail || 'Failed to update role';
          return throwError(() => new Error(message));
        })
      )
      .subscribe({
        next: (updated) => {
          this.users.update((list) =>
            list.map((u) => (u.id === userId ? { ...u, ...updated } : u))
          );
        },
      });
  }

  revokeAccess(userId: string): void {
    this.http
      .post<void>(
        getApiUrl(`/accounts/users/${userId}/revoke-access/`),
        { action: 'REVOKE_AND_BLACKLIST', notes: 'Revoked by admin via System Access panel' }
      )
      .pipe(
        catchError((err) => {
          const message = err.error?.detail || 'Failed to revoke access';
          return throwError(() => new Error(message));
        })
      )
      .subscribe({
        next: () => {
          this.users.update((list) =>
            list.map((u) => (u.id === userId ? { ...u, is_active: false } : u))
          );
        },
      });
  }
}
