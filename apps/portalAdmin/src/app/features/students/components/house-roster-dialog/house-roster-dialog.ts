// // import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
// // import { MatTableModule } from '@angular/material/table';
// // import { MatProgressBarModule } from '@angular/material/progress-bar';
// // import { MatButtonModule } from '@angular/material/button';
// // import { MatIconModule } from '@angular/material/icon';
// // import { MatTooltipModule } from '@angular/material/tooltip';
// // import { StudentsService } from '../../services/students.service';
// // import { StudentProfile } from '../../../../shared/models/students.models';

// // interface DialogData {
// //   houseId?: string;
// //   houseName?: string;
// // }

// // @Component({
// //   selector: 'app-house-roster-dialog',
// //   imports: [
// //     CommonModule,
// //     MatDialogModule,
// //     MatTableModule,
// //     MatProgressBarModule,
// //     MatButtonModule,
// //     MatIconModule,
// //     MatTooltipModule,
// //   ],
// //   templateUrl: './house-roster-dialog.html',
// //   styleUrls: ['./house-roster-dialog.css'],
// //   changeDetection: ChangeDetectionStrategy.OnPush,
// // })
// // export class HouseRosterDialogComponent implements OnInit {
// //   // 1. SAFE INJECTION: Prevent crashes if data isn't passed perfectly
// //   dialogData: DialogData = inject(MAT_DIALOG_DATA, { optional: true }) || {};
// //   private dialogRef = inject(MatDialogRef<HouseRosterDialogComponent>);
// //   private studentsService = inject(StudentsService);

// //   // 2. SAFE SIGNALS: Use optional chaining
// //   houseName = signal<string>(this.dialogData?.houseName || 'Unknown House');
// //   rawStudents = signal<StudentProfile[]>([]);
// //   isLoading = signal<boolean>(true);
// //   errorMessage = signal<string | null>(null);
// //   displayedColumns = ['admission_number', 'student', 'gender', 'grade', 'actions'];

// //   // Group students by family so siblings sit together
// //   groupedStudents = computed(() => {
// //     const students = [...this.rawStudents()];
// //     // Sort by last name to cluster families
// //     students.sort((a, b) => (a.last_name || '').localeCompare(b.last_name || ''));

// //     // Identify siblings for UI linkage
// //     return students.map((student, index, arr) => {
// //       const previous = arr[index - 1];
// //       const next = arr[index + 1];
// //       const isSiblingStart = !!(next && next.last_name === student.last_name);
// //       const isSiblingEnd = !!(previous && previous.last_name === student.last_name);

// //       return {
// //         ...student as object,
// //         isSiblingStart,
// //         isSiblingEnd,
// //       } as StudentProfile & { isSiblingStart?: boolean; isSiblingEnd?: boolean };
// //     });
// //   });

// //   ngOnInit(): void {
// //     console.log('Dialog Initialized with Data:', this.dialogData);

// //     // 3. SAFE EXECUTION: Abort cleanly if no ID is provided
// //     if (!this.dialogData?.houseId) {
// //       this.errorMessage.set('Error: No House ID provided to dialog.');
// //       this.isLoading.set(false);
// //       return;
// //     }

// //     this.loadStudents();
// //   }

// //   loadStudents(): void {
// //     this.isLoading.set(true);
// //     this.errorMessage.set(null);
// //     this.studentsService.getStudentsByHouse(this.dialogData.houseId!).subscribe({
// //       next: (res: any) => {
// //         console.log('Roster response:', res);
// //         this.rawStudents.set(res.results || res || []);
// //         this.isLoading.set(false);
// //       },
// //       error: (err) => {
// //         console.error('Failed to load roster', err);
// //         this.errorMessage.set('Failed to load students. Check console.');
// //         this.isLoading.set(false);
// //       },
// //     });
// //   }

// //   removeFromHouse(studentId: number): void {
// //     if (confirm('Are you sure you want to remove this student from the house?')) {
// //       this.isLoading.set(true);
// //       this.studentsService.removeStudentFromHouse(studentId.toString()).subscribe({
// //         next: () => {
// //           alert('Student removed from house successfully');
// //           this.loadStudents();
// //         },
// //         error: () => {
// //           this.errorMessage.set('Failed to remove student from house');
// //           this.isLoading.set(false);
// //         },
// //       });
// //     }
// //   }

// //   onClose(): void {
// //     // Close with true to signal parent to refresh unassigned list
// //     this.dialogRef.close(true);
// //   }
// // }

























// import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
// import { MatTableModule } from '@angular/material/table';
// import { MatProgressBarModule } from '@angular/material/progress-bar';
// import { MatButtonModule } from '@angular/material/button';
// import { MatIconModule } from '@angular/material/icon';
// import { MatTooltipModule } from '@angular/material/tooltip';
// import { StudentsService } from '../../services/students.service';

// @Component({
//   selector: 'app-house-roster-dialog',
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   imports: [
//     CommonModule, 
//     MatDialogModule, 
//     MatTableModule, 
//     MatProgressBarModule, 
//     MatButtonModule, 
//     MatIconModule, 
//     MatTooltipModule
//   ],
//   templateUrl: './house-roster-dialog.html'
// })
// export class HouseRosterDialogComponent implements OnInit {
//   dialogData: any = inject(MAT_DIALOG_DATA, { optional: true }) || {};
//   dialogRef = inject(MatDialogRef<HouseRosterDialogComponent>);
//   private studentsService = inject(StudentsService);

//   houseName = signal<string>(this.dialogData?.houseName || 'Unknown House');
//   rawStudents = signal<any[]>([]);
//   isLoading = signal<boolean>(true);
//   errorMessage = signal<string | null>(null);

//   displayedColumns: string[] = ['admission_number', 'student', 'gender', 'grade', 'actions'];

//   groupedStudents = computed(() => {
//     const students = [...this.rawStudents()];
//     students.sort((a, b) => (a.last_name || '').localeCompare(b.last_name || ''));
//     return students.map((student, index, arr) => {
//       const previous = arr[index - 1];
//       const next = arr[index + 1];
//       const isSiblingStart = next && next.last_name === student.last_name;
//       const isSiblingEnd = previous && previous.last_name === student.last_name;
//       return { ...student, isSiblingStart, isSiblingEnd };
//     });
//   });

//   ngOnInit(): void {
//     if (!this.dialogData?.houseId) {
//       this.errorMessage.set('Error: No House ID provided to dialog.');
//       this.isLoading.set(false);
//       return;
//     }
    
//     this.loadStudents();
//   }

//   loadStudents(): void {
//     this.isLoading.set(true);
//     this.errorMessage.set(null);
//     this.studentsService.getStudentsByHouse(this.dialogData.houseId).subscribe({
//       next: (res: any) => {
//         this.rawStudents.set(res.results || res || []);
//         this.isLoading.set(false);
//       },
//       error: (err) => {
//         console.error('Failed to load roster', err);
//         this.errorMessage.set('Failed to load students. Check console for details.');
//         this.isLoading.set(false);
//       }
//     });
//   }

//   removeFromHouse(studentId: string): void {
//     this.isLoading.set(true);
//     this.studentsService.removeStudentFromHouse(studentId).subscribe({
//       next: () => this.loadStudents(),
//       error: () => {
//         this.errorMessage.set('Failed to remove student from house.');
//         this.isLoading.set(false);
//       }
//     });
//   }

//   onClose(): void {
//     this.dialogRef.close();
//   }
// }
























import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StudentsService } from '../../services/students.service';

@Component({
  selector: 'app-house-roster-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, 
    MatDialogModule, 
    MatTableModule, 
    MatProgressBarModule, 
    MatButtonModule, 
    MatIconModule, 
    MatTooltipModule
  ],
  templateUrl: './house-roster-dialog.html'
})
export class HouseRosterDialogComponent implements OnInit {
  // Safe injection
  dialogData: any = inject(MAT_DIALOG_DATA, { optional: true }) || {};
  dialogRef = inject(MatDialogRef<HouseRosterDialogComponent>);
  private studentsService = inject(StudentsService);

  // Signals
  houseName = signal<string>(this.dialogData?.houseName || 'Unknown House');
  rawStudents = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

  displayedColumns: string[] = ['admission_number', 'student', 'gender', 'grade', 'actions'];

  // Smart Sibling Computation
  groupedStudents = computed(() => {
    const students = [...this.rawStudents()];
    students.sort((a, b) => (a.last_name || '').localeCompare(b.last_name || ''));
    return students.map((student, index, arr) => {
      const previous = arr[index - 1];
      const next = arr[index + 1];
      const isSiblingStart = next && next.last_name === student.last_name;
      const isSiblingEnd = previous && previous.last_name === student.last_name;
      return { ...student, isSiblingStart, isSiblingEnd };
    });
  });

  ngOnInit(): void {
    console.log('Popup Initialized! Data received:', this.dialogData);
    if (!this.dialogData?.houseId) {
      this.errorMessage.set('Error: No House ID provided to the dialog.');
      this.isLoading.set(false);
      return;
    }
    this.loadStudents();
  }

  loadStudents(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.studentsService.getStudentsByHouse(this.dialogData.houseId).subscribe({
      next: (res: any) => {
        this.rawStudents.set(res.results || res || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Backend fetch failed:', err);
        this.errorMessage.set('Failed to load students. Check your network tab.');
        this.isLoading.set(false);
      }
    });
  }

  removeFromHouse(studentId: string): void {
    this.isLoading.set(true);
    this.studentsService.removeStudentFromHouse(studentId).subscribe({
      next: () => this.loadStudents(),
      error: () => {
        this.errorMessage.set('Failed to remove student from house.');
        this.isLoading.set(false);
      }
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}