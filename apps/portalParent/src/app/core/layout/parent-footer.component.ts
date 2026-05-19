import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-parent-footer',
  template: `
    <footer class="footer">
      <span>&copy; {{ year }} SafariStack. All rights reserved.</span>
    </footer>
  `,
  styles: [`
    :host {
      display: block;
    }
    .footer {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 48px;
      background: #1e3a5f;
      color: rgba(255, 255, 255, 0.8);
      font-family: 'Inter', sans-serif;
      font-size: 0.75rem;
      font-weight: 400;
      padding: 0 24px;
      flex-shrink: 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParentFooterComponent {
  readonly year = new Date().getFullYear();
}