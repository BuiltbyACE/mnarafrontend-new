import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
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
    MatCardModule,
    MatDialogModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatDividerModule,
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
          <div class="search-field">
            <input placeholder="Search offerings..." [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)" />
          </div>
        </div>

        @if (service.isLoading()) {
          <div class="loading-state">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
        } @else {
          <table mat-table [dataSource]="filteredOfferings()" multiTemplateDataRows class="full-width-table">
            <ng-container matColumnDef="expand">
              <th mat-header-cell *matHeaderCellDef> </th>
              <td mat-cell *matCellDef="let row">
                <button mat-icon-button class="expand-btn" (click)="$event.stopPropagation(); toggleRow(row)">
                  <mat-icon>{{ expandedElement === row ? 'expand_less' : 'expand_more' }}</mat-icon>
                </button>
              </td>
            </ng-container>

            <ng-container matColumnDef="subject">
              <th mat-header-cell *matHeaderCellDef>Subject</th>
              <td mat-cell *matCellDef="let row" (click)="toggleRow(row)">
                <div class="cell-subject">
                  <span class="subject-badge">{{ row.subject_name }}</span>
                  <span class="subject-code">{{ row.subject_code }}</span>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="year_level">
              <th mat-header-cell *matHeaderCellDef>Year Level</th>
              <td mat-cell *matCellDef="let row">
                <span class="year-badge">{{ row.year_level_name }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let row">
                <mat-chip [class.chip-core]="row.is_compulsory" [class.chip-elective]="!row.is_compulsory" disableRipple>
                  {{ row.is_compulsory ? 'Core' : 'Elective' }}
                </mat-chip>
              </td>
            </ng-container>

            <ng-container matColumnDef="teacher">
              <th mat-header-cell *matHeaderCellDef>Teacher</th>
              <td mat-cell *matCellDef="let row">
                <span class="cell-teacher">{{ row.teacher_name || 'Unassigned' }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let row">
                <button mat-icon-button (click)="$event.stopPropagation(); openEditDialog(row)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="$event.stopPropagation(); deleteOffering(row)">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <ng-container matColumnDef="expandedDetail">
              <td mat-cell *matCellDef="let row" [attr.colspan]="displayedColumns.length">
                <div class="detail-container" [class.expanded]="expandedElement === row">
                  <mat-divider></mat-divider>
                  <div class="detail-grid">
                    <div class="detail-item">
                      <span class="detail-label">Subject</span>
                      <span class="detail-value">{{ row.subject_name }} ({{ row.subject_code }})</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Year Level</span>
                      <span class="detail-value">{{ row.year_level_name }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Academic Year</span>
                      <span class="detail-value">{{ row.academic_year }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Credit Hours</span>
                      <span class="detail-value">{{ row.credit_hours }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Type</span>
                      <span class="detail-value">
                        <mat-chip [class.chip-core]="row.is_compulsory" [class.chip-elective]="!row.is_compulsory" disableRipple>
                          {{ row.is_compulsory ? 'Core' : 'Elective' }}
                        </mat-chip>
                      </span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Selection Group</span>
                      <span class="detail-value">{{ row.selection_group || '—' }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Teacher</span>
                      <span class="detail-value">{{ row.teacher_name || 'Unassigned' }}</span>
                    </div>
                    @if (row.key_stage_name) {
                      <div class="detail-item">
                        <span class="detail-label">Key Stage</span>
                        <span class="detail-value">{{ row.key_stage_name }}</span>
                      </div>
                    }
                  </div>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="clickable-row"
                [class.expanded-row]="expandedElement === row"></tr>
            <tr mat-row *matRowDef="let row; columns: ['expandedDetail'];"
                class="detail-row"
                [class.visible]="expandedElement === row"></tr>

            <tr class="mat-row" *matNoDataRow><td class="mat-cell" [attr.colspan]="displayedColumns.length">No data available</td></tr>
          </table>
        }
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .header-content h1 { font-size: 1.5rem; font-weight: 600; color: #1e293b; margin: 0 0 4px; }
    .header-content p { font-size: 0.875rem; color: #64748b; margin: 0; }
    .content-card { border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.07); }
    .search-bar { padding: 16px 16px 0; }
    .search-field { width: 100%; max-width: 400px; }
    .search-field input {
      width: 100%; max-width: 400px; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px;
      font-size: 14px; color: #1f2937; background: #fff; transition: border-color 0.15s; box-sizing: border-box;
    }
    .search-field input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.2); }
    .full-width-table { width: 100%; }
    .loading-state { display: flex; justify-content: center; padding: 48px; }

    .clickable-row { cursor: pointer; }
    .clickable-row:hover { background: #f8fafc; }
    .clickable-row.expanded-row { background: #f1f5f9; }

    .expand-btn { width: 32px; height: 32px; line-height: 32px; }
    .expand-btn mat-icon { font-size: 20px; width: 20px; height: 20px; line-height: 20px; }

    .cell-subject { display: flex; align-items: center; gap: 8px; cursor: pointer; }
    .subject-badge {
      display: inline-block; padding: 4px 12px; background: #fef3c7; color: #92400e;
      border-radius: 16px; font-size: 0.75rem; font-weight: 500;
    }
    .subject-code { font-size: 0.6875rem; color: #94a3b8; font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; }
    .year-badge {
      display: inline-block; padding: 4px 12px; background: #dbeafe; color: #1e40af;
      border-radius: 16px; font-size: 0.75rem; font-weight: 500;
    }
    .cell-teacher { font-size: 0.8125rem; color: #334155; }

    mat-chip.chip-core {
      background: #dbeafe !important; color: #1e40af !important; font-size: 0.6875rem;
      font-weight: 600; padding: 0 10px; min-height: 24px; border-radius: 4px;
    }
    mat-chip.chip-elective {
      background: #f1f5f9 !important; color: #475569 !important; font-size: 0.6875rem;
      font-weight: 600; padding: 0 10px; min-height: 24px; border-radius: 4px;
    }

    .detail-row { display: none; }
    .detail-row.visible { display: table-row; }
    .detail-row > td { padding: 0 !important; border: none; }

    .detail-container {
      overflow: hidden;
      padding: 0 24px;
      background: #fafbfc;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      padding: 16px 0;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .detail-label {
      font-size: 0.6875rem;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .detail-value {
      font-size: 0.875rem;
      color: #1e293b;
    }

    .no-data-row { text-align: center; }
    .no-data-cell { padding: 48px; color: #94a3b8; font-size: 0.875rem; }

    @media (max-width: 768px) {
      .page-header { flex-direction: column; gap: 16px; }
      .detail-grid { grid-template-columns: 1fr 1fr; }
    }
  `],
})
export class SubjectOfferingsListComponent implements OnInit {
  readonly service = inject(AcademicsService);
  readonly dialog = inject(MatDialog);

  searchQuery = signal('');
  expandedElement: SubjectOffering | null = null;
  displayedColumns = ['expand', 'subject', 'year_level', 'type', 'teacher', 'actions'];

  readonly filteredOfferings = computed(() => {
    const offerings = this.service.subjectOfferings();
    if (!this.searchQuery()) return offerings;
    const query = this.searchQuery().toLowerCase();
    return offerings.filter(o =>
      o.subject_name.toLowerCase().includes(query) ||
      o.subject_code.toLowerCase().includes(query) ||
      o.year_level_name.toLowerCase().includes(query) ||
      (o.teacher_name || '').toLowerCase().includes(query) ||
      (o.academic_year || '').toLowerCase().includes(query)
    );
  });

  ngOnInit(): void {
    this.service.getSubjectOfferings().subscribe();
  }

  toggleRow(row: SubjectOffering): void {
    this.expandedElement = this.expandedElement === row ? null : row;
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(SubjectOfferingDialogComponent, {
      width: '600px',
      data: { isEdit: false },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.createSubjectOffering(result).subscribe({
          next: () => this.service.getSubjectOfferings().subscribe()
        });
      }
    });
  }

  openEditDialog(offering: SubjectOffering): void {
    const dialogRef = this.dialog.open(SubjectOfferingDialogComponent, {
      width: '600px',
      data: { isEdit: true, offering },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.updateSubjectOffering(offering.id, result).subscribe({
          next: () => this.service.getSubjectOfferings().subscribe()
        });
      }
    });
  }

  deleteOffering(offering: SubjectOffering): void {
    if (confirm(`Delete ${offering.subject_name} (${offering.subject_code}) - ${offering.year_level_name} offering?`)) {
      this.service.deleteSubjectOffering(offering.id).subscribe({
        next: () => this.service.getSubjectOfferings().subscribe()
      });
    }
  }
}
