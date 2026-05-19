import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-finance-hub',
  imports: [RouterLink, RouterOutlet, MatCardModule, MatIconModule, MatButtonModule, MatDividerModule],
  templateUrl: './finance-hub.component.html',
  styleUrls: ['./finance-hub.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinanceHubComponent {}