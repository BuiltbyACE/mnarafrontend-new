/**
 * Admin Header Component
 * Premium top navbar: sidebar toggle, live search, notifications, clock, user menu
 */

import { Component, EventEmitter, Input, Output, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthStore } from '@sms/core/auth';
import { getApiUrl } from '@sms/core/config';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil, of, catchError } from 'rxjs';

interface SearchResult {
  id?: string | number;
  title?: string;
  label?: string;
  name?: string;
  type?: string;
  url?: string;
}

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
  ],
  providers: [DatePipe],
  template: `
    <header class="admin-header">
      <div class="header-left">
        <button type="button" class="icon-btn sidebar-toggle" (click)="toggleSidebar.emit()" aria-label="Toggle sidebar">
          <mat-icon>menu</mat-icon>
        </button>
      </div>

      <div class="header-center">
        <div class="search-bar" [class.has-results]="searchOpen()">
          <mat-icon class="search-icon">search</mat-icon>
          <input
            type="text"
            [formControl]="searchQuery"
            placeholder="Search anything..."
            (focus)="onSearchFocus()"
            (blur)="onSearchBlur()"
          />
          @if (searching()) {
            <span class="search-spinner"></span>
          } @else {
            <div class="search-shortcut">Ctrl + K</div>
          }

          @if (searchOpen()) {
            <div class="search-results">
              @if (searchResults().length === 0) {
                <div class="search-empty">
                  {{ searching() ? 'Searching…' : 'No matches for "' + searchQuery.value + '"' }}
                </div>
              } @else {
                @for (result of searchResults(); track $index) {
                  <div class="search-result-item">
                    <mat-icon class="result-icon">{{ resultIcon(result.type) }}</mat-icon>
                    <div class="result-body">
                      <span class="result-title">{{ result.title || result.label || result.name }}</span>
                      @if (result.type) {
                        <span class="result-type">{{ result.type }}</span>
                      }
                    </div>
                  </div>
                }
              }
            </div>
          }
        </div>
      </div>

      <div class="header-right">
        <button type="button" class="icon-btn notification-btn" [routerLink]="['/dashboard']" aria-label="Notifications">
          <mat-icon>notifications_none</mat-icon>
          @if (notificationCount > 0) {
            <span class="notification-badge">{{ notificationCount > 9 ? '9+' : notificationCount }}</span>
          }
        </button>

        <div class="date-block">
          <mat-icon class="date-icon">calendar_today</mat-icon>
          <div class="date-info">
            <span class="date-main">{{ currentDate | date:'MMM d, y' }}</span>
            <span class="date-sub">{{ currentDate | date:'EEEE, h:mm a' }}</span>
          </div>
        </div>

        <div class="user-block" [matMenuTriggerFor]="userMenu">
          <div class="user-avatar">
            @if (authStore.avatarUrl()) {
              <img [src]="authStore.avatarUrl()!" alt="Avatar" />
            } @else {
              <span class="avatar-initials">{{ initials() }}</span>
            }
          </div>
          <div class="user-info">
            <span class="user-name">{{ authStore.fullName() || 'Admin User' }}</span>
            <span class="user-id">{{ authStore.identifier() || '—' }}</span>
            <span class="user-role">{{ authStore.roleName() || 'Admin' }}</span>
          </div>
          <mat-icon class="user-chevron">expand_more</mat-icon>
        </div>

        <mat-menu #userMenu="matMenu">
          <button mat-menu-item routerLink="/settings">
            <mat-icon>person</mat-icon>
            <span>Profile &amp; Settings</span>
          </button>
          <button mat-menu-item (click)="logout()">
            <mat-icon>logout</mat-icon>
            <span>Logout</span>
          </button>
        </mat-menu>
      </div>
    </header>
  `,
  styles: [`
    .admin-header {
      background: white;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      position: sticky;
      top: 0;
      z-index: 100;
      font-family: 'Inter', sans-serif;
      border-bottom: 1px solid #e2e8f0;
      gap: 16px;
    }

    .header-left {
      display: flex;
      align-items: center;
    }

    .icon-btn {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #475569;
      transition: background 0.15s, color 0.15s;
      padding: 0;

      &:hover {
        background: #eff6ff;
        color: #2563eb;
      }

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .header-center {
      flex: 1;
      display: flex;
      justify-content: center;
    }

    .search-bar {
      position: relative;
      display: flex;
      align-items: center;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 0 12px;
      width: 100%;
      max-width: 420px;
      height: 40px;
      transition: border-color 0.2s, background 0.2s;

      &:focus-within, &.has-results {
        border-color: #2563eb;
        background: white;
        box-shadow: 0 4px 16px rgba(37, 99, 235, 0.12);
      }

      .search-icon {
        color: #94a3b8;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      input {
        flex: 1;
        border: none;
        background: transparent;
        padding: 0 10px;
        font-family: 'Inter', sans-serif;
        font-size: 0.875rem;
        color: #334155;
        outline: none;

        &::placeholder {
          color: #94a3b8;
        }
      }

      .search-shortcut {
        font-size: 0.6875rem;
        color: #94a3b8;
        background: white;
        border: 1px solid #e2e8f0;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 500;
        flex-shrink: 0;
      }

      .search-spinner {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 2px solid #dbeafe;
        border-top-color: #2563eb;
        animation: spin 0.7s linear infinite;
        flex-shrink: 0;
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .search-results {
      position: absolute;
      top: calc(100% + 8px);
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      box-shadow: 0 12px 32px rgba(15, 23, 42, 0.14);
      max-height: 320px;
      overflow-y: auto;
      z-index: 200;
    }

    .search-empty {
      padding: 16px;
      font-size: 0.8125rem;
      color: #94a3b8;
      text-align: center;
    }

    .search-result-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border-bottom: 1px solid #f1f5f9;
      cursor: pointer;

      &:last-child { border-bottom: none; }
      &:hover { background: #f8fafc; }
    }

    .result-icon {
      color: #2563eb;
      font-size: 18px;
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .result-body {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .result-title {
      font-size: 0.8125rem;
      font-weight: 500;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .result-type {
      font-size: 0.6875rem;
      color: #94a3b8;
      text-transform: capitalize;
    }

    .header-right {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 16px;
    }

    .notification-btn {
      position: relative;
    }

    .notification-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: #ef4444;
      color: white;
      font-size: 9px;
      font-weight: 700;
      min-width: 16px;
      height: 16px;
      padding: 0 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      border: 1.5px solid white;
    }

    .date-block {
      display: flex;
      align-items: center;
      gap: 8px;
      padding-right: 16px;
      border-right: 1px solid #e2e8f0;

      .date-icon {
        color: #94a3b8;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .date-info {
        display: flex;
        flex-direction: column;
        line-height: 1.2;
      }

      .date-main {
        font-size: 0.8125rem;
        font-weight: 600;
        color: #1e293b;
      }

      .date-sub {
        font-size: 0.6875rem;
        color: #64748b;
        margin-top: 2px;
      }
    }

    .user-block {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      padding: 4px 6px;
      border-radius: 10px;
      transition: background 0.15s;

      &:hover { background: #f8fafc; }

      .user-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: linear-gradient(135deg, #2563eb, #1e3a5f);
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-initials {
          color: white;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.02em;
        }
      }

      .user-info {
        display: flex;
        flex-direction: column;
        line-height: 1.15;
        gap: 0;
      }

      .user-name {
        font-size: 0.8125rem;
        font-weight: 600;
        color: #1e293b;
      }

      .user-role {
        font-size: 0.625rem;
        color: #64748b;
      }

      .user-id {
        font-size: 0.625rem;
        color: #94a3b8;
        font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
      }

      .user-chevron {
        color: #94a3b8;
        font-size: 16px;
        width: 16px;
        height: 16px;
        margin-left: 2px;
      }
    }
  `],
})
export class AdminHeaderComponent implements OnInit, OnDestroy {
  @Input() notificationCount = 0;
  @Output() toggleSidebar = new EventEmitter<void>();

  authStore = inject(AuthStore);
  private router = inject(Router);
  private http = inject(HttpClient);

  searchQuery = new FormControl('');
  currentDate = new Date();
  searchOpen = signal(false);
  searching = signal(false);
  searchResults = signal<SearchResult[]>([]);

  private destroy$ = new Subject<void>();
  private blurTimeout?: ReturnType<typeof setTimeout>;

  initials(): string {
    const name = this.authStore.fullName() || this.authStore.identifier() || 'A';
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  resultIcon(type?: string): string {
    const icons: Record<string, string> = {
      student: 'school',
      staff: 'badge',
      payment: 'payments',
      class: 'meeting_room',
      event: 'event',
    };
    return (type && icons[type]) || 'description';
  }

  ngOnInit() {
    setInterval(() => {
      this.currentDate = new Date();
    }, 30000);

    this.searchQuery.valueChanges
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
        switchMap((query) => {
          if (!query || query.trim() === '') {
            this.searchResults.set([]);
            this.searching.set(false);
            this.searchOpen.set(false);
            return of([] as SearchResult[]);
          }
          this.searchOpen.set(true);
          this.searching.set(true);
          return this.http.get<SearchResult[]>(getApiUrl(`/search/?q=${encodeURIComponent(query)}`)).pipe(
            catchError(() => of([] as SearchResult[]))
          );
        })
      )
      .subscribe((results) => {
        this.searchResults.set(Array.isArray(results) ? results : []);
        this.searching.set(false);
      });
  }

  onSearchFocus(): void {
    clearTimeout(this.blurTimeout);
    if ((this.searchQuery.value ?? '').trim().length > 0) {
      this.searchOpen.set(true);
    }
  }

  onSearchBlur(): void {
    this.blurTimeout = setTimeout(() => this.searchOpen.set(false), 150);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    clearTimeout(this.blurTimeout);
  }

  logout(): void {
    this.authStore.logout();
    this.router.navigate(['/login']);
  }
}
