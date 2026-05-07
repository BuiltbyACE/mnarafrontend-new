import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { getApiUrl } from '@sms/core/config';

export interface AcademicYear {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface AcademicTerm {
  id: number;
  name: string;
  academic_year: { id: number; name: string };
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface Period {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

@Injectable({ providedIn: 'root' })
export class SchedulingService {
  private http = inject(HttpClient);
  private baseUrl = getApiUrl('/lms/');

  isLoading = signal(false);
  error = signal<string | null>(null);

  academicYears = signal<AcademicYear[]>([]);
  academicTerms = signal<AcademicTerm[]>([]);
  periods = signal<Period[]>([]);

  // Academic Years CRUD
  getAcademicYears(): Observable<AcademicYear[]> {
    this.isLoading.set(true);
    return this.http.get<AcademicYear[]>(`${this.baseUrl}years/`).pipe(
      tap(data => {
        this.academicYears.set(data);
        this.isLoading.set(false);
        this.error.set(null);
      }),
      catchError(err => this.handleError('Failed to load academic years', err))
    );
  }

  createAcademicYear(data: Omit<AcademicYear, 'id'>): Observable<AcademicYear> {
    return this.http.post<AcademicYear>(`${this.baseUrl}years/`, data).pipe(
      tap(newItem => this.academicYears.update(items => [...items, newItem])),
      catchError(err => this.handleError('Failed to create academic year', err))
    );
  }

  updateAcademicYear(id: number, data: Partial<AcademicYear>): Observable<AcademicYear> {
    return this.http.put<AcademicYear>(`${this.baseUrl}years/${id}/`, data).pipe(
      tap(updated => this.academicYears.update(items => 
        items.map(item => item.id === id ? updated : item)
      )),
      catchError(err => this.handleError('Failed to update academic year', err))
    );
  }

  deleteAcademicYear(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}years/${id}/`).pipe(
      tap(() => this.academicYears.update(items => items.filter(item => item.id !== id))),
      catchError(err => this.handleError('Failed to delete academic year', err))
    );
  }

  // Academic Terms CRUD
  getAcademicTerms(): Observable<AcademicTerm[]> {
    this.isLoading.set(true);
    return this.http.get<AcademicTerm[]>(`${this.baseUrl}terms/`).pipe(
      tap(data => {
        this.academicTerms.set(data);
        this.isLoading.set(false);
        this.error.set(null);
      }),
      catchError(err => this.handleError('Failed to load academic terms', err))
    );
  }

  createAcademicTerm(data: Omit<AcademicTerm, 'id'>): Observable<AcademicTerm> {
    return this.http.post<AcademicTerm>(`${this.baseUrl}terms/`, data).pipe(
      tap(newItem => this.academicTerms.update(items => [...items, newItem])),
      catchError(err => this.handleError('Failed to create academic term', err))
    );
  }

  updateAcademicTerm(id: number, data: Partial<AcademicTerm>): Observable<AcademicTerm> {
    return this.http.put<AcademicTerm>(`${this.baseUrl}terms/${id}/`, data).pipe(
      tap(updated => this.academicTerms.update(items => 
        items.map(item => item.id === id ? updated : item)
      )),
      catchError(err => this.handleError('Failed to update academic term', err))
    );
  }

  deleteAcademicTerm(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}terms/${id}/`).pipe(
      tap(() => this.academicTerms.update(items => items.filter(item => item.id !== id))),
      catchError(err => this.handleError('Failed to delete academic term', err))
    );
  }

  // Periods CRUD
  getPeriods(): Observable<Period[]> {
    this.isLoading.set(true);
    return this.http.get<Period[]>(`${this.baseUrl}periods/`).pipe(
      tap(data => {
        this.periods.set(data);
        this.isLoading.set(false);
        this.error.set(null);
      }),
      catchError(err => this.handleError('Failed to load periods', err))
    );
  }

  createPeriod(data: Omit<Period, 'id'>): Observable<Period> {
    return this.http.post<Period>(`${this.baseUrl}periods/`, data).pipe(
      tap(newItem => this.periods.update(items => [...items, newItem])),
      catchError(err => this.handleError('Failed to create period', err))
    );
  }

  updatePeriod(id: number, data: Partial<Period>): Observable<Period> {
    return this.http.put<Period>(`${this.baseUrl}periods/${id}/`, data).pipe(
      tap(updated => this.periods.update(items => 
        items.map(item => item.id === id ? updated : item)
      )),
      catchError(err => this.handleError('Failed to update period', err))
    );
  }

  deletePeriod(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}periods/${id}/`).pipe(
      tap(() => this.periods.update(items => items.filter(item => item.id !== id))),
      catchError(err => this.handleError('Failed to delete period', err))
    );
  }

  private handleError(message: string, err: any): Observable<never> {
    this.isLoading.set(false);
    this.error.set(message);
    return throwError(() => err);
  }
}
