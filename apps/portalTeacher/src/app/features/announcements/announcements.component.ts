import { Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { Announcement } from '../../shared/models/teacher.models';
import { TeacherAnnouncementService } from '../../core/services/teacher-announcement.service';

type CategoryFilter = 'all' | 'general' | 'academic' | 'administrative' | 'emergency';

@Component({
  selector: 'app-teacher-announcements',
  imports: [DatePipe, NgClass, MatCardModule, MatIconModule, MatButtonModule, MatChipsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Announcements</h1>
        <span class="page-count">{{ announcements().length }} total</span>
      </div>

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
    .page-header { display: flex; align-items: baseline; gap: 12px; margin-bottom: 24px; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0; }
    .page-count { font-size: 0.8125rem; color: #94a3b8; }

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

  readonly selectedCategory = signal<CategoryFilter>('all');

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

  categoryLabel(cat: string): string {
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  }

  truncate(text: string, max: number): string {
    return text.length > max ? text.slice(0, max) + '…' : text;
  }
}
