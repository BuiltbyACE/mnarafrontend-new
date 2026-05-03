/**
 * Transport Service
 * Manages fleet vehicles and routes
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError, of } from 'rxjs';
import { getApiUrl } from '@sms/core/config';
import { FleetVehicle, Route } from '../../../shared/models/transport.models';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface FleetSummary {
  total_vehicles: number;
  active_routes: number;
  online_count: number;
}

@Injectable({
  providedIn: 'root',
})
export class TransportService {
  private http = inject(HttpClient);

  readonly vehicles = signal<FleetVehicle[]>([]);
  readonly routes = signal<Route[]>([]);
  readonly totalCount = signal<number>(0);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly fleetSummary = signal<FleetSummary | null>(null);

  getVehicles(
    page: number = 1,
    pageSize: number = 25,
    filters?: { is_active?: boolean }
  ): Observable<PaginatedResponse<FleetVehicle>> {
    this.isLoading.set(true);
    this.error.set(null);

    let params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());

    if (filters?.is_active !== undefined) {
      params = params.set('is_active', filters.is_active.toString());
    }

    return this.http
      .get<PaginatedResponse<FleetVehicle>>(getApiUrl('/fleet/vehicles/'), { params })
      .pipe(
        catchError((err) => {
          // Safe stub - return empty data while backend implements endpoint
          if (err.status === 404) {
            console.warn('Fleet vehicles endpoint not implemented yet, returning empty data');
            this.isLoading.set(false);
            return of({
              count: 0,
              next: null,
              previous: null,
              results: []
            });
          }
          const message = err.error?.message || 'Failed to load vehicles';
          this.error.set(message);
          this.isLoading.set(false);
          return throwError(() => new Error(message));
        })
      );
  }

  getRoutes(): Observable<Route[]> {
    return this.http.get<Route[]>(getApiUrl('/fleet/routes/')).pipe(
      catchError((err) => {
        // Safe stub - return empty data while backend implements endpoint
        if (err.status === 404) {
          console.warn('Fleet routes endpoint not implemented yet, returning empty data');
          return of([]);
        }
        return throwError(() => new Error('Failed to load routes'));
      })
    );
  }

  getFleetSummary(): Observable<FleetSummary> {
    return this.http.get<FleetSummary>(getApiUrl('/fleet/summary/')).pipe(
      catchError((err) => {
        // Safe stub - return empty data while backend implements endpoint
        if (err.status === 404) {
          console.warn('Fleet summary endpoint not implemented yet, returning empty data');
          return of({
            total_vehicles: 0,
            active_routes: 0,
            online_count: 0
          });
        }
        return throwError(() => new Error('Failed to load fleet summary'));
      })
    );
  }

  setVehicles(data: FleetVehicle[], total: number): void {
    this.vehicles.set(data);
    this.totalCount.set(total);
    this.isLoading.set(false);
  }

  loadFleetSummary(): void {
    this.getFleetSummary().subscribe({
      next: (summary) => this.fleetSummary.set(summary),
      error: () => this.fleetSummary.set(null),
    });
  }
}
