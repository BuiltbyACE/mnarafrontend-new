import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';

export interface RouteGeometry {
  coordinates: [number, number][];
  distanceMeters: number;
  durationSeconds: number;
  distanceKm: number;
  durationMinutes: number;
}

export interface RouteCalculation {
  success: boolean;
  route?: RouteGeometry;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RoadRoutingService {
  private http = inject(HttpClient);

  // Public OSRM API endpoint for development
  // Swap to self-hosted Docker URL in production: http://your-server:5000/route/v1/driving
  private osrmBaseUrl = 'https://router.project-osrm.org/route/v1/driving';

  // Rate limiting configuration
  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL_MS = 10_000; // Max 6 requests per minute
  private readonly MIN_DEVIATION_METERS = 30; // Only recalculate if moved >30m

  // Store last route for deviation checking
  private lastRouteCoordinates: [number, number] | null = null;
  private lastRoute: RouteGeometry | null = null;

  /**
   * Calculate true road-network route between two points
   * Uses OSRM to get actual driving path, distance, and duration
   */
  getTrueRoadRoute(
    startLng: number,
    startLat: number,
    endLng: number,
    endLat: number,
    forceRefresh = false
  ): Observable<RouteCalculation> {
    // Check rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (!forceRefresh && timeSinceLastRequest < this.MIN_REQUEST_INTERVAL_MS) {
      // Return cached route if available
      if (this.lastRoute) {
        return of({
          success: true,
          route: this.lastRoute
        });
      }
    }

    // Check if we've moved enough to warrant a new calculation
    if (!forceRefresh && this.lastRouteCoordinates) {
      const deviation = this.calculateHaversineDistance(
        startLat,
        startLng,
        this.lastRouteCoordinates[1],
        this.lastRouteCoordinates[0]
      );
      if (deviation < this.MIN_DEVIATION_METERS) {
        return of({
          success: true,
          route: this.lastRoute!
        });
      }
    }

    const url = `${this.osrmBaseUrl}/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;

    return this.http.get<any>(url).pipe(
      map(response => {
        if (!response.routes || response.routes.length === 0) {
          return {
            success: false,
            error: 'No road network path found for given coordinates'
          };
        }

        const primaryRoute = response.routes[0];
        const routeGeometry: RouteGeometry = {
          coordinates: primaryRoute.geometry.coordinates,
          distanceMeters: Math.round(primaryRoute.distance),
          durationSeconds: Math.round(primaryRoute.duration),
          distanceKm: Math.round(primaryRoute.distance / 100) / 10,
          durationMinutes: Math.ceil(primaryRoute.duration / 60)
        };

        // Cache the route
        this.lastRequestTime = Date.now();
        this.lastRouteCoordinates = [startLng, startLat];
        this.lastRoute = routeGeometry;

        return {
          success: true,
          route: routeGeometry
        };
      }),
      catchError(error => {
        console.error('Routing service error:', error);
        return of({
          success: false,
          error: error.message || 'Failed to calculate route'
        });
      })
    );
  }

  /**
   * Quick distance check using Haversine formula (straight-line)
   * Used for deviation detection before making expensive routing calls
   */
  private calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Clear cached route data
   */
  clearCache(): void {
    this.lastRoute = null;
    this.lastRouteCoordinates = null;
    this.lastRequestTime = 0;
  }

  /**
   * Check if vehicle has deviated significantly from planned route
   * Returns true if recalculation is recommended
   */
  shouldRecalculate(
    currentLng: number,
    currentLat: number,
    thresholdMeters = 100
  ): boolean {
    if (!this.lastRouteCoordinates) return true;

    const deviation = this.calculateHaversineDistance(
      currentLat,
      currentLng,
      this.lastRouteCoordinates[1],
      this.lastRouteCoordinates[0]
    );

    return deviation > thresholdMeters;
  }
}
