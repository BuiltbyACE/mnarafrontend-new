import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { Announcement } from '../../shared/models/teacher.models';

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
  readonly selectedCategory = signal<CategoryFilter>('all');

  readonly categories: { label: string; value: CategoryFilter; color: string }[] = [
    { label: 'General', value: 'general', color: '#2563eb' },
    { label: 'Academic', value: 'academic', color: '#16a34a' },
    { label: 'Administrative', value: 'administrative', color: '#7c3aed' },
    { label: 'Emergency', value: 'emergency', color: '#dc2626' },
  ];

  private readonly allAnnouncements = signal<Announcement[]>([
    {
      id: '1', title: 'Welcome to Term 2 – 2026',
      content: 'We are pleased to welcome all staff and students to Term 2 of the 2026 academic year. The term begins on Monday, May 19th. Kindly ensure all lesson plans and schemes of work are submitted to your respective Heads of Department by Friday this week. Let us work together to make this term productive and successful.',
      postedBy: 'Principal’s Office', postedAt: '2026-05-15T08:00:00',
      category: 'general', pinned: true, hasAttachments: false, department: 'School-wide',
    },
    {
      id: '2', title: 'Science Department Meeting – This Friday',
      content: 'There will be a mandatory Science Department meeting on Friday, May 22nd at 2:30 PM in the Science Lab B. Agenda includes: review of term 1 performance, lab safety protocols, and preparation for the upcoming science fair. All science teachers must attend.',
      postedBy: 'Dr. Sarah Kimani', postedAt: '2026-05-14T10:30:00',
      category: 'academic', pinned: true, hasAttachments: true, department: 'Science Department',
    },
    {
      id: '3', title: 'Staff Room Renovation Notice',
      content: 'The main staff room will undergo renovation starting May 25th through June 5th. During this period, staff are requested to use the temporary lounge on the ground floor (Room G12). Tea and refreshments will still be served from 10:00 AM to 10:30 AM. We apologise for any inconvenience.',
      postedBy: 'Administration Office', postedAt: '2026-05-12T09:00:00',
      category: 'administrative', pinned: false, hasAttachments: false, department: 'School-wide',
    },
    {
      id: '4', title: 'School Closure – Heavy Rains Warning',
      content: 'Due to the ongoing heavy rains and potential flooding in the region, the school will be closed tomorrow, May 11th. All learning activities will resume on Tuesday. Parents have been notified via the parent portal. Stay safe and avoid non-essential travel.',
      postedBy: 'Emergency Response Team', postedAt: '2026-05-10T06:00:00',
      category: 'emergency', pinned: false, hasAttachments: false, department: 'School-wide',
    },
    {
      id: '5', title: 'Form 4 Mock Exam Schedule Released',
      content: 'The Form 4 Mock Examination timetable is now available for download. Exams will run from June 2nd to June 12th. Invigilation duties have been assigned and are visible on the teacher portal. Please review the schedule and report any clashes to the Examinations Office by May 25th.',
      postedBy: 'Examinations Office', postedAt: '2026-05-08T14:00:00',
      category: 'academic', pinned: false, hasAttachments: true, department: 'School-wide',
    },
    {
      id: '6', title: 'New School Uniform Policy – Effective June 1st',
      content: 'The Board of Management has approved an updated uniform policy. Key changes include: new sweater design (navy blue with school crest), optional house t-shirts on Fridays, and明确规定 on acceptable footwear. The full policy document is attached. Current uniforms remain acceptable until end of Term 2.',
      postedBy: 'Board of Management', postedAt: '2026-05-05T11:00:00',
      category: 'general', pinned: true, hasAttachments: true, department: 'School-wide',
    },
    {
      id: '7', title: 'Lab Equipment Inventory Exercise',
      content: 'All science teachers are requested to conduct an inventory audit of their respective laboratory equipment and chemicals. The inventory sheets are available from the lab technician. Completed forms must be returned by May 30th. This is in preparation for the annual audit.',
      postedBy: 'Science Department', postedAt: '2026-05-03T08:30:00',
      category: 'administrative', pinned: false, hasAttachments: false, department: 'Science Department',
    },
    {
      id: '8', title: 'Academic Excellence Awards Ceremony',
      content: 'The Term 1 Academic Excellence Awards Ceremony will be held on May 30th at 9:00 AM in the school hall. Parents of award recipients have been invited. Teachers are requested to be seated by 8:45 AM. Dress code: formal. A rehearsal will be held on May 29th at 2:00 PM.',
      postedBy: 'Academic Affairs', postedAt: '2026-04-28T10:00:00',
      category: 'academic', pinned: false, hasAttachments: false, department: 'School-wide',
    },
  ]);

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

  readonly announcements = this.allAnnouncements.asReadonly();

  categoryLabel(cat: string): string {
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  }

  truncate(text: string, max: number): string {
    return text.length > max ? text.slice(0, max) + '…' : text;
  }
}
