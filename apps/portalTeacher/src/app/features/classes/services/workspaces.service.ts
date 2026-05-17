import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { getApiUrl } from '@sms/core/config';

export interface CourseWorkspace {
  id: number;
  subject_name: string;
  classroom_name: string;
  syllabus_overview: string;
  student_count?: number;
}

@Injectable({ providedIn: 'root' })
export class WorkspacesService {
  private http = inject(HttpClient);
  readonly workspaces = signal<CourseWorkspace[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  fetchMyWorkspaces(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get<CourseWorkspace[]>(getApiUrl('/lms/workspaces/'))
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => this.workspaces.set(data),
        error: () => this.error.set('Failed to load workspaces'),
      });
  }
}
