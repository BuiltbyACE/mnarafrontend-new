import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StudentSidebarComponent } from './student-sidebar.component';
import { StudentNavbarComponent } from './student-navbar.component';
import { StudentFooterComponent } from './student-footer.component';

@Component({
  selector: 'app-student-layout',
  imports: [
    RouterOutlet,
    StudentSidebarComponent,
    StudentNavbarComponent,
    StudentFooterComponent,
  ],
  templateUrl: './student-layout.component.html',
  styleUrls: ['./student-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentLayoutComponent {}
