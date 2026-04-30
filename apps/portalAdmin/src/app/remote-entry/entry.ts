import { Component } from '@angular/core';
import { AdminLayoutComponent } from '../layout/admin-layout/admin-layout';

/**
 * Admin Portal Remote Entry Point
 * Loaded via Module Federation by the Shell application
 */
@Component({
  imports: [AdminLayoutComponent],
  selector: 'app-portalAdmin-entry',
  template: `<app-admin-layout></app-admin-layout>`,
})
export class RemoteEntry {}
