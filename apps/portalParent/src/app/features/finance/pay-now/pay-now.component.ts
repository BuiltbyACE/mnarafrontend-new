import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-pay-now',
  imports: [MatCardModule, MatIconModule],
  template: `
    <div class="pay-now-page">
      <mat-card>
        <mat-card-header>
          <mat-icon mat-card-avatar>payments</mat-icon>
          <mat-card-title>Make a Payment</mat-card-title>
          <mat-card-subtitle>Secure online payment via M-Pesa</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>Payment integration is being set up. You will be able to pay school fees securely using M-Pesa, bank transfer, or card.</p>
          <p>For now, please use the school's existing payment channels:</p>
          <ul>
            <li><strong>M-Pesa Paybill:</strong> 247247 &mdash; Account: [Student School ID]</li>
            <li><strong>Bank Transfer:</strong> Equity Bank &mdash; Acc: 1234567890</li>
          </ul>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .pay-now-page { padding: 16px 0; max-width: 600px; }
    mat-card-content p { color: #475569; font-size: 0.875rem; margin: 8px 0; }
    ul { margin: 12px 0; padding-left: 20px; }
    li { font-size: 0.8125rem; color: #334155; margin-bottom: 8px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PayNowComponent {}
