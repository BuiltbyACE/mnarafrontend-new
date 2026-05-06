import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { AcademicsService, Department, KeyStage, YearLevel, Subject, Classroom, SubjectOffering } from '../../services/academics.service';
import { AcademicFormDialogComponent } from '../academic-form-dialog/academic-form-dialog';

export type EntityType = 'departments' | 'key-stages' | 'year-levels' | 'subjects' | 'classrooms' | 'subject-offerings';

@Component({
  selector: 'app-academics-config',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
  ],
  template: `
    <div class="academics-container">
      <div class="header-section">
        <h1>Academics Settings</h1>
        <p>Configure your academic structure and entities</p>
      </div>

      <mat-tab-group class="academics-tabs">
        <!-- Departments Tab -->
        <mat-tab label="Departments">
          <div class="tab-content">
            <div class="table-header">
              <h2>Departments</h2>
              <button mat-raised-button color="primary" (click)="openDialog('departments')">
                <mat-icon>add</mat-icon> Add Department
              </button>
            </div>
            @if (departmentsLoading()) {
              <div class="loading-container"><mat-spinner diameter="40"></mat-spinner></div>
            } @else {
              <table mat-table [dataSource]="departments()" class="full-width-table">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Name</th>
                  <td mat-cell *matCellDef="let row">{{ row.name }}</td>
                </ng-container>
                <ng-container matColumnDef="description">
                  <th mat-header-cell *matHeaderCellDef>Description</th>
                  <td mat-cell *matCellDef="let row">{{ row.description || '-' }}</td>
                </ng-container>
                <ng-container matColumnDef="subject_count">
                  <th mat-header-cell *matHeaderCellDef>Subjects</th>
                  <td mat-cell *matCellDef="let row">
                    <mat-chip class="count-chip">{{ row.subject_count }}</mat-chip>
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
                    <button mat-icon-button color="primary" (click)="openDialog('departments', row)">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button color="warn" (click)="deleteEntity('departments', row.id)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="departmentColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: departmentColumns;"></tr>
              </table>
            }
          </div>
        </mat-tab>

        <!-- Key Stages Tab -->
        <mat-tab label="Key Stages">
          <div class="tab-content">
            <div class="table-header">
              <h2>Key Stages</h2>
              <button mat-raised-button color="primary" (click)="openDialog('key-stages')">
                <mat-icon>add</mat-icon> Add Key Stage
              </button>
            </div>
            @if (keyStagesLoading()) {
              <div class="loading-container"><mat-spinner diameter="40"></mat-spinner></div>
            } @else {
              <table mat-table [dataSource]="keyStages()" class="full-width-table">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Name</th>
                  <td mat-cell *matCellDef="let row">{{ row.name }}</td>
                </ng-container>
                <ng-container matColumnDef="order">
                  <th mat-header-cell *matHeaderCellDef>Order</th>
                  <td mat-cell *matCellDef="let row">{{ row.order }}</td>
                </ng-container>
                <ng-container matColumnDef="description">
                  <th mat-header-cell *matHeaderCellDef>Description</th>
                  <td mat-cell *matCellDef="let row">{{ row.description || '-' }}</td>
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
                    <button mat-icon-button color="primary" (click)="openDialog('key-stages', row)">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button color="warn" (click)="deleteEntity('key-stages', row.id)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="keyStageColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: keyStageColumns;"></tr>
              </table>
            }
          </div>
        </mat-tab>

        <!-- Year Levels Tab -->
        <mat-tab label="Year Levels">
          <div class="tab-content">
            <div class="table-header">
              <h2>Year Levels</h2>
              <button mat-raised-button color="primary" (click)="openDialog('year-levels')">
                <mat-icon>add</mat-icon> Add Year Level
              </button>
            </div>
            @if (yearLevelsLoading()) {
              <div class="loading-container"><mat-spinner diameter="40"></mat-spinner></div>
            } @else {
              <table mat-table [dataSource]="yearLevels()" class="full-width-table">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Name</th>
                  <td mat-cell *matCellDef="let row">{{ row.name }}</td>
                </ng-container>
                <ng-container matColumnDef="key_stage_name">
                  <th mat-header-cell *matHeaderCellDef>Key Stage</th>
                  <td mat-cell *matCellDef="let row">{{ row.key_stage_name || 'N/A' }}</td>
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
                    <button mat-icon-button color="primary" (click)="openDialog('year-levels', row)">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button color="warn" (click)="deleteEntity('year-levels', row.id)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="yearLevelColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: yearLevelColumns;"></tr>
              </table>
            }
          </div>
        </mat-tab>

        <!-- Subjects Tab -->
        <mat-tab label="Subjects">
          <div class="tab-content">
            <div class="table-header">
              <h2>Subjects</h2>
              <button mat-raised-button color="primary" (click)="openDialog('subjects')">
                <mat-icon>add</mat-icon> Add Subject
              </button>
            </div>
            @if (subjectsLoading()) {
              <div class="loading-container"><mat-spinner diameter="40"></mat-spinner></div>
            } @else {
              <table mat-table [dataSource]="subjects()" class="full-width-table">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Name</th>
                  <td mat-cell *matCellDef="let row">{{ row.name }}</td>
                </ng-container>
                <ng-container matColumnDef="code">
                  <th mat-header-cell *matHeaderCellDef>Code</th>
                  <td mat-cell *matCellDef="let row">{{ row.code }}</td>
                </ng-container>
                <ng-container matColumnDef="department_name">
                  <th mat-header-cell *matHeaderCellDef>Department</th>
                  <td mat-cell *matCellDef="let row">{{ row.department_name || 'N/A' }}</td>
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
                    <button mat-icon-button color="primary" (click)="openDialog('subjects', row)">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button color="warn" (click)="deleteEntity('subjects', row.id)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="subjectColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: subjectColumns;"></tr>
              </table>
            }
          </div>
        </mat-tab>

        <!-- Classrooms Tab -->
        <mat-tab label="Classrooms">
          <div class="tab-content">
            <div class="table-header">
              <h2>Classrooms</h2>
              <button mat-raised-button color="primary" (click)="openDialog('classrooms')">
                <mat-icon>add</mat-icon> Add Classroom
              </button>
            </div>
            @if (classroomsLoading()) {
              <div class="loading-container"><mat-spinner diameter="40"></mat-spinner></div>
            } @else {
              <table mat-table [dataSource]="classrooms()" class="full-width-table">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Name</th>
                  <td mat-cell *matCellDef="let row">{{ row.name }}</td>
                </ng-container>
                <ng-container matColumnDef="building">
                  <th mat-header-cell *matHeaderCellDef>Building</th>
                  <td mat-cell *matCellDef="let row">{{ row.building || 'N/A' }}</td>
                </ng-container>
                <ng-container matColumnDef="capacity">
                  <th mat-header-cell *matHeaderCellDef>Capacity</th>
                  <td mat-cell *matCellDef="let row">{{ row.capacity }}</td>
                </ng-container>
                <ng-container matColumnDef="utilization">
                  <th mat-header-cell *matHeaderCellDef>Utilization</th>
                  <td mat-cell *matCellDef="let row">
                    <div class="capacity-indicator">
                      <mat-progress-bar
                        mode="determinate"
                        [value]="(row.current_students / row.capacity) * 100"
                        [class.low]="(row.current_students / row.capacity) < 0.5"
                        [class.medium]="(row.current_students / row.capacity) >= 0.5 && (row.current_students / row.capacity) < 0.8"
                        [class.high]="(row.current_students / row.capacity) >= 0.8">
                      </mat-progress-bar>
                      <span class="capacity-text">{{ row.current_students }}/{{ row.capacity }}</span>
                    </div>
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
                    <button mat-icon-button color="primary" (click)="openDialog('classrooms', row)">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button color="warn" (click)="deleteEntity('classrooms', row.id)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="classroomColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: classroomColumns;"></tr>
              </table>
            }
          </div>
        </mat-tab>

        <!-- Subject Offerings Tab -->
        <mat-tab label="Subject Offerings">
          <div class="tab-content">
            <div class="table-header">
              <h2>Subject Offerings</h2>
              <button mat-raised-button color="primary" (click)="openDialog('subject-offerings')">
                <mat-icon>add</mat-icon> Add Subject Offering
              </button>
            </div>
            @if (subjectOfferingsLoading()) {
              <div class="loading-container"><mat-spinner diameter="40"></mat-spinner></div>
            } @else {
              <table mat-table [dataSource]="subjectOfferings()" class="full-width-table">
                <ng-container matColumnDef="subject_name">
                  <th mat-header-cell *matHeaderCellDef>Subject</th>
                  <td mat-cell *matCellDef="let row">{{ row.subject_name || 'N/A' }}</td>
                </ng-container>
                <ng-container matColumnDef="year_level_name">
                  <th mat-header-cell *matHeaderCellDef>Year Level</th>
                  <td mat-cell *matCellDef="let row">{{ row.year_level_name || 'N/A' }}</td>
                </ng-container>
                <ng-container matColumnDef="key_stage_name">
                  <th mat-header-cell *matHeaderCellDef>Key Stage</th>
                  <td mat-cell *matCellDef="let row">{{ row.key_stage_name || 'N/A' }}</td>
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
                    <button mat-icon-button color="primary" (click)="openDialog('subject-offerings', row)">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button color="warn" (click)="deleteEntity('subject-offerings', row.id)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="subjectOfferingColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: subjectOfferingColumns;"></tr>
              </table>
            }
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .academics-container {
      padding: 32px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header-section h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 8px;
    }

    .header-section p {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0 0 24px;
    }

    .academics-tabs {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.07);
    }

    .tab-content {
      padding: 24px;
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .table-header h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #334155;
      margin: 0;
    }

    .full-width-table {
      width: 100%;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 60px 0;
    }

    .count-chip {
      background: #dbeafe;
      color: #1e40af;
      font-weight: 600;
    }

    mat-chip.active {
      background: #d1fae5;
      color: #065f46;
    }

    mat-chip.inactive {
      background: #fee2e2;
      color: #991b1b;
    }

    .capacity-indicator {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 150px;
    }

    .capacity-text {
      font-size: 0.875rem;
      color: #475569;
      white-space: nowrap;
    }

    mat-progress-bar.low {
      --mdc-linear-progress-active-indicator-color: #10b981;
    }

    mat-progress-bar.medium {
      --mdc-linear-progress-active-indicator-color: #f59e0b;
    }

    mat-progress-bar.high {
      --mdc-linear-progress-active-indicator-color: #ef4444;
    }
  `],
})
export class AcademicsConfigComponent implements OnInit {
  private academicsService = inject(AcademicsService);
  private dialog = inject(MatDialog);

  // Data signals
  departments = signal<Department[]>([]);
  keyStages = signal<KeyStage[]>([]);
  yearLevels = signal<YearLevel[]>([]);
  subjects = signal<Subject[]>([]);
  classrooms = signal<Classroom[]>([]);
  subjectOfferings = signal<SubjectOffering[]>([]);

  // Loading signals
  departmentsLoading = signal(false);
  keyStagesLoading = signal(false);
  yearLevelsLoading = signal(false);
  subjectsLoading = signal(false);
  classroomsLoading = signal(false);
  subjectOfferingsLoading = signal(false);

  // Column definitions
  departmentColumns = ['name', 'description', 'subject_count', 'is_active', 'actions'];
  keyStageColumns = ['name', 'order', 'description', 'is_active', 'actions'];
  yearLevelColumns = ['name', 'key_stage_name', 'is_active', 'actions'];
  subjectColumns = ['name', 'code', 'department_name', 'is_active', 'actions'];
  classroomColumns = ['name', 'building', 'capacity', 'utilization', 'is_active', 'actions'];
  subjectOfferingColumns = ['subject_name', 'year_level_name', 'key_stage_name', 'is_active', 'actions'];

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.loadDepartments();
    this.loadKeyStages();
    this.loadYearLevels();
    this.loadSubjects();
    this.loadClassrooms();
    this.loadSubjectOfferings();
  }

  loadDepartments(): void {
    this.departmentsLoading.set(true);
    this.academicsService.getDepartments().subscribe({
      next: (data) => {
        this.departments.set(data);
        this.departmentsLoading.set(false);
      },
      error: () => this.departmentsLoading.set(false),
    });
  }

  loadKeyStages(): void {
    this.keyStagesLoading.set(true);
    this.academicsService.getKeyStages().subscribe({
      next: (data) => {
        this.keyStages.set(data);
        this.keyStagesLoading.set(false);
      },
      error: () => this.keyStagesLoading.set(false),
    });
  }

  loadYearLevels(): void {
    this.yearLevelsLoading.set(true);
    this.academicsService.getYearLevels().subscribe({
      next: (data) => {
        this.yearLevels.set(data);
        this.yearLevelsLoading.set(false);
      },
      error: () => this.yearLevelsLoading.set(false),
    });
  }

  loadSubjects(): void {
    this.subjectsLoading.set(true);
    this.academicsService.getSubjects().subscribe({
      next: (data) => {
        this.subjects.set(data);
        this.subjectsLoading.set(false);
      },
      error: () => this.subjectsLoading.set(false),
    });
  }

  loadClassrooms(): void {
    this.classroomsLoading.set(true);
    this.academicsService.getClassrooms().subscribe({
      next: (data) => {
        this.classrooms.set(data);
        this.classroomsLoading.set(false);
      },
      error: () => this.classroomsLoading.set(false),
    });
  }

  loadSubjectOfferings(): void {
    this.subjectOfferingsLoading.set(true);
    this.academicsService.getSubjectOfferings().subscribe({
      next: (data) => {
        this.subjectOfferings.set(data);
        this.subjectOfferingsLoading.set(false);
      },
      error: () => this.subjectOfferingsLoading.set(false),
    });
  }

  openDialog(entityType: EntityType, data?: any): void {
    const dialogRef = this.dialog.open(AcademicFormDialogComponent, {
      width: '500px',
      data: { entityType, entityData: data || null },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadAllData();
      }
    });
  }

  deleteEntity(entityType: EntityType, id: number): void {
    if (!confirm('Are you sure you want to delete this item?')) return;

    const serviceMap: Record<EntityType, () => void> = {
      'departments': () => {
        this.academicsService.deleteDepartment(id).subscribe(() => this.loadDepartments());
      },
      'key-stages': () => {
        this.academicsService.deleteKeyStage(id).subscribe(() => this.loadKeyStages());
      },
      'year-levels': () => {
        this.academicsService.deleteYearLevel(id).subscribe(() => this.loadYearLevels());
      },
      'subjects': () => {
        this.academicsService.deleteSubject(id).subscribe(() => this.loadSubjects());
      },
      'classrooms': () => {
        this.academicsService.deleteClassroom(id).subscribe(() => this.loadClassrooms());
      },
      'subject-offerings': () => {
        this.academicsService.deleteSubjectOffering(id).subscribe(() => this.loadSubjectOfferings());
      },
    };

    serviceMap[entityType]();
  }
}
