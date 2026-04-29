/**
 * Credentials Page Component
 * Step 2 of 2-Step Login Flow
 * Captures password and completes authentication
 */

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthStore, AuthService } from '@sms/core/auth';

@Component({
  selector: 'app-credentials-page',
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
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './credentials-page.html',
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    
    .login-card {
      width: 100%;
      max-width: 420px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    
    .login-header {
      text-align: center;
      padding: 2rem 2rem 1rem;
    }
    
    .back-button {
      position: absolute;
      top: 1rem;
      left: 1rem;
      color: #6b7280;
    }
    
    .user-avatar {
      width: 80px;
      height: 80px;
      margin: 0 auto 1rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .user-avatar mat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: white;
    }
    
    .welcome-text {
      font-size: 1.25rem;
      color: #6b7280;
      margin: 0 0 0.25rem;
    }
    
    .identifier-text {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1a1a2e;
      margin: 0;
      word-break: break-all;
    }
    
    .login-form {
      padding: 1rem 2rem 2rem;
    }
    
    .full-width {
      width: 100%;
    }
    
    .input-field {
      margin-bottom: 1.5rem;
    }
    
    .login-button {
      width: 100%;
      padding: 0.75rem;
      font-size: 1rem;
      font-weight: 500;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .login-button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
    }
    
    .login-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .button-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }
    
    .help-text {
      text-align: center;
      margin-top: 1.5rem;
      font-size: 0.875rem;
      color: #6b7280;
    }
    
    .help-text a {
      color: #667eea;
      text-decoration: none;
    }
    
    .help-text a:hover {
      text-decoration: underline;
    }
    
    /* Material Form Field Customization */
    ::ng-deep .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }
    
    ::ng-deep .mat-mdc-text-field-wrapper {
      background-color: #f9fafb;
      border-radius: 8px;
    }
    
    ::ng-deep .mat-mdc-form-field-focus-overlay {
      background-color: rgba(102, 126, 234, 0.1);
    }
    
    .header-wrapper {
      position: relative;
    }
  `],
})
export class CredentialsPage implements OnInit {
  private authStore = inject(AuthStore);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  password = '';
  hidePassword = true;
  isLoading = false;

  // Get identifier from store
  get identifier(): string {
    return this.authStore.identifier();
  }

  ngOnInit(): void {
    // If no identifier in store, redirect back to discover page
    if (!this.identifier) {
      this.router.navigate(['/login']);
    }
  }

  /**
   * Go back to discover page
   */
  goBack(): void {
    this.authStore.setIdentifier('');
    this.router.navigate(['/login']);
  }

  /**
   * Handle login submission
   */
  onSubmit(): void {
    if (!this.password || this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.authStore.setLoading(true);
    this.authStore.clearError();

    // Call login API
    this.authService
      .login({
        school_id: this.identifier,
        password: this.password,
      })
      .subscribe({
        next: (tokens) => {
          // Save tokens
          this.authStore.setTokens(tokens);

          // Fetch user context
          this.authService.fetchUserContext().subscribe({
            next: (userContext) => {
              this.authStore.setUserContext(userContext);
              this.authStore.setLoading(false);
              this.isLoading = false;

              // Navigate to portal
              const portalRoute = this.authStore.getPortalRoute();
              if (portalRoute) {
                this.router.navigate([portalRoute]);
              } else {
                this.showError('Unable to determine portal access');
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
    if (keyboardEvent.key === 'Enter' && this.password && !this.isLoading) {
      this.onSubmit();
    }
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
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
