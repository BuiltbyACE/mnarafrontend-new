import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StaffLocatorPanelComponent } from '@sms/frontend/timetable-matrix';

interface TeacherOption {
  id: number;
  name: string;
}

@Component({
  selector: 'app-staff-locator',
  standalone: true,
  imports: [CommonModule, StaffLocatorPanelComponent],
  template: `
    <div class="p-6 max-w-[1200px] mx-auto">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-slate-900">Staff Locator</h1>
        <p class="text-sm text-slate-500 mt-1">Find any teacher's current location in real-time</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2">
          <div class="bg-white rounded-xl border border-slate-200 p-6">
            <h2 class="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Campus Overview</h2>
            <p class="text-sm text-slate-400">Select a teacher from the panel to view their location on campus.</p>
          </div>
        </div>

        <div class="lg:col-span-1">
          <app-staff-locator-panel [teachers]="teachers()" />
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; }
  `],
})
export class StaffLocatorPage implements OnInit {
  protected teachers = signal<TeacherOption[]>([]);

  ngOnInit(): void {
    this.teachers.set([
      { id: 1, name: 'Teacher 1' },
      { id: 2, name: 'Teacher 2' },
    ]);
  }
}
