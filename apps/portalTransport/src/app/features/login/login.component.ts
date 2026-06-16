import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConductorApiService } from '../../shared/services/conductor-api.service';

@Component({
  selector: 'app-device-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-screen">
      <div class="login-card">
        <div class="logo-area">
          <div class="logo-icon">M</div>
          <h1>Mnara School</h1>
          <p class="subtitle">Fleet Conductor Console</p>
        </div>

        <form (ngSubmit)="onLogin()" class="login-form">
          <div class="input-group">
            <label for="deviceId">Device ID</label>
            <input
              id="deviceId"
              type="text"
              [(ngModel)]="deviceId"
              name="deviceId"
              placeholder="e.g. a1b2c3d4-..."
              autocomplete="off"
              inputmode="url"
              class="touch-input"
              required
            />
          </div>

          <div class="input-group">
            <label for="pinCode">PIN Code</label>
            <input
              id="pinCode"
              type="password"
              [(ngModel)]="pinCode"
              name="pinCode"
              placeholder="4-digit PIN"
              inputmode="numeric"
              maxlength="4"
              pattern="[0-9]{4}"
              class="touch-input pin-input"
              required
            />
          </div>

          @if (error()) {
            <div class="error-msg">{{ error() }}</div>
          }

          <button
            type="submit"
            class="login-btn touch-btn"
            [disabled]="isLoading() || !deviceId || !pinCode"
          >
            @if (isLoading()) {
              <span class="spinner"></span>
            }
            {{ isLoading() ? 'Connecting...' : 'Start Shift' }}
          </button>
        </form>

        <div class="footer-hint">
          <span class="hint-icon">&#9432;</span>
          Enter the Device ID and 4-digit PIN provided by your fleet manager
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100dvh; width: 100%; }
    .login-screen {
      height: 100%; display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
      padding: 16px;
    }
    .login-card {
      width: 100%; max-width: 420px;
      background: #1e293b; border-radius: 20px; border: 1px solid #334155;
      padding: 40px 28px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    }
    .logo-area { text-align: center; margin-bottom: 32px; }
    .logo-icon {
      width: 64px; height: 64px; border-radius: 16px;
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: #fff; font-size: 28px; font-weight: 800;
      display: inline-flex; align-items: center; justify-content: center;
      margin-bottom: 12px;
    }
    .logo-area h1 { color: #f1f5f9; font-size: 1.25rem; font-weight: 700; margin: 0; }
    .subtitle { color: #94a3b8; font-size: 0.8rem; margin: 4px 0 0; }
    .login-form { display: flex; flex-direction: column; gap: 20px; }
    .input-group { display: flex; flex-direction: column; gap: 6px; }
    .input-group label {
      color: #cbd5e1; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .touch-input {
      width: 100%; padding: 16px 14px; font-size: 1rem;
      background: #0f172a; border: 2px solid #334155; border-radius: 12px;
      color: #f1f5f9; outline: none; transition: border-color 0.2s;
      -webkit-appearance: none;
    }
    .touch-input:focus { border-color: #3b82f6; }
    .touch-input::placeholder { color: #475569; }
    .pin-input { font-size: 1.5rem; letter-spacing: 8px; text-align: center; font-weight: 700; }
    .error-msg {
      background: #7f1d1d; color: #fca5a5; padding: 12px; border-radius: 10px;
      font-size: 0.85rem; text-align: center; border: 1px solid #991b1b;
    }
    .login-btn {
      width: 100%; padding: 18px; font-size: 1.1rem; font-weight: 700;
      background: linear-gradient(135deg, #3b82f6, #2563eb); color: #fff;
      border: none; border-radius: 12px; cursor: pointer;
      transition: opacity 0.2s; min-height: 56px;
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .login-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .login-btn:not(:disabled):active { opacity: 0.8; }
    .spinner {
      width: 20px; height: 20px; border: 3px solid rgba(255,255,255,0.3);
      border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .footer-hint {
      margin-top: 24px; display: flex; align-items: center; gap: 8px;
      justify-content: center; color: #64748b; font-size: 0.7rem;
    }
    .hint-icon { font-size: 1rem; }
  `],
})
export class LoginComponent {
  private api = inject(ConductorApiService);
  private router = inject(Router);

  readonly deviceId = signal('');
  readonly pinCode = signal('');
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  onLogin(): void {
    const deviceId = this.deviceId().trim();
    const pinCode = this.pinCode().trim();

    if (!deviceId || pinCode.length !== 4) {
      this.error.set('Enter a valid Device ID and 4-digit PIN');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    this.api.deviceLogin(deviceId, pinCode).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/operator']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set(err.message || 'Invalid credentials. Try again.');
      },
    });
  }
}
