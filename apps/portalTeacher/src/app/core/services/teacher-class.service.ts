import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { getApiUrl } from '@sms/core/config';

export interface ClassAssignment {
  id: number;
  subject: string;
  class_name: string;
  section: string;
  student_count: number;
}

export interface ClassStudent {
  id: number;
  name: string;
  student_id: string;
}

export interface StaffRole {
  role: string;
  details: string;
}

export interface ClassAttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
}

export interface ClassGradesSummary {
  average: number;
  highest: number;
  lowest: number;
  distribution: { grade: string; count: number }[];
}

@Injectable({ providedIn: 'root' })
export class TeacherClassService {
  private http = inject(HttpClient);
  readonly assignments = signal<ClassAssignment[]>([]);
  readonly students = signal<ClassStudent[]>([]);
  readonly roles = signal<StaffRole[]>([]);
  readonly attendanceSummary = signal<ClassAttendanceSummary | null>(null);
  readonly gradesSummary = signal<ClassGradesSummary | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  fetchAssignments(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get<ClassAssignment[]>(getApiUrl('/staff/my-assignments/'))
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => this.assignments.set(data),
        error: () => this.error.set('Failed to load class assignments'),
      });
  }

  fetchStudents(assignmentId: number): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get<ClassStudent[]>(getApiUrl(`/staff/my-assignments/${assignmentId}/students/`))
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => this.students.set(data),
        error: () => this.error.set('Failed to load students for this class'),
      });
  }

  fetchRoles(): void {
    this.http.get<StaffRole[]>(getApiUrl('/staff/my-roles/'))
      .subscribe({
        next: (data) => this.roles.set(data),
      });
  }

  fetchAttendanceSummary(classId: number): void {
    this.http.get<ClassAttendanceSummary>(getApiUrl(`/teachers/classes/${classId}/attendance-summary/`))
      .subscribe({
        next: (data) => this.attendanceSummary.set(data),
      });
  }

  fetchGradesSummary(classId: number): void {
    this.http.get<ClassGradesSummary>(getApiUrl(`/teachers/classes/${classId}/grades-summary/`))
      .subscribe({
        next: (data) => this.gradesSummary.set(data),
      });
  }
}
