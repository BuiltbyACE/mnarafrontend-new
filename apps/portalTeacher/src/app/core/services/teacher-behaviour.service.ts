import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { getApiUrl } from '@sms/core/config';

export interface BehaviourRecordData {
  id: number;
  student_name: string;
  type: 'COMMENDATION' | 'INCIDENT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  date: string;
  status: 'OPEN' | 'RESOLVED' | 'FOLLOW_UP';
  reported_by: number;
  reported_by_name: string;
}

export interface BehaviourStats {
  total: number;
  commendations: number;
  incidents: number;
  pending_follow_ups: number;
}

export interface CreateBehaviourPayload {
  student_id: number;
  type: 'COMMENDATION' | 'INCIDENT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
}

@Injectable({ providedIn: 'root' })
export class TeacherBehaviourService {
  private http = inject(HttpClient);
  readonly records = signal<BehaviourRecordData[]>([]);
  readonly stats = signal<BehaviourStats | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly createSuccess = signal(false);

  fetchRecords(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get<BehaviourRecordData[]>(getApiUrl('/students/behaviour-records/'))
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => this.records.set(data),
        error: () => this.error.set('Failed to load behaviour records'),
      });
  }

  fetchStats(): void {
    this.http.get<BehaviourStats>(getApiUrl('/students/behaviour-records/stats/'))
      .subscribe({
        next: (data) => this.stats.set(data),
      });
  }

  createRecord(payload: CreateBehaviourPayload): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.createSuccess.set(false);
    this.http.post(getApiUrl('/students/behaviour-records/'), payload)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.createSuccess.set(true);
          this.fetchRecords();
          this.fetchStats();
        },
        error: () => this.error.set('Failed to create behaviour record'),
      });
  }
}
