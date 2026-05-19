import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-conferences',
  template: `<div class="placeholder"><h2>Conferences</h2><p>Schedule and view parent-teacher conferences</p></div>`,
  styles: [`.placeholder { padding: 24px; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConferencesComponent {}