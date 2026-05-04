import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-student-categories',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="stub-page">
      <mat-icon>category</mat-icon>
      <h2>Student Categories</h2>
      <p>Student category management will be available here.</p>
    </div>
  `,
  styles: [`
    .stub-page {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 60vh;
      gap: 16px;
      color: #64748b;
      mat-icon { font-size: 64px; width: 64px; height: 64px; color: #cbd5e1; }
      h2 { font-size: 1.5rem; font-weight: 600; margin: 0; color: #1e293b; }
      p { font-size: 0.95rem; margin: 0; }
    }
  `],
})
export class StudentCategoriesComponent {}
