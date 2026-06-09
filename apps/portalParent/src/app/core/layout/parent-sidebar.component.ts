import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-parent-sidebar',
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './parent-sidebar.component.html',
  styleUrls: ['./parent-sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParentSidebarComponent {
  readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: 'dashboard' },
    { label: 'Exam Reports', icon: 'assessment', route: 'academics/report-cards' },
    { label: 'Fee Statement', icon: 'receipt_long', route: 'finance/statement' },
    { label: 'Fee Structure', icon: 'description', route: 'fee-structure' },
    { label: 'Transport', icon: 'directions_bus', route: 'transport' },
    { label: 'Announcements', icon: 'campaign', route: 'announcements' },
    { label: 'School Calendar', icon: 'event', route: 'calendar' },
  ];
}
