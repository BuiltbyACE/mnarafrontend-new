import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-assignments',
  imports: [MatCardModule, MatIconModule],
  template: `
    <div class="assignments-page">
      <mat-card>
        <mat-card-header>
          <mat-icon mat-card-avatar>assignment</mat-icon>
          <mat-card-title>Assignments</mat-card-title>
          <mat-card-subtitle>Track assignments and deadlines</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>Assignment tracking is being developed. Check back soon to view and track your child's assignments.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .assignments-page { padding: 16px 0; max-width: 600px; }
    p { color: #475569; font-size: 0.875rem; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignmentsComponent {}
