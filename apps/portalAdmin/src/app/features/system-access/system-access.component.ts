import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReactiveFormsModule } from '@angular/forms';
import { SystemAccessService } from './system-access.service';

type FilterType = 'ALL' | 'ADMIN' | 'STAFF' | 'TEACHER' | 'PARENT' | 'STUDENT';

@Component({
  selector: 'app-system-access',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatChipsModule,
    MatTabsModule,
    MatButtonToggleModule,
    MatTooltipModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-text">
          <h1 class="page-title">System Access & RBAC</h1>
          <p class="page-subtitle">Manage user roles and security clearances</p>
        </div>
      </div>

      <mat-tab-group class="access-tabs" dynamicHeight>
        <mat-tab label="User Access Matrix">
          <ng-template matTabContent>
            <div class="filter-bar">
              <mat-button-toggle-group
                name="portalFilter"
                [value]="activeFilter()"
                (change)="activeFilter.set($event.value)"
                class="filter-toggle-group"
              >
                <mat-button-toggle value="ALL">All</mat-button-toggle>
                <mat-button-toggle value="ADMIN">Admins</mat-button-toggle>
                <mat-button-toggle value="STAFF">Staff</mat-button-toggle>
                <mat-button-toggle value="TEACHER">Teachers</mat-button-toggle>
                <mat-button-toggle value="PARENT">Parents</mat-button-toggle>
                <mat-button-toggle value="STUDENT">Students</mat-button-toggle>
              </mat-button-toggle-group>
            </div>

            <div class="kpi-grid">
              <mat-card class="kpi-card">
                <div class="kpi-content">
                  <div class="kpi-icon kpi-icon-total">
                    <mat-icon>people</mat-icon>
                  </div>
                  <div class="kpi-info">
                    <span class="kpi-value">{{ totalAccounts() }}</span>
                    <span class="kpi-label">Total Accounts</span>
                  </div>
                </div>
              </mat-card>
              <mat-card class="kpi-card">
                <div class="kpi-content">
                  <div class="kpi-icon kpi-icon-admin">
                    <mat-icon>admin_panel_settings</mat-icon>
                  </div>
                  <div class="kpi-info">
                    <span class="kpi-value">{{ activeAdmins() }}</span>
                    <span class="kpi-label">Active Administrators</span>
                  </div>
                </div>
              </mat-card>
              <mat-card class="kpi-card">
                <div class="kpi-content">
                  <div class="kpi-icon kpi-icon-revoked">
                    <mat-icon>block</mat-icon>
                  </div>
                  <div class="kpi-info">
                    <span class="kpi-value">{{ revokedAccounts() }}</span>
                    <span class="kpi-label">Revoked Accounts</span>
                  </div>
                </div>
              </mat-card>
            </div>

            <mat-card class="table-card">
              <div class="table-toolbar">
                <span class="table-title">User Accounts</span>
                @if (service.isLoading()) {
                  <span class="table-loading">Loading...</span>
                }
              </div>
              <div class="table-wrapper">
                <table mat-table [dataSource]="filteredUsers()" class="rbac-table">
                  <ng-container matColumnDef="user">
                    <th mat-header-cell *matHeaderCellDef>User</th>
                    <td mat-cell *matCellDef="let u">
                      <div class="cell-user">
                        <span class="cell-avatar">{{ (u.first_name || u.school_id || u.email || '?').charAt(0) | uppercase }}</span>
                        <div class="cell-user-text">
                          <span class="cell-user-name">{{ u.first_name ? (u.first_name + ' ' + (u.last_name || '')) : (u.full_name || u.school_id || u.email) }}</span>
                          <span class="cell-user-id">{{ u.school_id || u.id }}</span>
                        </div>
                      </div>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="portal">
                    <th mat-header-cell *matHeaderCellDef>Portal Access</th>
                    <td mat-cell *matCellDef="let u">
                      <span class="cell-portal">{{ u.system_role?.portal_type || u.role || '—' }}</span>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="role">
                    <th mat-header-cell *matHeaderCellDef>Role Assignment</th>
                    <td mat-cell *matCellDef="let u">
                      <div class="role-cell">
                        @if (u.system_role) {
                          <mat-select
                            class="role-select"
                            [value]="u.system_role.id"
                            (selectionChange)="onRoleChange(u.id, $event.value)"
                            [disabled]="!u.is_active"
                          >
                            @for (r of service.availableRoles(); track r.id) {
                              <mat-option [value]="r.id">{{ r.name }}</mat-option>
                            }
                          </mat-select>
                        } @else {
                          <div class="legacy-role-row">
                            <mat-icon
                              class="legacy-warn-icon"
                              [matTooltip]="'Legacy Role: ' + (u.role || 'N/A') + ' — Please Assign System Role'"
                              matTooltipPosition="above"
                            >warning_amber</mat-icon>
                            <span class="legacy-badge">{{ u.role || 'Unassigned' }}</span>
                            <mat-select
                              class="role-select"
                              [value]="null"
                              (selectionChange)="onRoleChange(u.id, $event.value)"
                              [disabled]="!u.is_active"
                            >
                              @for (r of service.availableRoles(); track r.id) {
                                <mat-option [value]="r.id">{{ r.name }}</mat-option>
                              }
                            </mat-select>
                          </div>
                        }
                      </div>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Status</th>
                    <td mat-cell *matCellDef="let u">
                      <mat-chip-set>
                        <mat-chip
                          [class.chip-active]="u.is_active"
                          [class.chip-inactive]="!u.is_active"
                          disableRipple
                        >
                          {{ u.is_active ? 'Active' : 'Revoked' }}
                        </mat-chip>
                      </mat-chip-set>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="security">
                    <th mat-header-cell *matHeaderCellDef>Security</th>
                    <td mat-cell *matCellDef="let u">
                      <button
                        mat-icon-button
                        color="warn"
                        class="sec-btn"
                        [disabled]="!u.is_active"
                        [title]="'Revoke access for ' + (u.full_name || u.email)"
                        (click)="revokeAccess(u.id)"
                      >
                        <mat-icon>gavel</mat-icon>
                      </button>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
                </table>

                @if (filteredUsers().length === 0 && !service.isLoading()) {
                  <div class="table-empty">
                    <mat-icon>person_off</mat-icon>
                    <span>No user accounts found</span>
                  </div>
                }
              </div>
            </mat-card>
          </ng-template>
        </mat-tab>

        <mat-tab label="Role Configurations">
          <ng-template matTabContent>
            <mat-card class="table-card">
              <div class="table-toolbar">
                <span class="table-title">System Roles</span>
                <button mat-flat-button color="primary" class="create-role-btn" (click)="createRole()">
                  <mat-icon>add</mat-icon>
                  Create Custom Role
                </button>
              </div>
              <div class="table-wrapper">
                <table mat-table [dataSource]="service.availableRoles()" class="rbac-table">
                  <ng-container matColumnDef="name">
                    <th mat-header-cell *matHeaderCellDef>Role Name</th>
                    <td mat-cell *matCellDef="let r">
                      <span class="role-name-cell">{{ r.name }}</span>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="portal_type">
                    <th mat-header-cell *matHeaderCellDef>Portal Type</th>
                    <td mat-cell *matCellDef="let r">
                      <span class="cell-portal">{{ r.portal_type }}</span>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="mfa">
                    <th mat-header-cell *matHeaderCellDef>MFA Required</th>
                    <td mat-cell *matCellDef="let r">
                      <mat-icon [class.mfa-yes]="r.requires_mfa" [class.mfa-no]="!r.requires_mfa">
                        {{ r.requires_mfa ? 'shield' : 'shield_outline' }}
                      </mat-icon>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="roleColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: roleColumns;"></tr>
                </table>

                @if (service.availableRoles().length === 0) {
                  <div class="table-empty">
                    <mat-icon>admin_panel_settings</mat-icon>
                    <span>No roles configured</span>
                  </div>
                }
              </div>
            </mat-card>
          </ng-template>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 24px;
      max-width: 1280px;
      margin: 0 auto;
      font-family: 'Inter', system-ui, sans-serif;
    }

    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .header-text {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .page-title {
      font-size: 1.375rem;
      font-weight: 700;
      color: #1e293b;
      letter-spacing: -0.02em;
      margin: 0;
    }

    .page-subtitle {
      font-size: 0.8125rem;
      color: #64748b;
      margin: 0;
    }

    .access-tabs {
      .mat-mdc-tab-header {
        margin-bottom: 16px;
      }
    }

    .filter-bar {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
    }

    .filter-toggle-group {
      .mat-button-toggle {
        font-size: 0.75rem;
        font-weight: 500;
        font-family: 'Inter', system-ui, sans-serif;
        height: 34px;
        line-height: 34px;
      }

      .mat-button-toggle-checked {
        background: #2563eb;
        color: white;
      }
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 20px;
    }

    .kpi-card {
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      padding: 16px 20px;
    }

    .kpi-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .kpi-icon {
      width: 44px;
      height: 44px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
      }
    }

    .kpi-icon-total {
      background: #eff6ff;
      color: #2563eb;
    }

    .kpi-icon-admin {
      background: #f0fdf4;
      color: #16a34a;
    }

    .kpi-icon-revoked {
      background: #fef2f2;
      color: #dc2626;
    }

    .kpi-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .kpi-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
      line-height: 1;
    }

    .kpi-label {
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 500;
    }

    .table-card {
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      overflow: hidden;
    }

    .table-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid #e2e8f0;
      background: #fafbfc;
    }

    .table-title {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #1e293b;
    }

    .table-loading {
      font-size: 0.75rem;
      color: #94a3b8;
      font-weight: 500;
    }

    .table-wrapper {
      overflow-x: auto;
      position: relative;
      min-height: 120px;
    }

    .rbac-table {
      width: 100%;
      border-collapse: collapse;

      .mat-mdc-header-row {
        background: #f8fafc;
        height: 44px;
      }

      .mat-mdc-header-cell {
        font-size: 0.6875rem;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 0 16px;
        border-bottom: 1px solid #e2e8f0;
      }

      .mat-mdc-row {
        height: 56px;
        transition: background 0.15s ease;

        &:hover {
          background: #f8fafc;
        }
      }

      .mat-mdc-cell {
        padding: 0 16px;
        border-bottom: 1px solid #f1f5f9;
        font-size: 0.8125rem;
        color: #334155;
      }
    }

    .cell-user {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .cell-avatar {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      background: #2563EB;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
      flex-shrink: 0;
    }

    .cell-user-text {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }

    .cell-user-name {
      font-size: 0.8125rem;
      font-weight: 500;
      color: #1e293b;
    }

    .cell-user-id {
      font-size: 0.6875rem;
      color: #94a3b8;
      font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
    }

    .cell-portal {
      display: inline-flex;
      align-items: center;
      padding: 2px 10px;
      background: #f1f5f9;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
      color: #475569;
    }

    .role-cell {
      display: flex;
      align-items: center;
    }

    .legacy-role-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .legacy-warn-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #d97706;
      flex-shrink: 0;
      cursor: help;
    }

    .legacy-badge {
      display: inline-flex;
      align-items: center;
      padding: 1px 8px;
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 4px;
      font-size: 0.6875rem;
      font-weight: 500;
      color: #92400e;
      white-space: nowrap;
      font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
    }

    .role-select {
      width: 170px;
      font-size: 0.8125rem;
      font-family: 'Inter', system-ui, sans-serif;

      &.mat-mdc-select {
        padding: 4px 8px;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        background: white;
        transition: border-color 0.15s;

        &:hover:not(.mat-mdc-select-disabled) {
          border-color: #2563EB;
        }

        &.mat-mdc-select-disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }

    mat-chip-set {
      display: flex;
    }

    mat-chip.chip-active {
      background: #dcfce7 !important;
      color: #166534 !important;
      font-size: 0.6875rem;
      font-weight: 600;
      padding: 0 10px;
      min-height: 24px;
      border-radius: 4px;
    }

    mat-chip.chip-inactive {
      background: #fef2f2 !important;
      color: #991b1b !important;
      font-size: 0.6875rem;
      font-weight: 600;
      padding: 0 10px;
      min-height: 24px;
      border-radius: 4px;
    }

    .sec-btn {
      width: 32px;
      height: 32px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      transition: background 0.15s;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      &:hover:not([disabled]) {
        background: #fef2f2;
      }

      &[disabled] {
        opacity: 0.3;
      }
    }

    .table-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 16px;
      gap: 8px;
      color: #94a3b8;

      mat-icon {
        font-size: 36px;
        width: 36px;
        height: 36px;
      }

      span {
        font-size: 0.8125rem;
        font-weight: 500;
      }
    }

    .create-role-btn {
      font-size: 0.75rem;
      font-weight: 600;
      font-family: 'Inter', system-ui, sans-serif;
      height: 32px;
      line-height: 32px;
      padding: 0 12px;
      border-radius: 6px;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        margin-right: 4px;
      }
    }

    .role-name-cell {
      font-size: 0.8125rem;
      font-weight: 500;
      color: #1e293b;
    }

    .mfa-yes {
      color: #16a34a;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .mfa-no {
      color: #cbd5e1;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
  `],
})
export class SystemAccessComponent implements OnInit {
  readonly service = inject(SystemAccessService);

  readonly displayedColumns = ['user', 'portal', 'role', 'status', 'security'];
  readonly roleColumns = ['name', 'portal_type', 'mfa'];

  readonly activeFilter = signal<FilterType>('ALL');

  readonly filteredUsers = computed(() => {
    const filter = this.activeFilter();
    const users = this.service.users();
    if (filter === 'ALL') return users;
    return users.filter(
      (u) =>
        u.system_role?.portal_type === filter ||
        u.role === filter
    );
  });

  readonly totalAccounts = computed(() => this.service.users().length);

  readonly activeAdmins = computed(() =>
    this.service.users().filter(
      (u) =>
        (u.system_role?.portal_type === 'ADMIN' || u.role === 'ADMIN') &&
        u.is_active
    ).length
  );

  readonly revokedAccounts = computed(() =>
    this.service.users().filter((u) => !u.is_active).length
  );

  ngOnInit(): void {
    this.service.loadUsers();
    this.service.loadRoles();
  }

  onRoleChange(userId: string, systemRoleId: number): void {
    if (!systemRoleId) return;
    this.service.updateUserRole(userId, systemRoleId);
  }

  revokeAccess(userId: string): void {
    this.service.revokeAccess(userId);
  }

  createRole(): void {
    console.log('Open Dialog to create role');
  }
}
