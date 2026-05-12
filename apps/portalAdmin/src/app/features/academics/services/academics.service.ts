import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { getApiUrl } from '@sms/core/config';

// Interfaces matching backend serializers
export interface Department {
  id: number;
  name: string;
  head_of_department: { id: number; name: string } | null;
  head_of_department_name?: string;
  is_active: boolean;
}

export interface KeyStage {
  id: number;
  name: string;
  code: string;
  description: string;
  year_levels: string[];
  level?: string;
  order?: number;
  is_active?: boolean;
}

export interface YearLevel {
  id: number;
  name: string;
  key_stage: { id: number; name: string };
  key_stage_name?: string;
  is_active: boolean;
}

export interface Subject {
  id: number;
  name: string;
  code?: string;
  department: { id: number; name: string };
  department_name?: string;
  is_active: boolean;
}

export interface Classroom {
  id: number;
  room_number: string;
  capacity: number;
  building?: string;
  is_active: boolean;
}

export interface ClassroomWritePayload {
  room_number: string;
  capacity: number;
  building?: string;
  is_active?: boolean;
}

export interface SubjectOffering {
  id: number;
  subject: number;
  subject_name: string;
  subject_code: string;
  year_level: number;
  year_level_name: string;
  is_compulsory: boolean;
  teacher_name: string | null;
  credit_hours: string;
  key_stage_name?: string;
  is_active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AcademicsService {
  private http = inject(HttpClient);
  private baseUrl = getApiUrl('/academics/');

  // State signals
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Entity collections
  departments = signal<Department[]>([]);
  keyStages = signal<KeyStage[]>([]);
  yearLevels = signal<YearLevel[]>([]);
  subjects = signal<Subject[]>([]);
  classrooms = signal<Classroom[]>([]);
  subjectOfferings = signal<SubjectOffering[]>([]);

  // Department CRUD
  getDepartments(): Observable<Department[]> {
    this.isLoading.set(true);
    return this.http.get<{ results: Department[] }>(`${this.baseUrl}departments/`).pipe(
      map(data => data.results || []),
      tap(data => {
        this.departments.set(data);
        this.isLoading.set(false);
        this.error.set(null);
      }),
      catchError(err => this.handleError('Failed to load departments', err))
    );
  }

  createDepartment(data: Omit<Department, 'id'>): Observable<Department> {
    return this.http.post<Department>(`${this.baseUrl}departments/`, data).pipe(
      tap(newItem => this.departments.update(items => [...items, newItem])),
      catchError(err => this.handleError('Failed to create department', err))
    );
  }

  updateDepartment(id: number, data: Partial<Department>): Observable<Department> {
    return this.http.put<Department>(`${this.baseUrl}departments/${id}/`, data).pipe(
      tap(updated => this.departments.update(items => 
        items.map(item => item.id === id ? updated : item)
      )),
      catchError(err => this.handleError('Failed to update department', err))
    );
  }

  deleteDepartment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}departments/${id}/`).pipe(
      tap(() => this.departments.update(items => items.filter(item => item.id !== id))),
      catchError(err => this.handleError('Failed to delete department', err))
    );
  }

  // Classroom CRUD
  getClassrooms(page?: number, pageSize?: number): Observable<Classroom[]> {
    this.isLoading.set(true);
    let url = `${this.baseUrl}classrooms/`;
    if (page && pageSize) {
      url += `?page=${page}&page_size=${pageSize}`;
    }
    return this.http.get<{ results: Classroom[] }>(url).pipe(
      map(data => data.results || []),
      tap(data => {
        this.classrooms.set(data);
        this.isLoading.set(false);
        this.error.set(null);
      }),
      catchError(err => this.handleError('Failed to load classrooms', err))
    );
  }

  createClassroom(classroom: Partial<Classroom> | any): Observable<Classroom> {
    return this.http.post<Classroom>(`${this.baseUrl}classrooms/`, classroom).pipe(
      tap(newItem => this.classrooms.update(items => [...items, newItem])),
      catchError(err => this.handleError('Failed to create classroom', err))
    );
  }

  updateClassroom(id: number | string, classroom: Partial<Classroom> | any): Observable<Classroom> {
    return this.http.put<Classroom>(`${this.baseUrl}classrooms/${id}/`, classroom).pipe(
      tap(updated => this.classrooms.update(items => 
        items.map(item => item.id === id ? updated : item)
      )),
      catchError(err => this.handleError('Failed to update classroom', err))
    );
  }

  deleteClassroom(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}classrooms/${id}/`).pipe(
      tap(() => this.classrooms.update(items => items.filter(item => item.id !== id))),
      catchError(err => this.handleError('Failed to delete classroom', err))
    );
  }

  // Key Stage CRUD
  getKeyStages(): Observable<KeyStage[]> {
    this.isLoading.set(true);
    return this.http.get<{ results: KeyStage[] }>(`${this.baseUrl}key-stages/`).pipe(
      map(data => data.results || []),
      tap(data => {
        this.keyStages.set(data);
        this.isLoading.set(false);
        this.error.set(null);
      }),
      catchError(err => this.handleError('Failed to load key stages', err))
    );
  }

  createKeyStage(data: Omit<KeyStage, 'id'>): Observable<KeyStage> {
    return this.http.post<KeyStage>(`${this.baseUrl}key-stages/`, data).pipe(
      tap(newItem => this.keyStages.update(items => [...items, newItem])),
      catchError(err => this.handleError('Failed to create key stage', err))
    );
  }

  updateKeyStage(id: number, data: Partial<KeyStage>): Observable<KeyStage> {
    return this.http.put<KeyStage>(`${this.baseUrl}key-stages/${id}/`, data).pipe(
      tap(updated => this.keyStages.update(items => 
        items.map(item => item.id === id ? updated : item)
      )),
      catchError(err => this.handleError('Failed to update key stage', err))
    );
  }

  deleteKeyStage(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}key-stages/${id}/`).pipe(
      tap(() => this.keyStages.update(items => items.filter(item => item.id !== id))),
      catchError(err => this.handleError('Failed to delete key stage', err))
    );
  }

  // Year Level CRUD
  getYearLevels(): Observable<YearLevel[]> {
    this.isLoading.set(true);
    return this.http.get<{ results: YearLevel[] }>(`${this.baseUrl}year-levels/`).pipe(
      map(data => data.results || []),
      tap(data => {
        this.yearLevels.set(data);
        this.isLoading.set(false);
        this.error.set(null);
      }),
      catchError(err => this.handleError('Failed to load year levels', err))
    );
  }

  createYearLevel(data: Omit<YearLevel, 'id'>): Observable<YearLevel> {
    return this.http.post<YearLevel>(`${this.baseUrl}year-levels/`, data).pipe(
      tap(newItem => this.yearLevels.update(items => [...items, newItem])),
      catchError(err => this.handleError('Failed to create year level', err))
    );
  }

  updateYearLevel(id: number, data: Partial<YearLevel>): Observable<YearLevel> {
    return this.http.put<YearLevel>(`${this.baseUrl}year-levels/${id}/`, data).pipe(
      tap(updated => this.yearLevels.update(items => 
        items.map(item => item.id === id ? updated : item)
      )),
      catchError(err => this.handleError('Failed to update year level', err))
    );
  }

  deleteYearLevel(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}year-levels/${id}/`).pipe(
      tap(() => this.yearLevels.update(items => items.filter(item => item.id !== id))),
      catchError(err => this.handleError('Failed to delete year level', err))
    );
  }

  // Subject CRUD
  getSubjects(): Observable<Subject[]> {
    this.isLoading.set(true);
    return this.http.get<{ results: Subject[] }>(`${this.baseUrl}subjects/`).pipe(
      map(data => data.results || []),
      tap(data => {
        this.subjects.set(data);
        this.isLoading.set(false);
        this.error.set(null);
      }),
      catchError(err => this.handleError('Failed to load subjects', err))
    );
  }

  createSubject(data: Omit<Subject, 'id'>): Observable<Subject> {
    return this.http.post<Subject>(`${this.baseUrl}subjects/`, data).pipe(
      tap(newItem => this.subjects.update(items => [...items, newItem])),
      catchError(err => this.handleError('Failed to create subject', err))
    );
  }

  updateSubject(id: number, data: Partial<Subject>): Observable<Subject> {
    return this.http.put<Subject>(`${this.baseUrl}subjects/${id}/`, data).pipe(
      tap(updated => this.subjects.update(items => 
        items.map(item => item.id === id ? updated : item)
      )),
      catchError(err => this.handleError('Failed to update subject', err))
    );
  }

  deleteSubject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}subjects/${id}/`).pipe(
      tap(() => this.subjects.update(items => items.filter(item => item.id !== id))),
      catchError(err => this.handleError('Failed to delete subject', err))
    );
  }

  // Subject Offering CRUD
  getSubjectOfferings(): Observable<SubjectOffering[]> {
    this.isLoading.set(true);
    return this.http.get<{ results: SubjectOffering[] }>(`${this.baseUrl}subject-offerings/`).pipe(
      map(data => data.results || []),
      tap(data => {
        this.subjectOfferings.set(data);
        this.isLoading.set(false);
        this.error.set(null);
      }),
      catchError(err => this.handleError('Failed to load subject offerings', err))
    );
  }

  createSubjectOffering(data: Omit<SubjectOffering, 'id'>): Observable<SubjectOffering> {
    return this.http.post<SubjectOffering>(`${this.baseUrl}subject-offerings/`, data).pipe(
      tap(newItem => this.subjectOfferings.update(items => [...items, newItem])),
      catchError(err => this.handleError('Failed to create subject offering', err))
    );
  }

  updateSubjectOffering(id: number, data: Partial<SubjectOffering>): Observable<SubjectOffering> {
    return this.http.put<SubjectOffering>(`${this.baseUrl}subject-offerings/${id}/`, data).pipe(
      tap(updated => this.subjectOfferings.update(items => 
        items.map(item => item.id === id ? updated : item)
      )),
      catchError(err => this.handleError('Failed to update subject offering', err))
    );
  }

  deleteSubjectOffering(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}subject-offerings/${id}/`).pipe(
      tap(() => this.subjectOfferings.update(items => items.filter(item => item.id !== id))),
      catchError(err => this.handleError('Failed to delete subject offering', err))
    );
  }

  // Legacy methods required by other components
  getAcademicYears(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}academic-years/`);
  }

  getClassesByYear(yearId: any): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}classrooms/?year=${yearId}`);
  }

  getCourseStreamsByYear(yearId: any): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}course-streams/?year=${yearId}`);
  }

  bulkPromote(payload: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}bulk-promote/`, payload);
  }

  archiveClassroom(id: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}classrooms/${id}/archive/`, {});
  }

  setClassrooms(results: any[], count: number): void {
    this.classrooms.set(results);
  }

  // Common error handler
  private handleError(message: string, err: any): Observable<never> {
    this.isLoading.set(false);
    this.error.set(message);
    return throwError(() => err);
  }
}
