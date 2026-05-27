import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ParentApiService } from '../../services/parent-api.service';
import { SiblingProfile } from '../../models/parent.models';

@Component({
  selector: 'app-my-children',
  imports: [MatCardModule, MatIconModule, MatChipsModule, MatProgressSpinnerModule],
  template: `
    <div class="children-page">
      <h2>My Children</h2>
      @if (loading()) { <div class="loading-wrap"><mat-spinner diameter="28"></mat-spinner></div> }
      @else if (profiles().length > 0) {
        <div class="children-grid">
          @for (child of profiles(); track child.id) {
            <mat-card class="child-card">
              <mat-card-header>
                <div class="child-avatar">{{ getInitials(child.first_name, child.last_name) }}</div>
                <mat-card-title>{{ child.first_name }} {{ child.last_name }}</mat-card-title>
                <mat-card-subtitle>{{ child.current_class_name }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="info-row"><span class="info-label">School ID</span><span class="info-value">{{ child.user_school_id }}</span></div>
                @if (child.house_name) { <div class="info-row"><span class="info-label">House</span><span class="info-value">{{ child.house_name }}</span></div> }
                @if (child.gender) { <div class="info-row"><span class="info-label">Gender</span><span class="info-value">{{ child.gender === 'MALE' ? 'Male' : 'Female' }}</span></div> }
                @if (child.attendance_percentage != null) { <div class="info-row"><span class="info-label">Attendance</span><span class="info-value">{{ child.attendance_percentage }}%</span></div> }
                @if (child.overall_performance != null) { <div class="info-row"><span class="info-label">Performance</span><span class="info-value">{{ child.overall_performance }}%</span></div> }
                @if (child.subjects && child.subjects.length > 0) {
                  <div class="subjects-row">
                    <span class="info-label">Subjects</span>
                    <div class="subject-chips">
                      @for (subj of child.subjects; track subj) {
                        <span class="subject-chip">{{ subj }}</span>
                      }
                    </div>
                  </div>
                }
              </mat-card-content>
              <mat-card-actions>
                <span class="action-link" (click)="selectChild(child)">Switch to {{ child.first_name }}'s view</span>
              </mat-card-actions>
            </mat-card>
          }
        </div>
      } @else { <div class="no-data">No children profiles found</div> }
    </div>
  `,
  styles: [`
    .children-page { padding: 16px 0; }
    h2 { font-size: 1.125rem; margin: 0 0 16px; color: #1e293b; }
    .loading-wrap { display: flex; justify-content: center; padding: 48px; }
    .children-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
    .child-avatar { width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1rem; margin-right: 12px; flex-shrink: 0; }
    .info-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 0.8125rem; border-bottom: 1px solid #f1f5f9; }
    .info-label { color: #94a3b8; }
    .info-value { color: #1e293b; font-weight: 500; }
    .subjects-row { padding: 8px 0 0; }
    .subject-chips { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
    .subject-chip { background: #eff6ff; color: #1e40af; font-size: 0.6875rem; padding: 2px 8px; border-radius: 4px; font-weight: 500; }
    .action-link { cursor: pointer; color: #2563eb; font-size: 0.8125rem; font-weight: 500; }
    .action-link:hover { text-decoration: underline; }
    .no-data { padding: 48px; text-align: center; color: #94a3b8; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyChildrenComponent implements OnInit {
  private readonly api = inject(ParentApiService);

  readonly profiles = signal<SiblingProfile[]>([]);
  readonly loading = signal(true);

  ngOnInit() {
    this.api.getStudentProfiles().subscribe({
      next: (res) => this.profiles.set(res.results),
      complete: () => this.loading.set(false),
    });
  }

  getInitials(first: string, last: string): string {
    return ((first?.[0] || '') + (last?.[0] || '')).toUpperCase();
  }

  selectChild(_child: SiblingProfile): void {
    // Sibling switcher in navbar handles this via siblingState
  }
}
