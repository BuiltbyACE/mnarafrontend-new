import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
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
    MatButtonModule,
    MatIconModule,
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
            <div class="form-field">
              <label class="input-label">Name</label>
              <input formControlName="name" placeholder="e.g., Sciences" />
            </div>

            <div class="form-field">
              <label class="input-label">Description</label>
              <textarea formControlName="description" rows="3" placeholder="Department description"></textarea>
            </div>

            <div class="form-field">
              <label class="input-label">Status</label>
              <select formControlName="is_active">
                <option [value]="true">Active</option>
                <option [value]="false">Inactive</option>
              </select>
            </div>
          }

          @if (entityType === 'key-stages') {
            <div class="form-field">
              <label class="input-label">Name</label>
              <input formControlName="name" placeholder="e.g., Key Stage 1" />
            </div>

            <div class="form-field">
              <label class="input-label">Order</label>
              <input type="number" formControlName="order" placeholder="e.g., 1" />
            </div>

            <div class="form-field">
              <label class="input-label">Description</label>
              <textarea formControlName="description" rows="3" placeholder="Key stage description"></textarea>
            </div>

            <div class="form-field">
              <label class="input-label">Status</label>
              <select formControlName="is_active">
                <option [value]="true">Active</option>
                <option [value]="false">Inactive</option>
              </select>
            </div>
          }

          @if (entityType === 'year-levels') {
            <div class="form-field">
              <label class="input-label">Name</label>
              <input formControlName="name" placeholder="e.g., Year 1" />
            </div>

            <div class="form-field">
              <label class="input-label">Key Stage</label>
              <select formControlName="key_stage_id">
                @for (stage of keyStages(); track stage.id) {
                  <option [value]="stage.id">{{ stage.name }}</option>
                }
              </select>
            </div>

            <div class="form-field">
              <label class="input-label">Status</label>
              <select formControlName="is_active">
                <option [value]="true">Active</option>
                <option [value]="false">Inactive</option>
              </select>
            </div>
          }

          @if (entityType === 'subjects') {
            <div class="form-field">
              <label class="input-label">Name</label>
              <input formControlName="name" placeholder="e.g., Mathematics" />
            </div>

            <div class="form-field">
              <label class="input-label">Code</label>
              <input formControlName="code" placeholder="e.g., MATH101" />
            </div>

            <div class="form-field">
              <label class="input-label">Department</label>
              <select formControlName="department_id">
                @for (dept of departments(); track dept.id) {
                  <option [value]="dept.id">{{ dept.name }}</option>
                }
              </select>
            </div>

            <div class="form-field">
              <label class="input-label">Status</label>
              <select formControlName="is_active">
                <option [value]="true">Active</option>
                <option [value]="false">Inactive</option>
              </select>
            </div>
          }

          @if (entityType === 'classrooms') {
            <div class="form-field">
              <label class="input-label">Name</label>
              <input formControlName="name" placeholder="e.g., East, West, Nujoom" />
            </div>

            <div class="form-field">
              <label class="input-label">Year Level</label>
              <select formControlName="year_level">
                @for (yl of yearLevels(); track yl.id) {
                  <option [value]="yl.id">{{ yl.name }}</option>
                }
              </select>
            </div>

            <div class="form-field">
              <label class="input-label">Room Number</label>
              <input formControlName="room_number" placeholder="e.g., B-2" />
            </div>

            <div class="form-field">
              <label class="input-label">Capacity</label>
              <input type="number" formControlName="capacity" placeholder="e.g., 30" />
            </div>
          }

          @if (entityType === 'subject-offerings') {
            <div class="form-field">
              <label class="input-label">Subject</label>
              <select formControlName="subject_id">
                @for (subject of subjects(); track subject.id) {
                  <option [value]="subject.id">{{ subject.name }}</option>
                }
              </select>
            </div>

            <div class="form-field">
              <label class="input-label">Year Level</label>
              <select formControlName="year_level_id">
                @for (level of yearLevels(); track level.id) {
                  <option [value]="level.id">{{ level.name }}</option>
                }
              </select>
            </div>

            <div class="form-field">
              <label class="input-label">Key Stage</label>
              <select formControlName="key_stage_id">
                @for (stage of keyStages(); track stage.id) {
                  <option [value]="stage.id">{{ stage.name }}</option>
                }
              </select>
            </div>

            <div class="form-field">
              <label class="input-label">Status</label>
              <select formControlName="is_active">
                <option [value]="true">Active</option>
                <option [value]="false">Inactive</option>
              </select>
            </div>
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
          name: [this.entityData?.name || '', Validators.required],
          year_level: [null as number | null, Validators.required],
          room_number: [this.entityData?.room_number || ''],
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

    if (this.entityType === 'classrooms' || this.entityType === 'subject-offerings') {
      this.academicsService.getYearLevels().subscribe((data: any) => {
        this.academicsService.yearLevels.set(data);
      });
    }

    if (this.entityType === 'subject-offerings') {
      this.academicsService.getSubjects().subscribe((data: any) => {
        this.academicsService.subjects.set(data);
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
