import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { SelectionModel } from '@angular/cdk/collections';
import { AcademicsService } from '../../../academics/services/academics.service';
import { StudentsService } from '../../services/students.service';
import { StudentProfile } from '../../../../shared/models/students.models';
import { Classroom, YearLevel } from '../../../../shared/models/academics.models';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

function extractResults<T>(response: PaginatedResponse<T> | T[]): T[] {
  return Array.isArray(response) ? response : (response.results || []);
}

@Component({
  selector: 'app-promote-students',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatSelectModule,
    MatButtonModule,
    MatTableModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule
  ],
  templateUrl: './promote-students.html',
  styleUrls: ['./promote-students.css']
})
export class PromoteStudentsComponent implements OnInit {
  academicYears = signal<YearLevel[]>([]);
  fromClasses = signal<Classroom[]>([]);
  toClasses = signal<Classroom[]>([]);
  coursesList = signal<Classroom[]>([]);
  studentsToPromote = signal<StudentProfile[]>([]);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  selection = new SelectionModel<StudentProfile>(true, []);
  displayedColumns = ['select', 'student', 'performance', 'target_course', 'status'];

  selectedFromYear = signal<string | null>(null);
  selectedFromClass = signal<string | null>(null);
  selectedToYear = signal<string | null>(null);
  selectedToClass = signal<string | null>(null);

  private academicsService = inject(AcademicsService);
  private studentsService = inject(StudentsService);

  ngOnInit(): void {
    this.loadAcademicYears();
  }

  loadAcademicYears(): void {
    this.academicsService.getAcademicYears().subscribe({
      next: (res) => this.academicYears.set(extractResults<YearLevel>(res)),
      error: () => this.error.set('Failed to load academic years')
    });
  }

  onFromYearChange(yearId: string): void {
    this.selectedFromYear.set(yearId);
    this.selectedFromClass.set(null);
    this.fromClasses.set([]);
    if (yearId) {
      this.academicsService.getClassesByYear(yearId).subscribe({
        next: (res) => this.fromClasses.set(extractResults<Classroom>(res)),
        error: () => this.error.set('Failed to load classes for selected year')
      });
    }
  }

  onToYearChange(yearId: string): void {
    this.selectedToYear.set(yearId);
    this.selectedToClass.set(null);
    this.toClasses.set([]);
    this.coursesList.set([]);
    if (yearId) {
      this.academicsService.getClassesByYear(yearId).subscribe({
        next: (res) => {
          this.toClasses.set(extractResults<Classroom>(res));
          this.academicsService.getCourseStreamsByYear(yearId).subscribe({
            next: (courseRes) => this.coursesList.set(extractResults<Classroom>(courseRes)),
            error: () => this.error.set('Failed to load course streams')
          });
        },
        error: () => this.error.set('Failed to load target classes')
      });
    }
  }

  onToClassChange(classId: string): void {
    this.selectedToClass.set(classId);
    this.studentsToPromote.update(students =>
      students.map(s => ({ ...s, assigned_course_id: s.assigned_course_id || classId }))
    );
  }

  fetchStudents(): void {
    if (!this.selectedFromYear() || !this.selectedFromClass()) {
      this.error.set('Select current academic year and class first');
      return;
    }
    this.isLoading.set(true);
    this.error.set(null);
    this.studentsService.getStudentsForPromotion({
      academicYearId: this.selectedFromYear()!,
      classId: this.selectedFromClass()!
    }).subscribe({
      next: (res) => {
        const rawStudents = extractResults<StudentProfile>(res);
        const initialized = rawStudents.map((s: StudentProfile) => ({
          ...s,
          assigned_course_id: this.selectedToClass() || ''
        }));
        this.studentsToPromote.set(initialized);
        this.selection.clear();
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Failed to fetch students');
        this.isLoading.set(false);
      }
    });
  }

  promoteSelected(): void {
    const selected = this.selection.selected;
    if (!selected.length || !this.selectedToYear() || !this.selectedToClass()) {
      this.error.set('Select students, target year and class first');
      return;
    }
    this.isLoading.set(true);
    const payload = selected.map(student => ({
      student_id: student.id,
      next_class_id: this.selectedToClass()!,
      course_stream_id: student.assigned_course_id || this.selectedToClass() || ''
    }));
    this.studentsService.promoteStudents(payload, this.selectedToYear()!).subscribe({
      next: () => {
        alert('Students promoted successfully');
        this.fetchStudents();
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Failed to promote students');
        this.isLoading.set(false);
      }
    });
  }

  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.studentsToPromote().length;
    return numSelected === numRows && numRows > 0;
  }

  masterToggle(): void {
    this.isAllSelected()
      ? this.selection.clear()
      : this.studentsToPromote().forEach(row => this.selection.select(row));
  }
}
