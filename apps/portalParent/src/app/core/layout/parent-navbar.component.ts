import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { SiblingStateService } from '@sms/core/state';
import { AuthStore } from '@sms/core/auth';

@Component({
  selector: 'app-parent-navbar',
  imports: [
    MatIconModule,
    MatMenuModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatDividerModule,
  ],
  templateUrl: './parent-navbar.component.html',
  styleUrls: ['./parent-navbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParentNavbarComponent {
  private readonly router = inject(Router);
  private readonly authStore = inject(AuthStore);
  readonly siblingState = inject(SiblingStateService);

  constructor() {
    this.authStore.restoreFromStorage();
  }

  readonly fullName = this.authStore.fullName;
  readonly email = this.authStore.user()?.user?.email ?? '';

  readonly initials = (() => {
    const name = this.fullName();
    return name
      .split(' ')
      .filter((n) => n.length > 0)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  })();

  readonly isDarkMode = { value: false };

  private readonly hour = new Date().getHours();

  private readonly firstName = (() => {
    const parts = this.fullName().split(' ').filter((n) => n.length > 0);
    return parts[0] || 'there';
  })();

  get greeting(): string {
    if (this.hour < 12) return `Good morning, ${this.firstName}`;
    if (this.hour < 17) return `Good afternoon, ${this.firstName}`;
    return `Good evening, ${this.firstName}`;
  }

  selectSibling(siblingId: string): void {
    this.siblingState.setActiveSiblingById(siblingId);
  }

  goToProfile(): void {
    this.router.navigate(['/parent/profile']);
  }

  logout(): void {
    this.authStore.logout();
    this.router.navigate(['/login']);
  }
}