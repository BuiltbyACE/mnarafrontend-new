import { Component, input, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LiveTrackerService } from '../../services/live-tracker.service';
import { LiveLocatorResponse, TeacherStatus } from '../../models/live-status.model';
import { LiveStatusBadgeComponent } from '../live-status-badge/live-status-badge.component';

interface TeacherOption {
  id: number;
  name: string;
}

@Component({
  selector: 'app-staff-locator-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, LiveStatusBadgeComponent],
  template: `
    <div class="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
      <!-- Header -->
      <div class="p-4 border-b border-slate-800">
        <h3 class="text-sm font-bold text-white uppercase tracking-wider">Staff Locator</h3>
        <p class="text-[11px] text-slate-500 mt-1">Find any teacher's current location</p>
      </div>

      <!-- Teacher Selector -->
      <div class="p-4">
        <label class="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Select Teacher
        </label>
        @if (teachers().length > 0) {
          <select [(ngModel)]="selectedTeacherId"
                  (change)="onTeacherChange()"
                  class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white
                         focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
            <option [value]="0" disabled>Choose a teacher...</option>
            @for (t of teachers(); track t.id) {
              <option [value]="t.id">{{ t.name }}</option>
            }
          </select>
        } @else {
          <p class="text-xs text-slate-600 italic">No teachers available.</p>
        }
      </div>

      <!-- Live Status -->
      @if (selectedTeacherId() > 0) {
        <div class="px-4 pb-4">
          <app-live-status-badge [teacherId]="selectedTeacherId()" [pollingIntervalMs]="30000" />
        </div>

        <!-- Quick Actions -->
        <div class="px-4 pb-4 flex gap-2">
          <button (click)="refresh()"
                  class="flex-1 px-3 py-2 text-[11px] font-semibold rounded-lg
                         bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors">
            Refresh Now
          </button>
          <button (click)="clearSelection()"
                  class="px-3 py-2 text-[11px] font-semibold rounded-lg
                         bg-red-950/30 text-red-400 hover:bg-red-900/40 transition-colors">
            Clear
          </button>
        </div>
      }

      <!-- Empty State -->
      @if (selectedTeacherId() === 0) {
        <div class="px-4 pb-6 text-center">
          <div class="text-3xl mb-2">📍</div>
          <p class="text-xs text-slate-600">Select a teacher to see their live location</p>
        </div>
      }
    </div>
  `,
})
export class StaffLocatorPanelComponent {
  readonly teachers = input<TeacherOption[]>([]);

  protected selectedTeacherId = signal(0);
  protected currentStatus = signal<LiveLocatorResponse | null>(null);

  private tracker = inject(LiveTrackerService);

  protected onTeacherChange(): void {
    if (this.selectedTeacherId() > 0) {
      this.refresh();
    }
  }

  protected refresh(): void {
    const id = this.selectedTeacherId();
    if (id <= 0) return;
    this.tracker.getTeacherStatus(id).subscribe({
      next: (status) => this.currentStatus.set(status),
    });
  }

  protected clearSelection(): void {
    this.selectedTeacherId.set(0);
    this.currentStatus.set(null);
  }
}
