import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';
import { AuthStore } from '@sms/core/auth';
import { getApiUrl } from '@sms/core/config';

@Component({
  selector: 'app-finance-header',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatMenuModule, ReactiveFormsModule],
  template: `
    <header class="admin-header">
      <div class="header-left"><span class="portal-title">Finance Portal</span></div>
      <div class="header-center">
        <div class="search-bar">
          <mat-icon class="search-icon">search</mat-icon>
          <input type="text" [formControl]="searchQuery" placeholder="Search anything..." />
          <div class="search-shortcut">Ctrl + K</div>
        </div>
      </div>
      <div class="header-right">
        <div class="notification-btn">
          <mat-icon>notifications_none</mat-icon>
          <div class="notification-badge">3</div>
        </div>
        <div class="date-block">
          <mat-icon class="date-icon">calendar_today</mat-icon>
          <div class="date-info">
            <span class="date-main">{{ currentDate | date:'MMM d, y' }}</span>
            <span class="date-sub">{{ currentDate | date:'EEEE' }}</span>
          </div>
        </div>
        <div class="user-block" [matMenuTriggerFor]="userMenu">
          <div class="user-avatar">
            <mat-icon>person</mat-icon>
          </div>
          <div class="user-info">
            <span class="user-name">{{ authStore.fullName() || 'Finance User' }}</span>
            <span class="user-id">{{ authStore.identifier() || 'FIN-001' }}</span>
            <span class="user-role">{{ authStore.roleName() || 'Finance Officer' }}</span>
          </div>
          <mat-icon class="user-chevron">expand_more</mat-icon>
        </div>
        <mat-menu #userMenu="matMenu">
          <button mat-menu-item (click)="goToProfile()"><mat-icon>person</mat-icon><span>Profile</span></button>
          <button mat-menu-item (click)="logout()"><mat-icon>logout</mat-icon><span>Logout</span></button>
        </mat-menu>
      </div>
    </header>
  `,
  styles: [`
    .admin-header {
      background: white; height: 56px; display: flex; align-items: center; justify-content: space-between;
      padding: 0 24px; position: sticky; top: 0; z-index: 100; font-family: 'Inter', sans-serif;
      border-bottom: 1px solid #e2e8f0;
    }
    .header-left { flex: 1; display: flex; align-items: center; }
    .portal-title { font-size: 1.125rem; font-weight: 700; color: #1e293b; letter-spacing: -0.01em; }
    .header-center { flex: 2; display: flex; justify-content: center; }
    .search-bar {
      display: flex; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0;
      border-radius: 6px; padding: 0 10px; width: 100%; max-width: 360px; height: 36px;
      transition: border-color 0.2s;
    }
    .search-bar:focus-within { border-color: #2563EB; background: white; }
    .search-icon { color: #94a3b8; font-size: 20px; width: 20px; height: 20px; }
    .search-bar input {
      flex: 1; border: none; background: transparent; padding: 0 12px; font-family: 'Inter', sans-serif;
      font-size: 0.875rem; color: #334155; outline: none;
    }
    .search-bar input::placeholder { color: #94a3b8; }
    .search-shortcut {
      font-size: 0.6875rem; color: #94a3b8; background: white; border: 1px solid #e2e8f0;
      padding: 2px 6px; border-radius: 4px; font-weight: 500;
    }
    .header-right { flex: 1; display: flex; align-items: center; justify-content: flex-end; gap: 20px; }
    .notification-btn {
      position: relative; width: 32px; height: 32px; border-radius: 50%; background: #f8fafc;
      display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b;
      transition: background 0.2s;
    }
    .notification-btn:hover { background: #f1f5f9; color: #334155; }
    .notification-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .notification-badge {
      position: absolute; top: -3px; right: -3px; background: #2563EB; color: white;
      font-size: 9px; font-weight: 700; width: 14px; height: 14px; display: flex;
      align-items: center; justify-content: center; border-radius: 50%; border: 1.5px solid white;
    }
    .date-block {
      display: flex; align-items: center; gap: 8px; padding-right: 20px; border-right: 1px solid #e2e8f0;
    }
    .date-icon { color: #94a3b8; font-size: 20px; width: 20px; height: 20px; }
    .date-info { display: flex; flex-direction: column; line-height: 1.2; }
    .date-main { font-size: 0.8125rem; font-weight: 600; color: #1e293b; }
    .date-sub { font-size: 0.6875rem; color: #64748b; margin-top: 2px; }
    .user-block {
      display: flex; align-items: center; gap: 10px; cursor: pointer;
    }
    .user-avatar {
      width: 32px; height: 32px; border-radius: 50%; background: #f1f5f9;
      display: flex; align-items: center; justify-content: center;
    }
    .user-avatar mat-icon { color: #94a3b8; font-size: 18px; width: 18px; height: 18px; }
    .user-info { display: flex; flex-direction: column; line-height: 1.15; gap: 0; }
    .user-name { font-size: 0.8125rem; font-weight: 600; color: #1e293b; }
    .user-role { font-size: 0.625rem; color: #64748b; }
    .user-id { font-size: 0.625rem; color: #94a3b8; font-family: 'SF Mono','Cascadia Code','Consolas',monospace; }
    .user-chevron { color: #94a3b8; font-size: 16px; width: 16px; height: 16px; margin-left: 2px; }
  `],
})
export class FinanceHeaderComponent implements OnInit, OnDestroy {
  authStore = inject(AuthStore);
  private router = inject(Router);
  private http = inject(HttpClient);
  searchQuery = new FormControl('');
  currentDate = new Date();
  private destroy$ = new Subject<void>();

  ngOnInit() {
    setInterval(() => { this.currentDate = new Date(); }, 60000);
    this.searchQuery.valueChanges.pipe(
      debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$),
      switchMap((query) => {
        if (!query || query.trim() === '') return [];
        return this.http.get<any[]>(getApiUrl(`/search/?q=${encodeURIComponent(query)}`));
      })
    ).subscribe({ next: (results) => console.log('Search Results:', results), error: () => {} });
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  goToProfile(): void {}
  logout(): void { this.authStore.logout(); this.router.navigate(['/login']); }
}
