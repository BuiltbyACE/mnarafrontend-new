import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, finalize } from 'rxjs';
import { getApiUrl } from '@sms/core/config';

export interface ResourceDTO {
  id: string;
  title: string;
  resource_type: 'video' | 'textbook' | 'coursebook' | 'past-paper';
  subject: string;
  description: string;
  created_at: string;
  file_size_mb: number;
}

@Injectable({ providedIn: 'root' })
export class ResourcesService {
  private http = inject(HttpClient);

  readonly resources = signal<ResourceDTO[]>([]);
  readonly isLoading = signal(true);

  fetchResources(): void {
    this.isLoading.set(true);
    this.http.get<{ results: ResourceDTO[] }>(getApiUrl('/lms/my-resources/'))
      .pipe(
        map((res) => res.results),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (data) => this.resources.set(data),
        error: () => this.resources.set([]),
      });
  }
}
