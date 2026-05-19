import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ParentSidebarComponent } from './parent-sidebar.component';
import { ParentNavbarComponent } from './parent-navbar.component';
import { ParentFooterComponent } from './parent-footer.component';

@Component({
  selector: 'app-parent-layout',
  imports: [
    RouterOutlet,
    ParentSidebarComponent,
    ParentNavbarComponent,
    ParentFooterComponent,
  ],
  templateUrl: './parent-layout.component.html',
  styleUrls: ['./parent-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParentLayoutComponent {}