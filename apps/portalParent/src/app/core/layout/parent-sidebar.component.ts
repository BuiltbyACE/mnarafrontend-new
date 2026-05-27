import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { SiblingStateService } from '@sms/core/state';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  children?: NavItem[];
}

@Component({
  selector: 'app-parent-sidebar',
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './parent-sidebar.component.html',
  styleUrls: ['./parent-sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParentSidebarComponent {
  readonly siblingState = inject(SiblingStateService);

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: 'dashboard' },
    { label: 'My Children', icon: 'people', route: 'students' },
    {
      label: 'Academic Progress', icon: 'school', route: 'academics',
      children: [
        { label: 'Timetable', icon: 'calendar_month', route: 'academics/timetable' },
        { label: 'Exam Results', icon: 'assessment', route: 'academics/report-cards' },
        { label: 'Assignments', icon: 'assignment', route: 'academics/assignments' },
      ],
    },
    {
      label: 'Fees & Payments', icon: 'payments', route: 'finance',
      children: [
        { label: 'Statement', icon: 'receipt_long', route: 'finance/statement' },
        { label: 'Pay Now', icon: 'payment', route: 'finance/pay-now' },
        { label: 'Receipts', icon: 'description', route: 'finance/receipts' },
      ],
    },
    {
      label: 'Safety & Transport', icon: 'directions_bus', route: 'logistics',
      children: [
        { label: 'Attendance', icon: 'fact_check', route: 'logistics/attendance' },
        { label: 'Bus Tracking', icon: 'location_on', route: 'logistics/bus-tracking' },
        { label: 'Report Absence', icon: 'report', route: 'logistics/report-absence' },
        { label: 'Behaviour Records', icon: 'stars', route: 'logistics/behaviour-records' },
        { label: 'Commitment Form', icon: 'assignment', route: 'logistics/behaviour-commitments' },
      ],
    },
    { label: 'Transport', icon: 'directions_bus', route: 'transport' },
    { label: 'Announcements', icon: 'campaign', route: 'announcements' },
    { label: 'Notifications', icon: 'notifications', route: 'notifications' },
    { label: 'Messages', icon: 'chat', route: 'chat' },
    { label: 'School Calendar', icon: 'event', route: 'calendar' },
  ];

  onToggle(_event: Event): void {
    // Details/summary toggle is handled natively by the browser
  }
}
