import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TokenRefreshService {
  isRefreshing = false;
  refreshSubject = new BehaviorSubject<string | null>(null);

  reset(): void {
    this.isRefreshing = false;
    this.refreshSubject.next(null);
  }
}
