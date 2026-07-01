import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'sched-teacher-assignment-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Confirm Assignment</h2>
    <mat-dialog-content>
      <p class="text-sm text-slate-600">
        Place <strong>{{ data.subjectName }}</strong> into
        <strong>{{ data.periodLabel }}</strong> for
        <strong>{{ data.yearLevelName }}</strong>?
      </p>
      <p class="text-xs text-slate-400 mt-2">
        Teacher: {{ data.teacherName }}
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="true">
        Confirm
      </button>
    </mat-dialog-actions>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherAssignmentDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<TeacherAssignmentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      subjectName: string;
      periodLabel: string;
      yearLevelName: string;
      teacherName: string;
    },
  ) {}
}
