import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { getApiUrl } from '@sms/core/config';

export interface CourseWorkspace {
  id: number;
  subject_name: string;
  teacher_name: string;
  classroom_name: string;
  syllabus_overview: string | null;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: CourseWorkspace[];
}

@Injectable({ providedIn: 'root' })
export class ClassesService {
  private http = inject(HttpClient);

  readonly myClasses = signal<CourseWorkspace[]>([]);
  readonly isLoading = signal(true);

  fetchMyClasses(): void {
    this.isLoading.set(true);

    this.http
      .get<PaginatedResponse>(getApiUrl('/lms/workspaces/'))
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.myClasses.set(response.results ?? []);
        },
        error: () => {
          this.myClasses.set([]);
        },
      });
  }
}
