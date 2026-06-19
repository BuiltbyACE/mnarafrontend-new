import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { TimetableGridComponent } from '@sms/frontend/timetable-matrix';
import { TimetableStateService } from '@sms/frontend/timetable-matrix';

@Component({
  selector: 'app-timetable-view',
  standalone: true,
  imports: [CommonModule, MatTabsModule, TimetableGridComponent],
  template: `
    <div class="p-6 max-w-[1400px] mx-auto">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-slate-900">Timetable</h1>
        <p class="text-sm text-slate-500 mt-1">Read-only view of class and teacher schedules</p>
      </div>

      <mat-tab-group animationDuration="0ms">
        <mat-tab label="Year Group View">
          <ng-template matTabContent>
            <div class="mt-4">
              <app-timetable-grid />
            </div>
          </ng-template>
        </mat-tab>

        <mat-tab label="Teacher View">
          <ng-template matTabContent>
            <div class="mt-4 p-8 text-center text-slate-500">
              <p>Select a teacher to view their timetable</p>
            </div>
          </ng-template>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; }
    mat-tab-group { background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.07); overflow: hidden; }
  `],
})
export class TimetableViewPage {}
