/**
 * Discover Page Component
 * Step 1 of 2-Step Login Flow
 * Captures user's identifier (School ID or Email)
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
import { AuthStore } from '@sms/core/auth';

@Component({
  selector: 'app-discover-page',
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
  ],
  templateUrl: './discover-page.html',
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
    
    .logo {
      width: 64px;
      height: 64px;
      margin-bottom: 1rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: auto;
      margin-right: auto;
    }
    
    .logo mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: white;
    }
    
    .login-title {
      font-size: 1.75rem;
      font-weight: 600;
      color: #1a1a2e;
      margin: 0 0 0.5rem;
    }
    
    .login-subtitle {
      font-size: 1rem;
      color: #6b7280;
      margin: 0;
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
    
    .next-button {
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
    
    .next-button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
    }
    
    .next-button:disabled {
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
  `],
})
export class DiscoverPage {
  private authStore = inject(AuthStore);
  private router = inject(Router);

  identifier = '';
  isLoading = false;

  /**
   * Handle form submission
   * Store identifier and navigate to credentials page
   */
  onSubmit(): void {
    if (!this.identifier.trim()) {
      return;
    }

    this.isLoading = true;

    // Store identifier in auth state
    this.authStore.setIdentifier(this.identifier.trim());

    // Navigate to credentials page
    this.router.navigate(['/login', 'password']);

    this.isLoading = false;
  }

  /**
   * Handle Enter key press
   */
  onKeyPress(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter' && this.identifier.trim()) {
      this.onSubmit();
    }
  }
}
