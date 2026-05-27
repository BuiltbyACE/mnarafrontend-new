import { Component, OnInit, OnDestroy, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DatePipe } from '@angular/common';
import { ParentTransportService } from '../services/parent-transport.service';
import { ParentBusMapComponent } from './parent-bus-map/parent-bus-map';
import { ParentApiService } from '../../../services/parent-api.service';
import { AttendanceRecord, STATUS_COLORS } from '../../../models/parent.models';

@Component({
  selector: 'app-logistics-hub',
  imports: [RouterLink, RouterOutlet, MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, ParentBusMapComponent, DatePipe],
  templateUrl: './logistics-hub.component.html',
  styleUrls: ['./logistics-hub.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogisticsHubComponent implements OnInit, OnDestroy {
  protected readonly transport = inject(ParentTransportService);
  private readonly api = inject(ParentApiService);

  readonly attendanceToday = signal<AttendanceRecord[]>([]);
  readonly attendanceMonth = signal<AttendanceRecord[]>([]);
  readonly attendanceLoading = signal(true);

  readonly STATUS_COLORS = STATUS_COLORS;

  ngOnInit(): void {
    this.transport.loadAll();
    this.loadAttendance();
  }

  ngOnDestroy(): void {
    this.transport.disconnectWebSocket();
  }

  private loadAttendance(): void {
    this.api.getAttendanceRecords().subscribe({
      next: (records) => {
        const today = new Date().toISOString().split('T')[0];
        this.attendanceToday.set(records.filter(r => r.date.startsWith(today)));
        this.attendanceMonth.set(records);
        this.attendanceLoading.set(false);
      },
      error: () => this.attendanceLoading.set(false),
    });
  }

  get presentCount() { return this.attendanceMonth().filter(r => r.status === 'PRESENT').length; }
  get totalCount() { return this.attendanceMonth().length || 1; }
  get attendanceRate() { return Math.round((this.presentCount / this.totalCount) * 100); }
  get absentCount() { return this.attendanceMonth().filter(r => r.status === 'ABSENT').length; }
}
