import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TimetableGridComponent } from '@sms/frontend/timetable-matrix';
import { TimetableApiService } from '@sms/frontend/timetable-matrix';

@Component({
  selector: 'app-timetable-admin',
  standalone: true,
  imports: [CommonModule, MatTabsModule, MatButtonModule, MatIconModule, TimetableGridComponent],
  template: `
    <div class="p-6 max-w-[1400px] mx-auto">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Timetable Administration</h1>
          <p class="text-sm text-slate-500 mt-1">Manage bell schedules, entries, and resolve conflicts</p>
        </div>
        <div class="flex gap-2">
          <button mat-stroked-button (click)="checkConflicts()" class="flex items-center gap-2">
            <mat-icon fontSet="material-icons-outlined">warning_amber</mat-icon>
            Check Conflicts
          </button>
          <button mat-flat-button color="primary" class="flex items-center gap-2">
            <mat-icon>add</mat-icon>
            New Entry
          </button>
        </div>
      </div>

      @if (conflicts().length > 0) {
        <div class="mb-4 p-4 rounded-lg bg-red-50 border border-red-200">
          <div class="flex items-center gap-2 text-red-700 font-semibold text-sm">
            <mat-icon fontSet="material-icons-outlined" class="text-red-500">error_outline</mat-icon>
            {{ conflicts().length }} conflict(s) detected
          </div>
          <div class="mt-2 space-y-1">
            @for (c of conflicts(); track $index) {
              <p class="text-xs text-red-600">{{ c.description }}</p>
            }
          </div>
        </div>
      }

      <mat-tab-group animationDuration="0ms">
        <mat-tab label="Grid View">
          <ng-template matTabContent>
            <div class="mt-4 h-[calc(100vh-280px)]">
              <app-timetable-grid />
            </div>
          </ng-template>
        </mat-tab>

        <mat-tab label="Conflict Report">
          <ng-template matTabContent>
            <div class="mt-4 p-8 text-center text-slate-500">
              <p>Run a conflict check to see results here</p>
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
export class TimetableAdminPage {
  private api = inject(TimetableApiService);
  protected conflicts = signal<any[]>([]);

  protected checkConflicts(): void {
    this.api.checkConflicts(1).subscribe({
      next: (res) => this.conflicts.set(res.conflicts),
      error: () => this.conflicts.set([{ description: 'Failed to load conflicts. Check server connection.' }]),
    });
  }
}
