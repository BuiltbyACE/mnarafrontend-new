import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, finalize } from 'rxjs';
import { getApiUrl } from '@sms/core/config';
import { RealtimeService } from '../../../../core/services/realtime.service';

export interface ResourceDTO {
  id: string;
  title: string;
  resource_type: string;
  subject: string;
  description: string;
  created_at: string;
  file_size_mb: number;
  file_attachment?: string;
  external_url?: string;
  is_favorite?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ResourcesService {
  private http = inject(HttpClient);
  private realtime = inject(RealtimeService);

  readonly resources = signal<ResourceDTO[]>([]);
  readonly isLoading = signal(true);

  constructor() {
    this.realtime.newResources$.subscribe(msg => {
      // Prepend the new resource to the list
      this.resources.update(current => [msg.resource as unknown as ResourceDTO, ...current]);
    });
  }

  fetchResources(workspaceId?: number): void {
    this.isLoading.set(true);
    let url = '/lms/my-resources/';
    if (workspaceId) {
      url += `?workspace_id=${workspaceId}`;
    }
    this.http.get<{ results: ResourceDTO[] }>(getApiUrl(url))
      .pipe(
        map((res) => res.results),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (data) => this.resources.set(data),
        error: () => this.resources.set([]),
      });
  }

  toggleFavorite(resourceId: string | number) {
    return this.http.post<{ is_favorite: boolean }>(getApiUrl(`/lms/resources/${resourceId}/favorite/`), {});
  }
}
