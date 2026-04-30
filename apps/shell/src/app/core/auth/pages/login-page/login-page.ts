/**
 * Premium Login Page Component
 * Split-screen design with school imagery and modern SaaS aesthetics
 */

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

  // Form fields
  email = '';
  password = '';
  rememberMe = false;
  hidePassword = true;
  isLoading = false;

  /**
   * Toggle password visibility
   */
  togglePassword(): void {
    this.hidePassword = !this.hidePassword;
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (!this.email || !this.password || this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.authStore.setLoading(true);
    this.authStore.clearError();

    // Call login API
    this.authService
      .login({
        school_id: this.email,
        password: this.password,
      })
      .subscribe({
        next: (tokens) => {
          // Save tokens
          this.authStore.setTokens(tokens);

          // Fetch user context
          this.authService.fetchUserContext().subscribe({
            next: (userContext) => {
              console.log('Login: User context received:', userContext);
              this.authStore.setUserContext(userContext);
              this.authStore.setLoading(false);
              this.isLoading = false;

              // Navigate to portal with small delay for state propagation
              const portalRoute = this.authStore.getPortalRoute();
              console.log('Login: Portal route:', portalRoute, 'portalKey:', userContext.portalKey);
              if (portalRoute) {
                console.log('Login: Attempting navigation to:', portalRoute);
                // Delay to ensure signals are propagated before navigation
                setTimeout(() => {
                  this.router.navigate([portalRoute]).then(
                    (success) => console.log('Login: Navigation success:', success),
                    (error) => console.error('Login: Navigation error:', error)
                  );
                }, 100);
              } else {
                const errorMsg = `Unable to determine portal access. Unknown portalKey: ${userContext.portalKey}`;
                console.error('Login:', errorMsg);
                this.handleError(new Error(errorMsg));
              }
            },
            error: (error) => {
              this.handleError(error);
            },
          });
        },
        error: (error) => {
          this.handleError(error);
        },
      });
  }

  /**
   * Handle Enter key press
   */
  onKeyPress(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter' && this.email && this.password && !this.isLoading) {
      this.onSubmit();
    }
  }

  /**
   * Handle errors from API calls
   */
  private handleError(error: Error): void {
    this.isLoading = false;
    this.authStore.setLoading(false);
    this.authStore.setError(error.message);
    this.showError(error.message);
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['error-snackbar'],
    });
  }
}
