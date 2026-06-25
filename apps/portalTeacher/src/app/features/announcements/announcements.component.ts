import { Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Announcement } from '../../shared/models/teacher.models';
import { TeacherAnnouncementService } from '../../core/services/teacher-announcement.service';
import { BroadcastService } from '../../core/services/broadcast.service';

type CategoryFilter = 'all' | 'general' | 'academic' | 'administrative' | 'emergency';

@Component({
  selector: 'app-teacher-announcements',
  imports: [DatePipe, NgClass, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatChipsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Announcements</h1>
        <div class="page-actions">
          <span class="page-count">{{ announcements().length }} total</span>
          <button class="btn-compose" (click)="showComposer.set(!showComposer())">
            <mat-icon>campaign</mat-icon>
            {{ showComposer() ? 'Cancel' : 'New Broadcast' }}
          </button>
        </div>
      </div>

      @if (showComposer()) {
        <mat-card class="composer-card">
          <h2 class="composer-title">Compose Broadcast</h2>
          <div class="composer-body">
            <input class="composer-input" placeholder="Title" [(ngModel)]="broadcastTitle" />
            <textarea class="composer-textarea" placeholder="Message body..." rows="4" [(ngModel)]="broadcastBody"></textarea>
            <div class="composer-row">
              <select class="composer-select" [(ngModel)]="broadcastPriority">
                <option value="LOW">Low Priority</option>
                <option value="NORMAL">Normal Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="EMERGENCY">Emergency</option>
              </select>
              <select class="composer-select" [(ngModel)]="broadcastAudience">
                <option value="ALL">Everyone</option>
                <option value="STAFF">Staff Only</option>
                <option value="TEACHING_STAFF">Teaching Staff</option>
                <option value="STUDENTS">Students</option>
                <option value="PARENTS">Parents</option>
              </select>
            </div>
            @if (broadcastSvc.error(); as err) {
              <div class="error-msg">{{ err }}</div>
            }
            <div class="composer-actions">
              <button class="btn-cancel" (click)="showComposer.set(false)">Discard</button>
              <button class="btn-save-draft" (click)="saveDraft()" [disabled]="!broadcastTitle()">Save Draft</button>
              <button class="btn-send" (click)="sendBroadcast()" [disabled]="!broadcastTitle() || !broadcastBody()">
                @if (broadcastSvc.isCreating()) { Sending... } @else { Send Now }
              </button>
            </div>
          </div>
        </mat-card>
      }

      <div class="filters">
        <button class="filter-chip"
                [class.active]="selectedCategory() === 'all'"
                (click)="selectedCategory.set('all')">
          All
        </button>
        @for (cat of categories; track cat) {
          <button class="filter-chip"
                  [class.active]="selectedCategory() === cat.value"
                  (click)="selectedCategory.set(cat.value)">
            <span class="dot" [style.background]="cat.color"></span>
            {{ cat.label }}
          </button>
        }
      </div>

      @if (pinnedAnnouncements().length > 0) {
        <div class="section">
          <div class="section-label">
            <mat-icon class="section-icon">push_pin</mat-icon>
            Pinned
          </div>
          <div class="announcement-list">
            @for (ann of pinnedAnnouncements(); track ann.id) {
              <mat-card class="ann-card pinned">
                <div class="card-body">
                  <div class="card-top">
                    <span class="cat-badge" [ngClass]="ann.category || 'general'">
                      {{ categoryLabel(ann.category || 'general') }}
                    </span>
                    <mat-icon class="pin-icon">push_pin</mat-icon>
                  </div>
                  <h3 class="card-title">{{ ann.title }}</h3>
                  <p class="card-preview">{{ truncate(ann.content, 180) }}</p>
                  <div class="card-meta">
                    <div class="meta-left">
                      <span class="meta-author">{{ ann.postedBy }}</span>
                      <span class="meta-sep">•</span>
                      <span class="meta-date">{{ ann.postedAt | date:'MMM d, yyyy' }}</span>
                    </div>
                    <div class="meta-right">
                      @if (ann.hasAttachments) {
                        <span class="attach-indicator">
                          <mat-icon class="attach-icon">attach_file</mat-icon>
                          Attachments
                        </span>
                      }
                    </div>
                  </div>
                </div>
              </mat-card>
            }
          </div>
        </div>
      }

      <div class="section">
        <div class="section-label">
          <mat-icon class="section-icon">campaign</mat-icon>
          Recent Announcements
        </div>
        @if (regularAnnouncements().length > 0) {
          <div class="announcement-list">
            @for (ann of regularAnnouncements(); track ann.id) {
              <mat-card class="ann-card">
                <div class="card-body">
                  <div class="card-top">
                    <span class="cat-badge" [ngClass]="ann.category || 'general'">
                      {{ categoryLabel(ann.category || 'general') }}
                    </span>
                  </div>
                  <h3 class="card-title">{{ ann.title }}</h3>
                  <p class="card-preview">{{ truncate(ann.content, 180) }}</p>
                  <div class="card-meta">
                    <div class="meta-left">
                      <span class="meta-author">{{ ann.postedBy }}</span>
                      <span class="meta-sep">•</span>
                      <span class="meta-date">{{ ann.postedAt | date:'MMM d, yyyy' }}</span>
                    </div>
                    <div class="meta-right">
                      @if (ann.hasAttachments) {
                        <span class="attach-indicator">
                          <mat-icon class="attach-icon">attach_file</mat-icon>
                          Attachments
                        </span>
                      }
                    </div>
                  </div>
                </div>
              </mat-card>
            }
          </div>
        } @else {
          <div class="empty-state">
            <mat-icon class="empty-icon">inbox</mat-icon>
            <p class="empty-text">No announcements in this category</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; font-family: 'Inter', sans-serif; }
    .page { padding: 24px 32px; max-width: 960px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0; }
    .page-actions { display: flex; align-items: center; gap: 12px; }
    .page-count { font-size: 0.8125rem; color: #94a3b8; }
    .btn-compose { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: #2563eb; color: white; border: none; border-radius: 8px; font-size: 0.8125rem; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; }
    .btn-compose:hover { background: #1d4ed8; }
    .btn-compose mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .composer-card { padding: 24px; margin-bottom: 24px; border: 1px solid #bfdbfe; border-radius: 12px; background: #f8faff; }
    .composer-title { font-size: 1rem; font-weight: 600; color: #1e40af; margin: 0 0 16px; }
    .composer-body { display: flex; flex-direction: column; gap: 12px; }
    .composer-input, .composer-textarea, .composer-select { padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem; font-family: 'Inter', sans-serif; color: #1e293b; width: 100%; }
    .composer-textarea { resize: vertical; min-height: 100px; }
    .composer-select { background: white; }
    .composer-input:focus, .composer-textarea:focus { outline: 2px solid #2563eb; outline-offset: -1px; }
    .composer-row { display: flex; gap: 12px; }
    .composer-row select { flex: 1; }
    .composer-actions { display: flex; gap: 8px; justify-content: flex-end; padding-top: 4px; }
    .btn-cancel { padding: 8px 16px; border: 1px solid #e2e8f0; border-radius: 8px; background: white; color: #475569; font-size: 0.8125rem; font-weight: 500; cursor: pointer; }
    .btn-save-draft { padding: 8px 16px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; color: #475569; font-size: 0.8125rem; font-weight: 500; cursor: pointer; }
    .btn-save-draft:disabled { opacity: .5; }
    .btn-send { padding: 8px 20px; border: none; border-radius: 8px; background: #2563eb; color: white; font-size: 0.8125rem; font-weight: 600; cursor: pointer; }
    .btn-send:hover { background: #1d4ed8; }
    .btn-send:disabled { opacity: .5; }
    .error-msg { padding: 8px 12px; background: #fee2e2; color: #991b1b; border-radius: 6px; font-size: 0.8125rem; }

    .filters { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 28px; }
    .filter-chip {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 16px; border-radius: 100px; border: 1px solid #e2e8f0;
      background: white; font-size: 0.8125rem; font-weight: 500;
      color: #475569; cursor: pointer; font-family: 'Inter', sans-serif;
      transition: all 0.15s ease;
    }
    .filter-chip:hover { border-color: #2563eb; color: #2563eb; background: #eff6ff; }
    .filter-chip.active { background: #2563eb; border-color: #2563eb; color: white; }
    .filter-chip.active .dot { background: white !important; }
    .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }

    .section { margin-bottom: 32px; }
    .section-label {
      display: flex; align-items: center; gap: 8px;
      font-size: 0.8125rem; font-weight: 600; color: #64748b;
      text-transform: uppercase; letter-spacing: 0.05em;
      margin-bottom: 14px;
    }
    .section-icon { font-size: 18px; width: 18px; height: 18px; }

    .announcement-list { display: flex; flex-direction: column; gap: 12px; }
    .ann-card { border-radius: 10px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.04); background: white; }
    .ann-card.pinned { background: #f8faff; border-color: #bfdbfe; }
    .card-body { padding: 20px 24px; }
    .card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .pin-icon { font-size: 18px; width: 18px; height: 18px; color: #2563eb; }

    .cat-badge {
      display: inline-flex; align-items: center; padding: 3px 10px;
      border-radius: 100px; font-size: 0.6875rem; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.04em;
    }
    .cat-badge.general { background: #dbeafe; color: #1d4ed8; }
    .cat-badge.academic { background: #dcfce7; color: #166534; }
    .cat-badge.administrative { background: #ede9fe; color: #5b21b6; }
    .cat-badge.emergency { background: #fee2e2; color: #991b1b; }

    .card-title { font-size: 1rem; font-weight: 600; color: #0f172a; margin: 0 0 8px; line-height: 1.4; }
    .card-preview { font-size: 0.875rem; color: #475569; line-height: 1.6; margin: 0 0 14px; }
    .card-meta { display: flex; align-items: center; justify-content: space-between; }
    .meta-left { display: flex; align-items: center; gap: 6px; }
    .meta-author { font-size: 0.8125rem; font-weight: 500; color: #334155; }
    .meta-sep { color: #cbd5e1; }
    .meta-date { font-size: 0.75rem; color: #94a3b8; }
    .meta-right { display: flex; align-items: center; gap: 8px; }
    .attach-indicator {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 0.75rem; color: #64748b; font-weight: 500;
    }
    .attach-icon { font-size: 16px; width: 16px; height: 16px; }

    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 48px 24px;
      background: white; border-radius: 10px; border: 1px dashed #e2e8f0;
    }
    .empty-icon { font-size: 40px; width: 40px; height: 40px; color: #cbd5e1; margin-bottom: 8px; }
    .empty-text { font-size: 0.875rem; color: #94a3b8; margin: 0; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnouncementsComponent {
  private announcementService = inject(TeacherAnnouncementService);
  readonly broadcastSvc = inject(BroadcastService);

  readonly selectedCategory = signal<CategoryFilter>('all');
  readonly showComposer = signal(false);

  readonly broadcastTitle = signal('');
  readonly broadcastBody = signal('');
  readonly broadcastPriority = signal<string>('NORMAL');
  readonly broadcastAudience = signal<string>('ALL');

  readonly categories: { label: string; value: CategoryFilter; color: string }[] = [
    { label: 'General', value: 'general', color: '#2563eb' },
    { label: 'Academic', value: 'academic', color: '#16a34a' },
    { label: 'Administrative', value: 'administrative', color: '#7c3aed' },
    { label: 'Emergency', value: 'emergency', color: '#dc2626' },
  ];

  private readonly allAnnouncements = this.announcementService.announcements;

  private readonly filtered = computed(() => {
    const cat = this.selectedCategory();
    if (cat === 'all') return this.allAnnouncements();
    return this.allAnnouncements().filter(a => a.category === cat);
  });

  readonly pinnedAnnouncements = computed(() =>
    this.filtered().filter(a => a.pinned)
  );

  readonly regularAnnouncements = computed(() =>
    this.filtered().filter(a => !a.pinned)
  );

  readonly announcements = this.allAnnouncements;

  constructor() {
    this.announcementService.fetchAnnouncements();
  }

  sendBroadcast(): void {
    if (!this.broadcastTitle() || !this.broadcastBody()) return;
    this.broadcastSvc.isCreating.set(true);
    this.broadcastSvc.error.set(null);
    this.broadcastSvc.createBroadcast({
      title: this.broadcastTitle(),
      body: this.broadcastBody(),
      priority: this.broadcastPriority(),
      audience_type: this.broadcastAudience(),
      status: 'DRAFT',
    }).subscribe({
      next: (broadcast) => {
        this.broadcastSvc.dispatchBroadcast(broadcast.id).subscribe({
          next: () => {
            this.broadcastSvc.isCreating.set(false);
            this.showComposer.set(false);
            this.broadcastTitle.set('');
            this.broadcastBody.set('');
            this.broadcastSvc.successMessage.set('Broadcast sent successfully');
            this.announcementService.fetchAnnouncements();
          },
          error: () => {
            this.broadcastSvc.isCreating.set(false);
            this.broadcastSvc.error.set('Broadcast created but dispatch failed');
          },
        });
      },
      error: (err) => {
        this.broadcastSvc.isCreating.set(false);
        this.broadcastSvc.error.set(err.error?.detail || 'Failed to create broadcast');
      },
    });
  }

  saveDraft(): void {
    if (!this.broadcastTitle()) return;
    this.broadcastSvc.isCreating.set(true);
    this.broadcastSvc.error.set(null);
    this.broadcastSvc.createBroadcast({
      title: this.broadcastTitle(),
      body: this.broadcastBody(),
      priority: this.broadcastPriority(),
      audience_type: this.broadcastAudience(),
      status: 'DRAFT',
    }).subscribe({
      next: () => {
        this.broadcastSvc.isCreating.set(false);
        this.showComposer.set(false);
        this.broadcastTitle.set('');
        this.broadcastBody.set('');
        this.broadcastSvc.successMessage.set('Draft saved');
      },
      error: (err) => {
        this.broadcastSvc.isCreating.set(false);
        this.broadcastSvc.error.set(err.error?.detail || 'Failed to save draft');
      },
    });
  }

  categoryLabel(cat: string): string {
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  }

  truncate(text: string, max: number): string {
    return text.length > max ? text.slice(0, max) + '…' : text;
  }
}
