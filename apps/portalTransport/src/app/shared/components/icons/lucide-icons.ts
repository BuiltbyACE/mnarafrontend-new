import { Component, input } from '@angular/core';

// Lucide-style SVG icon components for high-contrast touch interface
// No emojis - all SVG icons with consistent 24x24 viewBox

@Component({
  selector: 'icon-bus',
  standalone: true,
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.5"/><path d="M18 18h3s.5-1.7.5-3.5-.5-3.5-1-3.5h-2l-3-6H6l-3 6H2s-1 1.7-1 3.5.5 3.5.5 3.5h3"/><path d="M8 18v2"/><path d="M16 18v2"/>
    </svg>
  `,
})
export class BusIcon {
  readonly size = input<number>(24);
}

@Component({
  selector: 'icon-check',
  standalone: true,
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  `,
})
export class CheckIcon {
  readonly size = input<number>(24);
}

@Component({
  selector: 'icon-check-circle',
  standalone: true,
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  `,
})
export class CheckCircleIcon {
  readonly size = input<number>(24);
}

@Component({
  selector: 'icon-map-pin',
  standalone: true,
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  `,
})
export class MapPinIcon {
  readonly size = input<number>(24);
}

@Component({
  selector: 'icon-navigation',
  standalone: true,
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="3 11 22 2 13 21 11 13 3 11"/>
    </svg>
  `,
})
export class NavigationIcon {
  readonly size = input<number>(24);
}

@Component({
  selector: 'icon-play',
  standalone: true,
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  `,
})
export class PlayIcon {
  readonly size = input<number>(24);
}

@Component({
  selector: 'icon-square',
  standalone: true,
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <rect x="4" y="4" width="16" height="16" rx="2"/>
    </svg>
  `,
})
export class SquareIcon {
  readonly size = input<number>(24);
}

@Component({
  selector: 'icon-log-out',
  standalone: true,
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  `,
})
export class LogOutIcon {
  readonly size = input<number>(24);
}

@Component({
  selector: 'icon-user',
  standalone: true,
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  `,
})
export class UserIcon {
  readonly size = input<number>(24);
}

@Component({
  selector: 'icon-users',
  standalone: true,
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  `,
})
export class UsersIcon {
  readonly size = input<number>(24);
}

@Component({
  selector: 'icon-alert-triangle',
  standalone: true,
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  `,
})
export class AlertTriangleIcon {
  readonly size = input<number>(24);
}

@Component({
  selector: 'icon-clock',
  standalone: true,
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  `,
})
export class ClockIcon {
  readonly size = input<number>(24);
}

@Component({
  selector: 'icon-radio',
  standalone: true,
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10A10 10 0 0 1 2 12"/><path d="M12 8a4 4 0 0 1 4 4 4 4 0 0 1-4 4"/><circle cx="12" cy="12" r="2" fill="currentColor"/>
    </svg>
  `,
})
export class RadioIcon {
  readonly size = input<number>(24);
}

@Component({
  selector: 'icon-wifi',
  standalone: true,
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>
    </svg>
  `,
})
export class WifiIcon {
  readonly size = input<number>(24);
}

@Component({
  selector: 'icon-wifi-off',
  standalone: true,
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="2" y1="2" x2="22" y2="22"/><path d="M8.5 16.5a6 6 0 0 1 7.01-1"/><path d="M11.29 12.71a10 10 0 0 1 3.28-1.3"/><path d="M2 12.55a11 11 0 0 1 14.08 0"/><path d="M16.71 9.29A16 16 0 0 1 21.16 9"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>
    </svg>
  `,
})
export class WifiOffIcon {
  readonly size = input<number>(24);
}

@Component({
  selector: 'icon-arrow-right',
  standalone: true,
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
    </svg>
  `,
})
export class ArrowRightIcon {
  readonly size = input<number>(24);
}

@Component({
  selector: 'icon-arrow-down',
  standalone: true,
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>
    </svg>
  `,
})
export class ArrowDownIcon {
  readonly size = input<number>(24);
}

@Component({
  selector: 'icon-info',
  standalone: true,
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  `,
})
export class InfoIcon {
  readonly size = input<number>(24);
}
