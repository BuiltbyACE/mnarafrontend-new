// /**
//  * Faculty List Component
//  * Staff & HR module - faculty management with data table
//  */

// import { Component, inject, OnInit, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { MatCardModule } from '@angular/material/card';
// import { MatIconModule } from '@angular/material/icon';
// import { MatButtonModule } from '@angular/material/button';
// import { MatTableModule } from '@angular/material/table';
// import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
// import { MatSortModule, Sort } from '@angular/material/sort';
// import { MatChipsModule } from '@angular/material/chips';
// import { MatMenuModule } from '@angular/material/menu';
// import { MatDividerModule } from '@angular/material/divider';
// import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
// import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
// import { StaffService } from '../../services/staff.service';
// import { Faculty } from '../../../../shared/models/staff.models';
// import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge';

// @Component({
//   selector: 'app-faculty-list',
//   standalone: true,
//   imports: [
//     CommonModule,
//     MatCardModule,
//     MatIconModule,
//     MatButtonModule,
//     MatTableModule,
//     MatPaginatorModule,
//     MatSortModule,
//     MatChipsModule,
//     MatMenuModule,
//     MatDividerModule,
//     MatProgressSpinnerModule,
//     MatSnackBarModule,
//     StatusBadgeComponent,
//   ],
//   template: `
//     <div class="page-container">
//       <header class="page-header">
//         <div class="title-section">
//           <h1>Staff & HR</h1>
//           <p class="subtitle">Faculty & Support Staff</p>
//         </div>
//         <button mat-raised-button color="primary" (click)="addStaff()">
//           <mat-icon>person_add</mat-icon>
//           Add Staff
//         </button>
//       </header>

//       <!-- Payroll Summary Cards -->
//       <div class="summary-cards">
//         <mat-card class="summary-card">
//           <mat-card-content>
//             <div class="summary-icon payroll">
//             <mat-icon>payments</mat-icon>
//           </div>
//           <div class="summary-info">
//             <span class="summary-value">{{ formatCurrency(monthlyPayroll()) }}</span>
//             <span class="summary-label">Monthly Payroll</span>
//           </div>
//         </mat-card-content>
//       </mat-card>

//         @if (payrollSummary(); as summary) {
//           <mat-card class="summary-card" [class.alert]="summary.payrolls_pending_approval > 0">
//             <mat-card-content>
//               <div class="summary-icon pending">
//                 <mat-icon>pending_actions</mat-icon>
//               </div>
//               <div class="summary-info">
//                 <span class="summary-value">{{ summary.payrolls_pending_approval }}</span>
//                 <span class="summary-label">Pending Approvals</span>
//               </div>
//             </mat-card-content>
//           </mat-card>
//         }
//       </div>

//       @if (staffService.error()) {
//         <div class="error-alert">
//           <mat-icon>error</mat-icon>
//           <span>{{ staffService.error() }}</span>
//         </div>
//       }

//       <mat-card class="content-card">
//         <mat-card-content>
//           <div class="table-container">
//             <table mat-table [dataSource]="staff()" matSort (matSortChange)="onSort($event)">
               
//               <!-- Staff Column -->
//               <ng-container matColumnDef="staff">
//                 <th mat-header-cell *matHeaderCellDef> Staff Member </th>
//                 <td mat-cell *matCellDef="let element">
//                   <div style="display: flex; align-items: center; gap: 12px;">
//                     <div class="avatar sm">{{ getInitials(element.other_names + ' ' + element.surname) }}</div>
//                     <div style="display: flex; flex-direction: column;">
//                       <span style="font-weight: 500;">{{ element.other_names }} {{ element.surname }}</span>
//                       <span style="font-size: 0.75rem; color: #64748b;">{{ element.employee_id || 'ID Pending' }}</span>
//                     </div>
//                   </div>
//                 </td>
//               </ng-container>

//               <!-- Role & Department Column -->
//               <ng-container matColumnDef="role">
//                 <th mat-header-cell *matHeaderCellDef> Role & Department </th>
//                 <td mat-cell *matCellDef="let element"> 
//                   <div style="display: flex; flex-direction: column;">
//                     <span style="font-weight: 500;">{{ element.role_display || 'Staff' }}</span>
//                     <span style="font-size: 0.75rem; color: #64748b;">{{ element.department_name }}</span>
//                   </div>
//                 </td>
//               </ng-container>

//               <!-- Type Column -->
//               <ng-container matColumnDef="type">
//                 <th mat-header-cell *matHeaderCellDef> Type </th>
//                 <td mat-cell *matCellDef="let element"> {{ element.employment_type_display || 'Full-Time' }} </td>
//               </ng-container>

//               <!-- Status Column -->
//               <ng-container matColumnDef="status">
//                 <th mat-header-cell *matHeaderCellDef> Status </th>
//                 <td mat-cell *matCellDef="let element"> 
//                   <app-status-badge [type]="element.is_active ? 'active' : 'inactive'"></app-status-badge> 
//                 </td>
//               </ng-container>

//               <!-- Actions Column -->
//               <ng-container matColumnDef="actions">
//                 <th mat-header-cell *matHeaderCellDef> Actions </th>
//                 <td mat-cell *matCellDef="let element">
//                   <button mat-icon-button color="primary"><mat-icon>visibility</mat-icon></button>
//                   <button mat-icon-button color="accent"><mat-icon>edit</mat-icon></button>
//                 </td>
//               </ng-container>

//               <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
//               <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

//               <tr class="mat-row no-data-row" *matNoDataRow>
//                 <td class="mat-cell" [attr.colspan]="displayedColumns.length">
//                   <div class="no-data-message">
//                     @if (staffService.isLoading()) {
//                       <mat-spinner diameter="40"></mat-spinner>
//                     } @else {
//                       <mat-icon>people</mat-icon>
//                       <p>No staff members found</p>
//                     }
//                   </div>
//                 </td>
//               </tr>
//             </table>
//           </div>

//           <mat-paginator
//             [length]="staffService.totalCount()"
//             [pageSize]="pageSize"
//             [pageSizeOptions]="[10, 25, 50, 100]"
//             [pageIndex]="currentPage"
//             (page)="onPageChange($event)"
//             aria-label="Select page of staff">
//           </mat-paginator>
//         </mat-card-content>
//       </mat-card>
//     </div>
//   `,
//   styles: [`
//     .page-container {
//       padding: 24px;
//     }

//     .page-header {
//       display: flex;
//       align-items: center;
//       justify-content: space-between;
//       gap: 16px;
//       margin-bottom: 24px;

//       .title-section {
//         h1 {
//           font-size: 24px;
//           font-weight: 600;
//           margin: 0 0 4px 0;
//         }

//         .subtitle {
//           color: #6b7280;
//           margin: 0;
//         }
//       }
//     }

//     .summary-cards {
//       display: grid;
//       grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
//       gap: 16px;
//       margin-bottom: 24px;
//     }

//     .summary-card {
//       border-radius: 12px;

//       mat-card-content {
//         display: flex;
//         align-items: center;
//         gap: 16px;
//         padding: 20px;
//       }

//       &.alert {
//         background: #fef3c7;
//         border: 1px solid #f59e0b;
//       }
//     }

//     .summary-icon {
//       width: 48px;
//       height: 48px;
//       border-radius: 12px;
//       display: flex;
//       align-items: center;
//       justify-content: center;

//       &.payroll {
//         background: #dbeafe;
//         color: #3b82f6;
//       }

//       &.pending {
//         background: #fef3c7;
//         color: #f59e0b;
//       }

//       mat-icon {
//         font-size: 24px;
//         width: 24px;
//         height: 24px;
//       }
//     }

//     .summary-info {
//       display: flex;
//       flex-direction: column;

//       .summary-value {
//         font-size: 24px;
//         font-weight: 700;
//         color: #1f2937;
//       }

//       .summary-label {
//         font-size: 14px;
//         color: #6b7280;
//       }
//     }

//     .error-alert {
//       display: flex;
//       align-items: center;
//       gap: 8px;
//       padding: 16px;
//       background: #fee2e2;
//       border-radius: 8px;
//       color: #dc2626;
//       margin-bottom: 24px;
//     }

//     .content-card {
//       border-radius: 12px;
//     }

//     .table-container {
//       overflow-x: auto;
//     }

//     table {
//       width: 100%;
//     }

//     .mat-mdc-header-cell {
//       font-weight: 600;
//       color: #374151;
//       background-color: #f9fafb;
//     }

//     .staff-info {
//       display: flex;
//       align-items: center;
//       gap: 12px;

//       .avatar {
//         width: 40px;
//         height: 40px;
//         border-radius: 50%;
//         background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
//         color: white;
//         display: flex;
//         align-items: center;
//         justify-content: center;
//         font-size: 14px;
//         font-weight: 600;
//       }

//       .staff-details {
//         display: flex;
//         flex-direction: column;

//         .staff-name {
//           font-weight: 500;
//           color: #1f2937;
//         }

//         .staff-id {
//           font-size: 12px;
//           color: #6b7280;
//         }
//       }
//     }

//     .actions-header {
//       width: 50px;
//     }

//     .actions-cell {
//       text-align: right;
//     }

//     .deactivate-action {
//       color: #dc2626;

//       mat-icon {
//         color: #dc2626;
//       }
//     }

//     .no-data-row .mat-cell {
//       padding: 48px 24px;
//       text-align: center;
//     }

//     .no-data-message {
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       gap: 16px;
//       color: #9ca3af;

//       mat-icon {
//         font-size: 48px;
//         width: 48px;
//         height: 48px;
//       }

//       p {
//         margin: 0;
//       }
//     }

//     mat-paginator {
//       border-top: 1px solid #e5e7eb;
//     }
//   `],
// })
// export class FacultyListComponent implements OnInit {
//   readonly staffService = inject(StaffService);
//   private snackBar = inject(MatSnackBar);

//   readonly staff = this.staffService.staff;
//   readonly payrollSummary = this.staffService.payrollSummary;
//   readonly displayedColumns = ['staff', 'role', 'type', 'status', 'actions'];

//   readonly monthlyPayroll = computed(() => {
//     return this.staff().reduce((sum, staff) => sum + (Number((staff as any).base_salary) || 0), 0);
//   });

//   currentPage = 0;
//   pageSize = 25;

//   ngOnInit(): void {
//     this.loadStaff();
//     this.staffService.loadPayrollSummary();
//   }

//   loadStaff(): void {
//     this.staffService.getFaculty(this.currentPage + 1, this.pageSize)
//       .subscribe({
//         next: (response) => {
//           this.staffService.setStaff(response.results, response.count);
//         },
//         error: () => {
//           // Error handled in service
//         }
//       });
//   }

//   onPageChange(event: PageEvent): void {
//     this.currentPage = event.pageIndex;
//     this.pageSize = event.pageSize;
//     this.loadStaff();
//   }

//   onSort(sort: Sort): void {
//     // Sort handled by backend in real implementation
//     this.loadStaff();
//   }

//   getInitials(name: string): string {
//     if (!name) return '??';
//     return name
//       .split(' ')
//       .map(n => n[0])
//       .join('')
//       .toUpperCase()
//       .slice(0, 2) || '??';
//   }

//   formatCurrency(amount: number): string {
//     return new Intl.NumberFormat('en-KE', {
//       style: 'currency',
//       currency: 'KES',
//       minimumFractionDigits: 0,
//     }).format(amount);
//   }

//   addStaff(): void {
//     this.snackBar.open('Add staff feature coming soon', 'Close', { duration: 3000 });
//   }

//   viewStaff(faculty: Faculty): void {
//     this.snackBar.open(`Viewing ${faculty.full_name}'s profile`, 'Close', { duration: 3000 });
//   }

//   editStaff(faculty: Faculty): void {
//     this.snackBar.open(`Editing ${faculty.full_name}`, 'Close', { duration: 3000 });
//   }

//   viewPayroll(faculty: Faculty): void {
//     this.snackBar.open(`Viewing payroll for ${faculty.full_name}`, 'Close', { duration: 3000 });
//   }

//   deactivateStaff(faculty: Faculty): void {
//     if (confirm(`Are you sure you want to deactivate ${faculty.full_name}?`)) {
//       this.staffService.deactivateFaculty(faculty.id).subscribe({
//         next: () => {
//           this.snackBar.open(`${faculty.full_name} deactivated successfully`, 'Close', { duration: 3000 });
//           this.loadStaff();
//         },
//         error: (err) => {
//           this.snackBar.open(`Failed to deactivate: ${err.message}`, 'Close', { duration: 5000 });
//         }
//       });
//     }
//   }
// }























/**
 * Faculty List Component + Add Staff Wizard Dialog
 * Staff & HR module - Expandable data table + MatDialog Stepper Wizard
 * Location: apps/portalAdmin/src/app/features/staff/components/faculty-list/faculty-list.ts
 */

import {
  Component, inject, OnInit, computed,
  ChangeDetectionStrategy, signal, Inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';

// Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';

// App Imports
import { StaffService } from '../../services/staff.service';
import { Faculty } from '../../../../shared/models/staff.models';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge';


// ═══════════════════════════════════════════════════════════════════════════════
// ADD STAFF WIZARD DIALOG COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

@Component({
  selector: 'app-add-staff-wizard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatDialogModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="wizard-dialog-container">

      <!-- Dialog Header -->
      <div class="dialog-header">
        <div class="dialog-title-group">
          <div class="dialog-icon-wrap">
            <mat-icon>person_add</mat-icon>
          </div>
          <div>
            <h2 class="dialog-title">Add New Staff Member</h2>
            <p class="dialog-subtitle">Mnara ERP · Staff & HR Module</p>
          </div>
        </div>
        <button mat-icon-button (click)="close()" class="close-btn" aria-label="Close dialog">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Stepper -->
      <mat-stepper
        linear
        #stepper
        orientation="horizontal"
        class="wizard-stepper">

        <!-- ─────────────────────────────────────────────
             STEP 1 — Identity & Role
        ───────────────────────────────────────────── -->
        <mat-step
          [stepControl]="identityForm"
          [completed]="identityForm.valid">
          <ng-template matStepLabel>Identity & Role</ng-template>

          <form [formGroup]="identityForm" class="step-form" autocomplete="off">

            <div class="step-form-header">
              <mat-icon class="form-step-icon">badge</mat-icon>
              <div>
                <h3>Personal & Role Information</h3>
                <p>Enter the staff member's legal identity and system role.</p>
              </div>
            </div>

            <div class="form-row two-col">
              <div class="form-field">
                <label class="input-label">First Name *</label>
                <input formControlName="first_name" placeholder="e.g. Amina" />
                @if (identityForm.get('first_name')?.hasError('required') && identityForm.get('first_name')?.touched) {
                  <span class="error-text">First name is required</span>
                }
              </div>
              <div class="form-field">
                <label class="input-label">Last Name *</label>
                <input formControlName="last_name" placeholder="e.g. Odhiambo" />
                @if (identityForm.get('last_name')?.hasError('required') && identityForm.get('last_name')?.touched) {
                  <span class="error-text">Last name is required</span>
                }
              </div>
            </div>

            <div class="form-row two-col">
              <div class="form-field">
                <label class="input-label">Surname</label>
                <input formControlName="surname" placeholder="e.g. Odhiambo" />
              </div>
              <div class="form-field">
                <label class="input-label">Other Names</label>
                <input formControlName="other_names" placeholder="e.g. Amina Wanjiku" />
              </div>
            </div>

            <div class="form-row two-col">
              <div class="form-field">
                <label class="input-label">National ID *</label>
                <input formControlName="national_id" placeholder="e.g. 32456789" />
                @if (identityForm.get('national_id')?.hasError('required') && identityForm.get('national_id')?.touched) {
                  <span class="error-text">National ID is required</span>
                }
                @if (identityForm.get('national_id')?.hasError('pattern') && identityForm.get('national_id')?.touched) {
                  <span class="error-text">Must be 7–8 digits</span>
                }
              </div>
              <div class="form-field">
                <label class="input-label">KRA PIN *</label>
                <input formControlName="kra_pin" placeholder="e.g. A012345678Z" />
                @if (identityForm.get('kra_pin')?.hasError('required') && identityForm.get('kra_pin')?.touched) {
                  <span class="error-text">KRA PIN is required</span>
                }
                @if (identityForm.get('kra_pin')?.hasError('pattern') && identityForm.get('kra_pin')?.touched) {
                  <span class="error-text">Invalid KRA PIN format (e.g. A012345678Z)</span>
                }
              </div>
            </div>

            <div class="form-row two-col">
              <div class="form-field">
                <label class="input-label">Staff Role *</label>
                <select formControlName="staff_role">
                  <option value="TEACHER">Teacher — Academic Staff</option>
                  <option value="STAFF">Staff — Non-Teaching</option>
                  <option value="FINANCE">Finance</option>
                  <option value="ADMIN">Administrator</option>
                  <option value="SUPPORT_STAFF">Support Staff</option>
                </select>
              </div>
              <div class="form-field">
                <label class="input-label">Department</label>
                <select formControlName="department">
                  <option value="">— Select Department —</option>
                  @for (dept of departments(); track dept.id) {
                    <option [value]="dept.name">{{ dept.name }}</option>
                  }
                </select>
              </div>
            </div>

            <div class="form-row one-col">
              <div class="form-field">
                <label class="input-label">Qualification Level</label>
                <select formControlName="qualification_level">
                  <option value="DIPLOMA">Diploma</option>
                  <option value="DEGREE">Degree</option>
                  <option value="MASTERS">Masters</option>
                  <option value="PHD">PhD</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <div class="form-row two-col">
              <div class="form-field">
                <label class="input-label">Email</label>
                <input formControlName="email" placeholder="e.g. amina.odhiambo@school.ac.ke" />
              </div>
              <div class="form-field">
                <label class="input-label">Phone</label>
                <input formControlName="phone" placeholder="e.g. +254 712 345 678" />
              </div>
            </div>

            <div class="form-row two-col">
              <div class="form-field">
                <label class="input-label">NSSF Number</label>
                <input formControlName="nssf_number" placeholder="e.g. NSSF/001234" />
              </div>
              <div class="form-field">
                <label class="input-label">NHIF Number</label>
                <input formControlName="nhif_number" placeholder="e.g. NHIF/001234" />
              </div>
            </div>

            <div class="step-actions">
              <span class="required-note">* All fields are required</span>
              <button
                mat-flat-button
                color="primary"
                matStepperNext
                [disabled]="identityForm.invalid">
                Next: Pedagogical Data
                <mat-icon iconPositionEnd>arrow_forward</mat-icon>
              </button>
            </div>

          </form>
        </mat-step>

        <!-- ─────────────────────────────────────────────
             STEP 2 — Pedagogical Data (conditional)
        ───────────────────────────────────────────── -->
        <mat-step
          [stepControl]="pedagogyForm"
          [completed]="isPedagogyStepComplete()"
          [optional]="!isTeacher()">
          <ng-template matStepLabel>
            Pedagogical Data
            @if (!isTeacher()) {
              <span class="optional-tag">(Optional)</span>
            }
          </ng-template>

          <form [formGroup]="pedagogyForm" class="step-form" autocomplete="off">

            @if (isTeacher()) {

              <!-- Teacher flow -->
              <div class="step-form-header">
                <mat-icon class="form-step-icon teacher">school</mat-icon>
                <div>
                  <h3>Pedagogical Profile</h3>
                  <p>Provide teaching credentials for this staff member.</p>
                </div>
              </div>

              <div class="form-row two-col">
                <div class="form-field">
                  <label class="input-label">TSC Number *</label>
                  <input formControlName="tsc_number" placeholder="e.g. TSC/0012345" />
                  @if (pedagogyForm.get('tsc_number')?.hasError('required') && pedagogyForm.get('tsc_number')?.touched) {
                    <span class="error-text">TSC Number is required</span>
                  }
                </div>
                <div class="form-field">
                  <label class="input-label">Highest Degree *</label>
                  <input formControlName="highest_degree" placeholder="e.g. B.Ed. Mathematics" />
                  @if (pedagogyForm.get('highest_degree')?.hasError('required') && pedagogyForm.get('highest_degree')?.touched) {
                    <span class="error-text">Highest degree is required</span>
                  }
                </div>
              </div>

              <div class="form-row one-col">
                <div class="form-field">
                  <label class="input-label">Specialization / Teaching Area *</label>
                  <input formControlName="specialization_area" placeholder="e.g. Mathematics & Physics" />
                  @if (pedagogyForm.get('specialization_area')?.hasError('required') && pedagogyForm.get('specialization_area')?.touched) {
                    <span class="error-text">Specialization area is required</span>
                  }
                </div>
              </div>

              <div class="form-row one-col">
                <div class="form-field">
                  <label class="input-label">Teaching Subjects</label>
                  @if (loadingLookups()) {
                    <div class="subjects-loading">Loading subjects…</div>
                  } @else {
                    <div class="subjects-grid">
                      @for (sub of subjects(); track sub.id) {
                        <label class="subject-checkbox-label">
                          <input
                            type="checkbox"
                            [checked]="selectedSubjectIds().has(sub.id)"
                            (change)="toggleSubject(sub.id, sub.name)"
                          />
                          <span>{{ sub.name }}</span>
                        </label>
                      }
                      @if (subjects().length === 0) {
                        <span class="no-subjects">No subjects available</span>
                      }
                    </div>
                  }
                </div>
              </div>

            } @else {

              <!-- Support staff flow -->
              <div class="step-form-header">
                <mat-icon class="form-step-icon support">engineering</mat-icon>
                <div>
                  <h3>Support Staff Profile</h3>
                  <p>Optionally enter a specialization area for this support staff member.</p>
                </div>
              </div>

              <div class="form-row one-col">
                <div class="form-field">
                  <label class="input-label">Specialization Area (Optional)</label>
                  <input formControlName="specialization_area" placeholder="e.g. IT Infrastructure, Security, Catering" />
                </div>
              </div>

              <div class="skip-notice">
                <mat-icon>info_outline</mat-icon>
                <span>TSC Number is not required for non-teaching staff. You may skip this step.</span>
              </div>

            }

            <div class="step-actions">
              <button mat-stroked-button matStepperPrevious>
                <mat-icon>arrow_back</mat-icon>
                Back
              </button>
              <button
                mat-flat-button
                color="primary"
                matStepperNext
                [disabled]="isTeacher() && pedagogyForm.invalid">
                Next: Review & Submit
                <mat-icon iconPositionEnd>arrow_forward</mat-icon>
              </button>
            </div>

          </form>
        </mat-step>

        <!-- ─────────────────────────────────────────────
             STEP 3 — Review & Submit
        ───────────────────────────────────────────── -->
        <mat-step>
          <ng-template matStepLabel>Review & Submit</ng-template>

          <div class="step-form">

            <div class="step-form-header">
              <mat-icon class="form-step-icon review">fact_check</mat-icon>
              <div>
                <h3>Review Before Submitting</h3>
                <p>Verify the information below before creating the staff record.</p>
              </div>
            </div>

            <!-- Role Badge -->
            <div class="role-badge-row">
              <div class="role-badge" [class.teacher]="isTeacher()" [class.support]="!isTeacher()">
                <mat-icon>{{ isTeacher() ? 'school' : 'engineering' }}</mat-icon>
                <span>{{ getRoleLabel(identityForm.value.staff_role) }}</span>
              </div>
            </div>

            <!-- Summary Grid -->
            <div class="review-grid">

              <!-- Identity Block -->
              <div class="review-block">
                <div class="review-block-header">
                  <mat-icon>badge</mat-icon>
                  <span>Identity & Role</span>
                </div>
                <mat-divider></mat-divider>
                <div class="review-rows">
                  <div class="review-row">
                    <span class="review-label">Full Name</span>
                    <span class="review-value">
                      {{ identityForm.value.first_name }} {{ identityForm.value.last_name }}
                    </span>
                  </div>
                  @if (identityForm.value.surname) {
                    <div class="review-row">
                      <span class="review-label">Surname</span>
                      <span class="review-value">{{ identityForm.value.surname }}</span>
                    </div>
                  }
                  @if (identityForm.value.other_names) {
                    <div class="review-row">
                      <span class="review-label">Other Names</span>
                      <span class="review-value">{{ identityForm.value.other_names }}</span>
                    </div>
                  }
                  <div class="review-row">
                    <span class="review-label">National ID</span>
                    <span class="review-value">{{ identityForm.value.national_id }}</span>
                  </div>
                  <div class="review-row">
                    <span class="review-label">KRA PIN</span>
                    <span class="review-value">{{ identityForm.value.kra_pin }}</span>
                  </div>
                  <div class="review-row">
                    <span class="review-label">Staff Role</span>
                    <span class="review-value">{{ getRoleLabel(identityForm.value.staff_role) }}</span>
                  </div>
                  @if (identityForm.value.department) {
                    <div class="review-row">
                      <span class="review-label">Department</span>
                      <span class="review-value">{{ identityForm.value.department }}</span>
                    </div>
                  }
                  <div class="review-row">
                    <span class="review-label">Qualification</span>
                    <span class="review-value">{{ identityForm.value.qualification_level }}</span>
                  </div>
                  @if (identityForm.value.email) {
                    <div class="review-row">
                      <span class="review-label">Email</span>
                      <span class="review-value">{{ identityForm.value.email }}</span>
                    </div>
                  }
                  @if (identityForm.value.phone) {
                    <div class="review-row">
                      <span class="review-label">Phone</span>
                      <span class="review-value">{{ identityForm.value.phone }}</span>
                    </div>
                  }
                  @if (identityForm.value.nssf_number) {
                    <div class="review-row">
                      <span class="review-label">NSSF</span>
                      <span class="review-value">{{ identityForm.value.nssf_number }}</span>
                    </div>
                  }
                  @if (identityForm.value.nhif_number) {
                    <div class="review-row">
                      <span class="review-label">NHIF</span>
                      <span class="review-value">{{ identityForm.value.nhif_number }}</span>
                    </div>
                  }
                </div>
              </div>

              <!-- Pedagogical Block -->
              <div class="review-block">
                <div class="review-block-header">
                  <mat-icon>{{ isTeacher() ? 'school' : 'engineering' }}</mat-icon>
                  <span>{{ isTeacher() ? 'Pedagogical Profile' : 'Support Profile' }}</span>
                </div>
                <mat-divider></mat-divider>
                <div class="review-rows">
                  @if (isTeacher()) {
                    <div class="review-row">
                      <span class="review-label">TSC Number</span>
                      <span class="review-value">{{ pedagogyForm.value.tsc_number || '—' }}</span>
                    </div>
                    <div class="review-row">
                      <span class="review-label">Highest Degree</span>
                      <span class="review-value">{{ pedagogyForm.value.highest_degree || '—' }}</span>
                    </div>
                  }
                  <div class="review-row">
                    <span class="review-label">Specialization</span>
                    <span class="review-value">{{ pedagogyForm.value.specialization_area || '—' }}</span>
                  </div>
                  @if (pedagogyForm.value.teaching_subjects?.length) {
                    <div class="review-row">
                      <span class="review-label">Subjects</span>
                      <span class="review-value">{{ pedagogyForm.value.teaching_subjects.join(', ') }}</span>
                    </div>
                  }
                </div>
              </div>

            </div>

            <!-- Submit Error -->
            @if (submitError()) {
              <div class="submit-error-box">
                <mat-icon>error_outline</mat-icon>
                <span>{{ submitError() }}</span>
              </div>
            }

            <!-- Actions -->
            <div class="step-actions">
              <button mat-stroked-button matStepperPrevious [disabled]="isSubmitting()">
                <mat-icon>arrow_back</mat-icon>
                Back
              </button>
              <button
                mat-flat-button
                color="primary"
                (click)="onSubmit()"
                [disabled]="isSubmitting()">
                @if (isSubmitting()) {
                  <mat-spinner diameter="18" class="btn-spinner"></mat-spinner>
                  Submitting...
                } @else {
                  <mat-icon>check_circle</mat-icon>
                  Create Staff Record
                }
              </button>
            </div>

          </div>
        </mat-step>

      </mat-stepper>
    </div>
  `,
  styles: [`
    /* ── Dialog Container ── */
    .wizard-dialog-container {
      display: flex;
      flex-direction: column;
      width: 680px;
      max-width: 100%;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
    }

    /* ── Dialog Header ── */
    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px 16px;
      background: linear-gradient(135deg, #1565c0 0%, #1976d2 100%);
      color: #ffffff;
    }

    .dialog-title-group {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .dialog-icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .dialog-icon-wrap mat-icon {
      color: #ffffff;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .dialog-title {
      margin: 0 0 2px;
      font-size: 1.15rem;
      font-weight: 700;
      color: #ffffff;
    }

    .dialog-subtitle {
      margin: 0;
      font-size: 0.78rem;
      color: rgba(255, 255, 255, 0.75);
    }

    .close-btn {
      color: rgba(255, 255, 255, 0.85) !important;
    }

    .close-btn:hover {
      color: #ffffff !important;
    }

    /* ── Stepper Overrides ── */
    .wizard-stepper {
      background: transparent !important;
    }

    .wizard-stepper .mat-horizontal-stepper-header-container {
      background: #f8fafc;
      border-bottom: 1px solid #e5e7eb;
      padding: 0 12px;
    }

    .wizard-stepper .mat-horizontal-content-container {
      background: #ffffff;
      padding: 0;
    }

    /* ── Step Form ── */
    .step-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 28px 32px 24px;
    }

    /* ── Step Form Header ── */
    .step-form-header {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding-bottom: 16px;
      border-bottom: 1px solid #f0f0f0;
    }

    .form-step-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #1976d2;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .form-step-icon.teacher { color: #1565c0; }
    .form-step-icon.support { color: #558b2f; }
    .form-step-icon.review  { color: #6a1b9a; }

    .step-form-header h3 {
      margin: 0 0 4px;
      font-size: 1.05rem;
      font-weight: 600;
      color: #1a1a2e;
    }

    .step-form-header p {
      margin: 0;
      font-size: 0.83rem;
      color: #6b7280;
    }

    /* ── Form Rows ── */
    .form-row {
      display: grid;
      gap: 16px;
    }

    .form-row.two-col {
      grid-template-columns: 1fr 1fr;
    }

    .form-row.one-col {
      grid-template-columns: 1fr;
    }

    .full-width {
      width: 100%;
    }

    /* ── Role option inside mat-select ── */
    .role-option {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .role-option mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #1976d2;
    }

    /* ── Optional tag on step label ── */
    .optional-tag {
      font-size: 0.72rem;
      color: #9e9e9e;
      margin-left: 4px;
    }

    /* ── Subjects Checkbox Grid ── */
    .subjects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 6px;
      max-height: 200px;
      overflow-y: auto;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 10px 12px;
      background: #fafafa;
    }
    .subject-checkbox-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
      color: #374151;
      cursor: pointer;
      padding: 2px 0;
    }
    .subject-checkbox-label input[type="checkbox"] {
      accent-color: #1976d2;
      cursor: pointer;
    }
    .subjects-loading {
      font-size: 0.85rem;
      color: #9e9e9e;
      padding: 8px 0;
    }
    .no-subjects {
      font-size: 0.85rem;
      color: #9e9e9e;
      grid-column: 1 / -1;
    }

    .skip-notice {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background: #fff8e1;
      border: 1px solid #ffe082;
      border-radius: 8px;
      color: #f57f17;
      font-size: 0.85rem;
    }

    .skip-notice mat-icon {
      flex-shrink: 0;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    /* ── Step Actions ── */
    .step-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      padding-top: 8px;
      border-top: 1px solid #f0f0f0;
    }

    .required-note {
      font-size: 0.78rem;
      color: #9e9e9e;
      margin-right: auto;
    }

    /* ── Review Step ── */
    .role-badge-row {
      display: flex;
    }

    .role-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 18px;
      border-radius: 50px;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .role-badge.teacher {
      background: #e3f2fd;
      color: #1565c0;
    }

    .role-badge.support {
      background: #f1f8e9;
      color: #33691e;
    }

    .role-badge mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .review-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .review-block {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 18px;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      background: #fafafa;
    }

    .review-block-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      font-size: 0.9rem;
      color: #374151;
    }

    .review-block-header mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #1976d2;
    }

    .review-rows {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-top: 4px;
    }

    .review-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 8px;
      font-size: 0.85rem;
      padding: 4px 0;
      border-bottom: 1px solid #f3f4f6;
    }

    .review-row:last-child {
      border-bottom: none;
    }

    .review-label {
      color: #6b7280;
      font-weight: 500;
      flex-shrink: 0;
    }

    .review-value {
      color: #111827;
      font-weight: 600;
      text-align: right;
    }

    /* ── Submit Error ── */
    .submit-error-box {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background: #fdecea;
      border: 1px solid #f5c6cb;
      border-radius: 8px;
      color: #c62828;
      font-size: 0.88rem;
    }

    .submit-error-box mat-icon {
      flex-shrink: 0;
      color: #c62828;
    }

    /* ── Spinner inside button ── */
    .btn-spinner {
      display: inline-block;
      margin-right: 8px;
      vertical-align: middle;
    }

    /* ── Responsive ── */
    @media (max-width: 600px) {
      .wizard-dialog-container { width: 100vw; }
      .form-row.two-col { grid-template-columns: 1fr; }
      .review-grid { grid-template-columns: 1fr; }
      .step-form { padding: 20px 16px 18px; }
    }
    .form-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      width: 100%;
    }
    .form-field input,
    .form-field select,
    .form-field textarea {
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
    .form-field select:focus,
    .form-field textarea:focus {
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
  `],
})
export class AddStaffWizardComponent {

  private readonly fb        = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<AddStaffWizardComponent>);
  private readonly staffService = inject(StaffService);

  // ── UI State ──────────────────────────────────────────
  isSubmitting = signal<boolean>(false);
  submitError  = signal<string | null>(null);

  // ── Step 1: Identity & Role ───────────────────────────
  identityForm: FormGroup = this.fb.group({
    first_name:          ['', [Validators.required, Validators.minLength(2)]],
    last_name:           ['', [Validators.required, Validators.minLength(2)]],
    surname:             [''],
    other_names:         [''],
    national_id:         ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
    kra_pin:             ['', [Validators.required, Validators.pattern(/^[A-Z]\d{9}[A-Z]$/)]],
    staff_role:          ['TEACHER', Validators.required],
    department:          [''],
    qualification_level: ['DEGREE'],
    email:               [''],
    phone:               [''],
    nssf_number:         [''],
    nhif_number:         [''],
  });

  // ── Step 2: Pedagogical Data ──────────────────────────
  pedagogyForm: FormGroup = this.fb.group({
    tsc_number:          [''],
    specialization_area: [''],
    highest_degree:      [''],
    teaching_subjects:   [[] as string[]],
  });

  // ── Data from API ─────────────────────────────────────
  departments = signal<any[]>([]);
  subjects    = signal<any[]>([]);
  loadingLookups = signal(false);

  // ── Derived ───────────────────────────────────────────
  isTeacher = computed(() => this.identityForm.get('staff_role')?.value === 'TEACHER');

  selectedSubjectIds = signal<Set<number>>(new Set());

  toggleSubject(id: number, name: string): void {
    const set = new Set(this.selectedSubjectIds());
    if (set.has(id)) {
      set.delete(id);
    } else {
      set.add(id);
    }
    this.selectedSubjectIds.set(set);
    this.pedagogyForm.patchValue({
      teaching_subjects: Array.from(set).map(sid => {
        const sub = this.subjects().find(s => s.id === sid);
        return sub ? sub.name : String(sid);
      })
    });
  }

  // ── Load lookups on init ──────────────────────────────
  constructor() {
    this.loadingLookups.set(true);
    this.staffService.getDepartments().subscribe({
      next: (deps) => this.departments.set(deps),
      error: () => this.departments.set([]),
    });
    this.staffService.getSubjects().subscribe({
      next: (subs) => { this.subjects.set(subs); this.loadingLookups.set(false); },
      error: () => { this.subjects.set([]); this.loadingLookups.set(false); },
    });

    this.identityForm.get('staff_role')!.valueChanges.subscribe((role: string) => {
      const tsc   = this.pedagogyForm.get('tsc_number')!;
      const spec  = this.pedagogyForm.get('specialization_area')!;
      const degree = this.pedagogyForm.get('highest_degree')!;

      if (role === 'TEACHER') {
        tsc.setValidators([Validators.required]);
        spec.setValidators([Validators.required]);
        degree.setValidators([Validators.required]);
      } else {
        tsc.clearValidators();
        spec.clearValidators();
        degree.clearValidators();
      }

      tsc.updateValueAndValidity();
      spec.updateValueAndValidity();
      degree.updateValueAndValidity();
    });
  }

  // ── Step 2 completion guard ───────────────────────────
  isPedagogyStepComplete(): boolean {
    if (this.isTeacher()) return this.pedagogyForm.valid;
    return true;
  }

  // ── Submit ────────────────────────────────────────────
  onSubmit(): void {
    if (this.identityForm.invalid) return;

    this.isSubmitting.set(true);
    this.submitError.set(null);

    const payload: any = {
      first_name:         this.identityForm.value.first_name,
      last_name:          this.identityForm.value.last_name,
      national_id:        this.identityForm.value.national_id,
      kra_pin:            this.identityForm.value.kra_pin,
      staff_role:         this.identityForm.value.staff_role,
    };

    if (this.identityForm.value.surname)             payload.surname             = this.identityForm.value.surname;
    if (this.identityForm.value.other_names)         payload.other_names         = this.identityForm.value.other_names;
    if (this.identityForm.value.email)               payload.email               = this.identityForm.value.email;
    if (this.identityForm.value.phone)               payload.phone               = this.identityForm.value.phone;
    if (this.identityForm.value.nssf_number)         payload.nssf_number         = this.identityForm.value.nssf_number;
    if (this.identityForm.value.nhif_number)         payload.nhif_number         = this.identityForm.value.nhif_number;
    if (this.identityForm.value.department)           payload.department          = this.identityForm.value.department;
    if (this.identityForm.value.qualification_level)  payload.qualification_level = this.identityForm.value.qualification_level;

    if (this.pedagogyForm.value.specialization_area) payload.specialization_area = this.pedagogyForm.value.specialization_area;
    if (this.pedagogyForm.value.tsc_number)          payload.tsc_number          = this.pedagogyForm.value.tsc_number;
    if (this.pedagogyForm.value.highest_degree)      payload.highest_degree      = this.pedagogyForm.value.highest_degree;

    const subjects = this.pedagogyForm.value.teaching_subjects || [];
    if (subjects.length > 0) payload.teaching_subjects = subjects;

    this.staffService.createFaculty(payload).subscribe({
      next: (created: Faculty) => {
        this.isSubmitting.set(false);
        this.dialogRef.close({ success: true, data: created });
      },
      error: (err: any) => {
        this.isSubmitting.set(false);
        this.submitError.set(
          err?.error?.detail ?? err?.message ?? 'Submission failed. Please try again.'
        );
      },
    });
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      TEACHER: 'Teacher — Academic Staff',
      STAFF: 'Staff — Non-Teaching',
      FINANCE: 'Finance',
      ADMIN: 'Administrator',
      SUPPORT_STAFF: 'Support Staff',
    };
    return labels[role] || role || '—';
  }

  close(): void {
    this.dialogRef.close({ success: false });
  }
}


// ═══════════════════════════════════════════════════════════════════════════════
// FACULTY LIST COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

@Component({
  selector: 'app-faculty-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    StatusBadgeComponent,
  ],
  animations: [
    trigger('detailExpand', [
      state('collapsed, void', style({ height: '0px', minHeight: '0', display: 'none' })),
      state('expanded',        style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
      transition('expanded <=> void',      animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
  template: `
    <div class="page-container">

      <!-- Page Header -->
      <header class="page-header">
        <div class="title-section">
          <h1>Staff & HR</h1>
          <p class="subtitle">Faculty & Support Staff Management</p>
        </div>
        <button mat-raised-button color="primary" (click)="openAddStaffWizard()">
          <mat-icon>person_add</mat-icon>
          Add New Staff
        </button>
      </header>

      <!-- Summary Cards -->
      <div class="summary-cards">
        <mat-card class="summary-card">
          <mat-card-content>
            <div class="summary-icon payroll">
              <mat-icon>payments</mat-icon>
            </div>
            <div class="summary-info">
              <span class="summary-value">{{ formatCurrency(monthlyPayroll()) }}</span>
              <span class="summary-label">Monthly Payroll</span>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Staff Table -->
      <mat-card class="content-card">
        <mat-card-content>
          <div class="table-container">
            <table
              mat-table
              [dataSource]="staff()"
              multiTemplateDataRows
              matSort
              (matSortChange)="onSort($event)">

              <!-- Staff Column -->
              <ng-container matColumnDef="staff">
                <th mat-header-cell *matHeaderCellDef>Staff Member</th>
                <td mat-cell *matCellDef="let element">
                  <div style="display:flex; align-items:center; gap:12px;">
                    @if (element.photo_url) {
                      <img [src]="element.photo_url" alt="" class="avatar-img sm" />
                    } @else {
                      <div class="avatar sm">{{ getInitials(element.full_name) }}</div>
                    }
                    <div style="display:flex; flex-direction:column;">
                      <span style="font-weight:600; color:#1f2937;">{{ element.full_name }}</span>
                      <span style="font-size:0.75rem; color:#64748b;">{{ element.school_id }}</span>
                    </div>
                  </div>
                </td>
              </ng-container>

              <!-- Role Column -->
              <ng-container matColumnDef="role">
                <th mat-header-cell *matHeaderCellDef>Role & Department</th>
                <td mat-cell *matCellDef="let element">
                  <div style="display:flex; flex-direction:column;">
                    <span style="font-weight:500;">{{ element.user_role || element.role }}</span>
                    <span style="font-size:0.75rem; color:#64748b;">{{ element.department_name || element.department }}</span>
                    @let isTeaching = element.staff_category === 'TEACHING' || element.role === 'TEACHER' || element.user_role === 'TEACHER' || !!element.teacher_profile;
                    <span class="staff-category-badge" [class.teaching]="isTeaching" [class.non-teaching]="!isTeaching">
                      {{ isTeaching ? 'Teaching' : 'Non-Teaching' }}
                    </span>
                  </div>
                </td>
              </ng-container>

              <!-- Qualification Column -->
              <ng-container matColumnDef="qualification">
                <th mat-header-cell *matHeaderCellDef>Qualification</th>
                <td mat-cell *matCellDef="let element">{{ element.qualification || element.qualification_level }}</td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let element">
                  <app-status-badge [type]="element.is_active !== false ? 'active' : 'inactive'">
                  </app-status-badge>
                </td>
              </ng-container>

              <!-- Expand Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Expand</th>
                <td mat-cell *matCellDef="let element">
                  <mat-icon color="primary">
                    {{ expandedElement === element ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}
                  </mat-icon>
                </td>
              </ng-container>

              <!-- Expanded Detail Row -->
              <ng-container matColumnDef="expandedDetail">
                <td mat-cell *matCellDef="let element" [attr.colspan]="displayedColumns.length">
                  <div
                    class="staff-detail-container"
                    [@detailExpand]="element === expandedElement ? 'expanded' : 'collapsed'">

                    <div class="detail-grid">

                      <!-- Contact & Statutory Details -->
                      <div class="detail-block">
                        <h4><mat-icon>contact_mail</mat-icon> Contact & ID</h4>
                        <div class="info-row">
                          <strong>Email:</strong><span>{{ element.email || '—' }}</span>
                        </div>
                        <div class="info-row">
                          <strong>Phone:</strong><span>{{ element.phone || '—' }}</span>
                        </div>
                        <div class="info-row">
                          <strong>Hire Date:</strong><span>{{ element.hire_date | date: 'mediumDate' }}</span>
                        </div>
                        <div class="info-row">
                          <strong>National ID:</strong><span>{{ element.national_id }}</span>
                        </div>
                        <div class="info-row">
                          <strong>KRA PIN:</strong><span>{{ element.kra_pin }}</span>
                        </div>
                        <div class="info-row">
                          <strong>NSSF:</strong><span>{{ element.nssf_number || '—' }}</span>
                        </div>
                        <div class="info-row">
                          <strong>NHIF:</strong><span>{{ element.nhif_number || '—' }}</span>
                        </div>
                      </div>

                      <!-- Teacher or Support block -->
                      @if ((element.role || element.user_role) === 'TEACHER' || element.teacher_profile) {
                        <div class="detail-block teacher-block">
                          <h4><mat-icon>school</mat-icon> Pedagogical Profile</h4>
                          <div class="info-row">
                            <strong>TSC Number:</strong>
                            <span>{{ element.tsc_number || element.teacher_profile?.tsc_number || '—' }}</span>
                          </div>
                          <div class="info-row">
                            <strong>Highest Degree:</strong>
                            <span>{{ element.highest_degree || element.teacher_profile?.highest_degree || '—' }}</span>
                          </div>
                          <div class="info-row">
                            <strong>Specialization:</strong>
                            <span>{{ element.specialization || element.specialization_area || '—' }}</span>
                          </div>
                          <div class="info-row">
                            <strong>Teaching Subjects:</strong>
                            <div class="subject-chips">
                              @for (sub of (element.teaching_subjects?.length ? element.teaching_subjects : element.teacher_profile?.teaching_subjects || []); track sub) {
                                <span class="chip">{{ sub }}</span>
                              }
                            </div>
                          </div>
                        </div>
                      } @else {
                        <div class="detail-block support-block">
                          <h4><mat-icon>engineering</mat-icon> Support Staff Profile</h4>
                          <div class="info-row">
                            <strong>Specialization:</strong>
                            <span>{{ element.specialization || element.specialization_area || '—' }}</span>
                          </div>
                        </div>
                      }

                      <!-- Row Actions -->
                      <div class="detail-actions">
                        <button mat-stroked-button color="primary">
                          <mat-icon>edit</mat-icon> Edit Record
                        </button>
                        <button mat-stroked-button color="accent">
                          <mat-icon>payments</mat-icon> View Payslips
                        </button>
                        <button mat-stroked-button color="warn">
                          <mat-icon>block</mat-icon> Suspend
                        </button>
                      </div>

                    </div>
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr
                mat-row
                *matRowDef="let element; columns: displayedColumns;"
                class="staff-row"
                [class.expanded-row]="expandedElement === element"
                (click)="expandedElement = expandedElement === element ? null : element">
              </tr>
              <tr mat-row *matRowDef="let row; columns: ['expandedDetail']" class="detail-row"></tr>

            </table>
          </div>

          <mat-paginator
            [length]="staffService.totalCount()"
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

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }
    .page-header h1 { font-size: 24px; font-weight: 600; margin: 0; }
    .page-header .subtitle { color: #6b7280; margin: 0; }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .summary-card { border-radius: 12px; }
    .summary-card mat-card-content {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
    }
    .summary-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #dbeafe;
      color: #3b82f6;
    }
    .summary-info { display: flex; flex-direction: column; }
    .summary-value { font-size: 1.3rem; font-weight: 700; color: #1f2937; }
    .summary-label { font-size: 0.8rem; color: #6b7280; }

    .table-container { overflow-x: auto; }
    table { width: 100%; }
    .mat-mdc-header-cell { font-weight: 600; color: #374151; background-color: #f9fafb; }

    .avatar.sm {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      flex-shrink: 0;
    }
    .avatar-img.sm {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }

    .staff-category-badge {
      display: inline-block;
      margin-top: 4px;
      padding: 1px 8px;
      border-radius: 10px;
      font-size: 0.65rem;
      font-weight: 600;
      line-height: 1.6;
      width: fit-content;
    }
    .staff-category-badge.teaching { background: #dbeafe; color: #1d4ed8; }
    .staff-category-badge.non-teaching { background: #f3e8ff; color: #7c3aed; }

    tr.staff-row:not(.expanded-row):hover { background: #f8fafc; cursor: pointer; }
    tr.staff-row:not(.expanded-row):active { background: #eff6ff; }
    .staff-row td { border-bottom-width: 0; transition: background 0.2s; }
    .detail-row { height: 0; }

    .staff-detail-container {
      overflow: hidden;
      background: #fafafa;
      border-bottom: 1px solid #e5e7eb;
      border-top: 1px dashed #e5e7eb;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 24px;
      padding: 24px;
    }
    .detail-block h4 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 16px;
      color: #374151;
      font-size: 14px;
      font-weight: 600;
    }
    .detail-block h4 mat-icon { font-size: 18px; width: 18px; height: 18px; color: #6b7280; }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid #f3f4f6;
      font-size: 13px;
    }
    .info-row strong { color: #6b7280; font-weight: 500; }
    .info-row span { color: #111827; font-weight: 500; }

    .teacher-block {
      background: #eff6ff;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #bfdbfe;
    }
    .teacher-block h4 { color: #1d4ed8; }
    .teacher-block h4 mat-icon { color: #3b82f6; }

    .subject-chips { display: flex; gap: 4px; flex-wrap: wrap; justify-content: flex-end; }
    .chip {
      background: #dbeafe;
      color: #1d4ed8;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
    }

    .detail-actions { display: flex; flex-direction: column; gap: 12px; }
    .detail-actions button { justify-content: flex-start; }
    .form-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      width: 100%;
    }
    .form-field input,
    .form-field select,
    .form-field textarea {
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
    .form-field select:focus,
    .form-field textarea:focus {
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
  `],
})
export class FacultyListComponent implements OnInit {

  readonly staffService = inject(StaffService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog   = inject(MatDialog);

  readonly staff            = this.staffService.staff;
  readonly displayedColumns = ['staff', 'role', 'qualification', 'status', 'actions'];
  expandedElement: Faculty | null = null;

  readonly monthlyPayroll = computed(() =>
    this.staff().reduce((sum, s) => {
      const salary = s.salary?.gross_pay ?? s.base_salary ?? 0;
      return sum + Number(salary);
    }, 0)
  );

  currentPage = 0;
  pageSize    = 25;

  ngOnInit(): void {
    this.loadStaff();
  }

  loadStaff(): void {
    this.staffService.getAllHrRecords(this.currentPage + 1, this.pageSize).subscribe({
      next: (response) => this.staffService.setStaff(response.results, response.count),
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize    = event.pageSize;
    this.loadStaff();
  }

  onSort(_sort: Sort): void {
    this.loadStaff();
  }

  getInitials(name: string): string {
    if (!name) return '??';
    const parts = name.trim().split(' ');
    return parts.length > 1
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  openAddStaffWizard(): void {
    const dialogRef = this.dialog.open(AddStaffWizardComponent, {
      width: '720px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: true,        // force user to use the X button
      panelClass: 'wizard-panel',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.success) {
        this.snackBar.open('Staff member created successfully!', 'OK', { duration: 4000 });
        this.loadStaff(); // refresh the table
      }
    });
  }
}