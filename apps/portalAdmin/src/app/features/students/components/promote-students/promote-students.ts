

// import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { MatCardModule } from '@angular/material/card';
// import { MatSelectModule } from '@angular/material/select';
// import { MatButtonModule } from '@angular/material/button';
// import { MatTableModule } from '@angular/material/table';
// import { MatCheckboxModule } from '@angular/material/checkbox';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatInputModule } from '@angular/material/input';
// import { MatProgressBarModule } from '@angular/material/progress-bar';
// import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
// import { SelectionModel } from '@angular/cdk/collections';
// import { AcademicsService } from '../../../academics/services/academics.service';
// import { StudentsService } from '../../services/students.service';
// import { StudentProfile } from '../../../../shared/models/students.models';
// import { Classroom, YearLevel } from '../../../../shared/models/academics.models';
// import { MatIcon } from "@angular/material/icon";

// @Component({
//   selector: 'app-promote-students',
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   imports: [
//     CommonModule,
//     FormsModule,
//     MatCardModule,
//     MatSelectModule,
//     MatButtonModule,
//     MatTableModule,
//     MatCheckboxModule,
//     MatFormFieldModule,
//     MatInputModule,
//     MatProgressBarModule,
//     MatSnackBarModule,
//     MatIcon
// ],
//   templateUrl: './promote-students.html',
//   styleUrls: ['./promote-students.css']
// })
// export class PromoteStudentsComponent implements OnInit {
//   // Services
//   readonly academicsService = inject(AcademicsService);
//   readonly studentsService = inject(StudentsService);
//   private readonly snackBar = inject(MatSnackBar);

//   // Data Signals
//   academicYears = signal<YearLevel[]>([]); // These are Year Levels (KG1, etc.)
//   fromClasses = signal<Classroom[]>([]);
//   toClasses = signal<Classroom[]>([]);
//   coursesList = signal<any[]>([]); // Course streams/Offerings
//   studentsToPromote = signal<StudentProfile[]>([]);
  
//   // UI State Signals
//   isLoading = signal<boolean>(false);
//   error = signal<string | null>(null);

//   // Selection & Table config
//   selection = new SelectionModel<StudentProfile>(true, []);
//   displayedColumns = ['select', 'student', 'performance', 'target_course', 'status'];

//   // Value Signals
//   selectedFromYear = signal<string | null>(null);
//   selectedFromClass = signal<string | null>(null);
//   selectedToYear = signal<string | null>(null);
//   selectedToClass = signal<string | null>(null);

//   ngOnInit(): void {
//     this.loadInitialData();
//   }

//   loadInitialData(): void {
//     this.isLoading.set(true);
//     // Fetch Year Levels (KG1, Year 1, etc.)
//     this.studentsService.getAcademicYears().subscribe({
//       next: (res: any) => {
//         // Correctly unwrap paginated results
//         const levels = res.results || res || [];
//         this.academicYears.set(levels);
//         this.isLoading.set(false);
//       },
//       error: (err) => {
//         this.error.set('Failed to load grade levels');
//         this.isLoading.set(false);
//         this.snackBar.open('API Error: Check Year Levels endpoint', 'Close');
//       }
//     });
//   }

//   onFromYearChange(yearId: string): void {
//     this.selectedFromYear.set(yearId);
//     this.selectedFromClass.set(null);
//     this.fromClasses.set([]);
    
//     if (yearId) {
//       this.academicsService.getClassesByYear(yearId).subscribe({
//         next: (res: any) => {
//           const classes = res.results || res || [];
//           this.fromClasses.set(classes);
//         }
//       });
//     }
//   }

//   onToYearChange(yearId: string): void {
//     this.selectedToYear.set(yearId);
//     this.selectedToClass.set(null);
//     this.toClasses.set([]);
//     this.coursesList.set([]);

//     if (yearId) {
//       // Load both specific classrooms and available offerings for that grade
//       this.academicsService.getClassesByYear(yearId).subscribe({
//           next: (res: any) => {
//             const classes = res.results || res || [];
//             this.toClasses.set(classes);
            
//             this.academicsService.getCourseStreamsByYear(yearId).subscribe({
//               next: (courseRes: any) => {
//                 const streams = courseRes.results || courseRes || [];
//                 this.coursesList.set(streams);
//               }
//           });
//         }
//       });
//     }
//   }

//   onToClassChange(classId: string): void {
//     this.selectedToClass.set(classId);
//     // Bulk assign the selected stream to all students currently in the table
//     this.studentsToPromote.update(students =>
//       students.map(s => ({ ...s, assigned_course_id: classId }))
//     );
//   }

//   fetchStudents(): void {
//     if (!this.selectedFromYear() || !this.selectedFromClass()) {
//       this.snackBar.open('Please select current Year and Class', 'OK');
//       return;
//     }

//     this.isLoading.set(true);
//     this.error.set(null);
//     this.studentsToPromote.set([]);

//     this.studentsService.getStudentsForPromotion({
//       academicYearId: this.selectedFromYear()!,
//       classId: this.selectedFromClass()!
//     }).subscribe({
//       next: (res: any) => {
//         const students = res.results || res || [];
//         // Map backend student data to view-models with assigned stream
//         const initialized = students.map((s: StudentProfile) => ({
//           ...s,
//           assigned_course_id: this.selectedToClass() || ''
//         }));
        
//         this.studentsToPromote.set(initialized);
//         this.selection.clear();
//         this.isLoading.set(false);
//       },
//       error: () => {
//         this.error.set('Could not find students in this class');
//         this.isLoading.set(false);
//       }
//     });
//   }

//   promoteSelected(): void {
//     const selected = this.selection.selected;
//     if (!selected.length || !this.selectedToYear() || !this.selectedToClass()) {
//       this.snackBar.open('Selection incomplete: Target year/class missing', 'Close');
//       return;
//     }

//     this.isLoading.set(true);
//     const payload = selected.map(student => ({
//       student_id: student.id,
//       next_class_id: this.selectedToClass()!,
//       course_stream_id: student.assigned_course_id || this.selectedToClass() || ''
//     }));

//     this.studentsService.promoteStudents(payload, this.selectedToYear()!).subscribe({
//       next: () => {
//         this.snackBar.open(`${selected.length} Students promoted successfully`, 'Success');
//         this.fetchStudents(); // Refresh the list
//         this.isLoading.set(false);
//       },
//       error: (err) => {
//         this.snackBar.open(err.message || 'Promotion failed', 'Close');
//         this.isLoading.set(false);
//       }
//     });
//   }

//   // --- UI Helpers ---
//   isAllSelected(): boolean {
//     const numSelected = this.selection.selected.length;
//     const numRows = this.studentsToPromote().length;
//     return numSelected === numRows && numRows > 0;
//   }

//   masterToggle(): void {
//     this.isAllSelected()
//       ? this.selection.clear()
//       : this.studentsToPromote().forEach(row => this.selection.select(row));
//   }
// }









import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from "@angular/material/icon";
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AcademicsService } from '../../../academics/services/academics.service';
import { StudentsService } from '../../services/students.service';
import { StudentProfile } from '../../../../shared/models/students.models';
import { Classroom, YearLevel } from '../../../../shared/models/academics.models';

@Component({
  selector: 'app-promote-students',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule,
    MatStepperModule,
    MatButtonToggleModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './promote-students.html',
  styleUrls: ['./promote-students.css']
})
export class PromoteStudentsComponent implements OnInit {
  // --- Services ---
  readonly academicsService = inject(AcademicsService);
  readonly studentsService = inject(StudentsService);
  private readonly snackBar = inject(MatSnackBar);

  // --- Data Signals ---
  academicYears = signal<YearLevel[]>([]);
  fromClasses = signal<Classroom[]>([]);
  toClasses = signal<Classroom[]>([]);
  coursesList = signal<any[]>([]); 
  studentsToPromote = signal<StudentProfile[]>([]);
  
  // --- UI State Signals ---
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  selectedFromYear = signal<string | null>(null);
  selectedFromClass = signal<string | null>(null);
  selectedToYear = signal<string | null>(null);
  selectedToClass = signal<string | null>(null);

  // --- Selection State (Signal-Based Set) ---
  selectedStudentIds = signal<Set<number>>(new Set<number>());
  selectedStudentCount = computed(() => this.selectedStudentIds().size);

  // Grouping logic required by the template
  studentGroups = computed(() => {
    return [{
      label: 'Eligible for Promotion',
      students: this.studentsToPromote(),
      selectedCount: this.studentsToPromote().filter(s => this.selectedStudentIds().has(s.id)).length
    }];
  });

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.isLoading.set(true);
    this.studentsService.getAcademicYears().subscribe({
      next: (res: any) => {
        const levels = res.results || res || [];
        this.academicYears.set(levels);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Failed to load grade levels');
        this.isLoading.set(false);
        this.snackBar.open('API Error: Check Year Levels endpoint', 'Close');
      }
    });
  }

  onFromYearChange(yearId: string): void {
    this.selectedFromYear.set(yearId);
    this.selectedFromClass.set(null);
    this.fromClasses.set([]);
    
    if (yearId) {
      this.academicsService.getClassesByYear(yearId).subscribe({
        next: (res: any) => {
          this.fromClasses.set(res.results || res || []);
        }
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
          next: (res: any) => {
            this.toClasses.set(res.results || res || []);
            this.academicsService.getCourseStreamsByYear(yearId).subscribe({
              next: (courseRes: any) => {
                this.coursesList.set(courseRes.results || courseRes || []);
              }
          });
        }
      });
    }
  }

  onToClassChange(classId: string): void {
    this.selectedToClass.set(classId);
    this.studentsToPromote.update(students =>
      students.map(s => ({ ...s, assigned_course_id: classId }))
    );
  }

  fetchStudents(): void {
    if (!this.selectedFromYear() || !this.selectedFromClass()) {
      this.snackBar.open('Please select current Year and Class', 'OK');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.studentsToPromote.set([]);
    this.selectedStudentIds.set(new Set<number>()); // Reset selection

    this.studentsService.getStudentsForPromotion({
      academicYearId: this.selectedFromYear()!,
      classId: this.selectedFromClass()!
    }).subscribe({
      next: (res: any) => {
        const students = res.results || res || [];
        const initialized = students.map((s: StudentProfile) => ({
          ...s,
          assigned_course_id: this.selectedToClass() || ''
        }));
        
        this.studentsToPromote.set(initialized);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Could not find students in this class');
        this.isLoading.set(false);
      }
    });
  }

  promoteSelected(): void {
    const selectedIds = this.selectedStudentIds();
    if (selectedIds.size === 0 || !this.selectedToYear() || !this.selectedToClass()) {
      this.snackBar.open('Selection incomplete: Target year/class missing', 'Close');
      return;
    }

    this.isLoading.set(true);
    const allStudents = this.studentsToPromote();
    
    const payload = Array.from(selectedIds).map(id => {
      const student = allStudents.find(s => s.id === id)!;
      return {
        student_id: student.id,
        next_class_id: this.selectedToClass()!,
        course_stream_id: student.assigned_course_id || this.selectedToClass() || ''
      };
    });

    this.studentsService.promoteStudents(payload, this.selectedToYear()!).subscribe({
      next: () => {
        this.snackBar.open(`${selectedIds.size} Students promoted successfully`, 'Success');
        this.fetchStudents(); // Refresh list after successful promotion
        this.isLoading.set(false);
      },
      error: (err) => {
        this.snackBar.open(err.message || 'Promotion failed', 'Close');
        this.isLoading.set(false);
      }
    });
  }

  // --- Selection Helpers ---

  isSelected(student: StudentProfile): boolean {
    return this.selectedStudentIds().has(student.id);
  }

  toggleStudent(student: StudentProfile): void {
    const newSet = new Set(this.selectedStudentIds());
    newSet.has(student.id) ? newSet.delete(student.id) : newSet.add(student.id);
    this.selectedStudentIds.set(newSet);
  }

  selectAll(): void {
    const allIds = this.studentsToPromote().map(s => s.id);
    this.selectedStudentIds.set(new Set(allIds));
  }

  deselectAll(): void {
    this.selectedStudentIds.set(new Set<number>());
  }

  selectGroup(group: { students: StudentProfile[] }): void {
    const newSet = new Set(this.selectedStudentIds());
    group.students.forEach(s => newSet.add(s.id));
    this.selectedStudentIds.set(newSet);
  }

  deselectGroup(group: { students: StudentProfile[] }): void {
    const newSet = new Set(this.selectedStudentIds());
    group.students.forEach(s => newSet.delete(s.id));
    this.selectedStudentIds.set(newSet);
  }

  // --- Format Helpers ---

  // getYearName(yearId: string | null): string {
  //   if (!yearId) return '';
  //   return this.academicYears().find(y => y.id === yearId)?.name || 'Unknown';
  // }

  // getClassName(classId: string | null, classList: any[]): string {
  //   if (!classId) return '';
  //   return classList.find(c => c.id === classId)?.name || 'Unknown';
  // }


  // --- Format Helpers ---

  getYearName(yearId: number | string | null): string {
    if (!yearId) return '';
    return this.academicYears().find(y => String(y.id) === String(yearId))?.name || 'Unknown';
  }

  getClassName(classId: number | string | null, classList: any[]): string {
    if (!classId) return '';
    return classList.find(c => String(c.id) === String(classId))?.name || 'Unknown';
  }
}