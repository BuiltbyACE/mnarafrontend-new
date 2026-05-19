import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-assignments',
  template: `<div class="placeholder"><h2>Assignments</h2><p>View and track assignments</p></div>`,
  styles: [`.placeholder { padding: 24px; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignmentsComponent {}