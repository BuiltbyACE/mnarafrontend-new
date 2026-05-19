import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { getApiUrl } from '@sms/core/config';

export interface CourseWorkspace {
  id: number;
  subject_name: string;
  classroom_name: string;
  syllabus_overview: string;
  student_count: number;
  pending_tasks: number;
  term_name?: string;
}

export interface Assignment {
  id: number;
  title: string;
  due_date: string;
  total_marks: number;
  submission_count: number;
  status: 'draft' | 'published' | 'closed';
}

export interface Resource {
  id: number;
  title: string;
  file_type: 'pdf' | 'video' | 'doc' | 'link';
  file_url: string;
  uploaded_at: string;
}

export interface WorkspaceHydration {
  assignments: Assignment[];
  resources: Resource[];
  gradebook_url: string;
  attendance_url: string;
  roster: { id: number; first_name: string; last_name: string; admission_number: string }[];
}

@Injectable({ providedIn: 'root' })
export class WorkspacesService {
  private http = inject(HttpClient);
  readonly workspaces = signal<CourseWorkspace[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  fetchMyWorkspaces(): Observable<CourseWorkspace[]> {
    this.isLoading.set(true);
    this.error.set(null);
    return this.http.get<CourseWorkspace[]>(getApiUrl('/lms/workspaces/my-classes/'));
  }

  getWorkspaceById(id: string | number): Observable<CourseWorkspace> {
    return this.http.get<CourseWorkspace>(getApiUrl(`/lms/workspaces/${id}/`));
  }

  getWorkspaceHydration(id: string | number): Observable<WorkspaceHydration> {
    return this.http.get<WorkspaceHydration>(getApiUrl(`/lms/workspaces/${id}/hydration/`));
  }

  getAssignments(workspaceId: string | number): Observable<Assignment[]> {
    return this.http.get<Assignment[]>(getApiUrl(`/lms/workspaces/${workspaceId}/assignments/`));
  }

  getResources(workspaceId: string | number): Observable<Resource[]> {
    return this.http.get<Resource[]>(getApiUrl(`/lms/workspaces/${workspaceId}/resources/`));
  }
}