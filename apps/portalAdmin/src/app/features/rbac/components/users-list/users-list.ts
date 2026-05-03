/**
 * Users List Component
 * RBAC module - system access management with data table
 */

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RbacService } from '../../services/rbac.service';
import { AdminUser } from '../../../../shared/models/rbac.models';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge';
import { CreateUserDialogComponent } from '../create-user-dialog/create-user-dialog';
import { EditRoleDialogComponent } from '../edit-role-dialog/edit-role-dialog';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatChipsModule,
    MatMenuModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    StatusBadgeComponent,
  ],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div class="title-section">
          <h1>System Access</h1>
          <p class="subtitle">User Management & RBAC</p>
        </div>
        <button mat-raised-button color="primary" (click)="createUser()">
          <mat-icon>person_add</mat-icon>
          Create User
        </button>
      </header>

      @if (rbacService.error()) {
        <div class="error-alert">
          <mat-icon>error</mat-icon>
          <span>{{ rbacService.error() }}</span>
        </div>
      }

      <mat-card class="content-card">
        <mat-card-content>
          <div class="table-container">
            <table mat-table [dataSource]="users()" matSort (matSortChange)="onSort()">
              
              <ng-container matColumnDef="user">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>User</th>
                <td mat-cell *matCellDef="let user">
                  <div class="user-info">
                    <div class="avatar">{{ getInitials(getUserName(user)) }}</div>
                    <div class="user-details">
                      <span class="user-name">{{ getUserName(user) }}</span>
                      <span class="user-email">{{ user.email }}</span>
                    </div>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="portal">
                <th mat-header-cell *matHeaderCellDef>Portal</th>
                <td mat-cell *matCellDef="let user">{{ getPortalType(user) }}</td>
              </ng-container>

              <ng-container matColumnDef="role">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Role</th>
                <td mat-cell *matCellDef="let user">
                  <mat-chip-listbox>
                    <mat-chip-option selected highlighted>{{ getRoleName(user) }}</mat-chip-option>
                  </mat-chip-listbox>
                </td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let user">
                  <app-status-badge [type]="user.is_active ? 'active' : 'inactive'"></app-status-badge>
                </td>
              </ng-container>

              <ng-container matColumnDef="last_login">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Last Login</th>
                <td mat-cell *matCellDef="let user">{{ user.last_login | date:'mediumDate' }}</td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="actions-header"></th>
                <td mat-cell *matCellDef="let user" class="actions-cell">
                  <button mat-icon-button [matMenuTriggerFor]="menu">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #menu="matMenu">
                    <button mat-menu-item (click)="viewUser(user)">
                      <mat-icon>visibility</mat-icon>
                      <span>View Details</span>
                    </button>
                    <button mat-menu-item (click)="editRole(user)">
                      <mat-icon>edit</mat-icon>
                      <span>Edit Role</span>
                    </button>
                    <button mat-menu-item (click)="resetPassword(user)">
                      <mat-icon>lock_reset</mat-icon>
                      <span>Reset Password</span>
                    </button>
                    <mat-divider></mat-divider>
                    @if (user.is_active) {
                      <button mat-menu-item (click)="revokeAccess(user)" class="revoke-action">
                        <mat-icon>block</mat-icon>
                        <span>Revoke Access</span>
                      </button>
                    }
                  </mat-menu>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

              <tr class="mat-row no-data-row" *matNoDataRow>
                <td class="mat-cell" [attr.colspan]="displayedColumns.length">
                  <div class="no-data-message">
                    @if (rbacService.isLoading()) {
                      <mat-spinner diameter="40"></mat-spinner>
                    } @else {
                      <mat-icon>security</mat-icon>
                      <p>No users found</p>
                    }
                  </div>
                </td>
              </tr>
            </table>
          </div>

          <mat-paginator
            [length]="rbacService.totalCount()"
            [pageSize]="pageSize"
            [pageSizeOptions]="[10, 25, 50, 100]"
            [pageIndex]="currentPage"
            (page)="onPageChange($event)">
          </mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
    .page-header .title-section h1 { font-size: 24px; font-weight: 600; margin: 0 0 4px 0; }
    .page-header .title-section .subtitle { color: #6b7280; margin: 0; }

    .error-alert { display: flex; align-items: center; gap: 8px; padding: 16px; background: #fee2e2; border-radius: 8px; color: #dc2626; margin-bottom: 24px; }
    .content-card { border-radius: 12px; }
    .table-container { overflow-x: auto; }
    table { width: 100%; }
    .mat-mdc-header-cell { font-weight: 600; color: #374151; background-color: #f9fafb; }

    .user-info { display: flex; align-items: center; gap: 12px; }
    .user-info .avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); color: white; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; }
    .user-info .user-details { display: flex; flex-direction: column; }
    .user-info .user-name { font-weight: 500; color: #1f2937; }
    .user-info .user-email { font-size: 12px; color: #6b7280; }

    .actions-header { width: 50px; }
    .actions-cell { text-align: right; }
    .revoke-action { color: #dc2626; }
    .revoke-action mat-icon { color: #dc2626; }
    .no-data-row .mat-cell { padding: 48px 24px; text-align: center; }
    .no-data-message { display: flex; flex-direction: column; align-items: center; gap: 16px; color: #9ca3af; }
    .no-data-message mat-icon { font-size: 48px; width: 48px; height: 48px; }
    mat-paginator { border-top: 1px solid #e5e7eb; }
  `],
})
export class UsersListComponent implements OnInit {
  readonly rbacService = inject(RbacService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  readonly users = this.rbacService.users;
  readonly displayedColumns = ['user', 'portal', 'role', 'status', 'last_login', 'actions'];

  currentPage = 0;
  pageSize = 25;

  ngOnInit(): void {
    this.loadUsers();
    this.rbacService.loadRoles();
  }

  loadUsers(): void {
    this.rbacService.getUsers(this.currentPage + 1, this.pageSize)
      .subscribe((response) => this.rbacService.setUsers(response.results, response.count));
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadUsers();
  }

  onSort(): void { this.loadUsers(); }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getUserName(user: AdminUser): string {
    return user.full_name || `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.email;
  }

  getPortalType(user: AdminUser): string {
    return user.portal_type ?? user.system_role?.portal_type ?? user.role;
  }

  getRoleName(user: AdminUser): string {
    return user.role_name ?? user.system_role?.name ?? user.role;
  }

  createUser(): void {
    const ref = this.dialog.open(CreateUserDialogComponent, { width: '560px', disableClose: true });
    ref.afterClosed().subscribe((created) => { if (created) this.loadUsers(); });
  }

  viewUser(user: AdminUser): void {
    this.snackBar.open(`Viewing ${this.getUserName(user)}`, 'Close', { duration: 3000 });
  }

  editRole(user: AdminUser): void {
    const ref = this.dialog.open(EditRoleDialogComponent, {
      width: '480px',
      disableClose: true,
      data: { user },
    });
    ref.afterClosed().subscribe((updated) => { if (updated) this.loadUsers(); });
  }

  resetPassword(user: AdminUser): void {
    this.snackBar.open(`Password reset for ${this.getUserName(user)}`, 'Close', { duration: 3000 });
  }

  revokeAccess(user: AdminUser): void {
    if (confirm(`Are you sure you want to revoke access for ${this.getUserName(user)}?`)) {
      this.rbacService.revokeAccess(user.id, 'Access revoked by admin').subscribe({
        next: () => {
          this.snackBar.open(`Access revoked for ${this.getUserName(user)}`, 'Close', { duration: 3000 });
          this.loadUsers();
        },
        error: (err) => {
          this.snackBar.open(`Failed to revoke: ${err.message}`, 'Close', { duration: 5000 });
        },
      });
    }
  }
}
