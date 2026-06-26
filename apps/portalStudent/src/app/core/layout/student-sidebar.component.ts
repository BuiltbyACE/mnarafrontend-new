import { Component, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
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
export class StudentSidebarComponent implements OnInit {
  private notif = inject(NotificationService);

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/student/dashboard' },
    { label: 'My Classes', icon: 'school', route: '/student/classes' },
    { label: 'Exam Results', icon: 'quiz', route: '/student/exams' },
    { label: 'Timetable', icon: 'calendar_month', route: '/student/timetable' },
    { label: 'Attendance', icon: 'fact_check', route: '/student/attendance' },
    { label: 'Announcements', icon: 'campaign', route: '/student/announcements' },
    { label: 'School Calendar', icon: 'event', route: '/student/calendar' },
    { label: 'Clubs and activities', icon: 'groups', route: '/student/clubs' },
    { label: 'My profile', icon: 'person', route: '/student/profile' },
  ];

  ngOnInit(): void {
    this.notif.fetchAll();
  }

  getBadge(route: string): number {
    return this.notif.getBadge(route);
  }
}
