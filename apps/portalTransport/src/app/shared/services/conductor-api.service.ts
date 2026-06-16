import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { getApiUrl } from '@sms/core/config';
import type {
  DeviceLoginResponse,
  DailyTrip,
  TripManifest,
  TripActionResponse,
} from '../models/transport.models';

const DEVICE_TOKEN_KEY = 'mnara_device_token';
const DEVICE_INFO_KEY = 'mnara_device_info';
const CURRENT_TRIP_KEY = 'mnara_current_trip';

@Injectable({ providedIn: 'root' })
export class ConductorApiService {
  private http = inject(HttpClient);

  // ─── Device Auth ────────────────────────────────────────────────────────────

  deviceLogin(deviceId: string, pinCode: string): Observable<DeviceLoginResponse> {
    return this.http.post<DeviceLoginResponse>(
      getApiUrl('/transport/device-login/'),
      { device_id: deviceId, pin_code: pinCode },
    ).pipe(
      tap((res) => {
        sessionStorage.setItem(DEVICE_TOKEN_KEY, res.access_token);
        sessionStorage.setItem(DEVICE_INFO_KEY, JSON.stringify(res.device));
        if (res.current_trip) {
          sessionStorage.setItem(CURRENT_TRIP_KEY, JSON.stringify(res.current_trip));
        }
      }),
      catchError((err) => {
        const msg = err.error?.error || 'Login failed';
        return throwError(() => new Error(msg));
      }),
    );
  }

  getDeviceToken(): string | null {
    return sessionStorage.getItem(DEVICE_TOKEN_KEY);
  }

  getDeviceInfo(): { device_id: string; vehicle_id: number; registration_number: string } | null {
    const raw = sessionStorage.getItem(DEVICE_INFO_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  getCachedTrip(): DailyTrip | null {
    const raw = sessionStorage.getItem(CURRENT_TRIP_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  clearSession(): void {
    sessionStorage.removeItem(DEVICE_TOKEN_KEY);
    sessionStorage.removeItem(DEVICE_INFO_KEY);
    sessionStorage.removeItem(CURRENT_TRIP_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getDeviceToken();
  }

  // ─── Trip Actions ──────────────────────────────────────────────────────────

  startTrip(tripId: string): Observable<TripActionResponse> {
    return this.http.post<TripActionResponse>(
      getApiUrl(`/transport/daily-trips/${tripId}/start_trip/`), {},
    );
  }

  endTrip(tripId: string): Observable<TripActionResponse> {
    return this.http.post<TripActionResponse>(
      getApiUrl(`/transport/daily-trips/${tripId}/end_trip/`), {},
    );
  }

  getManifests(tripId: string): Observable<TripManifest[]> {
    return this.http.get<TripManifest[]>(
      getApiUrl(`/transport/manifests/?trip=${tripId}`),
    );
  }

  markBoarded(manifestId: number): Observable<TripActionResponse> {
    return this.http.post<TripActionResponse>(
      getApiUrl(`/transport/manifests/${manifestId}/mark_boarded/`), {},
    );
  }

  markDroppedOff(manifestId: number, lat?: number, lng?: number): Observable<TripActionResponse> {
    const body: Record<string, number> = {};
    if (lat != null) body['drop_off_lat'] = lat;
    if (lng != null) body['drop_off_lng'] = lng;
    return this.http.post<TripActionResponse>(
      getApiUrl(`/transport/manifests/${manifestId}/mark_dropped_off/`), body,
    );
  }
}
