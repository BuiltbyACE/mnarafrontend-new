import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of, timer, Observable } from 'rxjs';
import { environment } from '@sms/core/config';
import { TokenStorageService } from '@sms/core/auth';

export interface RouteStop {
  id: number;
  name: string;
  order: number;
  latitude: string;
  longitude: string;
  estimated_arrival_offset: string;
}

export interface TransportRoute {
  id: number;
  name: string;
  is_active: boolean;
  stops: RouteStop[];
}

export interface DailyTrip {
  id: string;
  vehicle: number;
  vehicle_details?: { registration_number?: string };
  route: number;
  route_name: string;
  route_details?: TransportRoute;
  driver: number;
  driver_name: string;
  conductor: number;
  conductor_name: string;
  status: string;
  trip_type: string;
  start_time: string;
  end_time?: string;
  passenger_count: number;
}

export interface BusTelemetry {
  vehicle_id?: number;
  fleet_id?: string;
  latitude: number;
  longitude: number;
  speed_kmh: number;
  status?: string;
  driver_name?: string;
  route_name?: string;
  passenger_count?: number;
  registration_number?: string;
  timestamp?: string;
}

@Injectable({ providedIn: 'root' })
export class ParentTransportService {
  private http = inject(HttpClient);
  private tokenStorage = inject(TokenStorageService);

  readonly activeTrip = signal<DailyTrip | null>(null);
  readonly route = signal<TransportRoute | null>(null);
  readonly allRoutes = signal<TransportRoute[]>([]);
  readonly telemetry = signal<BusTelemetry | null>(null);
  readonly wsConnected = signal(false);
  readonly wsReconnecting = signal(false);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private currentTripId: string | null = null;

  loadAll(): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<TransportRoute[]>(`${environment.apiBaseUrl}/transport/routes/`)
      .pipe(catchError(() => of([])))
      .subscribe({
        next: (routes) => this.allRoutes.set(routes),
      });

    this.http.get<DailyTrip[]>(`${environment.apiBaseUrl}/transport/daily-trips/`, {
      params: { status: 'ON_ROUTE' },
    }).pipe(catchError(() => of([]))).subscribe({
      next: (trips) => {
        if (trips.length > 0) {
          const trip = trips[0];
          this.activeTrip.set(trip);
          this.loadRoute(trip.route);
          this.connectToTripStream(trip.id);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Failed to load trip data');
      },
    });
  }

  private loadRoute(routeId: number): void {
    this.http.get<TransportRoute>(`${environment.apiBaseUrl}/transport/routes/${routeId}/`)
      .pipe(catchError(() => of(null as unknown as TransportRoute)))
      .subscribe({
        next: (route) => {
          if (route) this.route.set(route);
        },
      });
  }

  connectToTripStream(tripId: string): void {
    this.disconnectWebSocket();
    this.currentTripId = tripId;
    this.reconnectAttempts = 0;
    this.connectWs();
  }

  private connectWs(): void {
    const token = this.tokenStorage.getAccessToken();
    if (!token) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const baseUrl = environment.apiBaseUrl
      .replace(/^https?:\/\//, '')
      .replace(/\/api\/v1\/?$/, '');
    const wsUrl = `${wsProtocol}//${baseUrl}/ws/fleet/live/?token=${token}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.wsConnected.set(true);
      this.wsReconnecting.set(false);
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as BusTelemetry;
        if (data.latitude != null && data.longitude != null) {
          this.telemetry.set(data);
        }
      } catch { }
    };

    this.ws.onclose = () => {
      this.wsConnected.set(false);
      if (this.reconnectAttempts < 10) {
        this.wsReconnecting.set(true);
        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);
        timer(delay).subscribe(() => this.connectWs());
      }
    };

    this.ws.onerror = () => {
      this.wsConnected.set(false);
    };
  }

  disconnectWebSocket(): void {
    if (this.ws) {
      this.ws.close(1000, 'Component cleanup');
      this.ws = null;
    }
    this.wsConnected.set(false);
    this.wsReconnecting.set(false);
  }
}
