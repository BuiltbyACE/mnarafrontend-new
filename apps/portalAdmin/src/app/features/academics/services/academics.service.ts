import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { getApiUrl } from '@sms/core/config';

// Entity Interfaces
export interface Department {
  id: number;
  name: string;
  description?: string;
  subject_count: number;
  is_active: boolean;
}

export interface KeyStage {
  id: number;
  name: string;
  description?: string;
  order: number;
  is_active: boolean;
}

export interface YearLevel {
  id: number;
  name: string;
  key_stage_id: number;
  key_stage_name?: string;
  is_active: boolean;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  department_id: number;
  department_name?: string;
  is_active: boolean;
}

export interface Classroom {
  id: number;
  name: string;
  capacity: number;
  current_students: number;
  building?: string;
  is_active: boolean;
}

export interface SubjectOffering {
  id: number;
  subject_id: number;
  subject_name?: string;
  year_level_id: number;
  year_level_name?: string;
  key_stage_id: number;
  key_stage_name?: string;
  is_active: boolean;
}

@Injectable({ providedIn: 'root' })
export class AcademicsService {
  private http = inject(HttpClient);
  private basePath = '/api/v1/academics';

  // Legacy signals for backwards compatibility
  departments = signal<any[]>([]);
  keyStages = signal<any[]>([]);
  yearLevels = signal<any[]>([]);
  subjects = signal<any[]>([]);
  classrooms = signal<any[]>([]);
  subjectOfferings = signal<any[]>([]);

  // Global state signals
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  totalCount = signal<number>(0);

  // CRUD Methods for Departments
  getDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(getApiUrl(`${this.basePath}/departments/`));
  }

  createDepartment(data: Partial<Department>): Observable<Department> {
    return this.http.post<Department>(getApiUrl(`${this.basePath}/departments/`), data);
  }

  updateDepartment(id: number, data: Partial<Department>): Observable<Department> {
    return this.http.put<Department>(getApiUrl(`${this.basePath}/departments/${id}/`), data);
  }

  deleteDepartment(id: number): Observable<void> {
    return this.http.delete<void>(getApiUrl(`${this.basePath}/departments/${id}/`));
  }

  // CRUD Methods for Key Stages
  getKeyStages(): Observable<KeyStage[]> {
    return this.http.get<KeyStage[]>(getApiUrl(`${this.basePath}/key-stages/`));
  }

  createKeyStage(data: Partial<KeyStage>): Observable<KeyStage> {
    return this.http.post<KeyStage>(getApiUrl(`${this.basePath}/key-stages/`), data);
  }

  updateKeyStage(id: number, data: Partial<KeyStage>): Observable<KeyStage> {
    return this.http.put<KeyStage>(getApiUrl(`${this.basePath}/key-stages/${id}/`), data);
  }

  deleteKeyStage(id: number): Observable<void> {
    return this.http.delete<void>(getApiUrl(`${this.basePath}/key-stages/${id}/`));
  }

  // CRUD Methods for Year Levels
  getYearLevels(): Observable<YearLevel[]> {
    return this.http.get<YearLevel[]>(getApiUrl(`${this.basePath}/year-levels/`));
  }

  createYearLevel(data: Partial<YearLevel>): Observable<YearLevel> {
    return this.http.post<YearLevel>(getApiUrl(`${this.basePath}/year-levels/`), data);
  }

  updateYearLevel(id: number, data: Partial<YearLevel>): Observable<YearLevel> {
    return this.http.put<YearLevel>(getApiUrl(`${this.basePath}/year-levels/${id}/`), data);
  }

  deleteYearLevel(id: number): Observable<void> {
    return this.http.delete<void>(getApiUrl(`${this.basePath}/year-levels/${id}/`));
  }

  // CRUD Methods for Subjects
  getSubjects(): Observable<Subject[]> {
    return this.http.get<Subject[]>(getApiUrl(`${this.basePath}/subjects/`));
  }

  createSubject(data: Partial<Subject>): Observable<Subject> {
    return this.http.post<Subject>(getApiUrl(`${this.basePath}/subjects/`), data);
  }

  updateSubject(id: number, data: Partial<Subject>): Observable<Subject> {
    return this.http.put<Subject>(getApiUrl(`${this.basePath}/subjects/${id}/`), data);
  }

  deleteSubject(id: number): Observable<void> {
    return this.http.delete<void>(getApiUrl(`${this.basePath}/subjects/${id}/`));
  }

  // CRUD Methods for Classrooms
  getClassrooms(page?: number, pageSize?: number): Observable<any> {
    let url = `${this.basePath}/classrooms/`;
    if (page && pageSize) {
      url += `?page=${page}&page_size=${pageSize}`;
    }
    return this.http.get(getApiUrl(url));
  }

  setClassrooms(results: any[], count: number): void {
    this.classrooms.set(results);
    this.totalCount.set(count);
  }

  createClassroom(data: Partial<Classroom>): Observable<Classroom> {
    return this.http.post<Classroom>(getApiUrl(`${this.basePath}/classrooms/`), data);
  }

  updateClassroom(id: number, data: Partial<Classroom>): Observable<Classroom> {
    return this.http.put<Classroom>(getApiUrl(`${this.basePath}/classrooms/${id}/`), data);
  }

  deleteClassroom(id: number): Observable<void> {
    return this.http.delete<void>(getApiUrl(`${this.basePath}/classrooms/${id}/`));
  }

  // CRUD Methods for Subject Offerings
  getSubjectOfferings(): Observable<SubjectOffering[]> {
    return this.http.get<SubjectOffering[]>(getApiUrl(`${this.basePath}/subject-offerings/`));
  }

  createSubjectOffering(data: Partial<SubjectOffering>): Observable<SubjectOffering> {
    return this.http.post<SubjectOffering>(getApiUrl(`${this.basePath}/subject-offerings/`), data);
  }

  updateSubjectOffering(id: number, data: Partial<SubjectOffering>): Observable<SubjectOffering> {
    return this.http.put<SubjectOffering>(getApiUrl(`${this.basePath}/subject-offerings/${id}/`), data);
  }

  deleteSubjectOffering(id: number): Observable<void> {
    return this.http.delete<void>(getApiUrl(`${this.basePath}/subject-offerings/${id}/`));
  }

  // Legacy methods for backwards compatibility
  getAcademicYears(): Observable<any> {
    return this.http.get(getApiUrl(`${this.basePath}/academic-years/`));
  }

  getClassesByYear(yearId: string | number): Observable<any> {
    return this.http.get(getApiUrl(`${this.basePath}/classrooms/?year_level=${yearId}`));
  }

  getCourseStreamsByYear(yearId: string | number): Observable<any> {
    return this.http.get(getApiUrl(`${this.basePath}/subject-offerings/?year_level=${yearId}`));
  }

  bulkPromote(payload: any): Observable<any> {
    return this.http.post(getApiUrl(`${this.basePath}/students/bulk-promote/`), payload);
  }

  archiveClassroom(id: string | number): Observable<any> {
    return this.http.patch(getApiUrl(`${this.basePath}/classrooms/${id}/`), { is_active: false });
  }
}
