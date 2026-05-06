import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { StudentsService } from '../../services/students.service';
import { StudentHouse, StudentProfile } from '../../../../shared/models/students.models';
import { HouseRosterDialogComponent } from '../house-roster-dialog/house-roster-dialog';

@Component({
  selector: 'app-student-houses',
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressBarModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTabsModule,
  ],
  templateUrl: './student-houses.html',
  styleUrls: ['./student-houses.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentHousesComponent implements OnInit {
  private dialog = inject(MatDialog);
  private studentsService = inject(StudentsService);

  houses = signal<StudentHouse[]>([]);
  unassignedStudents = signal<StudentProfile[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);
  unassignedColumns = ['admission_number', 'student', 'class', 'recommendation', 'actions'];

  ngOnInit(): void {
    this.loadHouses();
    this.loadUnassignedStudents();
  }

  loadHouses(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.studentsService.getHouses().subscribe({
      next: (res: any) => {
        const extractedHouses = res.results || res || [];
        this.houses.set(extractedHouses);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Failed to load student houses.');
        this.isLoading.set(false);
      },
    });
  }

  loadUnassignedStudents(): void {
    this.studentsService.getUnassignedStudents().subscribe({
      next: (res: any) => {
        this.unassignedStudents.set(res.results || res || []);
      },
      error: () => this.error.set('Failed to load unassigned students'),
    });
  }

  // openHouseRoster(house: StudentHouse): void {
  //   const dialogRef = this.dialog.open(HouseRosterDialogComponent, {
  //     width: '600px',
  //     data: { houseId: house.id, houseName: house.name },
  //   });
  //   dialogRef.afterClosed().subscribe((refresh) => {
  //     // Refresh lists when dialog closes (if refresh=true, students were removed)
  //     this.loadUnassignedStudents();
  //     if (refresh) {
  //       this.loadHouses();
  //     }
  //   });
  // }




  openHouseDialog(house: StudentHouse): void {
    console.log('Button Clicked! Attempting to open roster for:', house);
    
    if (!house || !house.id) {
      console.error('FAILED: No house data provided to the click event.');
      return;
    }

    const dialogRef = this.dialog.open(HouseRosterDialogComponent, {
      width: '850px',
      maxWidth: '95vw',
      disableClose: false,
      autoFocus: false,
      data: { houseId: house.id, houseName: house.name }
    });

    dialogRef.afterClosed().subscribe(() => {
      console.log('Dialog closed. Refreshing lists...');
      this.loadHouses();
      this.loadUnassignedStudents();
    });
  }

  assignHouse(studentId: number, houseId: string): void {
    this.studentsService.assignHouse(studentId.toString(), houseId).subscribe({
      next: () => {
        alert('Student assigned to house successfully');
        this.loadUnassignedStudents();
        this.loadHouses();
      },
      error: () => this.error.set('Failed to assign student to house'),
    });
  }
}
