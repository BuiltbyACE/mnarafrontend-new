/**
 * Admissions List Component
 * Students module - admissions management with data table
 */

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { StudentsService } from '../../services/students.service';
import { Admission } from '../../../../shared/models/students.models';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-admissions-list',
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
    MatProgressSpinnerModule,
    MatSnackBarModule,
    StatusBadgeComponent,
  ],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div class="title-section">
          <h1>Students</h1>
          <p class="subtitle">Admissions & Records</p>
        </div>
        <button mat-raised-button color="primary" (click)="newAdmission()">
          <mat-icon>person_add</mat-icon>
          New Admission
        </button>
      </header>

      @if (summary(); as s) {
        <div class="summary-cards">
          <mat-card class="summary-card" [class.alert]="s.pending_review_count > 0">
            <mat-card-content>
              <div class="summary-icon pending">
                <mat-icon>pending</mat-icon>
              </div>
              <div class="summary-info">
                <span class="summary-value">{{ s.pending_review_count }}</span>
                <span class="summary-label">Pending Review</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="summary-card">
            <mat-card-content>
              <div class="summary-icon waitlist">
                <mat-icon>schedule</mat-icon>
              </div>
              <div class="summary-info">
                <span class="summary-value">{{ s.waitlisted_count }}</span>
                <span class="summary-label">Waitlisted</span>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      }

      @if (studentsService.error()) {
        <div class="error-alert">
          <mat-icon>error</mat-icon>
          <span>{{ studentsService.error() }}</span>
        </div>
      }

      <mat-card class="content-card">
        <mat-card-content>
          <div class="table-container">
            <table mat-table [dataSource]="admissions()" matSort (matSortChange)="onSort($event)">

              <!-- Student Column -->
              <ng-container matColumnDef="student">
                <th mat-header-cell *matHeaderCellDef> Student </th>
                <td mat-cell *matCellDef="let element">
                  <div class="student-cell" style="display: flex; align-items: center; gap: 12px;">
                    <div class="avatar sm">{{ getInitials(element.student_first_name, element.student_last_name) }}</div>
                    <div style="display: flex; flex-direction: column;">
                      <span style="font-weight: 500;">{{ element.student_first_name || 'Unknown' }} {{ element.student_last_name || 'Applicant' }}</span>
                      <span style="font-size: 0.75rem; color: #64748b;">{{ element.student_school_id || 'Pending ID' }}</span>
                    </div>
                  </div>
                </td>
              </ng-container>

              <!-- Year Level Column -->
              <ng-container matColumnDef="year_level">
                <th mat-header-cell *matHeaderCellDef> Year & Class </th>
                <td mat-cell *matCellDef="let element"> 
                  <span style="font-weight: 500; color: #334155;">{{ element.class_sought_name || 'Not Specified' }}</span>
                </td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef> Status </th>
                <td mat-cell *matCellDef="let element">
                  <app-status-badge [type]="getStatusType(element.status)"></app-status-badge>
                </td>
              </ng-container>

              <!-- Applied Column -->
              <ng-container matColumnDef="applied">
                <th mat-header-cell *matHeaderCellDef> Applied </th>
                <td mat-cell *matCellDef="let element"> {{ element.date_of_admission | date:'mediumDate' }} </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef> Actions </th>
                <td mat-cell *matCellDef="let element">
                  <button mat-icon-button color="primary" (click)="viewAdmission(element)"><mat-icon>visibility</mat-icon></button>
                  <button mat-icon-button color="accent" (click)="approveAdmission(element)"><mat-icon>check_circle</mat-icon></button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

              <tr class="mat-row no-data-row" *matNoDataRow>
                <td class="mat-cell" [attr.colspan]="displayedColumns.length">
                  <div class="no-data-message">
                    @if (studentsService.isLoading()) {
                      <mat-spinner diameter="40"></mat-spinner>
                    } @else {
                      <mat-icon>person_add</mat-icon>
                      <p>No admissions found</p>
                    }
                  </div>
                </td>
              </tr>
            </table>
          </div>

          <mat-paginator
            [length]="studentsService.totalCount()"
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

    .summary-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .summary-card { border-radius: 12px; }
    .summary-card mat-card-content { display: flex; align-items: center; gap: 16px; padding: 20px; }
    .summary-card.alert { background: #fef3c7; border: 1px solid #f59e0b; }

    .summary-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .summary-icon.pending { background: #fef3c7; color: #f59e0b; }
    .summary-icon.waitlist { background: #e0e7ff; color: #6366f1; }
    .summary-icon mat-icon { font-size: 24px; width: 24px; height: 24px; }

    .summary-info { display: flex; flex-direction: column; }
    .summary-value { font-size: 24px; font-weight: 700; color: #1f2937; }
    .summary-label { font-size: 14px; color: #6b7280; }

    .error-alert { display: flex; align-items: center; gap: 8px; padding: 16px; background: #fee2e2; border-radius: 8px; color: #dc2626; margin-bottom: 24px; }
    .content-card { border-radius: 12px; }
    .table-container { overflow-x: auto; }
    table { width: 100%; }
    .mat-mdc-header-cell { font-weight: 600; color: #374151; background-color: #f9fafb; }

    .student-info { display: flex; align-items: center; gap: 12px; }
    .student-info .avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; }
    .student-info .student-details { display: flex; flex-direction: column; }
    .student-info .student-name { font-weight: 500; color: #1f2937; }
    .student-info .student-id { font-size: 12px; color: #6b7280; }

    .actions-header { width: 50px; }
    .actions-cell { text-align: right; }
    .no-data-row .mat-cell { padding: 48px 24px; text-align: center; }
    .no-data-message { display: flex; flex-direction: column; align-items: center; gap: 16px; color: #9ca3af; }
    .no-data-message mat-icon { font-size: 48px; width: 48px; height: 48px; }
    mat-paginator { border-top: 1px solid #e5e7eb; }
  `],
})
export class AdmissionsListComponent implements OnInit {
  readonly studentsService = inject(StudentsService);
  private snackBar = inject(MatSnackBar);

  readonly admissions = this.studentsService.admissions;
  readonly summary = this.studentsService.admissionsSummary;
  readonly displayedColumns = ['student', 'year_level', 'status', 'applied', 'actions'];

  currentPage = 0;
  pageSize = 25;

  ngOnInit(): void {
    this.loadAdmissions();
    this.studentsService.loadAdmissionsSummary();
  }

  loadAdmissions(): void {
    this.studentsService.getAdmissions(this.currentPage + 1, this.pageSize)
      .subscribe({
        next: (response) => this.studentsService.setAdmissions(response.results, response.count),
        error: () => {}
      });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadAdmissions();
  }

  onSort(sort: Sort): void { this.loadAdmissions(); }

  getInitials(firstName?: string, lastName?: string): string {
    const first = (firstName ?? '')[0] ?? '';
    const last = (lastName ?? '')[0] ?? '';
    return (first + last).toUpperCase() || '??';
  }

  getStatusType(status: string): 'pending' | 'approved' | 'rejected' {
    const map: Record<string, any> = { PENDING: 'pending', APPROVED: 'approved', REJECTED: 'rejected', WAITLISTED: 'pending' };
    return map[status] || 'pending';
  }

  newAdmission(): void { this.snackBar.open('New admission feature coming soon', 'Close', { duration: 3000 }); }
  viewAdmission(admission: Admission): void { this.snackBar.open(`Viewing ${admission.student_name}`, 'Close', { duration: 3000 }); }
  updateStatus(admission: Admission): void { this.snackBar.open(`Updating status for ${admission.admission_number}`, 'Close', { duration: 3000 }); }
  approveAdmission(admission: Admission): void { this.snackBar.open(`Approving admission for ${admission.student_name}`, 'Close', { duration: 3000 }); }
}
