import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-conferences',
  imports: [MatCardModule, MatIconModule],
  template: `
    <div class="page">
      <mat-card>
        <mat-card-header>
          <mat-icon mat-card-avatar>event</mat-icon>
          <mat-card-title>Parent-Teacher Conferences</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>Conference scheduling is being developed. You will be able to book parent-teacher conference slots here.</p>
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
export class ConferencesComponent {}
