import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, finalize } from 'rxjs';
import { getApiUrl } from '@sms/core/config';

export interface Broadcast {
  id: string;
  title: string;
  body: string;
  author: number;
  author_name: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY';
  audience_type: 'ALL' | 'STAFF' | 'PARENTS' | 'STUDENTS' | 'SPECIFIC_ROLES' | 'YEAR_LEVEL_PARENTS';
  year_level: number | null;
  scheduled_at: string | null;
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'COMPLETED' | 'FAILED';
  created_at: string;
  updated_at: string;
  total_recipients: number;
  delivered_count: number;
  read_count: number;
  year_level_name: string | null;
}

export interface CreateBroadcastPayload {
  title: string;
  body: string;
  priority: string;
  audience_type: string;
  year_level?: number | null;
  scheduled_at?: string | null;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class BroadcastService {
  private http = inject(HttpClient);

  readonly broadcasts = signal<Broadcast[]>([]);
  readonly isLoading = signal(false);
  readonly isCreating = signal(false);
  readonly error = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  fetchBroadcasts(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get<Broadcast[]>(getApiUrl('/communication/broadcasts/'))
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => this.broadcasts.set(data),
        error: () => this.error.set('Failed to load broadcasts'),
      });
  }

  createBroadcast(payload: CreateBroadcastPayload): Observable<Broadcast> {
    return this.http.post<Broadcast>(getApiUrl('/communication/broadcasts/'), payload);
  }

  dispatchBroadcast(id: string): Observable<{ detail: string }> {
    return this.http.post<{ detail: string }>(
      getApiUrl(`/communication/broadcasts/${id}/dispatch_message/`),
      {}
    );
  }
}
