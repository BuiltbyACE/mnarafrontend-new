import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-logistics-hub',
  imports: [RouterLink, RouterOutlet, MatCardModule, MatIconModule, MatButtonModule],
  templateUrl: './logistics-hub.component.html',
  styleUrls: ['./logistics-hub.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogisticsHubComponent {}