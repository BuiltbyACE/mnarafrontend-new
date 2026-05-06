import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { StudentsService } from '../../services/students.service';
import { StudentCategory } from '../../../../shared/models/students.models';
import { CategoryDialogComponent } from '../category-dialog/category-dialog';

@Component({
  selector: 'app-student-categories',
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
  ],
  templateUrl: './student-categories.html',
  styleUrls: ['./student-categories.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentCategoriesComponent implements OnInit {
  categories = signal<StudentCategory[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);
  searchQuery = signal('');
  displayedColumns = ['name', 'description', 'student_count', 'status', 'actions'];

  private studentsService = inject(StudentsService);
  private dialog = inject(MatDialog);

  filteredCategories = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const cats = this.categories();
    return query
      ? cats.filter(c => c.name.toLowerCase().includes(query) || c.description.toLowerCase().includes(query))
      : cats;
  });

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.studentsService.getCategories().subscribe({
      next: (res: any) => this.categories.set(res.results || res || []),
      error: () => {
        this.error.set('Failed to load categories');
        this.isLoading.set(false);
      },
      complete: () => this.isLoading.set(false),
    });
  }

  openCategoryDialog(category?: StudentCategory): void {
    const dialogRef = this.dialog.open(CategoryDialogComponent, {
      width: '500px',
      data: category || null,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.loadCategories();
    });
  }

  deleteCategory(id: string): void {
    if (confirm('Are you sure you want to delete this category?')) {
      this.studentsService.deleteCategory(id).subscribe({
        next: () => this.loadCategories(),
        error: () => this.error.set('Failed to delete category'),
      });
    }
  }
}
