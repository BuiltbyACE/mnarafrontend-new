import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DatePipe } from '@angular/common';
import { ParentApiService } from '../../../services/parent-api.service';
import { Announcement } from '../../../models/parent.models';

@Component({
  selector: 'app-broadcasts',
  imports: [MatCardModule, MatIconModule, MatProgressSpinnerModule, DatePipe],
  template: `
    <div class="announcements-page">
      <h2>Announcements</h2>
      @if (loading()) { <div class="loading-wrap"><mat-spinner diameter="28"></mat-spinner></div> }
      @else if (announcements().length > 0) {
        <div class="announcements-list">
          @for (a of announcements(); track a.id) {
            <mat-card class="announcement-card" [class.pinned]="a.pinned" [class.urgent]="a.category === 'URGENT'">
              <mat-card-header>
                <mat-icon mat-card-avatar [style.color]="a.category === 'URGENT' ? '#e11d48' : '#2563eb'">campaign</mat-icon>
                <mat-card-title>{{ a.title }}</mat-card-title>
                <mat-card-subtitle>{{ a.published_at | date:'mediumDate' }} @if (a.pinned) { <span class="pinned-badge">Pinned</span> }</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <p>{{ a.content }}</p>
              </mat-card-content>
            </mat-card>
          }
        </div>
      } @else { <div class="no-data">No announcements</div> }
    </div>
  `,
  styles: [`
    .announcements-page { padding: 16px 0; }
    h2 { font-size: 1.125rem; margin: 0 0 16px; color: #1e293b; }
    .loading-wrap { display: flex; justify-content: center; padding: 48px; }
    .announcements-list { display: flex; flex-direction: column; gap: 12px; }
    .announcement-card.pinned { border-left: 4px solid #2563eb; }
    .announcement-card.urgent { border-left: 4px solid #e11d48; }
    .pinned-badge { display: inline-block; background: #dbeafe; color: #1e40af; font-size: 0.625rem; padding: 1px 6px; border-radius: 4px; margin-left: 6px; font-weight: 600; }
    mat-card-content p { color: #475569; font-size: 0.8125rem; margin: 0; white-space: pre-line; }
    .no-data { padding: 48px; text-align: center; color: #94a3b8; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BroadcastsComponent implements OnInit {
  private readonly api = inject(ParentApiService);

  readonly announcements = signal<Announcement[]>([]);
  readonly loading = signal(true);

  ngOnInit() {
    this.api.getAnnouncements().subscribe({
      next: (a) => this.announcements.set(a),
      complete: () => this.loading.set(false),
    });
  }
}
