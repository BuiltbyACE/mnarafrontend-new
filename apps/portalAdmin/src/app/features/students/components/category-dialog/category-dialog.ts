import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { StudentsService } from '../../services/students.service';
import { StudentCategory } from '../../../../shared/models/students.models';

@Component({
  selector: 'app-category-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatDialogModule,
  ],
  templateUrl: './category-dialog.html',
  styleUrls: ['./category-dialog.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CategoryDialogComponent>);
  private data = inject(MAT_DIALOG_DATA) as StudentCategory | null;
  private studentsService = inject(StudentsService);

  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    is_active: [true],
  });

  isEditMode = !!this.data;

  ngOnInit(): void {
    if (this.data) {
      this.form.patchValue({
        name: this.data.name,
        description: this.data.description,
        is_active: this.data.is_active,
      });
    }
  }

  onSave(): void {
    if (this.form.invalid) return;

    const formData = this.form.value;
    const categoryData = {
      name: formData.name || '',
      description: formData.description || '',
      is_active: formData.is_active ?? true,
    };

    const request = this.isEditMode
      ? this.studentsService.updateCategory(this.data!.id, categoryData)
      : this.studentsService.createCategory(categoryData);

    request.subscribe({
      next: () => this.dialogRef.close(true),
      error: () => this.dialogRef.close(false),
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
