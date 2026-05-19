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
    { label: 'Academic Progress', icon: 'school', route: 'academics' },
    { label: 'Fees & Payments', icon: 'payments', route: 'finance' },
    { label: 'Safety & Transport', icon: 'directions_bus', route: 'logistics' },
    { label: 'School Notices', icon: 'campaign', route: 'communication' },
  ];
}