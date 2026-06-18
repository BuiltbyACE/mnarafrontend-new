import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { switchMap, finalize } from 'rxjs/operators';
import { AuthStore, AuthService } from '@sms/core/auth';
import type { PortalType } from '@sms/shared/models';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './login-page.html',
  styleUrls: ['./login-page.scss'],
})
export class LoginPage {
  private authStore = inject(AuthStore);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  email = '';
  password = '';
  hidePassword = true;
  rememberMe = false;
  isLoading = false;

  togglePassword(): void {
    this.hidePassword = !this.hidePassword;
  }

  onSubmit(): void {
    if (!this.email || !this.password || this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.authStore.setLoading(true);
    this.authStore.clearError();

    const returnUrl = this.route.snapshot.queryParams['returnUrl'] || null;

    this.authService
      .login({
        school_id: this.email,
        password: this.password,
      })
      .pipe(
        switchMap(() => this.authService.fetchUserContext()),
        finalize(() => {
          setTimeout(() => {
            this.isLoading = false;
            this.authStore.setLoading(false);
          });
        })
      )
      .subscribe({
        next: () => {
          if (returnUrl) {
            this.router.navigateByUrl(returnUrl);
            return;
          }

          const portalType = this.authStore.portalType();
          const routes: Record<string, string> = {
            ADMIN: '/admin',
            SUPER_ADMIN: '/admin',
            STAFF: '/admin',
            TEACHER: '/teacher',
            STUDENT: '/student',
            PARENT: '/parent',
            TRANSPORT: '/transport',
            FINANCE: '/finance',
          };

          const targetRoute = portalType ? routes[portalType as PortalType] : null;
          if (targetRoute) {
            this.router.navigate([targetRoute]);
          } else {
          this.snackBar.open('Unrecognized user role.', 'Dismiss', { duration: 5000 });
          }
        },
        error: (error) => {
          this.handleError(error);
        },
      });
  }

  onKeyPress(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (
      keyboardEvent.key === 'Enter' &&
      this.email &&
      this.password &&
      !this.isLoading
    ) {
      this.onSubmit();
    }
  }

  private handleError(error: Error): void {
    this.authStore.setError(error.message);
    this.snackBar.open(error.message, 'Dismiss', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['error-snackbar'],
    });
  }
}
