import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { Observable } from 'rxjs';
import { AcademicsService, Department, KeyStage, YearLevel, Subject, Classroom, SubjectOffering } from '../../services/academics.service';

export interface DialogData {
  entityType: 'departments' | 'key-stages' | 'year-levels' | 'subjects' | 'classrooms' | 'subject-offerings';
  entityData: any | null;
}

@Component({
  selector: 'app-academic-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2 mat-dialog-title>
          <mat-icon>{{ isEditMode ? 'edit' : 'add' }}</mat-icon>
          {{ isEditMode ? 'Edit' : 'Create' }} {{ entityTypeLabel }}
        </h2>
        <button mat-icon-button mat-dialog-close>
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content>
        <form [formGroup]="entityForm" class="dialog-form">
          @if (entityType === 'departments') {
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Name</mat-label>
              <input matInput formControlName="name" placeholder="e.g., Sciences" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Description</mat-label>
              <textarea matInput formControlName="description" rows="3" placeholder="Department description"></textarea>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Status</mat-label>
              <mat-select formControlName="is_active">
                <mat-option [value]="true">Active</mat-option>
                <mat-option [value]="false">Inactive</mat-option>
              </mat-select>
            </mat-form-field>
          }

          @if (entityType === 'key-stages') {
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Name</mat-label>
              <input matInput formControlName="name" placeholder="e.g., Key Stage 1" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Order</mat-label>
              <input matInput type="number" formControlName="order" placeholder="e.g., 1" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Description</mat-label>
              <textarea matInput formControlName="description" rows="3" placeholder="Key stage description"></textarea>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Status</mat-label>
              <mat-select formControlName="is_active">
                <mat-option [value]="true">Active</mat-option>
                <mat-option [value]="false">Inactive</mat-option>
              </mat-select>
            </mat-form-field>
          }

          @if (entityType === 'year-levels') {
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Name</mat-label>
              <input matInput formControlName="name" placeholder="e.g., Year 1" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Key Stage</mat-label>
              <mat-select formControlName="key_stage_id">
                @for (stage of keyStages(); track stage.id) {
                  <mat-option [value]="stage.id">{{ stage.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Status</mat-label>
              <mat-select formControlName="is_active">
                <mat-option [value]="true">Active</mat-option>
                <mat-option [value]="false">Inactive</mat-option>
              </mat-select>
            </mat-form-field>
          }

          @if (entityType === 'subjects') {
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Name</mat-label>
              <input matInput formControlName="name" placeholder="e.g., Mathematics" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Code</mat-label>
              <input matInput formControlName="code" placeholder="e.g., MATH101" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Department</mat-label>
              <mat-select formControlName="department_id">
                @for (dept of departments(); track dept.id) {
                  <mat-option [value]="dept.id">{{ dept.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Status</mat-label>
              <mat-select formControlName="is_active">
                <mat-option [value]="true">Active</mat-option>
                <mat-option [value]="false">Inactive</mat-option>
              </mat-select>
            </mat-form-field>
          }

          @if (entityType === 'classrooms') {
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Name</mat-label>
              <input matInput formControlName="name" placeholder="e.g., Room A101" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Building</mat-label>
              <input matInput formControlName="building" placeholder="e.g., Main Block" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Capacity</mat-label>
              <input matInput type="number" formControlName="capacity" placeholder="e.g., 30" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Status</mat-label>
              <mat-select formControlName="is_active">
                <mat-option [value]="true">Active</mat-option>
                <mat-option [value]="false">Inactive</mat-option>
              </mat-select>
            </mat-form-field>
          }

          @if (entityType === 'subject-offerings') {
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Subject</mat-label>
              <mat-select formControlName="subject_id">
                @for (subject of subjects(); track subject.id) {
                  <mat-option [value]="subject.id">{{ subject.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Year Level</mat-label>
              <mat-select formControlName="year_level_id">
                @for (level of yearLevels(); track level.id) {
                  <mat-option [value]="level.id">{{ level.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Key Stage</mat-label>
              <mat-select formControlName="key_stage_id">
                @for (stage of keyStages(); track stage.id) {
                  <mat-option [value]="stage.id">{{ stage.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Status</mat-label>
              <mat-select formControlName="is_active">
                <mat-option [value]="true">Active</mat-option>
                <mat-option [value]="false">Inactive</mat-option>
              </mat-select>
            </mat-form-field>
          }
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Cancel</button>
        <button mat-raised-button color="primary"
                [disabled]="entityForm.invalid"
                (click)="onSubmit()">
          {{ isEditMode ? 'Update' : 'Create' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      font-family: 'Inter', sans-serif;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px 0;
    }

    .dialog-header h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
    }

    .dialog-header h2 mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    mat-dialog-content {
      padding: 20px 24px;
      min-width: 400px;
      max-height: 60vh;
    }

    .dialog-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .full-width {
      width: 100%;
    }

    mat-dialog-actions {
      padding: 16px 24px;
      gap: 8px;
    }

    mat-dialog-actions button[mat-raised-button] {
      min-width: 100px;
    }
  `],
})
export class AcademicFormDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<AcademicFormDialogComponent>);
  private data = inject<DialogData>(MAT_DIALOG_DATA);
  private academicsService = inject(AcademicsService);

  entityType = this.data.entityType;
  entityData = this.data.entityData;
  isEditMode = !!this.entityData;

  departments = this.academicsService.departments;
  keyStages = this.academicsService.keyStages;
  yearLevels = this.academicsService.yearLevels;
  subjects = this.academicsService.subjects;

  entityForm: FormGroup;
  entityTypeLabel = '';

  constructor() {
    const labels: Record<string, string> = {
      'departments': 'Department',
      'key-stages': 'Key Stage',
      'year-levels': 'Year Level',
      'subjects': 'Subject',
      'classrooms': 'Classroom',
      'subject-offerings': 'Subject Offering',
    };
    this.entityTypeLabel = labels[this.entityType] || 'Entity';

    this.entityForm = this.buildForm();
    this.loadReferenceData();
  }

  private buildForm(): FormGroup {
    const baseControls: Record<string, any> = {
      is_active: [this.entityData?.is_active ?? true],
    };

    switch (this.entityType) {
      case 'departments':
        return this.fb.group({
          ...baseControls,
          name: [this.entityData?.name || '', Validators.required],
          description: [this.entityData?.description || ''],
        });

      case 'key-stages':
        return this.fb.group({
          ...baseControls,
          name: [this.entityData?.name || '', Validators.required],
          order: [this.entityData?.order || 0, [Validators.required, Validators.min(0)]],
          description: [this.entityData?.description || ''],
        });

      case 'year-levels':
        return this.fb.group({
          ...baseControls,
          name: [this.entityData?.name || '', Validators.required],
          key_stage_id: [this.entityData?.key_stage_id || null, Validators.required],
        });

      case 'subjects':
        return this.fb.group({
          ...baseControls,
          name: [this.entityData?.name || '', Validators.required],
          code: [this.entityData?.code || '', Validators.required],
          department_id: [this.entityData?.department_id || null, Validators.required],
        });

      case 'classrooms':
        return this.fb.group({
          ...baseControls,
          name: [this.entityData?.name || '', Validators.required],
          building: [this.entityData?.building || ''],
          capacity: [this.entityData?.capacity || 30, [Validators.required, Validators.min(1)]],
        });

      case 'subject-offerings':
        return this.fb.group({
          ...baseControls,
          subject_id: [this.entityData?.subject_id || null, Validators.required],
          year_level_id: [this.entityData?.year_level_id || null, Validators.required],
          key_stage_id: [this.entityData?.key_stage_id || null, Validators.required],
        });

      default:
        return this.fb.group(baseControls);
    }
  }

  private loadReferenceData(): void {
    if (this.entityType === 'year-levels' || this.entityType === 'subject-offerings') {
      this.academicsService.getKeyStages().subscribe((data: any) => {
        this.academicsService.keyStages.set(data);
      });
    }

    if (this.entityType === 'subjects') {
      this.academicsService.getDepartments().subscribe((data: any) => {
        this.academicsService.departments.set(data);
      });
    }

    if (this.entityType === 'subject-offerings') {
      this.academicsService.getSubjects().subscribe((data: any) => {
        this.academicsService.subjects.set(data);
      });
      this.academicsService.getYearLevels().subscribe((data: any) => {
        this.academicsService.yearLevels.set(data);
      });
    }
  }

  onSubmit(): void {
    if (this.entityForm.invalid) return;

    const formData = this.entityForm.value;
    let operation: Observable<any> | undefined;

    switch (this.entityType) {
      case 'departments':
        operation = this.isEditMode
          ? this.academicsService.updateDepartment(this.entityData.id, formData)
          : this.academicsService.createDepartment(formData);
        break;
      case 'key-stages':
        operation = this.isEditMode
          ? this.academicsService.updateKeyStage(this.entityData.id, formData)
          : this.academicsService.createKeyStage(formData);
        break;
      case 'year-levels':
        operation = this.isEditMode
          ? this.academicsService.updateYearLevel(this.entityData.id, formData)
          : this.academicsService.createYearLevel(formData);
        break;
      case 'subjects':
        operation = this.isEditMode
          ? this.academicsService.updateSubject(this.entityData.id, formData)
          : this.academicsService.createSubject(formData);
        break;
      case 'classrooms':
        operation = this.isEditMode
          ? this.academicsService.updateClassroom(this.entityData.id, formData)
          : this.academicsService.createClassroom(formData);
        break;
      case 'subject-offerings':
        operation = this.isEditMode
          ? this.academicsService.updateSubjectOffering(this.entityData.id, formData)
          : this.academicsService.createSubjectOffering(formData);
        break;
    }

    operation?.subscribe({
      next: (res: any) => this.dialogRef.close(true),
      error: (err: any) => console.error('Error saving entity:', err),
    });
  }
}
