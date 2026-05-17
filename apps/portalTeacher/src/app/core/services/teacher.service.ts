import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { getApiUrl } from '@sms/core/config';

@Injectable({ providedIn: 'root' })
export class TeacherService {
  private http = inject(HttpClient);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  protected get<T>(endpoint: string): Observable<T> {
    this.isLoading.set(true);
    this.error.set(null);
    return this.http.get<{ results?: T; data?: T } | T>(getApiUrl(endpoint)).pipe(
      map(res => {
        if (res && typeof res === 'object' && 'results' in res) return (res as any).results as T;
        if (res && typeof res === 'object' && 'data' in res) return (res as any).data as T;
        return res as T;
      }),
      tap(() => this.isLoading.set(false)),
      catchError(err => {
        this.isLoading.set(false);
        this.error.set('Failed to load data');
        return throwError(() => err);
      }),
    );
  }

  protected post<T>(endpoint: string, body: any): Observable<T> {
    this.isLoading.set(true);
    this.error.set(null);
    return this.http.post<T>(getApiUrl(endpoint), body).pipe(
      tap(() => this.isLoading.set(false)),
      catchError(err => {
        this.isLoading.set(false);
        this.error.set('Operation failed');
        return throwError(() => err);
      }),
    );
  }

  protected handleMock<T>(data: T, delayMs = 300): Observable<T> {
    return of(data).pipe(
      tap(() => {
        this.isLoading.set(true);
      }),
      map(val => {
        this.isLoading.set(false);
        return val;
      }),
    );
  }
}
