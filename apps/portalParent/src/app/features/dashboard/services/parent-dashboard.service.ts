import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ParentApiService } from '../../../services/parent-api.service';
import { DashboardSummary } from '../../../models/parent.models';

@Injectable({ providedIn: 'root' })
export class ParentDashboardService {
  private readonly api = inject(ParentApiService);

  getDashboardSummary(studentId: string): Observable<DashboardSummary> {
    return this.api.getDashboardSummary(Number(studentId));
  }
}
