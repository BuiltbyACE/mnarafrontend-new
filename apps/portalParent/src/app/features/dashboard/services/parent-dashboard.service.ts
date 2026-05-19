import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@sms/core/config';

export interface SafetyStatus {
  color_code: 'success' | 'warning' | 'danger' | 'info';
  message: string;
  timestamp: string;
}

export interface GradeEntry {
  subject: string;
  grade: string;
  term: string;
  date: string;
}

export interface Notice {
  id: number;
  title: string;
  is_urgent: boolean;
  created_at: string;
}

export interface ParentDashboardPayload {
  student_id: string;
  student_name: string;
  student_form: string;
  safety_status: SafetyStatus;
  term_balance: number;
  last_payment_date: string | null;
  recent_grades: GradeEntry[];
  urgent_notices: Notice[];
}

@Injectable({
  providedIn: 'root',
})
export class ParentDashboardService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  getDashboardSummary(studentId: string): Observable<ParentDashboardPayload> {
    return this.http.get<ParentDashboardPayload>(
      `${this.baseUrl}/parents/dashboard-summary/`,
      { params: { student_id: studentId } }
    );
  }
}