import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  Observable, catchError, throwError, of, Subject,
  Subscription, timer, interval,
} from 'rxjs';
import { retry, tap } from 'rxjs/operators';
import { getApiUrl, environment } from '@sms/core/config';
import { TokenStorageService } from '@sms/core/auth';
import type {
  FleetVehicle, TransportRoute, DailyTrip, TripManifest,
  TripIncident, VehicleMaintenanceLog, VehicleTelemetrySample,
  FleetDevice, FleetTelemetry,
  TransportDashboardData,
  DeviceProvisionResponse, DeviceProvisionRequest, EmergencyStopResponse,
} from '../../../shared/models/transport.models';

@Injectable({ providedIn: 'root' })
export class TransportService {
  private http = inject(HttpClient);
  private tokenStorage = inject(TokenStorageService);

  readonly dashboardData = signal<TransportDashboardData | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly activeTrips = signal<DailyTrip[]>([]);
  readonly incidents = signal<TripIncident[]>([]);
  readonly vehicles = signal<FleetVehicle[]>([]);
  readonly routes = signal<TransportRoute[]>([]);

  readonly wsConnected = signal<boolean>(false);
  readonly wsReconnecting = signal<boolean>(false);
  readonly telemetryUpdates = signal<FleetTelemetry[]>([]);

  readonly incidentsAccessDenied = signal<boolean>(false);

  private wsSubscription: Subscription | null = null;
  private summaryRefreshSub: Subscription | null = null;
  private telemetrySubject = new Subject<FleetTelemetry>();
  readonly telemetry$ = this.telemetrySubject.asObservable();
  private readonly MAX_RECONNECT = 10;
  private readonly RETRY_BASE_DELAY = 1000;
  private readonly SUMMARY_REFRESH_INTERVAL = 60000;

  // ─── REST Endpoints ──────────────────────────────────────────────────────────

  getDashboardData(): Observable<TransportDashboardData> {
    this.isLoading.set(true);
    this.error.set(null);
    return this.http.get<TransportDashboardData>(getApiUrl('/transport/summary/')).pipe(
      catchError((err) => {
        const msg = err.error?.message || 'Failed to load transport dashboard';
        this.error.set(msg);
        this.isLoading.set(false);
        return throwError(() => new Error(msg));
      })
    );
  }

  getVehicles(page = 1, pageSize = 25): Observable<{ count: number; results: FleetVehicle[] }> {
    const params = new HttpParams().set('page', page.toString()).set('page_size', pageSize.toString());
    return this.http.get<{ count: number; results: FleetVehicle[] }>(getApiUrl('/transport/vehicles/'), { params }).pipe(
      catchError(() => of({ count: 0, results: [] }))
    );
  }

  getVehicle(id: number): Observable<FleetVehicle> {
    return this.http.get<FleetVehicle>(getApiUrl(`/transport/vehicles/${id}/`));
  }

  createVehicle(data: Partial<FleetVehicle>): Observable<FleetVehicle> {
    return this.http.post<FleetVehicle>(getApiUrl('/transport/vehicles/'), data).pipe(
      catchError((err) => throwError(() => new Error(err.error?.message || 'Failed to create vehicle')))
    );
  }

  updateVehicle(id: number, data: Partial<FleetVehicle>): Observable<FleetVehicle> {
    return this.http.patch<FleetVehicle>(getApiUrl(`/transport/vehicles/${id}/`), data).pipe(
      catchError((err) => throwError(() => new Error(err.error?.message || 'Failed to update vehicle')))
    );
  }

  deleteVehicle(id: number): Observable<void> {
    return this.http.delete<void>(getApiUrl(`/transport/vehicles/${id}/`)).pipe(
      catchError((err) => throwError(() => new Error(err.error?.message || 'Failed to delete vehicle')))
    );
  }

  getRoutes(): Observable<TransportRoute[]> {
    return this.http.get<TransportRoute[]>(getApiUrl('/transport/routes/')).pipe(
      catchError(() => of([]))
    );
  }

  getRoute(id: number): Observable<TransportRoute> {
    return this.http.get<TransportRoute>(getApiUrl(`/transport/routes/${id}/`));
  }

  getDailyTrips(params?: { status?: string; trip_type?: string; vehicle?: number; driver?: number }): Observable<DailyTrip[]> {
    let httpParams = new HttpParams();
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.trip_type) httpParams = httpParams.set('trip_type', params.trip_type);
    if (params?.vehicle) httpParams = httpParams.set('vehicle', params.vehicle);
    if (params?.driver) httpParams = httpParams.set('driver', params.driver);
    return this.http.get<DailyTrip[]>(getApiUrl('/transport/daily-trips/'), { params: httpParams }).pipe(
      catchError(() => of([]))
    );
  }

  startTrip(id: string): Observable<{ status: string; trip_id: string; start_time: string }> {
    return this.http.post<{ status: string; trip_id: string; start_time: string }>(
      getApiUrl(`/transport/daily-trips/${id}/start_trip/`), {}
    );
  }

  endTrip(id: string): Observable<{ status: string; trip_id: string; end_time: string }> {
    return this.http.post<{ status: string; trip_id: string; end_time: string }>(
      getApiUrl(`/transport/daily-trips/${id}/end_trip/`), {}
    );
  }

  createTrip(data: Partial<DailyTrip>): Observable<DailyTrip> {
    return this.http.post<DailyTrip>(getApiUrl('/transport/daily-trips/'), data).pipe(
      catchError((err) => throwError(() => new Error(err.error?.message || 'Failed to create trip')))
    );
  }

  getManifests(tripId?: string): Observable<TripManifest[]> {
    let params = new HttpParams();
    if (tripId) params = params.set('trip', tripId);
    return this.http.get<TripManifest[]>(getApiUrl('/transport/manifests/'), { params }).pipe(
      catchError(() => of([]))
    );
  }

  createManifest(data: { trip: string; student: number; stop_name?: string }): Observable<TripManifest> {
    return this.http.post<TripManifest>(getApiUrl('/transport/manifests/'), data).pipe(
      catchError((err) => throwError(() => new Error(err.error?.message || 'Failed to assign student')))
    );
  }

  deleteManifest(id: number): Observable<void> {
    return this.http.delete<void>(getApiUrl(`/transport/manifests/${id}/`)).pipe(
      catchError((err) => throwError(() => new Error(err.error?.message || 'Failed to remove student')))
    );
  }

  getIncidents(params?: { trip?: string; resolved?: boolean }): Observable<TripIncident[]> {
    let httpParams = new HttpParams();
    if (params?.trip) httpParams = httpParams.set('trip', params.trip);
    if (params?.resolved !== undefined) httpParams = httpParams.set('resolved', params.resolved.toString());
    this.incidentsAccessDenied.set(false);
    return this.http.get<TripIncident[]>(getApiUrl('/transport/incidents/'), { params: httpParams }).pipe(
      catchError((err) => {
        if (err.status === 403) {
          this.incidentsAccessDenied.set(true);
        }
        return of([]);
      })
    );
  }

  createIncident(data: Partial<TripIncident>): Observable<TripIncident> {
    return this.http.post<TripIncident>(getApiUrl('/transport/incidents/'), data);
  }

  getTelemetry(tripId?: string): Observable<VehicleTelemetrySample[]> {
    let params = new HttpParams();
    if (tripId) params = params.set('trip', tripId);
    return this.http.get<VehicleTelemetrySample[]>(getApiUrl('/transport/telemetry/'), { params }).pipe(
      catchError(() => of([]))
    );
  }

  getMaintenanceLogs(vehicleId?: number): Observable<VehicleMaintenanceLog[]> {
    let params = new HttpParams();
    if (vehicleId) params = params.set('vehicle', vehicleId);
    return this.http.get<VehicleMaintenanceLog[]>(getApiUrl('/transport/maintenance-logs/'), { params }).pipe(
      catchError(() => of([]))
    );
  }

  downloadReport(format: 'pdf' | 'xlsx', type: 'fleet_utilization' | 'fuel_maintenance'): Observable<Blob> {
    return this.http.get(getApiUrl(`/transport/reports/${type}/`), {
      params: new HttpParams().set('format', format),
      responseType: 'blob',
    }).pipe(catchError((err) => throwError(() => new Error(err.error?.message || 'Failed to download report'))));
  }

  setDashboardData(data: TransportDashboardData): void {
    this.dashboardData.set(data);
    this.activeTrips.set(data.active_trips || []);
    this.incidents.set(data.incidents || []);
    this.isLoading.set(false);
  }

  // ─── Fleet Device Management ─────────────────────────────────────────────────

  getFleetDevices(): Observable<FleetDevice[]> {
    return this.http.get<FleetDevice[]>(getApiUrl('/transport/fleet-devices/')).pipe(
      catchError(() => of([]))
    );
  }

  generateDevicePin(data: DeviceProvisionRequest): Observable<DeviceProvisionResponse> {
    return this.http.post<DeviceProvisionResponse>(getApiUrl('/transport/devices/provision/'), data).pipe(
      catchError((err) => throwError(() => new Error(err.error?.message || 'Failed to provision device')))
    );
  }

  // ─── Emergency Stop ───────────────────────────────────────────────────────────

  emergencyStopTrip(tripId: string): Observable<EmergencyStopResponse> {
    return this.http.post<EmergencyStopResponse>(
      getApiUrl(`/transport/daily-trips/${tripId}/emergency_stop/`), {}
    ).pipe(
      catchError((err) => throwError(() => new Error(err.error?.message || 'Failed to emergency stop trip')))
    );
  }

  // ─── Reporting ────────────────────────────────────────────────────────────────

  downloadDailyTripLog(format: 'pdf' | 'xlsx' = 'pdf'): Observable<Blob> {
    return this.http.get(getApiUrl('/transport/reports/daily-trip-log/'), {
      params: new HttpParams().set('format', format),
      responseType: 'blob',
    }).pipe(catchError((err) => throwError(() => new Error(err.error?.message || 'Failed to download daily trip log'))));
  }

  downloadStudentCommuterList(format: 'pdf' | 'xlsx' = 'xlsx'): Observable<Blob> {
    return this.http.get(getApiUrl('/transport/reports/student-commuter-list/'), {
      params: new HttpParams().set('format', format),
      responseType: 'blob',
    }).pipe(catchError((err) => throwError(() => new Error(err.error?.message || 'Failed to download commuter list'))));
  }

  // ─── WebSocket (RxJS-based with auto-reconnect) ──────────────────────────────

  connectWebSocket(): void {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
    this.wsReconnecting.set(false);

    this.wsSubscription = this.createWebSocketObservable().pipe(
      retry({
        count: this.MAX_RECONNECT,
        delay: (_, retryCount) => {
          this.wsReconnecting.set(true);
          const delayMs = Math.min(
            this.RETRY_BASE_DELAY * Math.pow(2, retryCount - 1),
            30000,
          );
          return timer(delayMs);
        },
      }),
      tap({
        next: (data) => {
          this.wsConnected.set(true);
          this.wsReconnecting.set(false);
          this.telemetrySubject.next(data);
          this.updateTelemetryCache(data);
          if (data.status) {
            this.refreshSummary();
          }
        },
        error: () => this.wsConnected.set(false),
      }),
      catchError((err) => {
        this.wsConnected.set(false);
        this.wsReconnecting.set(false);
        return throwError(() => err);
      }),
    ).subscribe();
  }

  disconnectWebSocket(): void {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
      this.wsSubscription = null;
    }
    this.wsConnected.set(false);
    this.wsReconnecting.set(false);
  }

  private createWebSocketObservable(): Observable<FleetTelemetry> {
    return new Observable<FleetTelemetry>((subscriber) => {
      const token = this.tokenStorage.getAccessToken();
      if (!token) {
        subscriber.error(new Error('No auth token'));
        return;
      }

      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const baseUrl = environment.apiBaseUrl
        .replace(/^https?:\/\//, '')
        .replace(/\/api\/v1\/?$/, '');
      const wsUrl = `${wsProtocol}//${baseUrl}/ws/fleet/live/?token=${token}`;

      let wsClosed = false;

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        this.wsConnected.set(true);
        this.wsReconnecting.set(false);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as FleetTelemetry;
          if (data.latitude != null && data.longitude != null) {
            subscriber.next(data);
          }
        } catch { /* skip unparseable */ }
      };

      ws.onerror = () => {
        this.wsConnected.set(false);
      };

      ws.onclose = (event) => {
        wsClosed = true;
        this.wsConnected.set(false);
        if (event.code !== 1000 && event.code !== 1001) {
          this.wsReconnecting.set(true);
          subscriber.error(new Error(`WebSocket closed: code=${event.code}`));
        } else {
          subscriber.complete();
        }
      };

      return () => {
        if (!wsClosed && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
          ws.close(1000, 'Component cleanup');
        }
      };
    });
  }

  private updateTelemetryCache(update: FleetTelemetry): void {
    const current = this.telemetryUpdates();
    const idx = current.findIndex(
      (t) => t.vehicle_id === update.vehicle_id || t.fleet_id === update.fleet_id,
    );
    if (idx >= 0) {
      const updated = [...current];
      updated[idx] = {
        ...updated[idx],
        ...update,
        timestamp: new Date().toISOString(),
      };
      this.telemetryUpdates.set(updated);
    } else {
      this.telemetryUpdates.set([
        ...current,
        { ...update, timestamp: new Date().toISOString() },
      ]);
    }
  }

  getVehicleTelemetry(vehicleId: number): FleetTelemetry | undefined {
    return this.telemetryUpdates().find(
      (t) => t.vehicle_id === vehicleId,
    );
  }

  // ─── Summary Auto-Refresh ────────────────────────────────────────────────────

  startSummaryRefresh(): void {
    this.stopSummaryRefresh();
    this.summaryRefreshSub = interval(this.SUMMARY_REFRESH_INTERVAL).subscribe(() => {
      this.refreshSummary();
    });
  }

  stopSummaryRefresh(): void {
    this.summaryRefreshSub?.unsubscribe();
    this.summaryRefreshSub = null;
  }

  private refreshSummary(): void {
    this.http.get<TransportDashboardData>(getApiUrl('/transport/summary/')).pipe(
      catchError(() => of(null)),
    ).subscribe((data) => {
      if (data) {
        this.setDashboardData(data);
      }
    });
  }
}
