import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConductorApiService } from '../../shared/services/conductor-api.service';
import { BusIcon, InfoIcon, CheckCircleIcon } from '../../shared/components/icons/lucide-icons';

/**
 * Device Registration / PIN Login Panel
 * 
 * High-contrast, touch-first interface optimized for 7-inch tablets
 * mounted to vehicle dashboards. Large touch targets, clear visual feedback.
 * Posts directly to secure authentication endpoints.
 */
@Component({
  selector: 'app-device-login',
  standalone: true,
  imports: [CommonModule, FormsModule, BusIcon, InfoIcon, CheckCircleIcon],
  template: `
    <div class="login-container">
      <!-- Header with Bus Icon -->
      <header class="login-header">
        <div class="logo-badge">
          <icon-bus [size]="32" />
        </div>
        <h1 class="app-title">Mnara Conductor</h1>
        <p class="app-subtitle">Fleet Operating Console</p>
      </header>

      <!-- Main Login Card -->
      <main class="login-card">
        <form (ngSubmit)="onSubmit()" class="login-form">
          
          <!-- Device ID Input -->
          <div class="input-wrapper">
            <label for="deviceId" class="input-label">
              Device ID
            </label>
            <input
              id="deviceId"
              type="text"
              [(ngModel)]="deviceId"
              name="deviceId"
              placeholder="Enter device ID"
              class="touch-input"
              autocomplete="off"
              autocorrect="off"
              autocapitalize="off"
              spellcheck="false"
              [disabled]="isLoading()"
              (focus)="onInputFocus()"
              (blur)="onInputBlur()"
            />
            <span class="input-hint">Found on device sticker</span>
          </div>

          <!-- PIN Code Input -->
          <div class="input-wrapper">
            <label for="pinCode" class="input-label">
              PIN Code
            </label>
            <input
              id="pinCode"
              type="password"
              [(ngModel)]="pinCode"
              name="pinCode"
              placeholder="••••"
              maxlength="4"
              inputmode="numeric"
              pattern="[0-9]*"
              class="touch-input pin-input"
              [disabled]="isLoading()"
              (input)="onPinInput($event)"
              (keydown)="onPinKeydown($event)"
            />
            <span class="input-hint">4-digit conductor PIN</span>
          </div>

          <!-- Error Message -->
          @if (error()) {
            <div class="error-banner" role="alert">
              <icon-info [size]="20" />
              <span>{{ error() }}</span>
            </div>
          }

          <!-- Success Message -->
          @if (success()) {
            <div class="success-banner" role="status">
              <icon-check-circle [size]="20" />
              <span>{{ success() }}</span>
            </div>
          }

          <!-- Submit Button -->
          <button
            type="submit"
            class="submit-btn"
            [disabled]="isLoading() || !isFormValid()"
            [class.loading]="isLoading()"
          >
            @if (isLoading()) {
              <span class="spinner"></span>
              <span>Connecting...</span>
            } @else {
              <span>Start Shift</span>
            }
          </button>
        </form>
      </main>

      <!-- Footer Info -->
      <footer class="login-footer">
        <div class="footer-hint">
          <icon-info [size]="16" />
          <span>Contact fleet manager if device is not registered</span>
        </div>
        <div class="version">v2.1.0</div>
      </footer>
    </div>
  `,
  styles: [`
    /* CSS Variables based on Design System */
    :host {
      --color-primary: #0F172A;
      --color-secondary: #334155;
      --color-accent: #0369A1;
      --color-accent-light: #0EA5E9;
      --color-background: #0F172A;
      --color-surface: #1E293B;
      --color-surface-elevated: #334155;
      --color-text-primary: #F8FAFC;
      --color-text-secondary: #94A3B8;
      --color-text-muted: #64748B;
      --color-success: #22C55E;
      --color-error: #EF4444;
      --color-warning: #F59E0B;
      
      --touch-target-min: 48px;
      --border-radius-sm: 8px;
      --border-radius-md: 12px;
      --border-radius-lg: 16px;
      --shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
      --shadow-md: 0 4px 6px rgba(0,0,0,0.4);
      --shadow-lg: 0 10px 15px rgba(0,0,0,0.5);
      
      display: block;
      height: 100dvh;
      width: 100%;
      font-family: 'Fira Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    .login-container {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(180deg, var(--color-primary) 0%, #020617 100%);
      padding: 24px;
      gap: 32px;
    }

    /* Header */
    .login-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      text-align: center;
    }

    .logo-badge {
      width: 72px;
      height: 72px;
      border-radius: var(--border-radius-lg);
      background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-light) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: var(--shadow-lg);
      border: 2px solid rgba(255,255,255,0.1);
    }

    .app-title {
      font-family: 'Fira Code', monospace;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-text-primary);
      margin: 0;
      letter-spacing: -0.5px;
    }

    .app-subtitle {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      margin: 0;
      font-weight: 500;
    }

    /* Login Card */
    .login-card {
      width: 100%;
      max-width: 420px;
      background: var(--color-surface);
      border-radius: var(--border-radius-lg);
      padding: 32px 28px;
      border: 1px solid var(--color-surface-elevated);
      box-shadow: var(--shadow-lg);
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    /* Input Styles */
    .input-wrapper {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .input-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .touch-input {
      width: 100%;
      height: 56px;
      padding: 0 16px;
      font-size: 1.125rem;
      font-family: 'Fira Sans', sans-serif;
      background: var(--color-primary);
      border: 2px solid var(--color-surface-elevated);
      border-radius: var(--border-radius-md);
      color: var(--color-text-primary);
      transition: all 200ms ease;
      -webkit-appearance: none;
    }

    .touch-input::placeholder {
      color: var(--color-text-muted);
    }

    .touch-input:focus {
      outline: none;
      border-color: var(--color-accent);
      box-shadow: 0 0 0 3px rgba(3, 105, 161, 0.3);
    }

    .touch-input:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .pin-input {
      font-family: 'Fira Code', monospace;
      font-size: 1.5rem;
      letter-spacing: 12px;
      text-align: center;
      font-weight: 600;
    }

    .input-hint {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      margin-top: 4px;
    }

    /* Messages */
    .error-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 16px;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid var(--color-error);
      border-radius: var(--border-radius-md);
      color: #FCA5A5;
      font-size: 0.875rem;
    }

    .success-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 16px;
      background: rgba(34, 197, 94, 0.15);
      border: 1px solid var(--color-success);
      border-radius: var(--border-radius-md);
      color: #86EFAC;
      font-size: 0.875rem;
    }

    /* Submit Button */
    .submit-btn {
      width: 100%;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 0 24px;
      font-family: 'Fira Sans', sans-serif;
      font-size: 1.125rem;
      font-weight: 700;
      color: white;
      background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-light) 100%);
      border: none;
      border-radius: var(--border-radius-md);
      cursor: pointer;
      transition: all 200ms ease;
      box-shadow: var(--shadow-md);
      margin-top: 8px;
    }

    .submit-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    .submit-btn:active:not(:disabled) {
      transform: translateY(0);
    }

    .submit-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .submit-btn.loading {
      cursor: wait;
    }

    /* Spinner */
    .spinner {
      width: 20px;
      height: 20px;
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Footer */
    .login-footer {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .footer-hint {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    .version {
      font-size: 0.6875rem;
      color: var(--color-text-muted);
      font-family: 'Fira Code', monospace;
    }

    /* Responsive for 7-inch tablets */
    @media (max-width: 600px) {
      .login-card {
        padding: 24px 20px;
      }

      .touch-input {
        height: 52px;
        font-size: 1rem;
      }

      .submit-btn {
        height: 52px;
        font-size: 1rem;
      }
    }

    /* Reduced motion preference */
    @media (prefers-reduced-motion: reduce) {
      .spinner {
        animation: none;
        border-top-color: rgba(255, 255, 255, 0.3);
      }

      .submit-btn,
      .touch-input {
        transition: none;
      }
    }
  `],
})
export class DeviceLoginComponent {
  private api = inject(ConductorApiService);
  private router = inject(Router);

  readonly deviceId = signal('');
  readonly pinCode = signal('');
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);

  isFormValid(): boolean {
    const deviceId = this.deviceId().trim();
    const pinCode = this.pinCode().trim();
    return deviceId.length >= 4 && /^\d{4}$/.test(pinCode);
  }

  onPinInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Only allow digits
    input.value = input.value.replace(/\D/g, '');
    this.pinCode.set(input.value);
  }

  onPinKeydown(event: KeyboardEvent): void {
    // Allow only digits, backspace, delete, arrows, tab
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
    if (allowedKeys.includes(event.key)) return;
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onInputFocus(): void {
    this.error.set(null);
  }

  onInputBlur(): void {
    // Clear any transient errors
  }

  onSubmit(): void {
    if (!this.isFormValid()) {
      this.error.set('Please enter valid Device ID and 4-digit PIN');
      return;
    }

    const deviceId = this.deviceId().trim();
    const pinCode = this.pinCode().trim();

    this.isLoading.set(true);
    this.error.set(null);
    this.success.set(null);

    this.api.deviceLogin(deviceId, pinCode).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.success.set('Connected! Starting session...');
        
        // Small delay for user feedback before navigation
        setTimeout(() => {
          this.router.navigate(['/operator']);
        }, 500);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set(err.message || 'Authentication failed. Check credentials.');
      },
    });
  }
}
