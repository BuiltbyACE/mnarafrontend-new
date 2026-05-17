import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { getApiUrl } from '@sms/core/config';
import { Resource, CreateResourcePayload } from '../../shared/models/teacher.models';

interface RawResource {
  id: number;
  course: number;
  title: string;
  resource_type: string;
  description?: string;
  file_attachment?: string | null;
  file_size_mb?: number | null;
  external_url?: string | null;
  is_published: boolean;
  created_at: string;
  subject?: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

function mapResource(r: RawResource): Resource {
  return {
    id: r.id,
    title: r.title,
    type: r.resource_type as Resource['type'],
    description: r.description,
    subject: r.subject ?? '',
    course: r.course,
    file_attachment: r.file_attachment,
    file_size_mb: r.file_size_mb,
    external_url: r.external_url,
    is_published: r.is_published,
    created_at: r.created_at,
  };
}

@Injectable({ providedIn: 'root' })
export class TeacherResourceService {
  private http = inject(HttpClient);

  readonly resources = signal<Resource[]>([]);
  readonly totalCount = signal(0);
  readonly isLoading = signal(false);
  readonly isUploading = signal(false);
  readonly error = signal<string | null>(null);

  fetchResources(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get<PaginatedResponse<RawResource>>(getApiUrl('/lms/lesson-resources/'))
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.resources.set(res.results.map(mapResource));
          this.totalCount.set(res.count);
        },
        error: () => this.error.set('Failed to load resources'),
      });
  }

  uploadResource(payload: CreateResourcePayload): void {
    this.isUploading.set(true);
    this.error.set(null);
    const formData = new FormData();
    formData.append('course', String(payload.course));
    formData.append('title', payload.title);
    formData.append('resource_type', payload.resource_type);
    if (payload.description) formData.append('description', payload.description);
    if (payload.file_attachment) formData.append('file_attachment', payload.file_attachment);
    if (payload.external_url) formData.append('external_url', payload.external_url);
    if (payload.file_size_mb != null) formData.append('file_size_mb', String(payload.file_size_mb));

    this.http.post<RawResource>(getApiUrl('/lms/lesson-resources/'), formData)
      .pipe(finalize(() => this.isUploading.set(false)))
      .subscribe({
        next: () => this.fetchResources(),
        error: () => this.error.set('Failed to upload resource'),
      });
  }

  deleteResource(id: number): void {
    this.http.delete(getApiUrl(`/lms/lesson-resources/${id}/`))
      .subscribe({
        next: () => this.resources.update(list => list.filter(r => r.id !== id)),
        error: () => this.error.set('Failed to delete resource'),
      });
  }
}
