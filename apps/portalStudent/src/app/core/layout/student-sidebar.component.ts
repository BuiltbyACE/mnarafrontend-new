import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NotificationService } from '../services/notification.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-student-sidebar',
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './student-sidebar.component.html',
  styleUrls: ['./student-sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentSidebarComponent {
  private notif = inject(NotificationService);

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/student/dashboard' },
    { label: 'My Classes', icon: 'school', route: '/student/classes' },
    { label: 'Assignments', icon: 'assignment', route: '/student/assignments' },
    { label: 'Exams', icon: 'quiz', route: '/student/exams' },
    { label: 'Timetable', icon: 'calendar_month', route: '/student/timetable' },
    { label: 'Grades', icon: 'grade', route: '/student/grades' },
    { label: 'Attendance', icon: 'fact_check', route: '/student/attendance' },
    { label: 'Announcements', icon: 'campaign', route: '/student/announcements' },
    { label: 'Resources', icon: 'folder', route: '/student/resources' },
    { label: 'E-learning', icon: 'computer', route: '/student/elearning' },
    { label: 'Clubs and activities', icon: 'groups', route: '/student/clubs' },
    { label: 'My profile', icon: 'person', route: '/student/profile' },
  ];

  getBadge(route: string): number {
    return this.notif.getBadge(route);
  }
}
