import { Component, signal, computed, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthStore } from '@sms/core/auth';
import { ChangePasswordDialogComponent } from '../change-password/change-password-dialog.component';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-student-navbar',
  imports: [MatIconModule, MatMenuModule, MatSlideToggleModule, MatDividerModule, MatDialogModule],
  templateUrl: './student-navbar.component.html',
  styleUrls: ['./student-navbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentNavbarComponent implements OnInit {
  private router = inject(Router);
  authStore = inject(AuthStore);
  private dialog = inject(MatDialog);
  private notif = inject(NotificationService);

  readonly fullName = this.authStore.fullName;
  readonly email = computed(() => this.authStore.user()?.user?.email ?? '');
  readonly admissionNo = computed(
    () => this.authStore.user()?.user?.schoolId ?? this.authStore.identifier()
  );
  readonly initials = computed(() =>
    this.fullName()
      .split(' ')
      .filter((n) => n.length > 0)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  );

  readonly grade = computed(() => this.authStore.roleName() ?? 'Student');

  readonly isDarkMode = signal(false);
  readonly notifCount = this.notif.badgeCounts;

  private readonly hour = new Date().getHours();

  private readonly firstName = computed(() => {
    const parts = this.fullName().split(' ').filter((n) => n.length > 0);
    return parts[0] || 'there';
  });

  readonly greeting = computed(() => {
    if (this.hour < 12) return `Good morning, ${this.firstName()} ☀️`;
    if (this.hour < 17) return `Good afternoon, ${this.firstName()} 🌤️`;
    return `Good evening, ${this.firstName()} 🌙`;
  });

  ngOnInit(): void {
    this.authStore.restoreFromStorage();
  }

  toggleDarkMode(): void {
    this.isDarkMode.update((v) => !v);
  }

  goToProfile(): void {
    this.router.navigate(['/student/profile']);
  }

  changePassword(): void {
    this.dialog.open(ChangePasswordDialogComponent, {
      width: '480px',
      disableClose: true,
    });
  }

  logout(): void {
    this.authStore.logout();
    this.router.navigate(['/login']);
  }
}
