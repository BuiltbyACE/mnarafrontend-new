import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-academic-hub',
  imports: [RouterLink, RouterOutlet, MatCardModule, MatIconModule, MatButtonModule],
  templateUrl: './academic-hub.component.html',
  styleUrls: ['./academic-hub.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcademicHubComponent {}