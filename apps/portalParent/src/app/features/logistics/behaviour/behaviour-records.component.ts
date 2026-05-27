import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DatePipe } from '@angular/common';
import { ParentApiService } from '../../../services/parent-api.service';
import { BehaviourRecord, BehaviourStats, STATUS_COLORS } from '../../../models/parent.models';

@Component({
  selector: 'app-behaviour-records',
  imports: [MatCardModule, MatIconModule, MatTabsModule, MatChipsModule, MatProgressSpinnerModule, DatePipe],
  template: `
    <div class="page">
      <h2>Behaviour Records</h2>
      @if (loading()) { <div class="loading-wrap"><mat-spinner diameter="28"></mat-spinner></div> }
      @else {
        @if (stats(); as s) {
          <div class="stats-bar">
            <div class="stat"><span class="stat-value">{{ s.commendations }}</span><span class="stat-label">Commendations</span></div>
            <div class="stat"><span class="stat-value">{{ s.incidents }}</span><span class="stat-label">Incidents</span></div>
            <div class="stat"><span class="stat-value">{{ s.pending_follow_ups }}</span><span class="stat-label">Follow-ups</span></div>
          </div>
        }
        <mat-tab-group>
          <mat-tab label="All ({{ records().length }})">
            @if (records().length > 0) {
              <div class="records-list">
                @for (r of records(); track r.id) {
                  <div class="record-card" [class.commendation]="r.type === 'COMMENDATION'" [class.incident]="r.type === 'INCIDENT'">
                    <div class="record-icon">
                      <mat-icon>{{ r.type === 'COMMENDATION' ? 'stars' : 'warning' }}</mat-icon>
                    </div>
                    <div class="record-body">
                      <div class="record-top">
                        <span class="record-type">{{ r.type }}</span>
                        <span class="record-severity">{{ r.severity }}</span>
                        <span class="record-date">{{ r.date | date:'mediumDate' }}</span>
                      </div>
                      <p class="record-desc">{{ r.description }}</p>
                      <span class="record-reporter">Reported by: {{ r.reported_by_name }}</span>
                    </div>
                    <span class="record-status" [style.color]="STATUS_COLORS[r.status] || '#94a3b8'">{{ r.status }}</span>
                  </div>
                }
              </div>
            } @else { <div class="no-data">No behaviour records</div> }
          </mat-tab>
          <mat-tab label="Commendations ({{ commendationList().length }})">
            <div class="records-list">
              @for (r of commendationList(); track r.id) {
                <div class="record-card commendation">
                  <div class="record-icon"><mat-icon>stars</mat-icon></div>
                  <div class="record-body">
                    <span class="record-type">Commendation</span>
                    <p class="record-desc">{{ r.description }}</p>
                    <span class="record-reporter">{{ r.reported_by_name }} — {{ r.date | date:'mediumDate' }}</span>
                  </div>
                </div>
              } @empty { <div class="no-data">No commendations</div> }
            </div>
          </mat-tab>
          <mat-tab label="Incidents ({{ incidentList().length }})">
            <div class="records-list">
              @for (r of incidentList(); track r.id) {
                <div class="record-card incident">
                  <div class="record-icon"><mat-icon>warning</mat-icon></div>
                  <div class="record-body">
                    <span class="record-type">Incident</span>
                    <p class="record-desc">{{ r.description }}</p>
                    <span class="record-reporter">{{ r.reported_by_name }} — {{ r.date | date:'mediumDate' }}</span>
                  </div>
                </div>
              } @empty { <div class="no-data">No incidents</div> }
            </div>
          </mat-tab>
        </mat-tab-group>
      }
    </div>
  `,
  styles: [`
    .page { padding: 16px 0; }
    h2 { font-size: 1.125rem; margin: 0 0 16px; color: #1e293b; }
    .loading-wrap { display: flex; justify-content: center; padding: 48px; }
    .stats-bar { display: flex; gap: 12px; margin-bottom: 20px; }
    .stat { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 20px; flex: 1; text-align: center; }
    .stat-value { display: block; font-size: 1.25rem; font-weight: 700; color: #1e293b; }
    .stat-label { font-size: 0.6875rem; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.04em; }
    .records-list { display: flex; flex-direction: column; gap: 10px; margin-top: 12px; }
    .record-card { display: flex; gap: 12px; padding: 14px; border-radius: 10px; border: 1px solid #e2e8f0; background: #fff; align-items: flex-start; }
    .record-card.commendation { border-left: 4px solid #059669; }
    .record-card.incident { border-left: 4px solid #e11d48; }
    .record-icon mat-icon { font-size: 24px; width: 24px; height: 24px; }
    .commendation .record-icon mat-icon { color: #059669; }
    .incident .record-icon mat-icon { color: #e11d48; }
    .record-body { flex: 1; }
    .record-top { display: flex; gap: 8px; align-items: center; margin-bottom: 4px; }
    .record-type { font-weight: 700; font-size: 0.75rem; text-transform: uppercase; color: #1e293b; }
    .record-severity { font-size: 0.625rem; color: #fff; background: #64748b; padding: 1px 6px; border-radius: 4px; }
    .record-date { font-size: 0.6875rem; color: #94a3b8; margin-left: auto; }
    .record-desc { font-size: 0.8125rem; color: #475569; margin: 4px 0; }
    .record-reporter { font-size: 0.6875rem; color: #94a3b8; }
    .record-status { font-size: 0.6875rem; font-weight: 600; white-space: nowrap; }
    .no-data { padding: 32px; text-align: center; color: #94a3b8; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BehaviourRecordsComponent implements OnInit {
  private readonly api = inject(ParentApiService);

  readonly records = signal<BehaviourRecord[]>([]);
  readonly stats = signal<BehaviourStats | null>(null);
  readonly loading = signal(true);

  readonly STATUS_COLORS = STATUS_COLORS;

  readonly commendationList = () => this.records().filter(r => r.type === 'COMMENDATION');
  readonly incidentList = () => this.records().filter(r => r.type === 'INCIDENT');

  ngOnInit() {
    this.api.getBehaviourRecords().subscribe({
      next: (r) => this.records.set(r),
    });
    this.api.getBehaviourStats().subscribe({
      next: (s) => this.stats.set(s),
      complete: () => this.loading.set(false),
    });
  }
}
