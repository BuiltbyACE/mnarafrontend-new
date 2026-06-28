import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { getApiUrl } from '@sms/core/config';
import { TeacherProfile } from '../../shared/models/teacher.models';

export interface StaffProfileData {
  name: string;
  employee_id: string;
  department: string;
  role: string;
  email: string;
  phone: string;
  hire_date?: string;
  photo_url?: string;
  surname?: string;
  other_names?: string;
  national_id?: string;
  kra_pin?: string;
  qualification_level?: string;
  specialization_area?: string;
  tsc_number?: string;
  highest_degree?: string;
  teaching_subjects?: string[];
  leave_balance?: {
    points_remaining: number;
    maternity_days_entitled: number;
    maternity_days_remaining: number;
    sick_days_remaining: number | null;
  } | null;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  assignment_reminders: boolean;
  meeting_reminders: boolean;
  grade_alerts: boolean;
}

@Injectable({ providedIn: 'root' })
export class TeacherSettingsService {
  private http = inject(HttpClient);
  readonly profile = signal<TeacherProfile | null>(null);
  readonly staffProfile = signal<StaffProfileData | null>(null);
  readonly preferences = signal<NotificationPreferences | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly saveSuccess = signal(false);
  readonly passwordChangeSuccess = signal(false);

  fetchProfile(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get<StaffProfileData>(getApiUrl('/staff/profiles/me/'))
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => {
          this.staffProfile.set(data);
          this.profile.set({
            name: data.name,
            employeeId: data.employee_id,
            department: data.department,
            role: data.highest_degree || data.role,
            email: data.email,
            phone: data.phone,
            hireDate: data.hire_date,
            photoUrl: data.photo_url,
            surname: data.surname,
            otherNames: data.other_names,
            nationalId: data.national_id,
            kraPin: data.kra_pin,
            qualificationLevel: data.qualification_level,
            specializationArea: data.specialization_area,
            tscNumber: data.tsc_number,
            highestDegree: data.highest_degree,
            teachingSubjects: data.teaching_subjects,
            leaveBalance: data.leave_balance ? {
              pointsRemaining: data.leave_balance.points_remaining,
              maternityDaysEntitled: data.leave_balance.maternity_days_entitled,
              maternityDaysRemaining: data.leave_balance.maternity_days_remaining,
              sickDaysRemaining: data.leave_balance.sick_days_remaining ?? null,
            } : undefined,
          });
        },
        error: () => this.error.set('Failed to load profile'),
      });
  }

  fetchSettings(): void {
    this.http.get<NotificationPreferences>(getApiUrl('/staff/settings/'))
      .subscribe({
        next: (data) => this.preferences.set(data),
      });
  }

  saveSettings(settings: NotificationPreferences): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.saveSuccess.set(false);
    this.http.patch(getApiUrl('/staff/settings/'), settings)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.saveSuccess.set(true);
          this.preferences.set(settings);
        },
        error: () => this.error.set('Failed to save settings'),
      });
  }

  changePassword(payload: ChangePasswordPayload): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.passwordChangeSuccess.set(false);
    this.http.post(getApiUrl('/accounts/auth/change-password/'), payload)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => this.passwordChangeSuccess.set(true),
        error: () => this.error.set('Failed to change password'),
      });
  }
}
