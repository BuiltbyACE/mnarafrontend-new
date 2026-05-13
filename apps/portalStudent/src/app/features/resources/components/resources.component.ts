import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-student-resources',
  imports: [MatCardModule],
  template: `
    <div class="page">
      <mat-card>
        <mat-card-content>
          <h1>Resources</h1>
          <p>Access learning materials and documents.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page { padding: 24px; }
    h1 { margin: 0 0 8px; font-size: 1.5rem; font-weight: 700; color: #1e293b; }
    p { margin: 0; color: #64748b; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourcesComponent {}
