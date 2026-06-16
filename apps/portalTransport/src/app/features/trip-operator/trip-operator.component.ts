import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ConductorApiService } from '../../shared/services/conductor-api.service';
import { TelemetryStreamService } from '../../shared/services/telemetry-stream.service';
import { RoadRoutingService, type RouteGeometry } from '../../shared/services/road-routing.service';
import { PassengerCardComponent } from './components/passenger-card/passenger-card.component';
import { RouteStopsComponent } from './components/route-stops/route-stops.component';
import { TripStatusComponent } from './components/trip-status/trip-status.component';
import { 
  BusIcon, 
  LogOutIcon, 
  PlayIcon, 
  SquareIcon,
  UsersIcon,
  MapPinIcon,
  WifiIcon,
  WifiOffIcon,
  NavigationIcon,
  RadioIcon,
  ClockIcon,
  ArrowRightIcon
} from '../../shared/components/icons/lucide-icons';
import type { DailyTrip, TripManifest, TripStatus, RouteStop } from '../../shared/models/transport.models';

@Component({
  selector: 'app-trip-operator',
  standalone: true,
  imports: [
    CommonModule,
    PassengerCardComponent,
    RouteStopsComponent,
    TripStatusComponent,
    BusIcon,
    LogOutIcon,
    PlayIcon,
    SquareIcon,
    UsersIcon,
    MapPinIcon,
    WifiIcon,
    WifiOffIcon,
    NavigationIcon,
    RadioIcon,
    ClockIcon,
    ArrowRightIcon,
  ],
  templateUrl: './trip-operator.component.html',
  styleUrls: ['./trip-operator.component.scss'],
})
export class TripOperatorComponent implements OnInit, OnDestroy {
  private api = inject(ConductorApiService);
  private telemetry = inject(TelemetryStreamService);
  private routing = inject(RoadRoutingService);
  private router = inject(Router);

  // Core State Signals — pre-populate from cache to avoid ExpressionChangedError
  readonly trip = signal<DailyTrip | null>(this.api.getCachedTrip());
  readonly passengers = signal<TripManifest[]>([]);
  readonly deviceReg = signal(this.api.getDeviceInfo()?.registration_number ?? '');
  readonly isLoading = signal(false);

  // Telemetry State
  readonly lastLat = signal<number | null>(null);
  readonly lastLng = signal<number | null>(null);
  readonly gpsActive = signal(false);
  readonly telemetryError = computed(() => this.telemetry.error());
  readonly lastPosition = computed(() => this.telemetry.lastPosition());
  readonly bufferSize = computed(() => this.telemetry.getBufferSize());

  // Road Routing State
  readonly currentRoute = signal<RouteGeometry | null>(null);
  readonly routeLoading = signal(false);
  readonly routeError = signal<string | null>(null);
  readonly nextStop = computed((): RouteStop | null => {
    const stops = this.routeStops();
    const currentId = this.currentStopId();
    return stops.find(s => s.id === currentId) ?? null;
  });
  readonly distanceToNextStop = computed(() => 
    this.currentRoute()?.distanceKm ?? null
  );
  readonly etaToNextStop = computed(() => {
    const minutes = this.currentRoute()?.durationMinutes;
    if (!minutes) return null;
    const eta = new Date();
    eta.setMinutes(eta.getMinutes() + minutes);
    return eta.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  });
  readonly hasRouteData = computed(() => this.currentRoute() !== null);

  // Derived Trip State
  readonly tripStatus = computed((): TripStatus => this.trip()?.status ?? 'SCHEDULED');
  readonly tripTypeClass = computed(() => {
    const type = this.trip()?.trip_type?.toLowerCase();
    return `trip-type-${type}`;
  });
  readonly tripTypeLabel = computed(() => {
    const type = this.trip()?.trip_type;
    return type === 'MORNING' ? 'Pickup' : 'Drop-off';
  });

  // Manifest Computations
  readonly totalCount = computed(() => this.passengers().length);
  readonly boardedCount = computed(() => this.passengers().filter(p => p.boarded).length);
  readonly processedCount = computed(() => 
    this.passengers().filter(p => p.boarded || p.alighted).length
  );
  readonly processedPct = computed(() => {
    const total = this.totalCount();
    return total ? (this.processedCount() / total) * 100 : 0;
  });
  readonly allPassengersProcessed = computed(() => 
    this.passengers().length > 0 && this.passengers().every(p => p.alighted)
  );
  readonly sortedPassengers = computed(() => {
    // Sort by stop order, then by name
    const stops = this.routeStops();
    return [...this.passengers()].sort((a, b) => {
      const stopOrderA = stops.find(s => s.id === a.stop_id)?.order ?? 999;
      const stopOrderB = stops.find(s => s.id === b.stop_id)?.order ?? 999;
      if (stopOrderA !== stopOrderB) return stopOrderA - stopOrderB;
      return a.student_name.localeCompare(b.student_name);
    });
  });

  // Route Computations
  readonly routeStops = computed(() => {
    const t = this.trip();
    return t?.route_details?.stops ?? [];
  });
  readonly currentStopId = computed(() => {
    // Determine current stop based on passenger progress
    const stops = this.routeStops();
    const passengers = this.passengers();
    
    // Find first stop with pending passengers
    for (const stop of stops) {
      const stopPassengers = passengers.filter(p => p.stop_id === stop.id);
      const hasPending = stopPassengers.some(p => !p.boarded && !p.alighted);
      if (hasPending) return stop.id;
    }
    
    return stops[stops.length - 1]?.id ?? null;
  });
  readonly completedStopIds = computed(() => {
    const stops = this.routeStops();
    const passengers = this.passengers();
    const completed: number[] = [];
    
    for (const stop of stops) {
      const stopPassengers = passengers.filter(p => p.stop_id === stop.id);
      const allProcessed = stopPassengers.length > 0 && 
        stopPassengers.every(p => p.boarded || p.alighted);
      if (allProcessed) completed.push(stop.id);
    }
    
    return completed;
  });

  // Action Permissions
  readonly canPerformActions = computed(() => this.trip()?.status === 'ON_ROUTE');

  constructor() {
    // Watch GPS position updates (injection context — valid for effect())
    effect(() => {
      const pos = this.telemetry.lastPosition();
      if (pos) {
        this.lastLat.set(pos.latitude);
        this.lastLng.set(pos.longitude);
        this.gpsActive.set(true);
      }
    });

    effect(() => {
      this.gpsActive.set(this.telemetry.isStreaming());
    });

    // Watch position changes and update route to next stop
    effect(() => {
      const pos = this.telemetry.lastPosition();
      const nextStopData = this.nextStop();
      const tripStatus = this.trip()?.status;

      if (!pos || !nextStopData || tripStatus !== 'ON_ROUTE') {
        return;
      }

      const shouldCalculate = this.currentRoute() === null || 
        this.routing.shouldRecalculate(pos.longitude, pos.latitude, 100);

      if (shouldCalculate && !this.routeLoading()) {
        this.calculateRouteToNextStop();
      }
    });
  }

  ngOnInit(): void {
    if (!this.api.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    const cached = this.trip();
    if (cached) {
      this.loadManifests(cached.id);
      if (cached.status === 'ON_ROUTE') {
        this.telemetry.connect(cached.id);
      }
    }
  }

  ngOnDestroy(): void {
    this.telemetry.disconnect();
  }

  onStartTrip(): void {
    const t = this.trip();
    if (!t) return;
    this.api.startTrip(t.id).subscribe({
      next: (res) => {
        this.trip.update((prev) => prev ? { ...prev, status: 'ON_ROUTE', start_time: res.start_time ?? null } : prev);
        this.telemetry.connect(t.id);
        // Calculate initial route to first stop once GPS locks
        setTimeout(() => this.calculateRouteToNextStop(), 2000);
      },
    });
  }

  onEndTrip(): void {
    const t = this.trip();
    if (!t) return;
    this.api.endTrip(t.id).subscribe({
      next: (res) => {
        this.trip.update((prev) => prev ? { ...prev, status: 'COMPLETED', end_time: res.end_time ?? null } : prev);
        this.telemetry.disconnect();
        this.routing.clearCache();
        this.currentRoute.set(null);
      },
    });
  }

  onMarkBoarded(manifestId: number): void {
    this.api.markBoarded(manifestId).subscribe({
      next: () => {
        this.passengers.update((all) =>
          all.map((p) => p.id === manifestId ? { ...p, boarded: true } : p),
        );
      },
    });
  }

  onMarkAlighted(manifestId: number): void {
    const pos = this.telemetry.lastPosition();
    this.api.markDroppedOff(manifestId, pos?.latitude, pos?.longitude).subscribe({
      next: () => {
        this.passengers.update((all) =>
          all.map((p) => p.id === manifestId ? { ...p, alighted: true } : p),
        );
        // Recalculate route to next stop after passenger drop-off
        setTimeout(() => this.calculateRouteToNextStop(), 500);
      },
    });
  }

  // Alias for backward compatibility
  onMarkDroppedOff(manifestId: number): void {
    this.onMarkAlighted(manifestId);
  }

  onLogout(): void {
    this.telemetry.disconnect();
    this.routing.clearCache();
    this.api.clearSession();
    this.router.navigate(['/login']);
  }

  /**
   * Calculate true road-network route to the next pending stop
   */
  calculateRouteToNextStop(): void {
    const pos = this.telemetry.lastPosition();
    const nextStopData = this.nextStop();

    if (!pos || !nextStopData) {
      return;
    }

    const stopLat = parseFloat(nextStopData.latitude);
    const stopLng = parseFloat(nextStopData.longitude);

    if (isNaN(stopLat) || isNaN(stopLng)) {
      this.routeError.set('Invalid stop coordinates');
      return;
    }

    this.routeLoading.set(true);
    this.routeError.set(null);

    this.routing.getTrueRoadRoute(
      pos.longitude,
      pos.latitude,
      stopLng,
      stopLat
    ).subscribe({
      next: (result) => {
        this.routeLoading.set(false);
        if (result.success && result.route) {
          this.currentRoute.set(result.route);
        } else {
          this.routeError.set(result.error || 'Unable to calculate route');
        }
      },
      error: (err) => {
        this.routeLoading.set(false);
        this.routeError.set(err.message || 'Route calculation failed');
      }
    });
  }

  private loadManifests(tripId: string): void {
    this.isLoading.set(true);
    this.api.getManifests(tripId).subscribe({
      next: (manifests) => {
        this.passengers.set(manifests);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }
}
