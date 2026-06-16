import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, tap, map, switchMap, finalize } from 'rxjs';
import { getApiUrl } from '@sms/core/config';
import { OmnichannelPayload, AudienceType, YearLevelOption } from './communication.models';

export interface Broadcast {
  id: string;
  title: string;
  body: string;
  audience_type: string;
  year_level: number | null;
  year_level_name: string | null;
  author_name: string;
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'COMPLETED' | 'FAILED';
  total_recipients: number;
  delivered_count: number;
  read_count: number;
  created_at: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  audience: string;
  is_active: boolean;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

@Injectable({ providedIn: 'root' })
export class OmnichannelService {
  private readonly http = inject(HttpClient);

  readonly yearLevels = signal<YearLevelOption[]>([]);
  readonly isSending = signal(false);
  readonly error = signal<string | null>(null);

  loadYearLevels(): void {
    this.http.get<{ results: YearLevelOption[] }>(getApiUrl('/academics/year-levels/')).pipe(
      map(res => res.results || []),
      catchError(() => {
        this.yearLevels.set([]);
        return throwError(() => new Error('Failed to load year levels'));
      }),
    ).subscribe(data => this.yearLevels.set(data));
  }

  sendOmnichannel(payload: OmnichannelPayload): Observable<{ broadcast?: Broadcast; announcement?: Announcement }> {
    this.isSending.set(true);
    this.error.set(null);

    const results: { broadcast?: Broadcast; announcement?: Announcement } = {};
    let chain: Observable<any> = new Observable(sub => sub.next(null));

    if (payload.send_sms) {
      chain = chain.pipe(
        tap(() => {}),
        switchMap(() =>
          this.http.post<Broadcast>(getApiUrl('/communication/broadcasts/'), {
            title: payload.title,
            body: payload.body,
            audience_type: payload.audience_type,
            year_level: payload.year_level_id ?? null,
          }).pipe(
            tap(b => results.broadcast = b),
          )
        ),
      );
    }

    if (payload.send_in_app) {
      const audienceMap: Record<string, string> = {
        [AudienceType.ALL]: 'ALL',
        [AudienceType.STAFF]: 'STAFF',
        [AudienceType.STUDENTS]: 'STUDENTS',
        [AudienceType.PARENTS]: 'PARENTS',
        [AudienceType.YEAR_LEVEL_PARENTS]: 'PARENTS',
        [AudienceType.SPECIFIC_ROLES]: 'ALL',
      };
      chain = chain.pipe(
        switchMap(() =>
          this.http.post<Announcement>(getApiUrl('/lms/announcements/'), {
            title: payload.title,
            content: payload.body,
            audience: audienceMap[payload.audience_type] || 'ALL',
            is_active: true,
          }).pipe(
            tap(a => results.announcement = a),
          )
        ),
      );
    }

    return chain.pipe(
      map(() => results),
      catchError(err => {
        const msg = err.error?.message || 'Failed to send communication';
        this.error.set(msg);
        return throwError(() => new Error(msg));
      }),
      finalize(() => this.isSending.set(false)),
    );
  }

  dispatchBroadcast(id: string): Observable<any> {
    return this.http.post(getApiUrl(`/communication/broadcasts/${id}/dispatch_message/`), {});
  }
}
