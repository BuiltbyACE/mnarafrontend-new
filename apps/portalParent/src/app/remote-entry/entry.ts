import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ParentLayoutComponent } from '../core/layout/parent-layout.component';

@Component({
  imports: [ParentLayoutComponent],
  selector: 'app-portalParent-entry',
  template: `<app-parent-layout />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RemoteEntry {}