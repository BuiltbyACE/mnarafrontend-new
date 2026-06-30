import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { getApiUrl } from '@sms/core/config';

export interface StudentProfileData {
  id: number;
  first_name: string;
  last_name: string;
  user_school_id: string;
  class_name: string;
  attendance_percentage: number;
  performance_average: number;
  parent_contact: string;
  gender?: string;
  stream?: string;
  date_of_birth?: string;
  address?: string;
  subjects?: string[];
  avatar?: string;
}

@Injectable({ providedIn: 'root' })
export class TeacherStudentService {
  private http = inject(HttpClient);
  readonly profiles = signal<StudentProfileData[]>([]);
  readonly selectedProfile = signal<StudentProfileData | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  fetchProfiles(classId?: string): void {
    this.isLoading.set(true);
    this.error.set(null);
    let endpoint = '/students/profiles/';
    if (classId) endpoint += `?class=${classId}`;

    this.http.get<StudentProfileData[] | { results: StudentProfileData[] }>(getApiUrl(endpoint))
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => {
          if (Array.isArray(data)) {
            this.profiles.set(data);
          } else if (data && Array.isArray(data.results)) {
            this.profiles.set(data.results);
          }
        },
        error: () => this.error.set('Failed to load student profiles'),
      });
  }

  fetchProfile(id: number): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get<StudentProfileData>(getApiUrl(`/students/profiles/${id}/`))
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => this.selectedProfile.set(data),
        error: () => this.error.set('Failed to load student profile'),
      });
  }
}
