import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-global-settings',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">Global System Configuration</h1>
        <p class="page-subtitle">Manage school-wide parameters, terms, and grading thresholds.</p>
      </div>
      <mat-card class="placeholder-card">
        <div class="placeholder-content">
          <mat-icon class="placeholder-icon">settings</mat-icon>
          <p class="placeholder-text">The System Configuration Matrix is currently under construction.</p>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 32px;
      max-width: 960px;
      margin: 0 auto;
      font-family: 'Inter', system-ui, sans-serif;
    }

    .page-header {
      margin-bottom: 32px;
    }

    .page-title {
      font-size: 1.375rem;
      font-weight: 700;
      color: #1e293b;
      letter-spacing: -0.02em;
      margin: 0 0 4px;
    }

    .page-subtitle {
      font-size: 0.8125rem;
      color: #6b7280;
      margin: 0;
    }

    .placeholder-card {
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }

    .placeholder-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 24px;
      gap: 16px;
    }

    .placeholder-icon {
      font-size: 56px;
      width: 56px;
      height: 56px;
      color: #94a3b8;
    }

    .placeholder-text {
      font-size: 1rem;
      font-weight: 500;
      color: #64748b;
      text-align: center;
      margin: 0;
    }
  `],
})
export class GlobalSettingsComponent {}
