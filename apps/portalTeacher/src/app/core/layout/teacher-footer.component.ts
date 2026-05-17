import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-teacher-footer',
  template: `
    <footer class="footer">
      &copy; {{ year }} SafariStack Solutions. All rights reserved.
      <span class="footer-version">Version 1.0.0</span>
    </footer>
  `,
  styles: [`
    :host { display: block; }
    .footer {
      display: flex; align-items: center; justify-content: space-between;
      height: 48px; padding: 0 24px;
      background: #1e3a8a; color: rgba(255, 255, 255, 0.7);
      font-family: 'Inter', sans-serif; font-size: 0.75rem;
      flex-shrink: 0;
    }
    .footer-version { font-size: 0.6875rem; color: rgba(255, 255, 255, 0.4); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherFooterComponent {
  readonly year = new Date().getFullYear();
}
