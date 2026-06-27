import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { getApiUrl } from '@sms/core/config';

export interface ZoomSdkSignatureResponse {
  signature: string;
  sdkKey: string;
  meetingNumber: string;
  role: number;
  userName: string;
  userEmail: string;
  passWord?: string;
}

@Injectable({ providedIn: 'root' })
export class ZoomMeetingService {
  private readonly http = inject(HttpClient);

  getSdkSignature(meetingNumber: string, role: number = 0): Observable<ZoomSdkSignatureResponse> {
    return this.http.post<ZoomSdkSignatureResponse>(getApiUrl('/zoom/sdk-signature/'), {
      meeting_number: meetingNumber,
      role
    });
  }

  getAttendanceReport(classroomId: number): Observable<any[]> {
    return this.http.get<any[]>(getApiUrl(`/zoom/attendance/${classroomId}/`));
  }

  getEngagementReport(classroomId: number): Observable<any> {
    return this.http.get<any>(getApiUrl(`/zoom/engagement/${classroomId}/`));
  }
}
