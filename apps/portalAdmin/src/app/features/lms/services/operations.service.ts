import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map, catchError, throwError } from 'rxjs';
import { getApiUrl } from '@sms/core/config';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  audience: string;
  created_at: string;
  created_by: number;       // The ID of the user
  created_by_name: string;  // The actual text name (ADMIN-001)
  is_active: boolean;
}

// export interface SchoolEvent {
//   id: number;
//   title: string;
//   start_date: string;
//   end_date: string;
//   location: string;
//   type: 'Academic' | 'Sports' | 'General';
// }


export interface SchoolEvent {
  id: number;
  title: string;
  description: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
  organizer: number;       // The ID from Django
  organizer_name: string;  // The computed name (ADMIN-001)
  is_active: boolean;
}

// export interface FacilityBooking {
//   id: number;
//   facility_name: string;
//   requested_by: string;
//   date: string;
//   status: 'PENDING' | 'APPROVED' | 'REJECTED';
// }


export interface FacilityBooking {
  id: number;
  facility_name: string;
  purpose: string;         // New field
  start_time: string;      // New field
  end_time: string;        // New field
  requested_by: number;    // The ID (221)
  requested_by_name: string; // The Name (ADMIN-001)
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

// export interface IncidentLog {
//   id: number;
//   date: string;
//   description: string;
//   reported_by: string;
//   status: 'OPEN' | 'RESOLVED';
// }


export interface IncidentLog {
  id: number;
  title: string;           // Backend field
  description: string;
  incident_date: string;   // Backend field
  severity: 'LOW' | 'MEDIUM' | 'HIGH'; // Backend field
  status: 'OPEN' | 'INVESTIGATING' | 'CLOSED'; // Backend field
  reported_by: number;
  reported_by_name: string; // Backend field
  action_taken: string;
}

@Injectable({ providedIn: 'root' })
export class OperationsService {
  private http = inject(HttpClient);
  private baseUrl = getApiUrl('/lms/');

  isLoading = signal(false);
  error = signal<string | null>(null);

  announcements = signal<Announcement[]>([]);
  events = signal<SchoolEvent[]>([]);
  facilityBookings = signal<FacilityBooking[]>([]);
  incidents = signal<IncidentLog[]>([]);

  loadAnnouncements(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get<Announcement[] | PaginatedResponse<Announcement>>(`${this.baseUrl}announcements/`).pipe(
      map(res => Array.isArray(res) ? res : res.results || []),
      catchError(err => this.handleError('Failed to load announcements', err))
    ).subscribe({
      next: data => { this.announcements.set(data); this.isLoading.set(false); },
    });
  }

  createAnnouncement(data: Omit<Announcement, 'id'>): Observable<Announcement> {
    return this.http.post<Announcement>(`${this.baseUrl}announcements/`, data).pipe(
      tap(newItem => this.announcements.update(items => [...items, newItem])),
      catchError(err => this.handleError('Failed to create announcement', err))
    );
  }

  updateAnnouncement(id: number, data: Partial<Announcement>): Observable<Announcement> {
    return this.http.put<Announcement>(`${this.baseUrl}announcements/${id}/`, data).pipe(
      tap(updated => this.announcements.update(items =>
        items.map(item => item.id === id ? updated : item)
      )),
      catchError(err => this.handleError('Failed to update announcement', err))
    );
  }

  deleteAnnouncement(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}announcements/${id}/`).pipe(
      tap(() => this.announcements.update(items => items.filter(item => item.id !== id))),
      catchError(err => this.handleError('Failed to delete announcement', err))
    );
  }

  loadEvents(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get<PaginatedResponse<SchoolEvent>>(`${this.baseUrl}events/`).pipe(
      map(res => res.results || []),
      catchError(err => this.handleError('Failed to load events', err))
    ).subscribe({
      next: data => { this.events.set(data); this.isLoading.set(false); },
    });
  }

  createEvent(data: Omit<SchoolEvent, 'id'>): Observable<SchoolEvent> {
    return this.http.post<SchoolEvent>(`${this.baseUrl}events/`, data).pipe(
      tap(newItem => this.events.update(items => [...items, newItem])),
      catchError(err => this.handleError('Failed to create event', err))
    );
  }

  updateEvent(id: number, data: Partial<SchoolEvent>): Observable<SchoolEvent> {
    return this.http.put<SchoolEvent>(`${this.baseUrl}events/${id}/`, data).pipe(
      tap(updated => this.events.update(items =>
        items.map(item => item.id === id ? updated : item)
      )),
      catchError(err => this.handleError('Failed to update event', err))
    );
  }

  deleteEvent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}events/${id}/`).pipe(
      tap(() => this.events.update(items => items.filter(item => item.id !== id))),
      catchError(err => this.handleError('Failed to delete event', err))
    );
  }

  loadFacilityBookings(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get<PaginatedResponse<FacilityBooking>>(`${this.baseUrl}facility-bookings/`).pipe(
      map(res => res.results || []),
      catchError(err => this.handleError('Failed to load facility bookings', err))
    ).subscribe({
      next: data => { this.facilityBookings.set(data); this.isLoading.set(false); },
    });
  }

  createFacilityBooking(data: Omit<FacilityBooking, 'id'>): Observable<FacilityBooking> {
    return this.http.post<FacilityBooking>(`${this.baseUrl}facility-bookings/`, data).pipe(
      tap(newItem => this.facilityBookings.update(items => [...items, newItem])),
      catchError(err => this.handleError('Failed to create facility booking', err))
    );
  }

  updateFacilityBooking(id: number, data: Partial<FacilityBooking>): Observable<FacilityBooking> {
    return this.http.put<FacilityBooking>(`${this.baseUrl}facility-bookings/${id}/`, data).pipe(
      tap(updated => this.facilityBookings.update(items =>
        items.map(item => item.id === id ? updated : item)
      )),
      catchError(err => this.handleError('Failed to update facility booking', err))
    );
  }

  deleteFacilityBooking(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}facility-bookings/${id}/`).pipe(
      tap(() => this.facilityBookings.update(items => items.filter(item => item.id !== id))),
      catchError(err => this.handleError('Failed to delete facility booking', err))
    );
  }

  loadIncidents(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get<PaginatedResponse<IncidentLog>>(`${this.baseUrl}incidents/`).pipe(
      map(res => res.results || []),
      catchError(err => this.handleError('Failed to load incidents', err))
    ).subscribe({
      next: data => { this.incidents.set(data); this.isLoading.set(false); },
    });
  }

  createIncident(data: Omit<IncidentLog, 'id'>): Observable<IncidentLog> {
    return this.http.post<IncidentLog>(`${this.baseUrl}incidents/`, data).pipe(
      tap(newItem => this.incidents.update(items => [...items, newItem])),
      catchError(err => this.handleError('Failed to create incident', err))
    );
  }

  updateIncident(id: number, data: Partial<IncidentLog>): Observable<IncidentLog> {
    return this.http.put<IncidentLog>(`${this.baseUrl}incidents/${id}/`, data).pipe(
      tap(updated => this.incidents.update(items =>
        items.map(item => item.id === id ? updated : item)
      )),
      catchError(err => this.handleError('Failed to update incident', err))
    );
  }

  deleteIncident(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}incidents/${id}/`).pipe(
      tap(() => this.incidents.update(items => items.filter(item => item.id !== id))),
      catchError(err => this.handleError('Failed to delete incident', err))
    );
  }

  private handleError(message: string, err: any): Observable<never> {
    this.isLoading.set(false);
    this.error.set(message);
    return throwError(() => err);
  }
}
