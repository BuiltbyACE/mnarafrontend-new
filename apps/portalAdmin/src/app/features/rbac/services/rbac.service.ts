/**
 * RBAC Service
 * Manages users, roles, and permissions
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { getApiUrl } from '@sms/core/config';
import { AdminUser, UserCreateRequest, RoleUpdateRequest, SystemRole } from '../../../shared/models/rbac.models';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

@Injectable({
  providedIn: 'root',
})
export class RbacService {
  private http = inject(HttpClient);

  readonly users = signal<AdminUser[]>([]);
  readonly roles = signal<SystemRole[]>([]);
  readonly totalCount = signal<number>(0);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  getUsers(
    page: number = 1,
    pageSize: number = 25,
    filters?: { role?: string; is_active?: boolean }
  ): Observable<PaginatedResponse<AdminUser>> {
    this.isLoading.set(true);
    this.error.set(null);

    let params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());

    if (filters?.role) {
      params = params.set('role', filters.role);
    }
    if (filters?.is_active !== undefined) {
      params = params.set('is_active', filters.is_active.toString());
    }

    return this.http
      .get<PaginatedResponse<AdminUser>>(getApiUrl('/accounts/users/'), { params })
      .pipe(
        catchError((err) => {
          const message = err.error?.message || 'Failed to load users';
          this.error.set(message);
          this.isLoading.set(false);
          return throwError(() => new Error(message));
        })
      );
  }

  createUser(data: UserCreateRequest): Observable<AdminUser> {
    return this.http.post<AdminUser>(getApiUrl('/accounts/users/'), data);
  }

  updateUserRole(userId: string, data: RoleUpdateRequest): Observable<AdminUser> {
    return this.http.patch<AdminUser>(getApiUrl(`/accounts/users/${userId}/role/`), data);
  }

  revokeAccess(userId: string, notes: string): Observable<void> {
    return this.http.post<void>(
      getApiUrl(`/accounts/users/${userId}/revoke-access/`),
      { action: 'REVOKE_AND_BLACKLIST', notes }
    );
  }

  resetPassword(userId: string): Observable<{ temp_password: string }> {
    return this.http.post<{ temp_password: string }>(getApiUrl(`/accounts/users/${userId}/reset-password/`), {});
  }

  getRoles(): Observable<SystemRole[]> {
    return this.http.get<SystemRole[]>(getApiUrl('/accounts/roles/'));
  }

  setUsers(data: AdminUser[], total: number): void {
    this.users.set(data);
    this.totalCount.set(total);
    this.isLoading.set(false);
  }

  loadRoles(): void {
    this.getRoles().subscribe({
      next: (roles) => this.roles.set(roles),
      error: () => this.roles.set([]),
    });
  }
}
