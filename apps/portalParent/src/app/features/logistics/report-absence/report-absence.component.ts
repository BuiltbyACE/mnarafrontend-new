import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-report-absence',
  imports: [MatCardModule, MatIconModule],
  template: `
    <div class="page">
      <mat-card>
        <mat-card-header>
          <mat-icon mat-card-avatar>report</mat-icon>
          <mat-card-title>Report Absence</mat-card-title>
          <mat-card-subtitle>Report your child's absence</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>To report an absence, please contact the school office directly at <strong>+254 711 223 344</strong> or email <strong>attendance@mnaraschool.ac.ke</strong>.</p>
          <p>An online absence reporting form is being developed.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page { padding: 16px 0; max-width: 600px; }
    p { color: #475569; font-size: 0.875rem; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportAbsenceComponent {}
