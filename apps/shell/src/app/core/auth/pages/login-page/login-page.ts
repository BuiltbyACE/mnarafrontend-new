import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs/operators';
import { AuthStore, AuthService } from '@sms/core/auth';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
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
  private snackBar = inject(MatSnackBar);

  email = '';
  password = '';
  rememberMe = false;
  hidePassword = true;
  isLoading = false;
  currentYear = new Date().getFullYear();

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

    this.authService
      .login({
        school_id: this.email,
        password: this.password,
      })
      .pipe(
        finalize(() => {
          setTimeout(() => {
            this.isLoading = false;
            this.authStore.setLoading(false);
          });
        })
      )
      .subscribe({
        next: (response) => {
          const raw = response as any;
          const accessToken = raw.access || raw.access_token;

          this.authStore.setTokens({
            access: accessToken,
            refresh: raw.refresh || raw.refresh_token,
          });

          let payload: any = {};
          try {
            const base64Url = accessToken.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            payload = JSON.parse(atob(base64));
          } catch (e) {
            console.error('Failed to decode JWT payload:', e);
          }

          const portalType = (payload.role || payload.portal_key || 'UNKNOWN').toUpperCase();

          const nameParts = (payload.full_name || '').split(' ');
          this.authStore.setUserContext({
            user: {
              firstName: nameParts[0] || '',
              lastName: nameParts.slice(1).join(' ') || undefined,
              isActive: true,
              email: payload.email || '',
              schoolId: payload.school_id || '',
            },
            portalKey: payload.portal_key || '',
            permissions: payload.permissions || [],
          });

          switch (portalType) {
            case 'ADMIN':
            case 'SUPER_ADMIN':
            case 'STAFF':
              this.router.navigate(['/admin']);
              break;
            case 'TEACHER':
              this.router.navigate(['/teacher']);
              break;
            case 'STUDENT':
              this.router.navigate(['/student']);
              break;
            case 'PARENT':
              this.router.navigate(['/parent']);
              break;
            case 'TRANSPORT':
              this.router.navigate(['/transport']);
              break;
            default:
              console.error('No routing rule for portal type:', portalType);
              setTimeout(() => {
                this.snackBar.open('Unrecognized user role.', 'Dismiss', { duration: 5000 });
              });
              break;
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
    setTimeout(() => {
      this.authStore.setError(error.message);
      this.snackBar.open(error.message, 'Dismiss', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['error-snackbar'],
      });
    });
  }
}
