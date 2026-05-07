import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AcademicsService, SubjectOffering } from '../../services/academics.service';
import { SubjectOfferingDialogComponent } from './subject-offering-dialog.component';

@Component({
  selector: 'app-subject-offerings-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
     MatChipsModule,
     MatProgressSpinnerModule,
   ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-content">
          <h1>Subject Offerings</h1>
          <p>Manage subject offerings for each year level</p>
        </div>
        <button mat-flat-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          Add Offering
        </button>
      </div>

      <mat-card class="content-card">
        <div class="search-bar">
          <mat-form-field appearance="outline" class="search-field">
            <mat-icon matPrefix>search</mat-icon>
            <input matInput placeholder="Search offerings..." [(ngModel)]="searchQuery" />
          </mat-form-field>
        </div>

        @if (service.isLoading()) {
          <div class="loading-state">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
        } @else {
          <table mat-table [dataSource]="filteredOfferings()" class="full-width-table">
            <ng-container matColumnDef="subject">
              <th mat-header-cell *matHeaderCellDef>Subject</th>
              <td mat-cell *matCellDef="let row">
                <span class="subject-badge">{{ row.subject.name }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="year_level">
              <th mat-header-cell *matHeaderCellDef>Year Level</th>
              <td mat-cell *matCellDef="let row">
                <span class="year-badge">{{ row.year_level.name }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="is_active">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let row">
                <mat-chip [class.active]="row.is_active" [class.inactive]="!row.is_active">
                  {{ row.is_active ? 'Active' : 'Inactive' }}
                </mat-chip>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let row">
                <button mat-icon-button (click)="openEditDialog(row)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="deleteOffering(row)">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

            <tr class="mat-row" *matNoDataRow><td class="mat-cell" [attr.colspan]="displayedColumns.length">No data available</td></tr>
          </table>
        }
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .header-content h1 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 4px;
    }

    .header-content p {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0;
    }

    .content-card {
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.07);
    }

    .search-bar {
      padding: 16px 16px 0;
    }

    .search-field {
      width: 100%;
      max-width: 400px;
    }

    .full-width-table {
      width: 100%;
    }

    .loading-state {
      display: flex;
      justify-content: center;
      padding: 48px;
    }

    .subject-badge {
      display: inline-block;
      padding: 4px 12px;
      background: #fef3c7;
      color: #92400e;
      border-radius: 16px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .year-badge {
      display: inline-block;
      padding: 4px 12px;
      background: #dbeafe;
      color: #1e40af;
      border-radius: 16px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    mat-chip.active {
      background: #dcfce7;
      color: #166534;
    }

    mat-chip.inactive {
      background: #fee2e2;
      color: #991b1b;
    }

    .no-data-row {
      text-align: center;
    }

    .no-data-cell {
      padding: 48px;
      color: #94a3b8;
      font-size: 0.875rem;
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 16px;
      }
    }
  `],
})
export class SubjectOfferingsListComponent implements OnInit {
  readonly service = inject(AcademicsService);
  readonly dialog = inject(MatDialog);

  searchQuery = '';
  displayedColumns = ['subject', 'year_level', 'is_active', 'actions'];

  readonly filteredOfferings = computed(() => {
    const offerings = this.service.subjectOfferings();
    if (!this.searchQuery) return offerings;
    const query = this.searchQuery.toLowerCase();
    return offerings.filter(o => 
      o.subject.name.toLowerCase().includes(query) ||
      o.year_level.name.toLowerCase().includes(query)
    );
  });

  ngOnInit(): void {
    this.service.getSubjectOfferings().subscribe();
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(SubjectOfferingDialogComponent, {
      width: '500px',
      data: { isEdit: false },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.createSubjectOffering(result).subscribe();
      }
    });
  }

  openEditDialog(offering: SubjectOffering): void {
    const dialogRef = this.dialog.open(SubjectOfferingDialogComponent, {
      width: '500px',
      data: { isEdit: true, offering },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.updateSubjectOffering(offering.id, result).subscribe();
      }
    });
  }

  deleteOffering(offering: SubjectOffering): void {
    if (confirm(`Delete ${offering.subject.name} - ${offering.year_level.name} offering?`)) {
      this.service.deleteSubjectOffering(offering.id).subscribe();
    }
  }
}
