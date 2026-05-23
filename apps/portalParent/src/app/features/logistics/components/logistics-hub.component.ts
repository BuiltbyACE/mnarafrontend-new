import { Component, OnInit, OnDestroy, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ParentTransportService } from '../services/parent-transport.service';
import { ParentBusMapComponent } from './parent-bus-map/parent-bus-map';

@Component({
  selector: 'app-logistics-hub',
  imports: [RouterLink, RouterOutlet, MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, ParentBusMapComponent],
  templateUrl: './logistics-hub.component.html',
  styleUrls: ['./logistics-hub.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogisticsHubComponent implements OnInit, OnDestroy {
  protected readonly transport = inject(ParentTransportService);

  ngOnInit(): void {
    this.transport.loadAll();
  }

  ngOnDestroy(): void {
    this.transport.disconnectWebSocket();
  }
}