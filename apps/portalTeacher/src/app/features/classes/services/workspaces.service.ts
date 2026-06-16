import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';
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
  instructions: string;
  submission_type: string;
  due_date: string | null;
  max_score: number;
  status: 'OPEN' | 'GRADED';
  submissions_count: number;
  is_published: boolean;
  allow_immediate_review: boolean;
}

export interface Resource {
  id: number;
  title: string;
  type: string;
  description: string;
  url: string;
  is_published: boolean;
  created_at: string;
}

export interface RosterStudent {
  id: number;
  admission_number: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface GradebookAssignment {
  id: number;
  title: string;
  max_score: number;
}

export interface GradebookStudent {
  id: number;
  admission_number: string;
  name: string;
  grades: { [assignmentId: string]: number | string | null };
}

export interface GradebookData {
  workspace_id: number;
  assignments: GradebookAssignment[];
  students: GradebookStudent[];
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
    return this.http.get<CourseWorkspace[]>(getApiUrl('/lms/workspaces/my-classes/')).pipe(
      tap({
        next: (data) => {
          this.workspaces.set(data);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to load workspaces');
          this.isLoading.set(false);
        }
      })
    );
  }

  getWorkspaceById(id: string | number): Observable<CourseWorkspace> {
    return this.http.get<CourseWorkspace>(getApiUrl(`/lms/workspaces/${id}/`));
  }

  getWorkspaceHydration(id: string | number): Observable<WorkspaceHydration> {
    return this.http.get<WorkspaceHydration>(getApiUrl(`/lms/workspaces/${id}/hydration/`));
  }

  getAssignments(workspaceId: string | number): Observable<Assignment[]> {
    return this.http.get<{ assignments: Assignment[] }>(getApiUrl(`/lms/workspaces/${workspaceId}/assignments/`)).pipe(
      map(res => res.assignments)
    );
  }

  getResources(workspaceId: string | number): Observable<Resource[]> {
    return this.http.get<{ resources: Resource[] }>(getApiUrl(`/lms/workspaces/${workspaceId}/resources/`)).pipe(
      map(res => res.resources)
    );
  }

  toggleResourcePublish(resourceId: number): Observable<{ is_published: boolean }> {
    return this.http.post<{ is_published: boolean }>(
      getApiUrl(`/lms/lesson-resources/${resourceId}/toggle_publish/`),
      {}
    );
  }

  getRoster(workspaceId: string | number): Observable<RosterStudent[]> {
    return this.http.get<{ roster: RosterStudent[] }>(getApiUrl(`/lms/workspaces/${workspaceId}/roster/`)).pipe(
      map(res => res.roster)
    );
  }

  getGradebook(workspaceId: string | number): Observable<GradebookData> {
    return this.http.get<GradebookData>(getApiUrl(`/lms/workspaces/${workspaceId}/gradebook/`));
  }
}