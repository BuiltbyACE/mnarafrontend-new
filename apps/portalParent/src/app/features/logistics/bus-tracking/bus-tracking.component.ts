import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-bus-tracking',
  imports: [MatCardModule, MatIconModule, RouterLink],
  template: `
    <div class="page">
      <mat-card>
        <mat-card-header>
          <mat-icon mat-card-avatar>map</mat-icon>
          <mat-card-title>Bus Tracking</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>Real-time bus tracking is available on the <a routerLink="/parent/logistics">Safety & Transport</a> dashboard.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page { padding: 16px 0; max-width: 600px; }
    p { color: #475569; font-size: 0.875rem; }
    a { color: #2563eb; text-decoration: none; font-weight: 500; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusTrackingComponent {}
